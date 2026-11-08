@echo off
chcp 65001 >nul
title Conectar Second Brain ao GitHub Desktop

echo =======================================================
echo    Sincronizador Continuo: Second Brain ^<--^> GitHub
echo =======================================================
echo.

set "GIT_EXE=C:\Users\idark\AppData\Local\GitHubDesktop\app-3.6.10\resources\app\git\cmd\git.exe"
set "GITHUB_DESKTOP=C:\Users\idark\AppData\Local\GitHubDesktop\GitHubDesktop.exe"
set "REPO_DIR=%~dp0"

cd /d "%REPO_DIR%"

echo [1/3] Verificando integridade do repositorio Git local...
if not exist ".git" (
    echo Inicializando repositorio Git...
    "%GIT_EXE%" init -b main
    "%GIT_EXE%" config user.name "jonathanmarquesnet-ctrl"
    "%GIT_EXE%" config user.email "jonathanmarquesnet@gmail.com"
)

echo [2/3] Registrando e preparando commits pendentes...
"%GIT_EXE%" add .
"%GIT_EXE%" commit -m "feat: Second Brain Deca-Engine v2.0 - Sincronizacao GitHub" 2>nul

echo [3/3] Conectando ao GitHub Desktop em tempo integral...
if exist "%GITHUB_DESKTOP%" (
    echo Abrindo o GitHub Desktop com o repositorio carregado...
    start "" "%GITHUB_DESKTOP%" "%REPO_DIR%"
    echo.
    echo Sucesso! O GitHub Desktop foi aberto com o Second Brain conectado.
    echo Para publicar no GitHub, basta clicar no botao 'Publish repository' no GitHub Desktop!
) else (
    echo GitHub Desktop nao encontrado em %GITHUB_DESKTOP%
)

echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul
