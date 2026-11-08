import { getNote, saveNote } from '@/lib/storage/notes';
import { useBlocksStore } from '@/store/blocks-store';
import { getActiveDirectory, readFileByPath } from '@/lib/bugs/file-system';
import type { Block, BlockType } from '@/lib/blocks/types';
import { createId } from '@/lib/blocks/operations';

export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const MCP_TOOLS: AnthropicTool[] = [
  {
    name: 'get_current_note',
    description: 'Lê o conteúdo da nota atualmente em foco no Second Brain (título, pergunta e dados de cada bloco do mosaico) ou busca pelo ID.',
    input_schema: {
      type: 'object',
      properties: {
        note_id: { type: 'string', description: 'ID opcional da nota. Deixe vazio para ler a nota em exibição.' },
      },
    },
  },
  {
    name: 'save_note_block',
    description: 'Adiciona ou substitui um bloco no mosaico do Second Brain (intro, critic, code, slides ou chart).',
    input_schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['intro', 'critic', 'code', 'slides', 'chart'],
          description: 'Tipo do bloco a ser adicionado ou atualizado.',
        },
        title: { type: 'string', description: 'Título visível do bloco.' },
        content: {
          type: 'string',
          description: 'Conteúdo do bloco. Para code: código-fonte. Para intro: texto descritivo. Para critic: itens em lista ou linhas. Para slides: JSON string [{heading, body}]. Para chart: JSON string [{label, value}].',
        },
      },
      required: ['type', 'content'],
    },
  },
  {
    name: 'read_project_file',
    description: 'Lê o conteúdo em texto de um arquivo do projeto local aberto via File System Access API no Caça-Bugs.',
    input_schema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Caminho relativo do arquivo (ex: "package.json", "app/page.tsx", "lib/ai/config.ts").',
        },
      },
      required: ['file_path'],
    },
  },
];

async function executeGetCurrentNote(args: Record<string, unknown>): Promise<string> {
  const noteId = typeof args.note_id === 'string' ? args.note_id.trim() : '';
  if (noteId) {
    const note = await getNote(noteId);
    if (note) return JSON.stringify(note);
  }
  const state = useBlocksStore.getState();
  if (state.blocks.length > 0) {
    return JSON.stringify({ noteId: state.noteId, question: state.question, blocks: state.blocks });
  }
  if (state.noteId) {
    const note = await getNote(state.noteId);
    if (note) return JSON.stringify(note);
  }
  return JSON.stringify({ message: 'Nenhuma nota aberta no mosaico no momento.' });
}

function createBlockFromInput(type: BlockType, title: string, content: string): Block {
  const id = createId();
  if (type === 'intro') return { id, type: 'intro', title: title || 'Introdução', content, loading: false };
  if (type === 'code') return { id, type: 'code', title: title || 'Código', language: 'typescript', code: content, loading: false };
  if (type === 'critic') {
    let points: string[];
    try {
      const parsed: unknown = JSON.parse(content);
      points = Array.isArray(parsed) ? parsed.map(String) : [content];
    } catch {
      points = content.split('\n').map((line) => line.replace(/^[-*]\s*/, '').trim()).filter(Boolean);
    }
    return { id, type: 'critic', title: title || 'Crítica', points, loading: false };
  }
  if (type === 'slides') {
    let slides = [{ heading: title || 'Slide 1', body: content }];
    try {
      const parsed: unknown = JSON.parse(content);
      if (Array.isArray(parsed)) slides = parsed as { heading: string; body: string }[];
    } catch {}
    return { id, type: 'slides', title: title || 'Apresentação', slides, loading: false };
  }
  let data = [{ label: 'Item 1', value: 100 }];
  try {
    const parsed: unknown = JSON.parse(content);
    if (Array.isArray(parsed)) data = parsed as { label: string; value: number }[];
  } catch {}
  return { id, type: 'chart', title: title || 'Gráfico', data, loading: false };
}

async function executeSaveNoteBlock(args: Record<string, unknown>): Promise<string> {
  const type = args.type as BlockType;
  const title = typeof args.title === 'string' ? args.title : '';
  const content = typeof args.content === 'string' ? args.content : '';
  if (!type || !content) return JSON.stringify({ error: 'Parâmetros "type" e "content" são obrigatórios.' });

  const state = useBlocksStore.getState();
  const newBlock = createBlockFromInput(type, title, content);
  const existingIdx = state.blocks.findIndex((b) => b.type === type);
  const updatedBlocks = existingIdx >= 0
    ? state.blocks.map((b, idx) => (idx === existingIdx ? { ...newBlock, id: b.id } : b))
    : [...state.blocks, newBlock];

  useBlocksStore.setState({ blocks: updatedBlocks, hasSubmitted: true });
  const noteId = state.noteId ?? createId();
  const now = new Date().toISOString();
  await saveNote({
    id: noteId,
    title: state.question || title || 'Nova nota',
    question: state.question,
    blocks: updatedBlocks.map((b) => ({ id: b.id, type: b.type, content: JSON.stringify(b) })),
    createdAt: now,
    updatedAt: now,
  });
  useBlocksStore.setState({ noteId });
  return JSON.stringify({ success: true, message: `Bloco ${type} atualizado no mosaico.`, blockId: newBlock.id });
}

async function tryDaemonBridge(name: string, args: Record<string, unknown>): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const response = await fetch('http://localhost:3005/mcp/tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, args }),
      signal: AbortSignal.timeout(700),
    });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    if (data && typeof data === 'object' && 'content' in data) {
      return JSON.stringify(data);
    }
    return null;
  } catch {
    return null;
  }
}

export async function syncWithMcpDaemon(payload: Record<string, unknown>): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const response = await fetch('http://localhost:3005/mcp/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(700),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function executeReadProjectFile(args: Record<string, unknown>): Promise<string> {
  const filePath = typeof args.file_path === 'string' ? args.file_path.trim() : '';
  if (!filePath) return JSON.stringify({ error: 'file_path é obrigatório.' });

  // Tenta Camada 1 Daemon (porta 3005) primeiro
  const daemonResult = await tryDaemonBridge('read_project_file', args);
  if (daemonResult) return daemonResult;

  // Fallback cliente via File System Access API
  const root = getActiveDirectory();
  if (!root) {
    return JSON.stringify({ error: 'Nenhuma pasta de projeto aberta no Caça-Bugs e Daemon 3005 offline. Abra a pasta antes de ler arquivos.' });
  }
  try {
    const text = await readFileByPath(root, filePath);
    return JSON.stringify({ file: filePath, content: text, source: 'browser-vfs' });
  } catch (err) {
    return JSON.stringify({ error: `Falha ao ler arquivo: ${err instanceof Error ? err.message : 'Não encontrado'}` });
  }
}

export async function executeMcpTool(name: string, args: Record<string, unknown>): Promise<string> {
  void syncWithMcpDaemon({ lastTool: name, args });
  if (name === 'get_current_note') return executeGetCurrentNote(args);
  if (name === 'save_note_block') return executeSaveNoteBlock(args);
  if (name === 'read_project_file') return executeReadProjectFile(args);
  return JSON.stringify({ error: `Ferramenta desconhecida: ${name}` });
}
