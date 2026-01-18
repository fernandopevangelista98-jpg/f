"""
Schemas de Temporada e Episódio
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

# === TEMPORADA ===
class TemporadaCreate(BaseModel):
    """Schema para criar temporada"""
    nome: str = Field(..., min_length=1, max_length=255)
    descricao: Optional[str] = None
    ordem: int = Field(..., ge=0)
    mantra: Optional[str] = None
    status: str = "rascunho"

class TemporadaUpdate(BaseModel):
    """Schema para atualizar temporada"""
    nome: Optional[str] = Field(None, min_length=1, max_length=255)
    descricao: Optional[str] = None
    ordem: Optional[int] = Field(None, ge=0)
    mantra: Optional[str] = None
    status: Optional[str] = None
    capa_url: Optional[str] = None

class TemporadaOut(BaseModel):
    """Schema de saída de temporada"""
    id: UUID
    nome: str
    descricao: Optional[str] = None
    ordem: int
    mantra: Optional[str] = None
    capa_url: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# === EPISÓDIO ===
class EpisodioCreate(BaseModel):
    """Schema para criar episódio"""
    temporada_id: UUID
    titulo: str = Field(..., min_length=1, max_length=255)
    descricao: Optional[str] = None
    ordem: int = Field(..., ge=0)
    status: str = "rascunho"

class EpisodioUpdate(BaseModel):
    """Schema para atualizar episódio"""
    titulo: Optional[str] = Field(None, min_length=1, max_length=255)
    descricao: Optional[str] = None
    ordem: Optional[int] = Field(None, ge=0)
    transcricao: Optional[str] = None
    status: Optional[str] = None
    temporada_id: Optional[UUID] = None  # Para mover de temporada
    video_url: Optional[str] = None

class EpisodioOut(BaseModel):
    """Schema de saída de episódio"""
    id: UUID
    temporada_id: UUID
    titulo: str
    descricao: Optional[str] = None
    duracao: Optional[int] = None
    ordem: int
    audio_url: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    transcricao: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class EpisodioWithProgress(EpisodioOut):
    """Episódio com dados de progresso do usuário"""
    assistido: bool = False
    tempo_atual: int = 0

# === TEMPORADA COM EPISÓDIOS ===
class TemporadaWithEpisodios(TemporadaOut):
    """Temporada com lista de episódios"""
    episodios: List[EpisodioOut] = []
    total_episodios: int = 0
    
class TemporadaWithProgress(TemporadaOut):
    """Temporada com progresso do usuário"""
    episodios: List[EpisodioWithProgress] = []
    total_episodios: int = 0
    episodios_concluidos: int = 0
    progresso_percentual: float = 0.0
    prova_liberada: bool = False
