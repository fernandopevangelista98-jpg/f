# Módulo de models
from .user import User
from .temporada import Temporada
from .episodio import Episodio
from .prova import Prova, Pergunta, OpcaoResposta, ResultadoProva
from .progresso import UsuarioEpisodio
from .anexo import AnexoEpisodio

__all__ = [
    "User",
    "Temporada", 
    "Episodio",
    "Prova",
    "Pergunta",
    "OpcaoResposta",
    "ResultadoProva",
    "UsuarioEpisodio",
    "AnexoEpisodio"
]
