"""
Schemas de Anexo de Episódio
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class AnexoCreate(BaseModel):
    """Schema para criar anexo"""
    tipo: str = Field(..., pattern="^(pdf|imagem|documento|audio_extra)$")
    nome_arquivo: str = Field(..., min_length=1, max_length=255)
    url: str
    tamanho_bytes: Optional[int] = None
    ordem: int = 0

class AnexoOut(BaseModel):
    """Schema de saída de anexo"""
    id: UUID
    episodio_id: UUID
    tipo: str
    nome_arquivo: str
    url: str
    tamanho_bytes: Optional[int] = None
    ordem: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class AnexoList(BaseModel):
    """Lista de anexos"""
    anexos: List[AnexoOut]
    total: int
