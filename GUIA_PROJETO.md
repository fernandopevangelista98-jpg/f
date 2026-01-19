# 📜 GUIA DO PROJETO - Podcast Educativo AI

> **Última Atualização:** 19/01/2026 às 10:05
> **Status Geral:** ✅ Sprint 8 Concluída | 🎉 PAINEL ADMIN COMPLETO

---

## 🎯 VISÃO GERAL DO PROJETO

**Nome:** Original AeC - Academia de Excelência
**Objetivo:** Plataforma de podcast educativo para treinamento de analistas de qualidade da AeC
**Tipo:** Aplicação Web Full-Stack (SPA + API REST)

---

## 🌍 URLS DE PRODUÇÃO (ATUAIS)

| Serviço | URL | Provedor | Plano |
|---------|-----|----------|-------|
| **Frontend** | https://f-bay-eight.vercel.app | Vercel | Free |
| **Backend API** | https://podcast-backend-fvsu.onrender.com | Render | Free |
| **Documentação API** | https://podcast-backend-fvsu.onrender.com/docs | Render | - |
| **Banco de Dados** | `postgresql+psycopg://...@crossover.proxy.rlwy.net:51819/railway` | Railway | Free |

---

## 🔐 CREDENCIAIS ADMIN

```
Email: fernando.p.evangelista98@gmail.com
Senha: Admin@2026
Perfil: admin
Status: ativo
```

---

## 🏗️ ARQUITETURA TÉCNICA

### Stack Frontend
```
Framework:      React 18.2.0
Build Tool:     Vite 5.0.8
Estilização:    TailwindCSS 3.3.6
Roteamento:     React Router Dom 6.21.1
HTTP Client:    Axios 1.6.2
Gráficos:       Recharts 2.x
State:          Context API (AuthContext)
```

### Stack Backend
```
Framework:      FastAPI 0.108.0
Linguagem:      Python 3.10+
ORM:            SQLAlchemy 2.0.23
Driver DB:      psycopg 3.1.14
Auth:           python-jose (JWT), bcrypt
Validação:      Pydantic 2.5.3, email-validator 2.1.0
Server:         Uvicorn 0.25.0
```

### Infraestrutura
```
Frontend Host:  Vercel (Auto-deploy via GitHub)
Backend Host:   Render (Auto-deploy via GitHub)
Database:       PostgreSQL 16 (Railway)
Repositório:    https://github.com/fernandopevangelista98-jpg/f
Branch:         main
```

---

## 📁 ESTRUTURA DE PASTAS

```
c:\Users\Fernando\Documents\podcast com ia\
├── backend\
│   ├── app\
│   │   ├── database\
│   │   │   └── connection.py      # Config SQLAlchemy + Engine
│   │   ├── models\
│   │   │   ├── user.py            # Model User
│   │   │   ├── temporada.py       # Model Temporada
│   │   │   ├── episodio.py        # Model Episodio
│   │   │   ├── prova.py           # Model Prova + Pergunta + Opcao
│   │   │   └── progresso.py       # Model Progresso
│   │   └── routes\
│   │       ├── auth.py            # /auth (login, register)
│   │       ├── users.py           # /users (CRUD)
│   │       ├── temporadas.py      # /temporadas (CRUD)
│   │       ├── episodios.py       # /episodios (CRUD)
│   │       ├── provas.py          # /provas (CRUD + perguntas)
│   │       ├── progresso.py       # /usuario (progresso aluno)
│   │       ├── storage.py         # /storage (upload arquivos)
│   │       └── dashboard.py       # /dashboard (stats admin)
│   ├── main.py                    # App FastAPI + CORS + Rotas
│   ├── config.py                  # Settings (env vars)
│   ├── create_admin.py            # Script criar admin
│   └── requirements.txt           # Dependências Python
│
├── frontend\
│   ├── src\
│   │   ├── contexts\
│   │   │   └── AuthContext.jsx    # Estado global de auth
│   │   ├── pages\
│   │   │   ├── Home.jsx           # Landing page
│   │   │   ├── Login.jsx          # Tela de login
│   │   │   ├── Register.jsx       # Tela de cadastro
│   │   │   ├── Temporadas.jsx     # Lista de temporadas (aluno)
│   │   │   ├── Prova.jsx          # Realizar prova
│   │   │   └── Admin.jsx          # PAINEL ADMIN COMPLETO
│   │   ├── services\
│   │   │   └── api.js             # Axios instance + interceptor
│   │   ├── App.jsx                # Rotas + Proteção
│   │   ├── main.jsx               # Entry point
│   │   └── index.css              # Estilos globais + Tailwind
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── vercel.json                # Config rewrites SPA
│
└── GUIA_PROJETO.md                # Este arquivo
```

