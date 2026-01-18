"""
Rotas de Provas
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from decimal import Decimal
from datetime import datetime

from app.database.connection import get_db
from app.models.prova import Prova, Pergunta, OpcaoResposta, ResultadoProva
from app.models.temporada import Temporada
from app.models.episodio import Episodio
from app.models.progresso import UsuarioEpisodio
from app.models.user import User
from app.schemas.prova import (
    ProvaCreate, ProvaUpdate, ProvaOut, ProvaWithPerguntas,
    PerguntaCreate, PerguntaOut, OpcaoOut,
    ResponderProva, ResultadoOut, ResultadoDetalhado, PerguntaWithAnswer, OpcaoWithAnswer
)
from app.utils.jwt import get_current_user, get_current_admin
from app.services.certificados import gerar_certificado

router = APIRouter()

def verificar_prova_liberada(db: Session, temporada_id: UUID, usuario_id: UUID) -> bool:
    """Verifica se o usuário completou todos os episódios da temporada"""
    # Total de episódios publicados na temporada
    total_episodios = db.query(Episodio)\
        .filter(Episodio.temporada_id == temporada_id, Episodio.status == "publicado")\
        .count()
    
    if total_episodios == 0:
        return False
    
    # Episódios concluídos pelo usuário
    concluidos = db.query(UsuarioEpisodio)\
        .join(Episodio)\
        .filter(
            Episodio.temporada_id == temporada_id,
            UsuarioEpisodio.usuario_id == usuario_id,
            UsuarioEpisodio.assistido == True
        )\
        .count()
    
    return concluidos >= total_episodios

# === ROTA DE LISTAGEM ===

@router.get("", response_model=List[ProvaOut])
async def list_provas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista todas as provas.
    Admins veem todas; usuários veem apenas provas de temporadas disponíveis.
    """
    if current_user.perfil == "admin":
        provas = db.query(Prova).order_by(Prova.created_at.desc()).all()
    else:
        # Usuários comuns veem apenas provas de temporadas publicadas
        provas = db.query(Prova)\
            .join(Temporada)\
            .filter(Temporada.status == "publicada")\
            .order_by(Prova.created_at.desc())\
            .all()
    
    return [ProvaOut.model_validate(p) for p in provas]


