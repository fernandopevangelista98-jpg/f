"""
Schemas de Progresso
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class ProgressoUpdate(BaseModel):
    """Schema para atualizar progresso do episódio"""
    tempo_atual: int = Field(..., ge=0)

class ProgressoEpisodio(BaseModel):
    """Progresso em um episódio específico"""
    episodio_id: UUID
    episodio_titulo: str
    assistido: bool
    tempo_atual: int
    duracao_total: Optional[int] = None
    percentual: float = 0.0
    data_conclusao: Optional[datetime] = None

class ProgressoTemporada(BaseModel):
    """Progresso em uma temporada"""
    temporada_id: UUID
    temporada_nome: str
    total_episodios: int
    episodios_concluidos: int
    progresso_percentual: float
    prova_liberada: bool
    prova_aprovada: bool = False
    melhor_nota: Optional[float] = None

class ProgressoGeral(BaseModel):
    """Progresso geral do usuário"""
    total_temporadas: int
    temporadas_concluidas: int
    total_episodios: int
    episodios_concluidos: int
    tempo_total_assistido: int  # em segundos
    provas_aprovadas: int
    temporadas: List[ProgressoTemporada]
