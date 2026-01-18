"""
Rotas de Autenticação
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.schemas.auth import (
    UserRegister, UserLogin, Token, TokenRefresh,
    ForgotPassword, ResetPassword, LoginResponse, UserBase
)
from app.utils.jwt import (
    get_password_hash, verify_password,
    create_access_token, create_refresh_token, decode_token,
    create_password_reset_token, verify_password_reset_token,
    get_current_user
)
from app.services.email_service import send_welcome_email, send_password_reset_email

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Cadastro de novo usuário.
    O usuário fica com status 'pendente' até ser aprovado por um admin.
    """
    # Verificar se email já existe
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado"
        )
    
    # Verificar se matrícula já existe
    existing_matricula = db.query(User).filter(User.matricula_aec == user_data.matricula_aec).first()
    if existing_matricula:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Matrícula já cadastrada"
        )
    
    # Criar usuário
    new_user = User(
        nome_completo=user_data.nome_completo,
        email=user_data.email,
        senha_hash=get_password_hash(user_data.senha),
        matricula_aec=user_data.matricula_aec,
        area=user_data.area.value if user_data.area else None,
        cargo=user_data.cargo.value if user_data.cargo else None,
        status="pendente",
        perfil="usuario"
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Enviar email de boas-vindas (em background)
    background_tasks.add_task(send_welcome_email, new_user.nome_completo, new_user.email)
    
    return {
        "message": "Cadastro realizado com sucesso! Aguarde aprovação do administrador.",
        "user_id": str(new_user.id)
    }

@router.post("/login", response_model=LoginResponse)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """
    Login de usuário.
    Retorna tokens JWT (access e refresh).
    """
    # Buscar usuário
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )
    
    # Verificar senha
    if not verify_password(user_data.senha, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )
    
    # Verificar status
    if user.status == "pendente":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sua conta está aguardando aprovação"
        )
    
    if user.status == "inativo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sua conta foi desativada"
        )
    
    # Criar tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserBase.model_validate(user)
    )

@router.post("/refresh", response_model=Token)
async def refresh_token(token_data: TokenRefresh, db: Session = Depends(get_db)):
    """
    Renova o access token usando o refresh token.
    """
    payload = decode_token(token_data.refresh_token)
    
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or user.status != "ativo":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário inválido ou inativo"
        )
    
    # Criar novos tokens
    new_access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer"
    )

@router.get("/me", response_model=UserBase)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Retorna dados do usuário autenticado.
    """
    return UserBase.model_validate(current_user)

@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPassword,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Solicita recuperação de senha.
    Envia email com link para redefinir.
    """
    user = db.query(User).filter(User.email == data.email).first()
    
    # Sempre retorna sucesso para não revelar se email existe
    if user:
        token = create_password_reset_token(user.email)
        background_tasks.add_task(
            send_password_reset_email,
            user.nome_completo,
            user.email,
            token
        )
    
    return {"message": "Se o email existir, você receberá instruções para redefinir sua senha."}

@router.post("/reset-password")
async def reset_password(data: ResetPassword, db: Session = Depends(get_db)):
    """
    Redefine a senha usando o token recebido por email.
    """
    email = verify_password_reset_token(data.token)
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido ou expirado"
        )
    
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Atualizar senha
    user.senha_hash = get_password_hash(data.nova_senha)
    db.commit()
    
    return {"message": "Senha alterada com sucesso!"}
