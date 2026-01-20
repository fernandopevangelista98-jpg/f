"""
Rotas de Temporadas
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID

from app.database.connection import get_db
from app.models.temporada import Temporada
from app.models.episodio import Episodio
from app.models.user import User
from app.schemas.temporada import (
    TemporadaCreate, TemporadaUpdate, TemporadaOut, 
    TemporadaWithEpisodios, EpisodioOut
)
from app.utils.jwt import get_current_user, get_current_admin

router = APIRouter()

from sqlalchemy import or_, and_, func

@router.get("", response_model=List[TemporadaOut])
async def list_temporadas(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista todas as temporadas.
    Usuários comuns veem apenas as publicadas.
    Admins veem todas.
    """
    query = db.query(Temporada)
    
    # Usuário comum só vê publicadas, visíveis e liberadas
    if current_user.perfil != "admin":
        query = query.filter(
            Temporada.status == "publicado",
            Temporada.visivel == True,
            or_(
                Temporada.data_lancamento == None,
                Temporada.data_lancamento <= func.now()
            )
        )
    elif status_filter:
        query = query.filter(Temporada.status == status_filter)
    
    temporadas = query.order_by(Temporada.ordem).all()
    return [TemporadaOut.model_validate(t) for t in temporadas]

@router.get("/{temporada_id}", response_model=TemporadaWithEpisodios)
async def get_temporada(
    temporada_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtém detalhes de uma temporada com seus episódios.
    """
    temporada = db.query(Temporada).filter(Temporada.id == temporada_id).first()
    
    if not temporada:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Temporada não encontrada"
        )
    
    # Usuário comum só vê publicadas
    if current_user.perfil != "admin" and temporada.status != "publicado":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Temporada não encontrada"
        )
    
    # Buscar episódios
    episodios_query = db.query(Episodio).filter(Episodio.temporada_id == temporada_id)
    
    # Usuário comum só vê episódios publicados
    if current_user.perfil != "admin":
        episodios_query = episodios_query.filter(Episodio.status == "publicado")
    
    episodios = episodios_query.order_by(Episodio.ordem).all()
    
    return TemporadaWithEpisodios(
        **TemporadaOut.model_validate(temporada).model_dump(),
        episodios=[EpisodioOut.model_validate(e) for e in episodios],
        total_episodios=len(episodios)
    )

@router.post("", response_model=TemporadaOut, status_code=status.HTTP_201_CREATED)
async def create_temporada(
    temporada_data: TemporadaCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Cria uma nova temporada.
    Apenas admins.
    """
    temporada = Temporada(
        nome=temporada_data.nome,
        descricao=temporada_data.descricao,
        ordem=temporada_data.ordem,
        mantra=temporada_data.mantra,
        status=temporada_data.status,
        data_lancamento=temporada_data.data_lancamento,
        visivel=temporada_data.visivel,
    )
    
    db.add(temporada)
    db.commit()
    db.refresh(temporada)
    
    return TemporadaOut.model_validate(temporada)

@router.put("/{temporada_id}", response_model=TemporadaOut)
async def update_temporada(
    temporada_id: UUID,
    temporada_data: TemporadaUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Atualiza uma temporada.
    Apenas admins.
    """
    temporada = db.query(Temporada).filter(Temporada.id == temporada_id).first()
    
    if not temporada:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Temporada não encontrada"
        )
    
    update_data = temporada_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(temporada, field, value)
    
    db.commit()
    db.refresh(temporada)
    
    return TemporadaOut.model_validate(temporada)

@router.put("/{temporada_id}/reorder")
async def reorder_temporada(
    temporada_id: UUID,
    nova_ordem: int = Query(..., ge=0),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Altera a ordem de exibição de uma temporada.
    """
    temporada = db.query(Temporada).filter(Temporada.id == temporada_id).first()
    
    if not temporada:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Temporada não encontrada"
        )
    
    temporada.ordem = nova_ordem
    db.commit()
    
    return {"message": f"Temporada reordenada para posição {nova_ordem}"}

@router.delete("/{temporada_id}")
async def delete_temporada(
    temporada_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Deleta uma temporada e todos seus episódios.
    Apenas admins.
    """
    temporada = db.query(Temporada).filter(Temporada.id == temporada_id).first()
    
    if not temporada:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Temporada não encontrada"
        )
    
    db.delete(temporada)
    db.commit()
    
    return {"message": "Temporada deletada com sucesso"}

@router.post("/{temporada_id}/duplicate", response_model=TemporadaOut)
async def duplicate_temporada(
    temporada_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Duplica uma temporada (sem os episódios).
    """
    original = db.query(Temporada).filter(Temporada.id == temporada_id).first()
    
    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Temporada não encontrada"
        )
    
    # Criar cópia
    nova_temporada = Temporada(
        nome=f"{original.nome} (Cópia)",
        descricao=original.descricao,
        ordem=original.ordem + 1,
        mantra=original.mantra,
        capa_url=original.capa_url,
        status="rascunho"
    )
    
    db.add(nova_temporada)
    db.commit()
    db.refresh(nova_temporada)
    
    return TemporadaOut.model_validate(nova_temporada)
