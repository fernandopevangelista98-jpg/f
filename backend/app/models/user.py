"""
Model de Usuário
"""
from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.database.connection import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome_completo = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    senha_hash = Column(Text, nullable=False)
    matricula_aec = Column(String(20), unique=True, index=True)  # Matrícula AeC
    area = Column(String(100))
    cargo = Column(String(100))
    perfil = Column(String(20), default="usuario")  # 'admin' ou 'usuario'
    status = Column(String(20), default="pendente", index=True)  # 'pendente', 'ativo', 'inativo'
    avatar_url = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<User {self.email}>"
