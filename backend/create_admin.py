"""
Script para criar usuário administrador
Execute: python create_admin.py
"""
import sys
import os

# Adicionar pasta raiz ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import SessionLocal, engine, Base
from app.models.user import User
import bcrypt

def hash_password(password: str) -> str:
    """Hash de senha usando bcrypt diretamente"""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def create_admin():
    """Cria o usuário admin inicial"""
    
    # Criar tabelas se não existirem
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Dados do admin
        admin_email = "fernando.p.evangelista98@gmail.com"
        admin_password = "Admin@2026"
        admin_name = "Fernando Evangelista"
        admin_matricula = "ADMIN001"
        
        # Verificar se já existe
        existing = db.query(User).filter(User.email == admin_email).first()
        
        if existing:
            print(f"[INFO] Admin já existe: {admin_email}")
            print(f"       Status: {existing.status}")
            print(f"       Perfil: {existing.perfil}")
            
            # Garantir que é admin ativo
            if existing.perfil != "admin" or existing.status != "ativo":
                existing.perfil = "admin"
                existing.status = "ativo"
                db.commit()
                print("[OK] Admin atualizado para ativo!")
            return
        
        # Criar admin
        admin = User(
            nome_completo=admin_name,
            email=admin_email,
            senha_hash=hash_password(admin_password),
            matricula_aec=admin_matricula,
            area="QUALIDADE",
            cargo="GERENTE",
            perfil="admin",
            status="ativo"  # Admin já começa ativo
        )
        
        db.add(admin)
        db.commit()
        
        print("=" * 50)
        print("ADMIN CRIADO COM SUCESSO!")
        print("=" * 50)
        print(f"   Email: {admin_email}")
        print(f"   Senha: {admin_password}")
        print(f"   Matricula: {admin_matricula}")
        print("=" * 50)
        print("GUARDE ESSAS CREDENCIAIS EM LOCAL SEGURO!")
        print("=" * 50)
        
    except Exception as e:
        print(f"[ERRO] Falha ao criar admin: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
