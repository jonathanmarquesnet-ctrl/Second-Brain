@echo off
setlocal enabledelayedexpansion
title Encerrar Second Brain

echo ========================================================
echo    Encerrando Second Brain e liberando porta 3000...
echo ========================================================
echo.

set FECHOU=0

:: Identifica qualquer PID escutando na porta 3000 e finaliza
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    if not "%%a"=="" (
        set FECHOU=1
        echo Encerrando processo PID: %%a...
        taskkill /f /pid %%a >nul 2>&1
    )
)

:: Encerra o terminal rotulado do servidor Next.js se estiver aberto
taskkill /f /fi "WINDOWTITLE eq Second-Brain-Server*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Second Brain Server*" >nul 2>&1

echo.
if "!FECHOU!"=="1" (
    echo [Sucesso] Processos na porta 3000 finalizados com sucesso!
) else (
    echo [Info] Nenhum processo ativo detectado na porta 3000.
)

echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul
exit
