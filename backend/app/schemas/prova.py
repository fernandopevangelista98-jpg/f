"""
Schemas de Prova
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from uuid import UUID
from datetime import datetime
from decimal import Decimal

# === OPÇÃO DE RESPOSTA ===
class OpcaoCreate(BaseModel):
    """Schema para criar opção de resposta"""
    texto: str
    correta: bool = False
    feedback: Optional[str] = None
    ordem: str = Field(..., pattern="^[A-D]$")

class OpcaoOut(BaseModel):
    """Schema de saída de opção"""
    id: UUID
    texto: str
    ordem: str
    # Nota: 'correta' e 'feedback' só são retornados após responder
    
    class Config:
        from_attributes = True

class OpcaoWithAnswer(OpcaoOut):
    """Opção com resposta correta (pós prova)"""
    correta: bool
    feedback: Optional[str] = None

# === PERGUNTA ===
class PerguntaCreate(BaseModel):
    """Schema para criar pergunta"""
    enunciado: str
    ordem: int = Field(..., ge=0)
    peso: int = Field(default=1, ge=1)
    opcoes: List[OpcaoCreate]

class PerguntaOut(BaseModel):
    """Schema de saída de pergunta"""
    id: UUID
    enunciado: str
    ordem: int
    peso: int
    opcoes: List[OpcaoOut]
    
    class Config:
        from_attributes = True

class PerguntaWithAnswer(BaseModel):
    """Pergunta com resposta (feedback pós prova)"""
    id: UUID
    enunciado: str
    ordem: int
    peso: int
    opcoes: List[OpcaoWithAnswer]
    resposta_usuario: Optional[UUID] = None
    acertou: bool = False

# === PROVA ===
class ProvaCreate(BaseModel):
    """Schema para criar prova"""
    temporada_id: UUID
    titulo: str = Field(..., min_length=1, max_length=255)
    descricao: Optional[str] = None
    tentativas_permitidas: int = Field(default=3, ge=1)
    nota_minima_aprovacao: Decimal = Field(default=70.00, ge=0, le=100)
    tempo_limite: Optional[int] = Field(None, ge=1)  # minutos
    mostrar_respostas: bool = True

class ProvaUpdate(BaseModel):
    """Schema para atualizar prova"""
    titulo: Optional[str] = Field(None, min_length=1, max_length=255)
    descricao: Optional[str] = None
    tentativas_permitidas: Optional[int] = Field(None, ge=1)
    nota_minima_aprovacao: Optional[Decimal] = Field(None, ge=0, le=100)
    tempo_limite: Optional[int] = None
    mostrar_respostas: Optional[bool] = None

class ProvaOut(BaseModel):
    """Schema de saída de prova (sem perguntas)"""
    id: UUID
    temporada_id: UUID
    titulo: str
    descricao: Optional[str] = None
    tentativas_permitidas: int
    nota_minima_aprovacao: Decimal
    tempo_limite: Optional[int] = None
    mostrar_respostas: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class ProvaWithPerguntas(ProvaOut):
    """Prova com perguntas para responder"""
    perguntas: List[PerguntaOut]
    total_perguntas: int = 0
    tentativas_restantes: int = 0
    bloqueado: bool = False

# === RESPONDER PROVA ===
class ResponderProva(BaseModel):
    """Schema para enviar respostas da prova"""
    respostas: Dict[str, str]  # {pergunta_id: opcao_id}

class ResultadoOut(BaseModel):
    """Schema de resultado da prova"""
    id: UUID
    pontuacao: Decimal
    aprovado: bool
    tentativa_numero: int
    tempo_gasto: Optional[int] = None
    certificado_url: Optional[str] = None
    data_realizacao: datetime
    
    class Config:
        from_attributes = True

class ResultadoDetalhado(ResultadoOut):
    """Resultado com feedback por questão"""
    perguntas: List[PerguntaWithAnswer] = []
    acertos: int = 0
    erros: int = 0