---

## 📊 ENDPOINTS DA API (BACKEND)

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/register` | Cadastrar novo usuário |
| POST | `/auth/login` | Login (retorna JWT) |

### Usuários
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/users` | Listar todos |
| GET | `/users/{id}` | Detalhes usuário |
| PUT | `/users/{id}` | Atualizar usuário |
| DELETE | `/users/{id}` | Deletar usuário |
| PATCH | `/users/{id}/approve` | Aprovar/Recusar |

### Temporadas
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/temporadas` | Listar temporadas |
| POST | `/temporadas` | Criar temporada |
| PUT | `/temporadas/{id}` | Atualizar |
| DELETE | `/temporadas/{id}` | Deletar |

### Episódios
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/episodios` | Listar episódios |
| GET | `/episodios?temporada_id=xxx` | Listar por temporada |
| POST | `/episodios` | Criar episódio |
| PUT | `/episodios/{id}` | Atualizar |
| DELETE | `/episodios/{id}` | Deletar |

### Provas
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/provas` | Listar provas |
| POST | `/provas` | Criar prova |
| PUT | `/provas/{id}` | Atualizar prova |
| POST | `/provas/{id}/perguntas` | Adicionar pergunta |
| DELETE | `/provas/{id}` | Deletar prova |
| DELETE | `/provas/perguntas/{id}` | Deletar pergunta |

### Dashboard
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/dashboard/stats` | Estatísticas gerais |
| GET | `/dashboard/users-progress` | Progresso dos usuários |
| GET | `/dashboard/provas-performance` | Performance das provas |
| GET | `/dashboard/episodios-ranking` | Ranking de episódios |
| GET | `/dashboard/novos-usuarios` | Novos usuários por período |

---

## 🎨 PAINEL ADMINISTRATIVO

### Abas Disponíveis

| Aba | Funcionalidade |
|-----|----------------|
| 📊 Dashboard | KPIs, gráficos, atividade recente |
| 👥 Usuários | CRUD completo, aprovação de cadastros |
| 📚 Temporadas | Criar/editar/excluir temporadas |
| 🎧 Episódios | Gerenciar episódios por temporada |
| 📝 Provas | Criar provas e perguntas |
| 📊 Relatórios | 6 relatórios com gráficos + exportação CSV |
| ⚙️ Configurações | 6 módulos de configuração |
| 📋 Logs | Log de atividades e erros |

---

## 🛠️ VARIÁVEIS DE AMBIENTE

### Backend (Render)
```env
DATABASE_URL=postgresql+psycopg://postgres:OAOGWqosBElqBiDxGSwHnzNQUevNHeyu@crossover.proxy.rlwy.net:51819/railway
SECRET_KEY=uma_chave_secreta_bem_dificil_123
FRONTEND_URL=https://f-bay-eight.vercel.app
PYTHON_VERSION=3.11.9
```

### Frontend (Vercel)
```env
VITE_API_URL=https://podcast-backend-fvsu.onrender.com
```

---

## 🔧 COMANDOS ÚTEIS

### Rodar Localmente
```bash
# Backend
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

### Deploy
```bash
# Push para GitHub (auto-deploy Vercel/Render)
git add -A && git commit -m "mensagem" && git push
```

---

## ⚠️ PROBLEMAS CONHECIDOS

1. **Render Free Tier:** O backend "dorme" após 15min de inatividade. Primeiro request pode levar ~50s.
2. **CORS:** Frontend DEVE usar URL de produção (`f-bay-eight.vercel.app`), não os links de preview.
3. **PowerShell:** Comando `npm` pode falhar, usar `cmd /c npm ...` como workaround.

---

## 📞 CONTATO

**Desenvolvedor:** Fernando Evangelista
**Email:** fernando.p.evangelista98@gmail.com
**Repositório:** https://github.com/fernandopevangelista98-jpg/f

---

*Documento gerado automaticamente em 19/01/2026.*
