"""
Rotas de Progresso do Usuário
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime

from app.database.connection import get_db
from app.models.episodio import Episodio
from app.models.temporada import Temporada
from app.models.progresso import UsuarioEpisodio
from app.models.prova import Prova, ResultadoProva
from app.models.user import User
from app.schemas.progresso import ProgressoUpdate, ProgressoEpisodio, ProgressoTemporada, ProgressoGeral
from app.utils.jwt import get_current_user

router = APIRouter()

@router.get("/progresso", response_model=ProgressoGeral)
async def get_progresso_geral(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtém o progresso geral do usuário em todas as temporadas.
    """
    # Temporadas publicadas
    temporadas = db.query(Temporada).filter(Temporada.status == "publicado").order_by(Temporada.ordem).all()
    
    temporadas_progresso = []
    total_episodios = 0
    total_concluidos = 0
    tempo_total = 0
    temporadas_concluidas = 0
    provas_aprovadas = 0
    
    for temp in temporadas:
        # Episódios da temporada
        episodios = db.query(Episodio)\
            .filter(Episodio.temporada_id == temp.id, Episodio.status == "publicado")\
            .all()
        
        temp_total = len(episodios)
        temp_concluidos = 0
        
        for ep in episodios:
            progresso = db.query(UsuarioEpisodio)\
                .filter(
                    UsuarioEpisodio.usuario_id == current_user.id,
                    UsuarioEpisodio.episodio_id == ep.id
                )\
                .first()
            
            if progresso:
                tempo_total += progresso.tempo_atual
                if progresso.assistido:
                    temp_concluidos += 1
        
        total_episodios += temp_total
        total_concluidos += temp_concluidos
        
        prova_liberada = temp_concluidos >= temp_total if temp_total > 0 else False
        
        # Verificar se já passou na prova
        prova = db.query(Prova).filter(Prova.temporada_id == temp.id).first()
        prova_aprovada = False
        melhor_nota = None
        
        if prova:
            resultado = db.query(ResultadoProva)\
                .filter(
                    ResultadoProva.prova_id == prova.id,
                    ResultadoProva.usuario_id == current_user.id,
                    ResultadoProva.aprovado == True
                )\
                .first()
            
            if resultado:
                prova_aprovada = True
                provas_aprovadas += 1
                melhor_nota = float(resultado.pontuacao)
        
        if temp_concluidos >= temp_total and prova_aprovada:
            temporadas_concluidas += 1
        
        temporadas_progresso.append(ProgressoTemporada(
            temporada_id=temp.id,
            temporada_nome=temp.nome,
            total_episodios=temp_total,
            episodios_concluidos=temp_concluidos,
            progresso_percentual=round((temp_concluidos / temp_total * 100) if temp_total > 0 else 0, 1),
            prova_liberada=prova_liberada,
            prova_aprovada=prova_aprovada,
            melhor_nota=melhor_nota
        ))
    
    return ProgressoGeral(
        total_temporadas=len(temporadas),
        temporadas_concluidas=temporadas_concluidas,
        total_episodios=total_episodios,
        episodios_concluidos=total_concluidos,
        tempo_total_assistido=tempo_total,
        provas_aprovadas=provas_aprovadas,
        temporadas=temporadas_progresso
    )

@router.get("/temporadas/{temporada_id}/progresso")
async def get_progresso_temporada(
    temporada_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtém o progresso detalhado do usuário em uma temporada específica.
    """
    temporada = db.query(Temporada).filter(Temporada.id == temporada_id).first()
    
    if not temporada:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Temporada não encontrada"
        )
    
    episodios = db.query(Episodio)\
        .filter(Episodio.temporada_id == temporada_id, Episodio.status == "publicado")\
        .order_by(Episodio.ordem)\
        .all()
    
    episodios_progresso = []
    total_concluidos = 0
    
    for ep in episodios:
        progresso = db.query(UsuarioEpisodio)\
            .filter(
                UsuarioEpisodio.usuario_id == current_user.id,
                UsuarioEpisodio.episodio_id == ep.id
            )\
            .first()
        
        assistido = progresso.assistido if progresso else False
        tempo_atual = progresso.tempo_atual if progresso else 0
        data_conclusao = progresso.data_conclusao if progresso else None
        
        if assistido:
            total_concluidos += 1
        
        percentual = (tempo_atual / ep.duracao * 100) if ep.duracao and ep.duracao > 0 else 0
        
        episodios_progresso.append(ProgressoEpisodio(
            episodio_id=ep.id,
            episodio_titulo=ep.titulo,
            assistido=assistido,
            tempo_atual=tempo_atual,
            duracao_total=ep.duracao,
            percentual=round(min(percentual, 100), 1),
            data_conclusao=data_conclusao
        ))
    
    total_episodios = len(episodios)
    progresso_percentual = (total_concluidos / total_episodios * 100) if total_episodios > 0 else 0
    prova_liberada = total_concluidos >= total_episodios
    
    return {
        "temporada": {
            "id": str(temporada.id),
            "nome": temporada.nome
        },
        "episodios": episodios_progresso,
        "total_episodios": total_episodios,
        "episodios_concluidos": total_concluidos,
        "progresso_percentual": round(progresso_percentual, 1),
        "prova_liberada": prova_liberada
    }

@router.put("/episodios/{episodio_id}/progresso")
async def update_progresso(
    episodio_id: UUID,
    data: ProgressoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Salva o tempo atual de reprodução de um episódio.
    """
    episodio = db.query(Episodio).filter(Episodio.id == episodio_id).first()
    
    if not episodio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episódio não encontrado"
        )
    
    # Buscar ou criar registro de progresso
    progresso = db.query(UsuarioEpisodio)\
        .filter(
            UsuarioEpisodio.usuario_id == current_user.id,
            UsuarioEpisodio.episodio_id == episodio_id
        )\
        .first()
    
    if not progresso:
        progresso = UsuarioEpisodio(
            usuario_id=current_user.id,
            episodio_id=episodio_id
        )
        db.add(progresso)
    
    progresso.tempo_atual = data.tempo_atual
    
    # Marcar como assistido se chegou a 90% (se soubermos a duração)
    if episodio.duracao and data.tempo_atual >= (episodio.duracao * 0.9):
        if not progresso.assistido:
            progresso.assistido = True
            progresso.data_conclusao = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Progresso salvo", "tempo_atual": data.tempo_atual}

@router.put("/episodios/{episodio_id}/marcar-assistido")
async def marcar_assistido(
    episodio_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Marca um episódio como assistido manualmente.
    """
    episodio = db.query(Episodio).filter(Episodio.id == episodio_id).first()
    
    if not episodio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episódio não encontrado"
        )
    
    # Buscar ou criar registro de progresso
    progresso = db.query(UsuarioEpisodio)\
        .filter(
            UsuarioEpisodio.usuario_id == current_user.id,
            UsuarioEpisodio.episodio_id == episodio_id
        )\
        .first()
    
    if not progresso:
        progresso = UsuarioEpisodio(
            usuario_id=current_user.id,
            episodio_id=episodio_id
        )
        db.add(progresso)
    
    if not progresso.assistido:
        progresso.assistido = True
        progresso.data_conclusao = datetime.utcnow()
        if episodio.duracao:
            progresso.tempo_atual = episodio.duracao
    
    db.commit()
    
    return {"message": "Episódio marcado como assistido"}
