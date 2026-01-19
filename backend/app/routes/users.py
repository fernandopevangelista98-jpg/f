"""
Rotas de Usuários (Admin)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from uuid import UUID

from app.database.connection import get_db
from app.models.user import User
from app.models.progresso import UsuarioEpisodio
from app.models.prova import ResultadoProva
from app.schemas.user import UserUpdate, UserOut, UserList, UserApprove, UserWithProgress
from app.utils.jwt import get_current_admin
from app.services.email_service import send_approval_email, send_rejection_email

router = APIRouter()

@router.get("", response_model=UserList)
async def list_users(
    status_filter: Optional[str] = Query(None, alias="status"),
    area: Optional[str] = None,
    cargo: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Lista todos os usuários (paginado).
    Apenas admins podem acessar.
    """
    query = db.query(User)
    
    # Filtros
    if status_filter:
        query = query.filter(User.status == status_filter)
    if area:
        query = query.filter(User.area == area)
    if cargo:
        query = query.filter(User.cargo == cargo)
    if search:
        query = query.filter(
            or_(
                User.nome_completo.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%")
            )
        )
    
    # Contagem total
    total = query.count()
    
    # Paginação
    offset = (page - 1) * limit
    users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    
    pages = (total + limit - 1) // limit  # Arredonda para cima
    
    return UserList(
        users=[UserOut.model_validate(u) for u in users],
        total=total,
        page=page,
        pages=pages
    )

@router.get("/{user_id}", response_model=UserWithProgress)
async def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Obtém detalhes de um usuário específico com progresso.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Calcular progresso
    episodios_concluidos = db.query(UsuarioEpisodio)\
        .filter(UsuarioEpisodio.usuario_id == user_id, UsuarioEpisodio.assistido == True)\
        .count()
    
    # Total de episódios publicados
    from app.models.episodio import Episodio
    total_episodios = db.query(Episodio).filter(Episodio.status == "publicado").count()
    
    # Provas
    provas_realizadas = db.query(ResultadoProva)\
        .filter(ResultadoProva.usuario_id == user_id)\
        .count()
    
    provas_aprovadas = db.query(ResultadoProva)\
        .filter(ResultadoProva.usuario_id == user_id, ResultadoProva.aprovado == True)\
        .count()
    
    progresso_percentual = (episodios_concluidos / total_episodios * 100) if total_episodios > 0 else 0
    
    return UserWithProgress(
        **UserOut.model_validate(user).model_dump(),
        episodios_concluidos=episodios_concluidos,
        total_episodios=total_episodios,
        progresso_percentual=round(progresso_percentual, 1),
        provas_realizadas=provas_realizadas,
        provas_aprovadas=provas_aprovadas
    )

@router.put("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Atualiza dados de um usuário.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Atualizar campos
    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return UserOut.model_validate(user)

@router.put("/{user_id}/approve")
async def approve_user(
    user_id: UUID,
    data: UserApprove,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Aprova ou recusa um usuário pendente.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    if data.acao == "aprovar":
        user.status = "ativo"
        db.commit()
        background_tasks.add_task(send_approval_email, user.nome_completo, user.email)
        return {"message": f"Usuário {user.nome_completo} aprovado com sucesso!"}
    
    elif data.acao == "recusar":
        user.status = "inativo"
        db.commit()
        background_tasks.add_task(send_rejection_email, user.nome_completo, user.email, data.motivo)
        return {"message": f"Usuário {user.nome_completo} recusado."}

@router.patch("/{user_id}/approve")
async def approve_user_patch(
    user_id: UUID,
    data: UserApprove,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Aprova ou recusa um usuário pendente (PATCH).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    if data.acao == "aprovar":
        user.status = "ativo"
        db.commit()
        background_tasks.add_task(send_approval_email, user.nome_completo, user.email)
        return {"message": f"Usuário {user.nome_completo} aprovado com sucesso!"}
    
    elif data.acao == "recusar":
        user.status = "inativo"
        db.commit()
        background_tasks.add_task(send_rejection_email, user.nome_completo, user.email, data.motivo)
        return {"message": f"Usuário {user.nome_completo} recusado."}

@router.patch("/{user_id}/approve")
async def approve_user_patch(
    user_id: UUID,
    data: UserApprove,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Aprova ou recusa um usuário pendente (PATCH).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    if data.acao == "aprovar":
        user.status = "ativo"
        db.commit()
        background_tasks.add_task(send_approval_email, user.nome_completo, user.email)
        return {"message": f"Usuário {user.nome_completo} aprovado com sucesso!"}
    
    elif data.acao == "recusar":
        user.status = "inativo"
        db.commit()
        background_tasks.add_task(send_rejection_email, user.nome_completo, user.email, data.motivo)
        return {"message": f"Usuário {user.nome_completo} recusado."}

@router.delete("/{user_id}")
async def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Deleta um usuário permanentemente.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Não permitir deletar a si mesmo
    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode deletar sua própria conta"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "Usuário deletado com sucesso"}
