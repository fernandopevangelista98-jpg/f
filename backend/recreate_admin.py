"""
Script para recriar usuário administrador com senha correta
Execute: python recreate_admin.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database.connection import engine, SessionLocal, Base
from app.models.user import User
import bcrypt

def recreate_admin():
    """Deleta e recria o admin com senha correta"""
    
    db = SessionLocal()
    
    try:
        # Dados do admin
        admin_email = "fernando.p.evangelista98@gmail.com"
        admin_password = "Admin@2026"
        
        # Deletar admin existente
        existing = db.query(User).filter(User.email == admin_email).first()
        if existing:
            db.delete(existing)
            db.commit()
            print(f"[OK] Admin anterior deletado: {admin_email}")
        
        # Criar hash da senha corretamente
        password_bytes = admin_password.encode('utf-8')
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password_bytes, salt)
        senha_hash = hashed.decode('utf-8')
        
        # Criar novo admin
        admin = User(
            nome_completo="Fernando Evangelista",
            email=admin_email,
            senha_hash=senha_hash,
            matricula_aec="ADMIN001",
            area="QUALIDADE",
            cargo="GERENTE",
            perfil="admin",
            status="ativo"
        )
        
        db.add(admin)
        db.commit()
        
        print("=" * 50)
        print("ADMIN RECRIADO COM SUCESSO!")
        print("=" * 50)
        print(f"   Email: {admin_email}")
        print(f"   Senha: {admin_password}")
        print("=" * 50)
        
        # Verificar se o hash funciona
        stored_hash = senha_hash.encode('utf-8')
        if bcrypt.checkpw(password_bytes, stored_hash):
            print("[OK] Verificacao de senha OK!")
        else:
            print("[ERRO] Falha na verificacao de senha!")
        
    except Exception as e:
        print(f"[ERRO] Falha: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    recreate_admin()
