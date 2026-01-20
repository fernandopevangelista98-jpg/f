"""
Rotas de Storage (Upload de arquivos)
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID, uuid4
import boto3
from botocore.client import Config
import os

from app.database.connection import get_db
from app.models.episodio import Episodio
from app.models.temporada import Temporada
from app.models.user import User
from app.utils.jwt import get_current_admin

router = APIRouter()

# Configuração do Cloudflare R2 (S3-compatible)
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "podcast-aec")
R2_ENDPOINT = os.getenv("R2_ENDPOINT", f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com")

def get_s3_client():
    """Retorna cliente S3 configurado para Cloudflare R2"""
    return boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version='s3v4'),
        region_name='auto'
    )

def get_public_url(key: str) -> str:
    """Gera URL pública do arquivo"""
    # Para R2, você pode configurar um domínio público ou usar presigned URLs
    # Por enquanto, vamos usar a estrutura básica
    return f"https://{R2_BUCKET_NAME}.{R2_ACCOUNT_ID}.r2.cloudflarestorage.com/{key}"

ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/x-m4a"]
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"]
MAX_AUDIO_SIZE = 100 * 1024 * 1024  # 100 MB
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_VIDEO_SIZE = 500 * 1024 * 1024  # 500 MB

@router.post("/upload/audio")
async def upload_audio(
    file: UploadFile = File(...),
    episodio_id: UUID = Form(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Upload de arquivo de áudio para um episódio.
    Apenas admins.
    """
    # Verificar episódio
    episodio = db.query(Episodio).filter(Episodio.id == episodio_id).first()
    if not episodio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episódio não encontrado"
        )
    
    # Validar tipo
    if file.content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de arquivo não permitido. Use: {', '.join(ALLOWED_AUDIO_TYPES)}"
        )
    
    # Validar tamanho
    contents = await file.read()
    if len(contents) > MAX_AUDIO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Arquivo muito grande. Máximo: {MAX_AUDIO_SIZE // (1024*1024)} MB"
        )
    
    # Gerar nome único
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'mp3'
    key = f"episodios/{episodio.temporada_id}/{episodio_id}/audio.{ext}"
    
    try:
        s3 = get_s3_client()
        s3.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=key,
            Body=contents,
            ContentType=file.content_type
        )
        
        # Atualizar episódio com URL
        episodio.audio_url = get_public_url(key)
        
        # Tentar detectar duração (se possível)
        # TODO: Implementar detecção de duração com mutagen
        
        db.commit()
        
        return {
            "message": "Áudio enviado com sucesso",
            "url": episodio.audio_url,
            "size": len(contents)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao fazer upload: {str(e)}"
        )

