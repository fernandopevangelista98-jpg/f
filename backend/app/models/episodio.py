"""
Model de Episódio
"""
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database.connection import Base

class Episodio(Base):
    __tablename__ = "episodios"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    temporada_id = Column(UUID(as_uuid=True), ForeignKey("temporadas.id", ondelete="CASCADE"), nullable=False, index=True)
    titulo = Column(String(255), nullable=False)
    descricao = Column(Text)
    duracao = Column(Integer)  # em segundos
    ordem = Column(Integer, nullable=False, index=True)
    audio_url = Column(Text, nullable=True)  # Pode ser nulo se tiver apenas vídeo
    video_url = Column(Text)
    thumbnail_url = Column(Text)
    transcricao = Column(Text)
    status = Column(String(20), default="rascunho")  # 'rascunho', 'publicado', 'arquivado'
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relacionamentos
    temporada = relationship("Temporada", back_populates="episodios")
    progresso_usuarios = relationship("UsuarioEpisodio", back_populates="episodio", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Episodio {self.titulo}>"
