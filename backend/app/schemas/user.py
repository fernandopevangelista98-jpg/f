"""
Schemas de Usuário
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class UserUpdate(BaseModel):
    """Schema para atualizar usuário"""
    nome_completo: Optional[str] = Field(None, min_length=3, max_length=255)
    matricula_aec: Optional[str] = None
    area: Optional[str] = None
    cargo: Optional[str] = None
    status: Optional[str] = None  # 'pendente', 'ativo', 'inativo'
    perfil: Optional[str] = None  # 'admin', 'usuario'

class UserOut(BaseModel):
    """Schema de saída de usuário"""
    id: UUID
    nome_completo: str
    email: EmailStr
    matricula_aec: Optional[str] = None
    area: Optional[str] = None
    cargo: Optional[str] = None
    perfil: str
    status: str
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserWithProgress(UserOut):
    """Usuário com dados de progresso"""
    episodios_concluidos: int = 0
    total_episodios: int = 0
    progresso_percentual: float = 0.0
    provas_realizadas: int = 0
    provas_aprovadas: int = 0

class UserList(BaseModel):
    """Lista paginada de usuários"""
    users: List[UserOut]
    total: int
    page: int
    pages: int

class UserApprove(BaseModel):
    """Schema para aprovar/recusar usuário"""
    acao: str = Field(..., pattern="^(aprovar|recusar)$")
    motivo: Optional[str] = None  # Motivo da recusa
