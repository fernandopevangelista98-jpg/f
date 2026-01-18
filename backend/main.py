"""
================================================
PODCAST EDUCATIVO - API BACKEND
Original AeC - Temporada Zero
================================================
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Importar rotas
from app.routes import auth, users, temporadas, episodios, provas, progresso, storage, dashboard

# Importar configuração do banco
from app.database.connection import engine, Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida da aplicação"""
    # Startup: Criar tabelas no banco
    Base.metadata.create_all(bind=engine)
    print("[OK] Banco de dados inicializado!")
    yield
    # Shutdown
    print("[BYE] Servidor encerrado!")

# Criar aplicação FastAPI
app = FastAPI(
    title="Podcast Educativo API",
    description="API para a plataforma de podcast educativo Original AeC",
    version="1.0.0",
    lifespan=lifespan
)

# Configurar CORS
origins = [
    "http://localhost:5173",      # Vite dev server
    "http://localhost:3000",      # React dev server
    os.getenv("FRONTEND_URL", "http://localhost:5173"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar rotas
app.include_router(auth.router, prefix="/auth", tags=["Autenticação"])
app.include_router(users.router, prefix="/users", tags=["Usuários"])
app.include_router(temporadas.router, prefix="/temporadas", tags=["Temporadas"])
app.include_router(episodios.router, prefix="/episodios", tags=["Episódios"])
app.include_router(provas.router, prefix="/provas", tags=["Provas"])
app.include_router(progresso.router, prefix="/usuario", tags=["Progresso"])
app.include_router(storage.router, prefix="/storage", tags=["Storage"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard Admin"])

@app.get("/", tags=["Health"])
async def root():
    """Endpoint de verificação de saúde da API"""
    return {
        "status": "online",
        "message": "Podcast Educativo API está funcionando!",
        "version": "1.0.0"
    }

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check para monitoramento"""
    return {"status": "healthy"}

# Para rodar localmente: uvicorn main:app --reload
