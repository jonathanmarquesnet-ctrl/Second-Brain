#!/usr/bin/env bash
echo "======================================================"
echo "   Encerrando Second Brain e liberando porta 3000...  "
echo "======================================================"

PIDS=$(lsof -ti:3000 2>/dev/null || true)
if [ -n "$PIDS" ]; then
  kill -9 $PIDS 2>/dev/null || true
  echo "[Sucesso] Processos na porta 3000 finalizados!"
else
  echo "[Info] Nenhum processo ativo detectado na porta 3000."
fi

echo "Finalizado."
