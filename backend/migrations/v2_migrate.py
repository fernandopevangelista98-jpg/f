"""
Migração v2 - Adiciona campos para controle de lançamento e anexos
Execute: python -m migrations.v2_migrate
"""
import os
import sys

# Adicionar o diretório pai ao path para importar os módulos
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database.connection import engine

def run_migration():
    """Executa as migrações do banco de dados"""
    
    migrations = [
        # === TEMPORADAS ===
        """
        ALTER TABLE temporadas 
        ADD COLUMN IF NOT EXISTS data_lancamento TIMESTAMP WITH TIME ZONE;
        """,
        """
        ALTER TABLE temporadas 
        ADD COLUMN IF NOT EXISTS visivel BOOLEAN DEFAULT true;
        """,
        
        # === EPISÓDIOS ===
        """
        ALTER TABLE episodios 
        ADD COLUMN IF NOT EXISTS data_lancamento TIMESTAMP WITH TIME ZONE;
        """,
        """
        ALTER TABLE episodios 
        ADD COLUMN IF NOT EXISTS conteudo_texto TEXT;
        """,
        """
        ALTER TABLE episodios 
        ADD COLUMN IF NOT EXISTS visivel BOOLEAN DEFAULT true;
        """,
        
        # === NOVA TABELA: ANEXOS ===
        """
        CREATE TABLE IF NOT EXISTS anexos_episodio (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            episodio_id UUID NOT NULL REFERENCES episodios(id) ON DELETE CASCADE,
            tipo VARCHAR(20) NOT NULL,
            nome_arquivo VARCHAR(255) NOT NULL,
            url TEXT NOT NULL,
            tamanho_bytes INTEGER,
            ordem INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_anexos_episodio_id ON anexos_episodio(episodio_id);
        """,
    ]
    
    print("🚀 Iniciando migração v2...")
    
    with engine.connect() as conn:
        for i, migration in enumerate(migrations, 1):
            try:
                conn.execute(text(migration))
                conn.commit()
                print(f"  ✓ Migração {i}/{len(migrations)} executada com sucesso")
            except Exception as e:
                # Se já existe, apenas continua
                if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                    print(f"  ⏭️ Migração {i}/{len(migrations)} já aplicada, pulando...")
                else:
                    print(f"  ❌ Erro na migração {i}: {e}")
                    # Continua mesmo com erro (pode ser que já exista)
    
    print("✅ Migração v2 concluída!")

if __name__ == "__main__":
    run_migration()
