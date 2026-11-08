@echo off
setlocal enabledelayedexpansion
title Second Brain Launcher

:: 1. LOCALIZA AUTOMATICAMENTE A PASTA ONDE ESTA O PACKAGE.JSON
cd /d "%~dp0"
if exist "project\package.json" (
    cd /d "%~dp0project"
)

if not exist "package.json" (
    echo ========================================================
    echo [ERRO] package.json nao encontrado no diretorio:
    echo %CD%
    echo Certifique-se de executar este script na raiz de D:\Project X
    echo ========================================================
    pause
    exit /b 1
)

echo ========================================================
echo         Second Brain - Inicializador Nativo
echo ========================================================
echo.

:: 2. LIBERA QUALQUER PROCESSO RESIDUAL NA PORTA 3000
echo [1/4] Verificando e liberando a porta 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    if not "%%a"=="" taskkill /f /pid %%a >nul 2>&1
)

:: 3. INSTALACAO AUTOMATICA SE FALTAR O BINARIO DO NEXT.JS
if not exist "node_modules\next" (
    echo [2/4] Instalando dependencias completas com npm...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERRO] Falha ao executar 'npm install'.
        pause
        exit /b %ERRORLEVEL%
    )
)

:: 4. INICIALIZACAO DESACOPLADA DO NEXT.JS EM SEGUNDO PLANO
echo [3/4] Iniciando servidor Next.js em processo independente...
start "Second-Brain-Server" cmd /k "npm run dev"

:: 5. POLLING ATIVO NA PORTA 3000 ATE RESPONDER 200/304
echo [4/4] Aguardando o servidor responder na porta 3000...
set MAX_TENTATIVAS=35
set TENTATIVA=1

:loop_espera
powershell -NoProfile -Command "try { $r = (Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 1).StatusCode; if ($r -eq 200 -or $r -eq 304) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    goto :servidor_pronto
)

echo Aguardando compilacao inicial... [!TENTATIVA!/%MAX_TENTATIVAS%s]
timeout /t 1 /nobreak >nul
set /a TENTATIVA+=1

if !TENTATIVA! LEQ %MAX_TENTATIVAS% (
    goto :loop_espera
)

echo.
echo [AVISO] Tempo limite de espera atingido. Tentando abrir o app mesmo assim...
goto :abrir_janela

:servidor_pronto
echo.
echo [Sucesso] Servidor ativo e pronto na porta 3000!

:abrir_janela
:: 6. ABERTURA EM MODO APP NATIVO STANDALONE
echo Abrindo Second Brain em modo desktop nativo...

where msedge >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    start "" msedge --app=http://localhost:3000
    goto :finalizar
)

where chrome >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    start "" chrome --app=http://localhost:3000
    goto :finalizar
)

if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000
    goto :finalizar
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000
    goto :finalizar
)
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000
    goto :finalizar
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000
    goto :finalizar
)

start http://localhost:3000

:finalizar
echo [Pronto] Second Brain iniciado com sucesso!
timeout /t 2 /nobreak >nul
exit
