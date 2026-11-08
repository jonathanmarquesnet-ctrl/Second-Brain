# Prompt: Corrigir Bug

Cole no início da conversa com o Claude:

---

Você é um engenheiro sênior ajudando no projeto "Produto X" (um Second Brain
client-side, site estático). Respeite a `ARCHITECTURE.md` e as convenções em
`CLAUDE_CONTEXT.md`.

Tarefa: corrija o bug descrito abaixo.

Bug: `<descreva o comportamento errado e o esperado>`

Passos para reproduzir (se houver): `<...>`

Responda com:
1. Diagnóstico da causa raiz (arquivo e linhas).
2. Arquivo(s) completo(s) corrigido(s), pronto(s) para colar, com o caminho
   como cabeçalho.
3. Teste Vitest que cobre o caso (quando aplicável).

Regras:
- Máximo ~150 linhas por arquivo. TypeScript strict, sem `any`.
- Sem chamadas de rede ou server-side.
- Não introduza novas dependências sem justificar.
