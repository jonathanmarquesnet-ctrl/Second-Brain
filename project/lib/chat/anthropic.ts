import type { ChatMessage } from '@/lib/chat/types';
import { MCP_TOOLS, executeMcpTool } from '@/lib/mcp/tools';
import type { SystemPromptBlock } from '@/lib/chat/context';
import { streamPuterClaude } from '@/lib/ai/providers/claude-free-relay';
import { askLocalLlmText } from '@/lib/ai/providers/local-llm';
import { promptNativeBrowserAi } from '@/lib/ai/providers/native-browser-ai';
import { getTopTriplesContext, recordTriple } from '@/lib/ai/memory/llm-memshare-kg';
import { registerWebMcpTools } from '@/lib/ai/layers/layer9-webmcp-a2a';
import { synthesizeDomainProfile } from '@/lib/ai/domain-synthesizer';
import { useProvidersStore } from '@/store/providers-store';

export const CLAUDE_MODEL = 'claude-3-5-sonnet-latest';
const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';
const MAX_TOKENS = 4096;
const MAX_TOOL_TURNS = 4;

export class ChatError extends Error {}

interface StreamOptions {
  key: string;
  system: string | SystemPromptBlock[];
  messages: ChatMessage[];
  signal: AbortSignal;
  onText: (text: string) => void;
}

type ApiContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string };

interface ApiMessage {
  role: 'user' | 'assistant';
  content: string | ApiContentBlock[];
}

interface RawToolCall {
  id: string;
  name: string;
  inputJson: string;
}

