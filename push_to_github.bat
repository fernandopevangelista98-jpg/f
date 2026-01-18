@echo off
set GIT_CMD="C:\Program Files\Git\cmd\git.exe"

echo Configurando identidade...
%GIT_CMD% config --global user.email "fernando@exemplo.com"
%GIT_CMD% config --global user.name "Fernando"

echo Inicializando repositorio...
%GIT_CMD% init

echo Adicionando arquivos...
%GIT_CMD% add .

echo Commit...
%GIT_CMD% commit -m "Deploy inicial Fase 6 - Podcast AI"

echo Branch main...
%GIT_CMD% branch -M main

echo Configurando remote...
%GIT_CMD% remote remove origin 2>nul
%GIT_CMD% remote add origin https://github.com/fernandopevangelista98-jpg/f.git

echo Enviando para GitHub...
echo ATENCAO: Pode abrir uma janela pop-up pedindo login!
%GIT_CMD% push -u origin main

echo.
echo Processo finalizado.