@router.post("/upload/video")
async def upload_video(
    file: UploadFile = File(...),
    episodio_id: UUID = Form(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Upload de arquivo de vídeo para um episódio.
    Apenas admins.
    """
    # Verificar episódio
    episodio = db.query(Episodio).filter(Episodio.id == episodio_id).first()
    if not episodio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episódio não encontrado"
        )
    
    # Validar tipo
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de arquivo não permitido. Use: {', '.join(ALLOWED_VIDEO_TYPES)}"
        )
    
    # Validar tamanho
    contents = await file.read()
    if len(contents) > MAX_VIDEO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Arquivo muito grande. Máximo: {MAX_VIDEO_SIZE // (1024*1024)} MB"
        )
    
    # Gerar nome único
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'mp4'
    key = f"episodios/{episodio.temporada_id}/{episodio_id}/video.{ext}"
    
    try:
        s3 = get_s3_client()
        s3.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=key,
            Body=contents,
            ContentType=file.content_type
        )
        
        # Atualizar episódio com URL
        episodio.video_url = get_public_url(key)
        
        # Se não tiver áudio, vídeo serve como principal
        if not episodio.audio_url:
             episodio.audio_url = "" # Manter consistente
        
        db.commit()
        
        return {
            "message": "Vídeo enviado com sucesso",
            "url": episodio.video_url,
            "size": len(contents)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao fazer upload: {str(e)}"
        )

@router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    tipo: str = Form(...),  # 'temporada_capa', 'episodio_thumbnail', 'avatar'
    entidade_id: UUID = Form(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Upload de imagem (capa de temporada, thumbnail de episódio, avatar).
    Apenas admins.
    """
    # Validar tipo de arquivo
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de arquivo não permitido. Use: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )
    
    # Validar tamanho
    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Arquivo muito grande. Máximo: {MAX_IMAGE_SIZE // (1024*1024)} MB"
        )
    
    # Gerar caminho baseado no tipo
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    
    if tipo == "temporada_capa":
        temporada = db.query(Temporada).filter(Temporada.id == entidade_id).first()
        if not temporada:
            raise HTTPException(status_code=404, detail="Temporada não encontrada")
        key = f"temporadas/{entidade_id}/capa.{ext}"
        
    elif tipo == "episodio_thumbnail":
        episodio = db.query(Episodio).filter(Episodio.id == entidade_id).first()
        if not episodio:
            raise HTTPException(status_code=404, detail="Episódio não encontrado")
        key = f"episodios/{episodio.temporada_id}/{entidade_id}/thumbnail.{ext}"
        
    elif tipo == "avatar":
        key = f"avatares/{entidade_id}/perfil.{ext}"
        
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo inválido. Use: temporada_capa, episodio_thumbnail, avatar"
        )
    
    try:
        s3 = get_s3_client()
        s3.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=key,
            Body=contents,
            ContentType=file.content_type
        )
        
        url = get_public_url(key)
        
        # Atualizar entidade com URL
        if tipo == "temporada_capa":
            temporada.capa_url = url
        elif tipo == "episodio_thumbnail":
            episodio.thumbnail_url = url
        # Avatar é atualizado separadamente
        
        db.commit()
        
        return {
            "message": "Imagem enviada com sucesso",
            "url": url,
            "size": len(contents)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao fazer upload: {str(e)}"
        )

@router.post("/upload/attachment")
async def upload_attachment(
    file: UploadFile = File(...),
    episodio_id: UUID = Form(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Upload de anexo (PDF, Doc, Áudio Extra, etc) para um episódio.
    Apenas admins.
    """
    # Verificar episódio
    episodio = db.query(Episodio).filter(Episodio.id == episodio_id).first()
    if not episodio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episódio não encontrado"
        )
    
    # Validar tamanho (Limite de 50MB para ser seguro)
    contents = await file.read()
    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Arquivo muito grande. Máximo: 50 MB"
        )
    
    # Gerar nome único e manter extensão original
    original_filename = file.filename or "arquivo"
    ext = original_filename.split('.')[-1] if '.' in original_filename else 'bin'
    
    # Sanitizar nome se necessário, mas aqui vamos usar uuid para o nome no storage
    # e manter o nome original no banco (na tabela anexos)
    file_uuid = uuid4()
    key = f"episodios/{episodio.temporada_id}/{episodio_id}/anexos/{file_uuid}.{ext}"
    
    try:
        s3 = get_s3_client()
        s3.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=key,
            Body=contents,
            ContentType=file.content_type or 'application/octet-stream'
        )
        
        url = get_public_url(key)
        
        return {
            "message": "Arquivo enviado com sucesso",
            "url": url,
            "size": len(contents),
            "filename": original_filename,
            "type": file.content_type
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao fazer upload: {str(e)}"
        )

@router.delete("/{tipo}/{entidade_id}")
async def delete_file(
    tipo: str,
    entidade_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Deleta um arquivo do storage.
    Apenas admins.
    """
    # TODO: Implementar deleção
    return {"message": "Funcionalidade em desenvolvimento"}

@router.get("/stats")
async def get_storage_stats(
    current_admin: User = Depends(get_current_admin)
):
    """
    Obtém estatísticas de uso do storage.
    Apenas admins.
    """
    try:
        s3 = get_s3_client()
        
        # Listar objetos
        response = s3.list_objects_v2(Bucket=R2_BUCKET_NAME)
        
        total_files = response.get('KeyCount', 0)
        total_size = sum(obj.get('Size', 0) for obj in response.get('Contents', []))
        
        return {
            "total_files": total_files,
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2)
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "total_files": 0,
            "total_size_mb": 0
        }