function parseSseData(data: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(data);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

async function maybeRunImplicitMcpTools(userText: string, onText: (text: string) => void): Promise<string> {
  const lower = userText.toLowerCase();
  if (lower.includes('nota atual') || lower.includes('ler nota') || lower.includes('get_current_note')) {
    onText('\n\n> ⚙️ *Lendo nota ativa (`get_current_note`)...*\n\n');
    return executeMcpTool('get_current_note', {});
  }
  const fileMatch = /ler arquivo\s+([\w./-]+)/i.exec(userText);
  if (fileMatch?.[1]) {
    onText(`\n\n> ⚙️ *Lendo arquivo (\`${fileMatch[1]}\`)...*\n\n`);
    return executeMcpTool('read_project_file', { file_path: fileMatch[1] });
  }
  return '';
}

async function streamZeroKeyPipeline(
  messages: ChatMessage[],
  systemText: string,
  signal: AbortSignal,
  onText: (text: string) => void
): Promise<void> {
  registerWebMcpTools();
  const routeTable = useProvidersStore.getState().instantRouteTable;
  const lastMsg = messages[messages.length - 1]?.content ?? '';
  const toolContext = await maybeRunImplicitMcpTools(lastMsg, onText);
  const kgContext = await getTopTriplesContext(lastMsg);

  const fullPrompt = [
    systemText,
    kgContext,
    toolContext ? `[Dados da Ferramenta]: ${toolContext}` : '',
    ...messages.slice(-6).map((m) => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`),
  ]
    .filter(Boolean)
    .join('\n\n');

  // Despacho em 0ms usando a tabela de rotas pré-aquecida
  if (routeTable.puterReady) {
    const puterHandled = await streamPuterClaude(fullPrompt, onText, signal);
    if (puterHandled) {
      void recordTriple(lastMsg.slice(0, 48), 'analisado', 'Síntese Contextual', 2);
      return;
    }
  }

  if (routeTable.localLlmBaseUrl) {
    const localReply = await askLocalLlmText(fullPrompt);
    if (localReply) {
      onText(localReply);
      return;
    }
  }

  if (routeTable.nativeAiReady) {
    const nativeReply = await promptNativeBrowserAi(fullPrompt, signal);
    if (nativeReply) {
      onText(nativeReply);
      return;
    }
  }

  // Síntese de Domínio Instantânea (<10ms) focada no tema real do usuário
  const domainProfile = synthesizeDomainProfile(lastMsg);
  const fullAnswer = toolContext
    ? `${domainProfile.chatAnswer}\n\n**Contexto Capturado:**\n\`\`\`json\n${toolContext.slice(0, 400)}\n\`\`\``
    : domainProfile.chatAnswer;

  const chunks = fullAnswer.split(' ');
  // Emite o primeiro bloco imediatamente em 0ms
  if (chunks.length > 0 && !signal.aborted) {
    onText(`${chunks[0]} `);
  }
  for (let i = 1; i < chunks.length; i++) {
    if (signal.aborted) return;
    onText(`${chunks[i]} `);
  }
  void recordTriple(lastMsg.slice(0, 48), 'analisado', 'Síntese de Domínio', 2);
}

export async function streamClaude({ key, system, messages, signal, onText }: StreamOptions): Promise<void> {
  const systemText = typeof system === 'string' ? system : system.map((b) => b.text).join('\n');

  if (!key.trim()) {
    await streamZeroKeyPipeline(messages, systemText, signal, onText);
    return;
  }

  const apiMessages: ApiMessage[] = messages.map(({ role, content }) => ({ role, content }));
  const systemPayload = typeof system === 'string'
    ? [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }]
    : system;

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    let response: Response;
    try {
      response = await fetch(ENDPOINT, {
        method: 'POST',
        signal,
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': API_VERSION,
          'anthropic-dangerous-direct-browser-access': 'true',
          'anthropic-beta': 'prompt-caching-2024-07-31',
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: MAX_TOKENS,
          stream: true,
          system: systemPayload,
          tools: MCP_TOOLS,
          messages: apiMessages,
        }),
      });
    } catch {
      if (signal.aborted) return;
      await streamZeroKeyPipeline(messages, systemText, signal, onText);
      return;
    }

    if (!response.ok || !response.body) {
      await streamZeroKeyPipeline(messages, systemText, signal, onText);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let turnText = '';
    const toolCalls: RawToolCall[] = [];
    let currentTool: RawToolCall | null = null;
    let stopReason: string | null = null;

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() ?? '';

      for (const block of blocks) {
        const dataLines = block.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('');
        if (!dataLines) continue;
        const event = parseSseData(dataLines);
        if (!event) continue;

        if (event.type === 'content_block_start' && event.content_block && typeof event.content_block === 'object') {
          const cb = event.content_block as Record<string, unknown>;
          if (cb.type === 'tool_use') {
            currentTool = { id: String(cb.id ?? ''), name: String(cb.name ?? ''), inputJson: '' };
          }
        } else if (event.type === 'content_block_delta' && event.delta && typeof event.delta === 'object') {
          const delta = event.delta as Record<string, unknown>;
          if (delta.type === 'text_delta' && typeof delta.text === 'string') {
            turnText += delta.text;
            onText(delta.text);
          } else if (delta.type === 'input_json_delta' && typeof delta.partial_json === 'string' && currentTool) {
            currentTool.inputJson += delta.partial_json;
          }
        } else if (event.type === 'content_block_stop' && currentTool) {
          toolCalls.push(currentTool);
          currentTool = null;
        } else if (event.type === 'message_delta' && event.delta && typeof event.delta === 'object') {
          const md = event.delta as Record<string, unknown>;
          if (typeof md.stop_reason === 'string') stopReason = md.stop_reason;
        }
      }
    }

    if (stopReason === 'tool_use' && toolCalls.length > 0) {
      const assistantBlocks: ApiContentBlock[] = [];
      if (turnText.trim()) assistantBlocks.push({ type: 'text', text: turnText });
      const toolResults: ApiContentBlock[] = [];
      for (const tc of toolCalls) {
        let input: Record<string, unknown> = {};
        try {
          input = tc.inputJson ? (JSON.parse(tc.inputJson) as Record<string, unknown>) : {};
        } catch {}
        assistantBlocks.push({ type: 'tool_use', id: tc.id, name: tc.name, input });
        onText(`\n\n> ⚙️ *Executando ferramenta MCP: \`${tc.name}\`...*\n\n`);
        const result = await executeMcpTool(tc.name, input);
        toolResults.push({ type: 'tool_result', tool_use_id: tc.id, content: result });
      }
      apiMessages.push({ role: 'assistant', content: assistantBlocks });
      apiMessages.push({ role: 'user', content: toolResults });
      continue;
    }

    break;
  }
}
