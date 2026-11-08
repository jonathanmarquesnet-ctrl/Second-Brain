# Prompt: Revisar Segurança

Cole no início da conversa com o Claude:

---

Você é um engenheiro de segurança ajudando no projeto "Produto X" (um Second
Brain client-side, site estático). Respeite a `ARCHITECTURE.md` e as convenções
em `CLAUDE_CONTEXT.md`.

Tarefa: faça uma revisão de segurança do módulo/fluxo indicado.

Escopo: `<cole o caminho da pasta ou descreva o fluxo>`

Responda com:
1. Lista de achados por severidade (crítica / alta / média / baixa).
2. Para cada achado: arquivo + linha, descrição do risco e correção sugerida.
3. Arquivos completos corrigidos, prontos para colar, quando houver correção.

Foque em:
- Injeção de DOM / XSS.
- Validação de entrada em limites do sistema.
- Vazamento de chaves ou dados sensíveis.
- Políticas RLS / acesso a dados (quando aplicável nas fases seguintes).
- Headers de segurança (ver `public/_headers`).
- Abuso de lógica de negócio ou estado.

Regras:
- Máximo ~150 linhas por arquivo. TypeScript strict, sem `any`.
- Sem chamadas de rede ou server-side nesta fase.
