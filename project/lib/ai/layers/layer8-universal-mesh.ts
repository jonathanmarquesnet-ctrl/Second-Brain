import { getAiSettings, type Route } from '@/lib/ai/config';
import { providerFor } from '@/lib/ai/providers';
import type { AiField, AiJson } from '@/lib/ai/providers/types';
import type { Block } from '@/lib/blocks/types';
import { saveNote } from '@/lib/storage/notes';
import { syncWithMcpDaemon } from '@/lib/mcp/tools';
import { useProvidersStore, type SnapshotRecord } from '@/store/providers-store';
import { createId } from '@/lib/blocks/operations';

export type AgentPersona = 'stitch' | 'claude' | 'astra' | 'antigravity';

export interface ProjectPlanContract {
  projectName: string;
  version: string;
  fileOwnership: Record<string, AgentPersona>;
  contractsDts: string;
}

const PERSONA_FIELD_MAP: Record<AgentPersona, AiField> = {
  stitch: 'slides',
  claude: 'code',
  astra: 'chart',
  antigravity: 'businessCritique',
};

// Fila FIFO transacional (Mutex)
let fifoChain: Promise<unknown> = Promise.resolve();

export function enqueueMeshTransaction<T>(task: () => Promise<T>): Promise<T> {
  const next = fifoChain.then(task, task);
  fifoChain = next.catch(() => {});
  return next;
}

export function validateFileOwnership(
  plan: ProjectPlanContract,
  filePath: string,
  agent: AgentPersona
): boolean {
  const owner = plan.fileOwnership[filePath];
  return !owner || owner === agent;
}

export async function resolvePersonaRoute(persona: AgentPersona): Promise<{ route: Route; key: string }> {
  const settings = await getAiSettings();
  const field = PERSONA_FIELD_MAP[persona];
  const configured = settings.routes[field] ?? { provider: 'claude-free-relay', model: 'claude-3-5-sonnet' };

  if (configured.provider === 'gemini' && !settings.geminiKey) {
    return { route: { provider: 'claude-free-relay', model: 'claude-3-5-sonnet' }, key: '' };
  }
  if (configured.provider === 'openai-compatible' && !settings.openAiKey) {
    return { route: { provider: 'claude-free-relay', model: 'claude-3-5-sonnet' }, key: '' };
  }

  const key = configured.provider === 'gemini'
    ? settings.geminiKey
    : configured.provider === 'openai-compatible'
      ? settings.openAiKey
      : '';

  return { route: configured, key };
}

export async function executePersonaTask(
  persona: AgentPersona,
  prompt: string,
  fields: AiField[]
): Promise<AiJson> {
  const { route, key } = await resolvePersonaRoute(persona);
  try {
    return await providerFor(route.provider).ask(prompt, fields, key, route.model);
  } catch {
    // Fallback universal automático para Camada 2 Zero-Key
    return providerFor('claude-free-relay').ask(prompt, fields, '', 'claude-3-5-sonnet');
  }
}

export async function saveMilestoneSnapshot(
  label: string,
  question: string,
  blocks: Block[]
): Promise<SnapshotRecord> {
  return enqueueMeshTransaction(async () => {
    const start = Date.now();
    useProvidersStore.getState().setLayerStatus(8, 'processing');

    const snapshotId = `snap-${createId()}`;
    const now = new Date().toISOString();
    const record: SnapshotRecord = {
      id: snapshotId,
      label,
      createdAt: now,
      question: question || 'Snapshot Deca-Engine',
      blocksJson: JSON.stringify(blocks),
    };

    useProvidersStore.getState().addSnapshot(record);

    await saveNote({
      id: snapshotId,
      title: `[Snapshot] ${label} — ${question.slice(0, 32)}`,
      question,
      blocks: blocks.map((b) => ({ id: b.id, type: b.type, content: JSON.stringify(b) })),
      createdAt: now,
      updatedAt: now,
    });

    void syncWithMcpDaemon({
      gitCommitMilestone: label,
      snapshotId,
      timestamp: now,
    });

    useProvidersStore.getState().setLayerStatus(8, 'synced', Date.now() - start);
    return record;
  });
}
