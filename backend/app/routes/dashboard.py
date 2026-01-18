"""
Rotas do Dashboard Admin
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta

from app.database.connection import get_db
from app.models.user import User
from app.models.temporada import Temporada
from app.models.episodio import Episodio
from app.models.prova import Prova, ResultadoProva, Pergunta, OpcaoResposta
from app.models.progresso import UsuarioEpisodio
from app.utils.jwt import get_current_admin

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Obtém estatísticas gerais para o dashboard admin.
    """
    # Usuários
    total_usuarios = db.query(User).count()
    usuarios_ativos = db.query(User).filter(User.status == "ativo").count()
    usuarios_pendentes = db.query(User).filter(User.status == "pendente").count()
    usuarios_inativos = db.query(User).filter(User.status == "inativo").count()
    
    # Conteúdo
    total_temporadas = db.query(Temporada).count()
    temporadas_publicadas = db.query(Temporada).filter(Temporada.status == "publicado").count()
    total_episodios = db.query(Episodio).count()
    episodios_publicados = db.query(Episodio).filter(Episodio.status == "publicado").count()
    
    # Provas
    total_provas = db.query(Prova).count()
    total_tentativas = db.query(ResultadoProva).count()
    tentativas_aprovadas = db.query(ResultadoProva).filter(ResultadoProva.aprovado == True).count()
    taxa_aprovacao = (tentativas_aprovadas / total_tentativas * 100) if total_tentativas > 0 else 0
    
    # Progresso geral
    total_visualizacoes = db.query(UsuarioEpisodio).count()
    episodios_concluidos = db.query(UsuarioEpisodio).filter(UsuarioEpisodio.assistido == True).count()
    
    return {
        "usuarios": {
            "total": total_usuarios,
            "ativos": usuarios_ativos,
            "pendentes": usuarios_pendentes,
            "inativos": usuarios_inativos
        },
        "temporadas": {
            "total": total_temporadas,
            "publicadas": temporadas_publicadas
        },
        "episodios": {
            "total": total_episodios,
            "publicados": episodios_publicados,
            "visualizacoes": total_visualizacoes,
            "concluidos": episodios_concluidos
        },
        "provas": {
            "total": total_provas,
            "tentativas": total_tentativas,
            "aprovadas": tentativas_aprovadas,
            "taxa_aprovacao": round(taxa_aprovacao, 1)
        }
    }

@router.get("/users-progress")
async def get_users_progress(
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Obtém os usuários mais ativos com seu progresso.
    """
    # Total de episódios publicados
    total_episodios = db.query(Episodio).filter(Episodio.status == "publicado").count()
    
    # Usuários com mais episódios concluídos
    users_progress = db.query(
        User.id,
        User.nome_completo,
        User.email,
        func.count(UsuarioEpisodio.id).label('episodios_assistidos')
    ).outerjoin(
        UsuarioEpisodio, 
        (User.id == UsuarioEpisodio.usuario_id) & (UsuarioEpisodio.assistido == True)
    ).filter(
        User.status == "ativo"
    ).group_by(
        User.id
    ).order_by(
        func.count(UsuarioEpisodio.id).desc()
    ).limit(limit).all()
    
    result = []
    for u in users_progress:
        progresso = (u.episodios_assistidos / total_episodios * 100) if total_episodios > 0 else 0
        result.append({
            "id": str(u.id),
            "nome": u.nome_completo,
            "email": u.email,
            "episodios_assistidos": u.episodios_assistidos,
            "total_episodios": total_episodios,
            "progresso": round(progresso, 1)
        })
    
    return {"users": result}

@router.get("/provas-performance")
async def get_provas_performance(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Obtém performance das provas e questões mais erradas.
    """
    provas = db.query(Prova).all()
    
    provas_stats = []
    for prova in provas:
        total_tentativas = db.query(ResultadoProva).filter(ResultadoProva.prova_id == prova.id).count()
        aprovadas = db.query(ResultadoProva).filter(
            ResultadoProva.prova_id == prova.id,
            ResultadoProva.aprovado == True
        ).count()
        
        # Média de pontuação
        avg_query = db.query(func.avg(ResultadoProva.pontuacao)).filter(
            ResultadoProva.prova_id == prova.id
        ).scalar()
        
        provas_stats.append({
            "prova_id": str(prova.id),
            "titulo": prova.titulo,
            "total_tentativas": total_tentativas,
            "aprovadas": aprovadas,
            "taxa_aprovacao": round((aprovadas / total_tentativas * 100) if total_tentativas > 0 else 0, 1),
            "media_pontuacao": round(float(avg_query or 0), 1)
        })
    
    return {"provas": provas_stats}

@router.get("/episodios-ranking")
async def get_episodios_ranking(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Obtém os episódios mais assistidos.
    """
    ranking = db.query(
        Episodio.id,
        Episodio.titulo,
        func.count(UsuarioEpisodio.id).label('visualizacoes'),
        func.sum(
            func.cast(UsuarioEpisodio.assistido, db.bind.dialect.type_descriptor(db.bind.dialect.type_descriptor.__class__))
        ).label('concluidos')
    ).outerjoin(
        UsuarioEpisodio,
        Episodio.id == UsuarioEpisodio.episodio_id
    ).group_by(
        Episodio.id
    ).order_by(
        func.count(UsuarioEpisodio.id).desc()
    ).limit(limit).all()
    
    result = []
    for ep in ranking:
        concluidos = ep.concluidos or 0
        taxa = (concluidos / ep.visualizacoes * 100) if ep.visualizacoes > 0 else 0
        result.append({
            "id": str(ep.id),
            "titulo": ep.titulo,
            "visualizacoes": ep.visualizacoes,
            "concluidos": concluidos,
            "taxa_conclusao": round(taxa, 1)
        })
    
    return {"episodios": result}

@router.get("/novos-usuarios")
async def get_novos_usuarios(
    dias: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Obtém contagem de novos usuários por dia nos últimos X dias.
    """
    data_inicio = datetime.utcnow() - timedelta(days=dias)
    
    usuarios_por_dia = db.query(
        func.date(User.created_at).label('data'),
        func.count(User.id).label('quantidade')
    ).filter(
        User.created_at >= data_inicio
    ).group_by(
        func.date(User.created_at)
    ).order_by(
        func.date(User.created_at)
    ).all()
    
    result = [
        {"data": str(u.data), "quantidade": u.quantidade}
        for u in usuarios_por_dia
    ]
    
    return {"dados": result}
