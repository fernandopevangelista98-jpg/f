"""
Schemas de Autenticação
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime
from enum import Enum

# === ENUMS ===
class CargoEnum(str, Enum):
    ATENDENTE = "ATENDENTE"
    AUXILIAR = "AUXILIAR"
    MONITOR = "MONITOR"
    SUPERVISOR = "SUPERVISOR"
    COORDENADOR = "COORDENADOR"
    GERENTE = "GERENTE"
    SUPERINTENDENTE = "SUPERINTENDENTE"
    DIRETOR = "DIRETOR"
    VP = "VP"

class AreaEnum(str, Enum):
    QUALIDADE = "QUALIDADE"
    PLANEJAMENTO = "PLANEJAMENTO"
    OPERACAO = "OPERAÇÃO"
    TREINAMENTO = "TREINAMENTO"
    OUTRAS = "OUTRAS"

# === CADASTRO ===
class UserRegister(BaseModel):
    """Schema para cadastro de novo usuário"""
    nome_completo: str = Field(..., min_length=3, max_length=255)
    email: EmailStr
    senha: str = Field(..., min_length=6)
    matricula_aec: str = Field(..., min_length=3, max_length=20, description="Matrícula AeC")
    area: AreaEnum
    cargo: CargoEnum

# === LOGIN ===
class UserLogin(BaseModel):
    """Schema para login"""
    email: EmailStr
    senha: str

class Token(BaseModel):
    """Schema de resposta com tokens"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenRefresh(BaseModel):
    """Schema para refresh de token"""
    refresh_token: str

# === RECUPERAR SENHA ===
class ForgotPassword(BaseModel):
    """Schema para solicitar recuperação de senha"""
    email: EmailStr

class ResetPassword(BaseModel):
    """Schema para redefinir senha"""
    token: str
    nova_senha: str = Field(..., min_length=6)

# === USUÁRIO RESPONSE ===
class UserBase(BaseModel):
    """Schema base de usuário"""
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
    
    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    """Schema de resposta de usuário"""
    user: UserBase

class LoginResponse(BaseModel):
    """Schema de resposta de login"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserBase
