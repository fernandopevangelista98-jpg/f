"""
Rotas de Anexos de Episódios
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import os

from app.database.connection import get_db
from app.models.anexo import AnexoEpisodio
from app.models.episodio import Episodio
from app.models.user import User
from app.schemas.anexo import AnexoCreate, AnexoOut, AnexoList
from app.utils.jwt import get_current_admin, get_current_user

# Importar serviço de storage se existir
try:
    from app.services.storage_service import upload_file_to_r2, delete_file_from_r2
    HAS_STORAGE = True
except ImportError:
    HAS_STORAGE = False

router = APIRouter()

# Tipos de arquivo permitidos por tipo de anexo
ALLOWED_EXTENSIONS = {
    'pdf': ['.pdf'],
    'imagem': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    'documento': ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
    'audio_extra': ['.mp3', '.wav', '.ogg', '.m4a']
}

MAX_FILE_SIZES = {
    'pdf': 20 * 1024 * 1024,  # 20MB
    'imagem': 5 * 1024 * 1024,  # 5MB
    'documento': 20 * 1024 * 1024,  # 20MB
    'audio_extra': 50 * 1024 * 1024  # 50MB
}

@router.get("/{episodio_id}/anexos", response_model=List[AnexoOut])
async def list_anexos(
    episodio_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista todos os anexos de um episódio.
    """
    # Verificar se episódio existe
    episodio = db.query(Episodio).filter(Episodio.id == episodio_id).first()
    if not episodio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episódio não encontrado"
        )
    
    # Usuários comuns só veem anexos de episódios publicados
    if current_user.perfil != "admin" and episodio.status != "publicado":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episódio não encontrado"
        )
    
    anexos = db.query(AnexoEpisodio)\
        .filter(AnexoEpisodio.episodio_id == episodio_id)\
        .order_by(AnexoEpisodio.ordem)\
        .all()
    
    return [AnexoOut.model_validate(a) for a in anexos]

@router.post("/{episodio_id}/anexos", response_model=AnexoOut, status_code=status.HTTP_201_CREATED)
async def create_anexo(
    episodio_id: UUID,
    tipo: str = Form(...),
    nome_arquivo: str = Form(...),
    url: str = Form(...),
    tamanho_bytes: int = Form(None),
    ordem: int = Form(0),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Adiciona um anexo a um episódio.
    O upload do arquivo deve ser feito previamente via /storage/upload.
    """
    # Validar tipo
    if tipo not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo inválido. Permitidos: {list(ALLOWED_EXTENSIONS.keys())}"
        )
    
    # Verificar se episódio existe
    episodio = db.query(Episodio).filter(Episodio.id == episodio_id).first()
    if not episodio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episódio não encontrado"
        )
    
    # Criar anexo
    anexo = AnexoEpisodio(
        episodio_id=episodio_id,
        tipo=tipo,
        nome_arquivo=nome_arquivo,
        url=url,
        tamanho_bytes=tamanho_bytes,
        ordem=ordem
    )
    
    db.add(anexo)
    db.commit()
    db.refresh(anexo)
    
    return AnexoOut.model_validate(anexo)

@router.put("/{episodio_id}/anexos/{anexo_id}", response_model=AnexoOut)
async def update_anexo(
    episodio_id: UUID,
    anexo_id: UUID,
    nome_arquivo: str = Form(None),
    ordem: int = Form(None),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Atualiza um anexo (nome ou ordem).
    """
    anexo = db.query(AnexoEpisodio).filter(
        AnexoEpisodio.id == anexo_id,
        AnexoEpisodio.episodio_id == episodio_id
    ).first()
    
    if not anexo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anexo não encontrado"
        )
    
    if nome_arquivo is not None:
        anexo.nome_arquivo = nome_arquivo
    if ordem is not None:
        anexo.ordem = ordem
    
    db.commit()
    db.refresh(anexo)
    
    return AnexoOut.model_validate(anexo)

@router.delete("/{episodio_id}/anexos/{anexo_id}")
async def delete_anexo(
    episodio_id: UUID,
    anexo_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Remove um anexo de um episódio.
    """
    anexo = db.query(AnexoEpisodio).filter(
        AnexoEpisodio.id == anexo_id,
        AnexoEpisodio.episodio_id == episodio_id
    ).first()
    
    if not anexo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anexo não encontrado"
        )
    
    # Tentar deletar arquivo do storage (opcional)
    if HAS_STORAGE:
        try:
            delete_file_from_r2(anexo.url)
        except Exception as e:
            print(f"Aviso: não foi possível deletar arquivo do storage: {e}")
    
    db.delete(anexo)
    db.commit()
    
    return {"message": "Anexo deletado com sucesso"}

@router.put("/{episodio_id}/anexos/reorder")
async def reorder_anexos(
    episodio_id: UUID,
    ordem: List[UUID],  # Lista de IDs na nova ordem
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Reordena os anexos de um episódio.
    """
    for i, anexo_id in enumerate(ordem):
        anexo = db.query(AnexoEpisodio).filter(
            AnexoEpisodio.id == anexo_id,
            AnexoEpisodio.episodio_id == episodio_id
        ).first()
        
        if anexo:
            anexo.ordem = i
    
    db.commit()
    
    return {"message": "Anexos reordenados com sucesso"}