@router.get("/{prova_id}", response_model=ProvaWithPerguntas)
async def get_prova(
    prova_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtém uma prova com suas perguntas para responder.
    """
    prova = db.query(Prova).filter(Prova.id == prova_id).first()
    
    if not prova:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prova não encontrada"
        )
    
    # Verificar se está liberada (apenas para usuários comuns)
    bloqueado = False
    if current_user.perfil != "admin":
        if not verificar_prova_liberada(db, prova.temporada_id, current_user.id):
            bloqueado = True
    
    # Contar tentativas do usuário
    tentativas_feitas = db.query(ResultadoProva)\
        .filter(ResultadoProva.prova_id == prova_id, ResultadoProva.usuario_id == current_user.id)\
        .count()
    
    tentativas_restantes = prova.tentativas_permitidas - tentativas_feitas
    
    # Verificar se já aprovado
    ja_aprovado = db.query(ResultadoProva)\
        .filter(
            ResultadoProva.prova_id == prova_id,
            ResultadoProva.usuario_id == current_user.id,
            ResultadoProva.aprovado == True
        )\
        .first()
    
    if ja_aprovado and current_user.perfil != "admin":
        bloqueado = True  # Já passou, não precisa refazer
    
    # Buscar perguntas
    perguntas = db.query(Pergunta)\
        .filter(Pergunta.prova_id == prova_id)\
        .order_by(Pergunta.ordem)\
        .all()
    
    perguntas_out = []
    for p in perguntas:
        opcoes = db.query(OpcaoResposta)\
            .filter(OpcaoResposta.pergunta_id == p.id)\
            .order_by(OpcaoResposta.ordem)\
            .all()
        
        perguntas_out.append(PerguntaOut(
            id=p.id,
            enunciado=p.enunciado,
            ordem=p.ordem,
            peso=p.peso,
            opcoes=[OpcaoOut(id=o.id, texto=o.texto, ordem=o.ordem) for o in opcoes]
        ))
    
    return ProvaWithPerguntas(
        **ProvaOut.model_validate(prova).model_dump(),
        perguntas=perguntas_out,
        total_perguntas=len(perguntas_out),
        tentativas_restantes=max(0, tentativas_restantes),
        bloqueado=bloqueado
    )

@router.post("/{prova_id}/responder", response_model=ResultadoDetalhado)
async def responder_prova(
    prova_id: UUID,
    respostas: ResponderProva,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Envia respostas da prova e recebe o resultado.
    """
    prova = db.query(Prova).filter(Prova.id == prova_id).first()
    
    if not prova:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prova não encontrada"
        )
    
    # Verificar se está liberada
    if not verificar_prova_liberada(db, prova.temporada_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Complete todos os episódios antes de fazer a prova"
        )
    
    # Verificar tentativas
    tentativas_feitas = db.query(ResultadoProva)\
        .filter(ResultadoProva.prova_id == prova_id, ResultadoProva.usuario_id == current_user.id)\
        .count()
    
    if tentativas_feitas >= prova.tentativas_permitidas:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você já esgotou todas as tentativas"
        )
    
    # Calcular pontuação
    perguntas = db.query(Pergunta).filter(Pergunta.prova_id == prova_id).all()
    
    total_pontos = sum(p.peso for p in perguntas)
    pontos_obtidos = 0
    acertos = 0
    erros = 0
    feedback_perguntas = []
    
    for pergunta in perguntas:
        resposta_usuario_id = respostas.respostas.get(str(pergunta.id))
        
        # Buscar opções
        opcoes = db.query(OpcaoResposta).filter(OpcaoResposta.pergunta_id == pergunta.id).all()
        opcao_correta = next((o for o in opcoes if o.correta), None)
        
        acertou = False
        if resposta_usuario_id and opcao_correta:
            acertou = str(opcao_correta.id) == resposta_usuario_id
            if acertou:
                pontos_obtidos += pergunta.peso
                acertos += 1
            else:
                erros += 1
        else:
            erros += 1
        
        # Montar feedback se configurado para mostrar
        if prova.mostrar_respostas:
            feedback_perguntas.append(PerguntaWithAnswer(
                id=pergunta.id,
                enunciado=pergunta.enunciado,
                ordem=pergunta.ordem,
                peso=pergunta.peso,
                opcoes=[OpcaoWithAnswer(
                    id=o.id,
                    texto=o.texto,
                    ordem=o.ordem,
                    correta=o.correta,
                    feedback=o.feedback
                ) for o in opcoes],
                resposta_usuario=UUID(resposta_usuario_id) if resposta_usuario_id else None,
                acertou=acertou
            ))
    
    # Calcular porcentagem
    pontuacao = (pontos_obtidos / total_pontos * 100) if total_pontos > 0 else 0
    aprovado = pontuacao >= float(prova.nota_minima_aprovacao)
    
    # Salvar resultado
    resultado = ResultadoProva(
        usuario_id=current_user.id,
        prova_id=prova_id,
        respostas=respostas.respostas,
        pontuacao=Decimal(str(round(pontuacao, 2))),
        aprovado=aprovado,
        tentativa_numero=tentativas_feitas + 1
    )
    
    db.add(resultado)
    db.commit()
    db.refresh(resultado)
    
    return ResultadoDetalhado(
        **ResultadoOut.model_validate(resultado).model_dump(),
        perguntas=feedback_perguntas if prova.mostrar_respostas else [],
        acertos=acertos,
        erros=erros
    )

