import { MCP_TOOLS, executeMcpTool } from '@/lib/mcp/tools';
import { executePersonaTask, type AgentPersona } from './layer8-universal-mesh';
import type { AiField, AiJson } from '@/lib/ai/providers/types';
import { useProvidersStore } from '@/store/providers-store';
import type { WebMCPToolDescriptor } from '@/types/deca-engine';

export interface A2AAgentCard {
  id: string;
  persona: AgentPersona;
  name: string;
  description: string;
  capabilities: AiField[];
  maxHops: number;
  timeoutMs: number;
}

export const A2A_MAX_HOPS = 3;
export const A2A_TIMEOUT_MS = 15_000;

export const A2A_AGENT_CARDS: Record<AgentPersona, A2AAgentCard> = {
  stitch: {
    id: 'agent-stitch-ui',
    persona: 'stitch',
    name: 'Stitch UI & Design Worker',
    description: 'Especialista em DESIGN.md, paletas visuais e slides modulares.',
    capabilities: ['intro', 'slides'],
    maxHops: A2A_MAX_HOPS,
    timeoutMs: A2A_TIMEOUT_MS,
  },
  claude: {
    id: 'agent-claude-architect',
    persona: 'claude',
    name: 'Claude Code Architect Worker',
    description: 'Especialista em contratos TypeScript estritos e arquitetura modular.',
    capabilities: ['code', 'intro'],
    maxHops: A2A_MAX_HOPS,
    timeoutMs: A2A_TIMEOUT_MS,
  },
  astra: {
    id: 'agent-gpt-astra',
    persona: 'astra',
    name: 'GPT Astra Math & Systems Worker',
    description: 'Especialista em algoritmos matemáticos, física e métricas de gráficos.',
    capabilities: ['chart', 'code'],
    maxHops: A2A_MAX_HOPS,
    timeoutMs: A2A_TIMEOUT_MS,
  },
  antigravity: {
    id: 'agent-antigravity-qa',
    persona: 'antigravity',
    name: 'Antigravity QA & Tester Worker',
    description: 'Auditor de stack traces, validação de contratos e patches cirúrgicos.',
    capabilities: ['businessCritique'],
    maxHops: A2A_MAX_HOPS,
    timeoutMs: A2A_TIMEOUT_MS,
  },
};

let webMcpInitialized = false;

export function registerWebMcpTools(): void {
  if (typeof document === 'undefined' || webMcpInitialized) return;
  webMcpInitialized = true;

  const registeredTools = new Map<string, WebMCPToolDescriptor>();
  if (!document.modelContext) {
    document.modelContext = {
      registerTool(tool: WebMCPToolDescriptor) {
        registeredTools.set(tool.name, tool);
      },
      unregisterTool(name: string) {
        registeredTools.delete(name);
      },
      getTools() {
        return [...registeredTools.values()];
      },
    };
  }

  for (const schema of MCP_TOOLS) {
    document.modelContext.registerTool({
      name: schema.name,
      description: schema.description,
      inputSchema: schema.input_schema,
      execute: (args) => executeMcpTool(schema.name, args),
    });
  }

  useProvidersStore.getState().setLayerStatus(9, 'synced', 5);
}

export async function delegateA2ATask(
  targetPersona: AgentPersona,
  prompt: string,
  fields: AiField[],
  currentHop = 0
): Promise<AiJson> {
  if (currentHop >= A2A_MAX_HOPS) {
    throw new Error(`Limite de delegação A2A atingido (maxHops=${A2A_MAX_HOPS}).`);
  }

  const card = A2A_AGENT_CARDS[targetPersona];
  const start = Date.now();
  useProvidersStore.getState().setLayerStatus(9, 'processing');

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout A2A (${card.timeoutMs}ms)`)), card.timeoutMs);
  });

  try {
    const result = await Promise.race([
      executePersonaTask(targetPersona, prompt, fields),
      timeoutPromise,
    ]);
    useProvidersStore.getState().setLayerStatus(9, 'synced', Date.now() - start);
    return result;
  } catch (err) {
    useProvidersStore.getState().setLayerStatus(9, 'error', Date.now() - start);
    throw err;
  }
}
