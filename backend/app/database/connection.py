"""
Conexão com o banco de dados PostgreSQL (Supabase)
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# URL de conexão do Supabase
# Formato: postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
SUPABASE_PROJECT_ID = os.getenv("SUPABASE_PROJECT_ID", "bnmxpftovfgabmoxfrwr")
DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD", "")

# Se DATABASE_URL não estiver definida, construir a partir dos componentes
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL and DATABASE_PASSWORD:
    DATABASE_URL = f"postgresql+psycopg://postgres:{DATABASE_PASSWORD}@db.{SUPABASE_PROJECT_ID}.supabase.co:5432/postgres"
elif not DATABASE_URL:
    # URL para desenvolvimento local (SQLite)
    DATABASE_URL = "sqlite:///./podcast_dev.db"
    print("⚠️ Usando SQLite local para desenvolvimento")

# Configurar engine
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_size=20,
        max_overflow=10,
        pool_pre_ping=True
    )

# Criar sessão
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para os models
Base = declarative_base()

def get_db():
    """
    Dependency para obter sessão do banco.
    Uso: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
