"""
Model de Temporada
"""
from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database.connection import Base

class Temporada(Base):
    __tablename__ = "temporadas"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String(255), nullable=False)
    descricao = Column(Text)
    ordem = Column(Integer, nullable=False, index=True)
    mantra = Column(Text)
    capa_url = Column(Text)
    status = Column(String(20), default="rascunho", index=True)  # 'rascunho', 'publicado', 'arquivado'
    data_lancamento = Column(DateTime(timezone=True))  # Data/hora de lançamento agendado
    visivel = Column(Boolean, default=True)  # Controle de visibilidade
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relacionamentos
    episodios = relationship("Episodio", back_populates="temporada", cascade="all, delete-orphan")
    prova = relationship("Prova", back_populates="temporada", uselist=False, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Temporada {self.nome}>"