@router.get("/{prova_id}/resultado", response_model=List[ResultadoOut])
async def get_resultados(
    prova_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtém histórico de tentativas do usuário na prova.
    """
    resultados = db.query(ResultadoProva)\
        .filter(
            ResultadoProva.prova_id == prova_id,
            ResultadoProva.usuario_id == current_user.id
        )\
        .order_by(ResultadoProva.tentativa_numero.desc())\
        .all()
    
    return [ResultadoOut.model_validate(r) for r in resultados]

# === ROTAS ADMIN ===

@router.post("", response_model=ProvaOut, status_code=status.HTTP_201_CREATED)
async def create_prova(
    prova_data: ProvaCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Cria uma nova prova para uma temporada.
    Apenas admins.
    """
    # Verificar se temporada existe
    temporada = db.query(Temporada).filter(Temporada.id == prova_data.temporada_id).first()
    if not temporada:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Temporada não encontrada"
        )
    
    # Verificar se já existe prova para essa temporada
    prova_existente = db.query(Prova).filter(Prova.temporada_id == prova_data.temporada_id).first()
    if prova_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe uma prova para esta temporada"
        )
    
    prova = Prova(
        temporada_id=prova_data.temporada_id,
        titulo=prova_data.titulo,
        descricao=prova_data.descricao,
        tentativas_permitidas=prova_data.tentativas_permitidas,
        nota_minima_aprovacao=prova_data.nota_minima_aprovacao,
        tempo_limite=prova_data.tempo_limite,
        mostrar_respostas=prova_data.mostrar_respostas
    )
    
    db.add(prova)
    db.commit()
    db.refresh(prova)
    
    return ProvaOut.model_validate(prova)

@router.post("/{prova_id}/perguntas", response_model=PerguntaOut)
async def add_pergunta(
    prova_id: UUID,
    pergunta_data: PerguntaCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Adiciona uma pergunta à prova.
    Apenas admins.
    """
    prova = db.query(Prova).filter(Prova.id == prova_id).first()
    if not prova:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prova não encontrada"
        )
    
    # Criar pergunta
    pergunta = Pergunta(
        prova_id=prova_id,
        enunciado=pergunta_data.enunciado,
        ordem=pergunta_data.ordem,
        peso=pergunta_data.peso
    )
    
    db.add(pergunta)
    db.commit()
    db.refresh(pergunta)
    
    # Criar opções
    for opcao_data in pergunta_data.opcoes:
        opcao = OpcaoResposta(
            pergunta_id=pergunta.id,
            texto=opcao_data.texto,
            correta=opcao_data.correta,
            feedback=opcao_data.feedback,
            ordem=opcao_data.ordem
        )
        db.add(opcao)
    
    db.commit()
    
    # Buscar opções para retornar
    opcoes = db.query(OpcaoResposta).filter(OpcaoResposta.pergunta_id == pergunta.id).all()
    
    return PerguntaOut(
        id=pergunta.id,
        enunciado=pergunta.enunciado,
        ordem=pergunta.ordem,
        peso=pergunta.peso,
        opcoes=[OpcaoOut(id=o.id, texto=o.texto, ordem=o.ordem) for o in opcoes]
    )

@router.delete("/{prova_id}")
async def delete_prova(
    prova_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Deleta uma prova e todas suas perguntas.
    Apenas admins.
    """
    prova = db.query(Prova).filter(Prova.id == prova_id).first()
    
    if not prova:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prova não encontrada"
        )
    
    db.delete(prova)
    db.commit()
    
    return {"message": "Prova deletada com sucesso"}


@router.get("/{prova_id}/certificado/{resultado_id}")
async def download_certificado(
    prova_id: UUID,
    resultado_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Gera e retorna o certificado PDF para download.
    Apenas para resultados aprovados do próprio usuário.
    """
    # Buscar resultado
    resultado = db.query(ResultadoProva).filter(
        ResultadoProva.id == resultado_id,
        ResultadoProva.prova_id == prova_id
    ).first()
    
    if not resultado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resultado não encontrado"
        )
    
    # Verificar se é do usuário atual (admin pode ver qualquer um)
    if resultado.usuario_id != current_user.id and current_user.perfil != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )
    
    # Verificar se foi aprovado
    if not resultado.aprovado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Certificado disponível apenas para aprovados"
        )
    
    # Buscar prova e temporada
    prova = db.query(Prova).filter(Prova.id == prova_id).first()
    temporada = db.query(Temporada).filter(Temporada.id == prova.temporada_id).first()
    
    # Gerar PDF
    pdf_bytes = gerar_certificado(
        nome_aluno=current_user.nome_completo,
        titulo_prova=prova.titulo,
        titulo_temporada=temporada.titulo if temporada else "N/A",
        pontuacao=float(resultado.pontuacao),
        data_realizacao=resultado.data_realizacao
    )
    
    # Retornar como download
    filename = f"certificado-{prova.titulo.replace(' ', '_')}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

