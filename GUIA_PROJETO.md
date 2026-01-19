# 📘 GUIA COMPLETO DO PROJETO - PODCAST EDUCATIVO AI

> **Projeto:** Original AeC - Academia de Excelência  
> **Versão:** 1.8.0 (Sprint 8 Concluída)  
> **Última Atualização:** 19/01/2026

---

## 1. 🎯 O QUE É ESTE PROJETO?

O **Original AeC - Academia de Excelência** é uma plataforma de educação corporativa moderna, estilo "Netflix/Spotify", focada no treinamento de analistas de qualidade da AeC.

**Problema que resolve:** Treinamentos corporativos tradicionais podem ser maçantes e pouco engajadores.  
**Solução:** Uma plataforma de Learning Management System (LMS) focada em áudio (podcasts), onde o conteúdo é organizado em **Temporadas** e **Episódios**, com validação de conhecimento através de **Provas**.

### 👥 Perfis de Usuário
1.  **Aluno (Analista):** Ouve os podcasts, acompanha seu progresso, realiza provas para testar o conhecimento.
2.  **Administrador:** Gerencia usuários, cria temporadas e episódios, elabora provas, monitora relatórios de desempenho e configurações do sistema.

---

## 2. 🏗️ ARQUITETURA E TECNOLOGIAS

O sistema opera como uma **Aplicação Web Full-Stack** dividida em duas partes principais (Frontend e Backend) que se comunicam via API REST.

