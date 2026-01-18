"""
Configurações da aplicação
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    """Configurações carregadas do arquivo .env"""
    
    # Banco de Dados
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "")
    database_url: str = os.getenv("DATABASE_URL", "")
    
    # JWT
    secret_key: str = os.getenv("SECRET_KEY", "sua-chave-secreta-mude-isso")
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    refresh_token_expire_days: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # Cloudflare R2
    r2_account_id: str = os.getenv("R2_ACCOUNT_ID", "")
    r2_access_key_id: str = os.getenv("R2_ACCESS_KEY_ID", "")
    r2_secret_access_key: str = os.getenv("R2_SECRET_ACCESS_KEY", "")
    r2_bucket_name: str = os.getenv("R2_BUCKET_NAME", "podcast-aec")
    r2_endpoint: str = os.getenv("R2_ENDPOINT", "")
    
    # Resend (Emails)
    resend_api_key: str = os.getenv("RESEND_API_KEY", "")
    email_from: str = os.getenv("EMAIL_FROM", "onboarding@resend.dev")
    
    # Frontend
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # Admin inicial
    admin_email: str = os.getenv("ADMIN_EMAIL", "admin@exemplo.com")
    admin_password: str = os.getenv("ADMIN_PASSWORD", "mudar123")
    
    class Config:
        env_file = "../.env"

@lru_cache()
def get_settings():
    """Retorna as configurações (cached)"""
    return Settings()

settings = get_settings()
