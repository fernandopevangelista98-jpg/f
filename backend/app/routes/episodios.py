"""
Rotas de Episódios
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID
import os

from app.database.connection import get_db
from app.models.episodio import Episodio
from app.models.temporada import Temporada
from app.models.user import User
from app.schemas.temporada import EpisodioCreate, EpisodioUpdate, EpisodioOut
from app.utils.jwt import get_current_user, get_current_admin

router = APIRouter()

@router.get("", response_model=List[EpisodioOut])
async def list_episodios(
    temporada_id: Optional[UUID] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista episódios, opcionalmente filtrados por temporada.
    """
    query = db.query(Episodio)
    
    if temporada_id:
        query = query.filter(Episodio.temporada_id == temporada_id)
    
    # Usuário comum só vê publicados
    if current_user.perfil != "admin":
        query = query.filter(Episodio.status == "publicado")
    elif status_filter:
        query = query.filter(Episodio.status == status_filter)
    
    episodios = query.order_by(Episodio.ordem).all()
    
    return [EpisodioOut.model_validate(ep) for ep in episodios]



@router.get("/{episodio_id}", response_model=EpisodioOut)
async def get_episodio(
    episodio_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtém detalhes de um episódio.
    """
    episodio = db.query(Episodio).filter(Episodio.id == episodio_id).first()
    
    if not episodio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episódio não encontrado"
        )
    
    # Usuário comum só vê publicados
    if current_user.perfil != "admin" and episodio.status != "publicado":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episódio não encontrado"
        )
    
    return EpisodioOut.model_validate(episodio)

@router.post("", response_model=EpisodioOut, status_code=status.HTTP_201_CREATED)
async def create_episodio(
    episodio_data: EpisodioCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Cria um novo episódio.
    Apenas admins.
    """
    # Verificar se temporada existe
    temporada = db.query(Temporada).filter(Temporada.id == episodio_data.temporada_id).first()
    if not temporada:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Temporada não encontrada"
        )
    
    episodio = Episodio(
        temporada_id=episodio_data.temporada_id,
        titulo=episodio_data.titulo,
        descricao=episodio_data.descricao,
        ordem=episodio_data.ordem,
        status=episodio_data.status,
        audio_url=episodio_data.audio_url,
        video_url=episodio_data.video_url,
        transcricao=episodio_data.transcricao
    )
    
    db.add(episodio)
    db.commit()
    db.refresh(episodio)
    
    return EpisodioOut.model_validate(episodio)

@router.put("/{episodio_id}", response_model=EpisodioOut)
async def update_episodio(
    episodio_id: UUID,
    episodio_data: EpisodioUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Atualiza um episódio.
    Apenas admins.
    """
    episodio = db.query(Episodio).filter(Episodio.id == episodio_id).first()
    
    if not episodio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episódio não encontrado"
        )
    
    update_data = episodio_data.model_dump(exclude_unset=True)
    
    # Se está movendo para outra temporada, verificar se existe
    if "temporada_id" in update_data:
        temporada = db.query(Temporada).filter(Temporada.id == update_data["temporada_id"]).first()
        if not temporada:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Temporada de destino não encontrada"
            )
    
    for field, value in update_data.items():
        setattr(episodio, field, value)
    
    db.commit()
    db.refresh(episodio)
    
    return EpisodioOut.model_validate(episodio)

@router.delete("/{episodio_id}")
async def delete_episodio(
    episodio_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Deleta um episódio.
    Apenas admins.
    """
    episodio = db.query(Episodio).filter(Episodio.id == episodio_id).first()
    
    if not episodio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episódio não encontrado"
        )
    
    db.delete(episodio)
    db.commit()
    
    return {"message": "Episódio deletado com sucesso"}

@router.get("/{episodio_id}/stats")
async def get_episodio_stats(
    episodio_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Obtém estatísticas de um episódio.
    Apenas admins.
    """
    from app.models.progresso import UsuarioEpisodio
    
    episodio = db.query(Episodio).filter(Episodio.id == episodio_id).first()
    
    if not episodio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episódio não encontrado"
        )
    
    # Estatísticas
    total_views = db.query(UsuarioEpisodio)\
        .filter(UsuarioEpisodio.episodio_id == episodio_id)\
        .count()
    
    completed = db.query(UsuarioEpisodio)\
        .filter(UsuarioEpisodio.episodio_id == episodio_id, UsuarioEpisodio.assistido == True)\
        .count()
    
    avg_completion = (completed / total_views * 100) if total_views > 0 else 0
    
    return {
        "episodio_id": str(episodio_id),
        "titulo": episodio.titulo,
        "total_views": total_views,
        "completed": completed,
        "avg_completion": round(avg_completion, 1)
    }
