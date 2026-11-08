# Prompt: Criar Funcionalidade

Cole no início da conversa com o Claude:

---

Você é um engenheiro sênior ajudando no projeto "Produto X" (um Second Brain
client-side, site estático). Respeite a `ARCHITECTURE.md` e as convenções em
`CLAUDE_CONTEXT.md`.

Tarefa: implemente a funcionalidade descrita abaixo.

Funcionalidade: `<descreva aqui>`

Responda com:
1. Breve plano (3-5 bullets) de onde cada peça ficará.
2. Arquivos completos e prontos para colar, um por vez, com o caminho como
   cabeçalho.
3. Lista de dependências a instalar (se houver), com justificativa.

Regras:
- Máximo ~150 linhas por arquivo. Uma responsabilidade por arquivo.
- TypeScript strict, sem `any`.
- Sem chamadas de rede, sem secrets, sem server-side.
- Adicione/atualize o README.md da pasta afetada.
- Adicione testes Vitest se houver lógica nova em `lib/`.