### 🖥️ Frontend (O que o usuário vê)
-   **Tecnologia:** React 18 (Javascript) + Vite
-   **Estilização:** TailwindCSS (para design rápido e responsivo)
-   **Design:** Tema escuro "Dark Mode", visual moderno com glassmorphism.
-   **Hospedagem:** Vercel (https://f-bay-eight.vercel.app)
-   **Responsabilidade:** Exibir as telas, tocar os áudios, mostrar gráficos (Recharts), gerenciar navegação.

### ⚙️ Backend (O cérebro do sistema)
-   **Tecnologia:** Python 3.10 + FastAPI
-   **Segurança:** Autenticação JWT (JSON Web Token) e senhas criptografadas (Bcrypt).
-   **Hospedagem:** Render (https://podcast-backend-fvsu.onrender.com)
-   **Responsabilidade:** processar logins, salvar dados no banco, validar provas, enviar emails.

### 🗄️ Banco de Dados (A memória)
-   **Tecnologia:** PostgreSQL 16
-   **Hospedagem:** Railway
-   **Responsabilidade:** Armazenar usuários, temporadas, episódios, notas de provas e histórico.

---

## 3. 🚀 FUNCIONALIDADES DETALHADAS (MÓDULOS)

### 3.1. 📊 Dashboard (Admin)
O centro de comando. Exibe cards com KPIs (Indicadores Chave de Desempenho):
-   Total de usuários ativos.
-   Conteúdo publicado (temporadas/episódios).
-   Média de notas nas provas.
-   Uso de armazenamento.
-   **Gráficos:** Novos usuários por mês, progresso por temporada, distribuição por área.

### 3.2. 👥 Gerenciador de Usuários
Controle total sobre quem acessa a plataforma.
-   **Listagem:** Tabela com busca e filtros (Status, Área, Cargo).
-   **Aprovação:** Novos cadastros entram como "Pendentes" e precisam ser aprovados manualmente pelo Admin.
-   **Ações:** Criar, Editar, Excluir, Resetar senha de usuários.

### 3.3. 📚 Gestão de Conteúdo (Temporadas e Episódios)
Onde o conteúdo educacional é criado.
-   **Temporadas:** Conjuntos temáticos de episódios. Têm capa, título, descrição e um "mantra".
-   **Episódios:** O conteúdo em si. Cada episódio tem áudio, vídeo (opcional), transcrição e ordem.
-   **Status:** Podem ser salvos como "Rascunho" (invisível para alunos) ou "Publicado".

### 3.4. 📝 Sistema de Avaliação (Provas)
Para validar o aprendizado.
-   **Provas:** Vinculadas a conteúdos ou gerais. Configurações de nota mínima, tempo limite e tentativas permitidas.
-   **Perguntas:** Múltipla escolha (A, B, C, D). O admin cadastra a pergunta e define a correta.
-   **Feedback:** O aluno recebe a nota imediatamente após finalizar.

### 3.5. 📈 Hub de Relatórios
Analytics avançado para tomada de decisão.
-   **6 Relatórios:** Visão Geral, Usuários Ativos, Performance em Provas, Episódios Populares, Crescimento, Engajamento.
-   **Exportação:** Capacidade de exportar dados brutos em CSV.

### 3.6. ⚙️ Configurações e Logs
Manutenção do sistema.
-   **Configurações:** Personalização visual (Logo, Cores), Templates de Email, Regras de Segurança (senha forte), Backup.
-   **Logs:** Histórico de quem fez o que (Log de Atividades) e registro de erros do sistema (Log de Erros).

---

## 4. 🔄 FLUXOS PRINCIPAIS

### Fluxo de Cadastro
1.  Usuário acessa `/register` e preenche dados.
2.  Conta é criada com status **"Pendente"**.
3.  Admin recebe notificação (Log) e acessa aba **Usuários**.
4.  Admin clica em **"Aprovar"**.
5.  Usuário recebe email (simulado) e pode logar.

### Fluxo de Consumo (Aluno)
1.  Aluno loga e vê a **Home** com temporadas disponíveis.
2.  Clica em uma temporada para ver os episódios.
3.  Ouve o episódio (Player de áudio persistente).
4.  Sistema marca automaticamente como "Concluído" ao terminar.
5.  Se houver prova vinculada, o botão "Fazer Prova" é habilitado.

---

## 5. 🛠️ GUIA DE MANUTENÇÃO E DESENVOLVIMENTO

### Como rodar o projeto no seu computador (Localhost)

**Pré-requisitos:** Node.js, Python e Git instalados.

#### 1. Clonar o repositório
```bash
git clone https://github.com/fernandopevangelista98-jpg/f.git
cd f
```

#### 2. Configurar o Backend (API)
```bash
cd backend
python -m venv venv           # Criar ambiente virtual
.\venv\Scripts\activate       # Ativar ambiente (Windows)
pip install -r requirements.txt # Instalar dependências
uvicorn main:app --reload     # Iniciar servidor
# Backend rodando em http://localhost:8000
```

#### 3. Configurar o Frontend (Interface)
(Em outro terminal)
```bash
cd frontend
npm install                   # Instalar dependências
npm run dev                   # Iniciar servidor de desenvolvimento
# Frontend rodando em http://localhost:5173
```

### Deploy (Colocar no ar)
O deploy é automatizado. Basta enviar as alterações para o GitHub:
```bash
git add -A
git commit -m "Descrição das mudanças"
git push
```
-   O **Vercel** detecta o push e atualiza o site automaticamente em ~1 minuto.
-   O **Render** detecta o push e atualiza a API em ~3-5 minutos.

---

## 6. ⚠️ RESOLUÇÃO DE PROBLEMAS COMUNS

| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| **Site não carrega dados ("Loading infinito")** | Backend no Render está "dormindo" (Free Tier). | Aguarde ~50 segundos para "acordar" o servidor. Tente recarregar. |
| **Erro "Network Error"** | Frontend local tentando acessar Backend produtivo bloqueado por CORS (ou vice-versa), ou Backend offline. | Verifique se o Backend está rodando. Se for local, verifique a URL da API no `.env`. |
| **Login falha (401 Unauthorized)** | Email/Senha incorretos ou usuário pendente. | Verifique credenciais. Se for novo usuário, peça ao Admin para aprovar. |
| **Erro ao aprovar usuário (405 Method Not Allowed)** | Endpoint incorreto sendo chamado (PUT vs PATCH). | **Corrigido na Sprint 8.** Se persistir, limpe o cache do navegador. |

---

## 7. 📞 SUPORTE

**Desenvolvedor Líder:** Fernando Evangelista  
**Contato:** fernando.p.evangelista98@gmail.com  
**Repositório Oficial:** [GitHub](https://github.com/fernandopevangelista98-jpg/f)

---
*Documento gerado para documentação oficial do projeto.*
