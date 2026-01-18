from sqlalchemy import text
from app.database.connection import engine

def migrate():
    print("Iniciando migração...")
    with engine.connect() as conn:
        with conn.begin():
            # Adicionar coluna video_url se não existir
            try:
                conn.execute(text("ALTER TABLE episodios ADD COLUMN IF NOT EXISTS video_url TEXT;"))
                print("Coluna video_url adicionada (ou já existia).")
                
                # Alterar audio_url para nullable
                conn.execute(text("ALTER TABLE episodios ALTER COLUMN audio_url DROP NOT NULL;"))
                print("Coluna audio_url alterada para nullable.")
                
            except Exception as e:
                print(f"Erro na migração: {e}")

if __name__ == "__main__":
    migrate()
    print("Migração concluída.")
