"""
Migração: Adicionar coluna matricula_aec à tabela users
Execute: python add_matricula_column.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database.connection import engine

def run_migration():
    """Adiciona a coluna matricula_aec à tabela users"""
    
    with engine.connect() as conn:
        try:
            # Verificar se coluna já existe
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'matricula_aec'
            """))
            
            if result.fetchone():
                print("[INFO] Coluna matricula_aec já existe!")
                return
            
            # Adicionar coluna
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN matricula_aec VARCHAR(20)
            """))
            
            conn.commit()
            print("[OK] Coluna matricula_aec adicionada com sucesso!")
            
        except Exception as e:
            print(f"[ERRO] Falha na migração: {e}")
            try:
                conn.rollback()
            except:
                pass

if __name__ == "__main__":
    run_migration()
