#!/usr/bin/env bash
set -e

# Navega para o diretorio do script
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

if [ -f "project/package.json" ]; then
  cd project
fi

echo "======================================================"
echo "   Second Brain - Inicializador Nativo Desktop"
echo "======================================================"
echo ""

if [ ! -d "node_modules" ]; then
  echo "[1/3] Instalando dependências (primeira execução)..."
  npm install
fi

echo "[2/3] Iniciando servidor Next.js..."
npm run dev > /dev/null 2>&1 &
SERVER_PID=$!

echo "[3/3] Aguardando aplicação inicializar na porta 3000..."
until curl -s http://localhost:3000 > /dev/null; do
  sleep 1
done

echo ""
echo "[Sucesso] Servidor ativo! Abrindo janela de aplicativo..."

if command -v msedge >/dev/null 2>&1; then
  msedge --app=http://localhost:3000 &
elif command -v google-chrome >/dev/null 2>&1; then
  google-chrome --app=http://localhost:3000 &
elif command -v chromium >/dev/null 2>&1; then
  chromium --app=http://localhost:3000 &
elif [ "$(uname)" = "Darwin" ]; then
  if [ -d "/Applications/Microsoft Edge.app" ]; then
    open -na "Microsoft Edge" --args --app=http://localhost:3000
  elif [ -d "/Applications/Google Chrome.app" ]; then
    open -na "Google Chrome" --args --app=http://localhost:3000
  else
    open http://localhost:3000
  fi
else
  xdg-open http://localhost:3000 &
fi

echo "[Pronto] Second Brain aberto com sucesso!"
