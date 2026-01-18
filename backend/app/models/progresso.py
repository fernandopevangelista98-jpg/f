"""
Model de Progresso do Usuário nos Episódios
"""
from sqlalchemy import Column, Integer, DateTime, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database.connection import Base

class UsuarioEpisodio(Base):
    __tablename__ = "usuario_episodios"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    episodio_id = Column(UUID(as_uuid=True), ForeignKey("episodios.id", ondelete="CASCADE"), nullable=False, index=True)
    assistido = Column(Boolean, default=False)
    tempo_atual = Column(Integer, default=0)  # em segundos
    data_conclusao = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Constraint de unicidade
    __table_args__ = (
        UniqueConstraint('usuario_id', 'episodio_id', name='uq_usuario_episodio'),
    )
    
    # Relacionamentos
    episodio = relationship("Episodio", back_populates="progresso_usuarios")
    
    def __repr__(self):
        return f"<Progresso user={self.usuario_id} ep={self.episodio_id}>"
