"""
Models de Prova, Perguntas e Respostas
"""
from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database.connection import Base

class Prova(Base):
    __tablename__ = "provas"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    temporada_id = Column(UUID(as_uuid=True), ForeignKey("temporadas.id", ondelete="CASCADE"), unique=True, index=True)
    titulo = Column(String(255), nullable=False)
    descricao = Column(Text)
    tentativas_permitidas = Column(Integer, default=3)
    nota_minima_aprovacao = Column(Numeric(5, 2), default=70.00)
    tempo_limite = Column(Integer)  # em minutos, NULL = sem limite
    mostrar_respostas = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relacionamentos
    temporada = relationship("Temporada", back_populates="prova")
    perguntas = relationship("Pergunta", back_populates="prova", cascade="all, delete-orphan")
    resultados = relationship("ResultadoProva", back_populates="prova", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Prova {self.titulo}>"


class Pergunta(Base):
    __tablename__ = "perguntas"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prova_id = Column(UUID(as_uuid=True), ForeignKey("provas.id", ondelete="CASCADE"), nullable=False, index=True)
    enunciado = Column(Text, nullable=False)
    ordem = Column(Integer, nullable=False)
    peso = Column(Integer, default=1)  # pontos
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relacionamentos
    prova = relationship("Prova", back_populates="perguntas")
    opcoes = relationship("OpcaoResposta", back_populates="pergunta", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Pergunta {self.id}>"


class OpcaoResposta(Base):
    __tablename__ = "opcoes_resposta"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pergunta_id = Column(UUID(as_uuid=True), ForeignKey("perguntas.id", ondelete="CASCADE"), nullable=False, index=True)
    texto = Column(Text, nullable=False)
    correta = Column(Boolean, default=False)
    feedback = Column(Text)
    ordem = Column(String(1))  # 'A', 'B', 'C', 'D'
    
    # Relacionamentos
    pergunta = relationship("Pergunta", back_populates="opcoes")
    
    def __repr__(self):
        return f"<Opcao {self.ordem}: {self.texto[:30]}>"


class ResultadoProva(Base):
    __tablename__ = "resultados_prova"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    prova_id = Column(UUID(as_uuid=True), ForeignKey("provas.id", ondelete="CASCADE"), nullable=False, index=True)
    respostas = Column(JSONB)  # {pergunta_id: opcao_id}
    pontuacao = Column(Numeric(5, 2), nullable=False)
    aprovado = Column(Boolean, nullable=False)
    tentativa_numero = Column(Integer, default=1)
    tempo_gasto = Column(Integer)  # em segundos
    certificado_url = Column(Text)
    
    data_realizacao = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relacionamentos
    prova = relationship("Prova", back_populates="resultados")
    
    def __repr__(self):
        return f"<Resultado {self.pontuacao}% - {'Aprovado' if self.aprovado else 'Reprovado'}>"
