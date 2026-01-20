"""
Model de Anexo de Episódio
Suporta: PDFs, imagens, documentos, áudios extras
"""
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database.connection import Base

class AnexoEpisodio(Base):
    __tablename__ = "anexos_episodio"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    episodio_id = Column(UUID(as_uuid=True), ForeignKey("episodios.id", ondelete="CASCADE"), nullable=False, index=True)
    
    tipo = Column(String(20), nullable=False)  # 'pdf', 'imagem', 'documento', 'audio_extra'
    nome_arquivo = Column(String(255), nullable=False)
    url = Column(Text, nullable=False)
    tamanho_bytes = Column(Integer)
    ordem = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relacionamento
    episodio = relationship("Episodio", back_populates="anexos")
    
    def __repr__(self):
        return f"<Anexo {self.nome_arquivo} ({self.tipo})>"
