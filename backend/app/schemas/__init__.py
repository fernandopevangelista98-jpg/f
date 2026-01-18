# Módulo de schemas
from .auth import (
    UserRegister, UserLogin, Token, TokenRefresh,
    ForgotPassword, ResetPassword, UserBase, UserResponse, LoginResponse
)
from .user import UserUpdate, UserOut, UserWithProgress, UserList, UserApprove
from .temporada import (
    TemporadaCreate, TemporadaUpdate, TemporadaOut, TemporadaWithEpisodios, TemporadaWithProgress,
    EpisodioCreate, EpisodioUpdate, EpisodioOut, EpisodioWithProgress
)
from .prova import (
    ProvaCreate, ProvaUpdate, ProvaOut, ProvaWithPerguntas,
    PerguntaCreate, PerguntaOut, PerguntaWithAnswer,
    OpcaoCreate, OpcaoOut, OpcaoWithAnswer,
    ResponderProva, ResultadoOut, ResultadoDetalhado
)
from .progresso import ProgressoUpdate, ProgressoEpisodio, ProgressoTemporada, ProgressoGeral
