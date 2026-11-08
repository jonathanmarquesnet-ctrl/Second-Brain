import { create } from 'zustand';
import type { ProviderStatus } from '@/lib/ai/types';

export interface ProviderInfo {
  id: string;
  label: string;
  status: ProviderStatus;
  elapsedMs: number;
  progress: number;
}

export type DecaExecutionMode = 'multi-swarm' | 'gamedev-pipeline';

export interface DecaLayerInfo {
  layer: number;
  id: string;
  shortLabel: string;
  label: string;
  status: ProviderStatus;
  latencyMs: number;
}

export interface SnapshotRecord {
  id: string;
  label: string;
  createdAt: string;
  question: string;
  blocksJson: string;
}

export interface AutoIssueRecord {
  id: string;
  layer: number;
  reason: string;
  patchedAt: string;
  improved: boolean;
}

export interface InstantRouteTable {
  mcpDaemonReady: boolean;
  puterReady: boolean;
  localLlmBaseUrl: string | null;
  localLlmModel: string;
  nativeAiReady: boolean;
  prewarmed: boolean;
}

const INITIAL_PROVIDERS: ProviderInfo[] = [
  { id: 'local-webgpu', label: 'Local WebGPU', status: 'synced', elapsedMs: 12, progress: 100 },
  { id: 'byok-a', label: 'BYOK-A (Opcional)', status: 'idle', elapsedMs: 0, progress: 0 },
  { id: 'byok-b', label: 'BYOK-B (Opcional)', status: 'idle', elapsedMs: 0, progress: 0 },
  { id: 'ai-horde-critic', label: 'Claude Zero-Key Relay (L2)', status: 'synced', elapsedMs: 18, progress: 100 },
  { id: 'ai-horde-image', label: 'Procedural Forge (L7)', status: 'synced', elapsedMs: 9, progress: 100 },
];

const INITIAL_DECA_LAYERS: DecaLayerInfo[] = [
  { layer: 1, id: 'mcp-bridge', shortLabel: 'L1 MCP/VFS', label: 'MCP & CLI Daemon + VFS', status: 'synced', latencyMs: 8 },
  { layer: 2, id: 'claude-free-relay', shortLabel: 'L2 Zero-Key', label: 'Claude 3.5 Sonnet Zero-Key', status: 'synced', latencyMs: 15 },
  { layer: 3, id: 'local-llm', shortLabel: 'L3 Ollama', label: 'Ollama / LM Studio Discovery', status: 'idle', latencyMs: 0 },
  { layer: 4, id: 'browser-webgpu', shortLabel: 'L4 WebGPU', label: 'WebGPU In-Browser Engine', status: 'synced', latencyMs: 11 },
  { layer: 5, id: 'native-browser-ai', shortLabel: 'L5 WebAI', label: 'Browser Native AI', status: 'idle', latencyMs: 0 },
  { layer: 6, id: 'gamedev-pipeline', shortLabel: 'L6 GameDev', label: 'Multi-Agent Game & App Pipeline', status: 'synced', latencyMs: 22 },
  { layer: 7, id: 'asset-forge', shortLabel: 'L7 Forge', label: 'Multimodal Asset & Audio Forge', status: 'synced', latencyMs: 14 },
  { layer: 8, id: 'universal-mesh', shortLabel: 'L8 Git-Lock', label: 'Universal Mesh & Snapshot Lock', status: 'synced', latencyMs: 6 },
  { layer: 9, id: 'webmcp-a2a', shortLabel: 'L9 WebMCP/A2A', label: 'WebMCP Live-DOM & A2A Protocol', status: 'synced', latencyMs: 4 },
  { layer: 10, id: 'telemetry-ctoloop', shortLabel: 'L10 CTOLoop', label: 'CTOLoop Telemetry & MemShare KG', status: 'synced', latencyMs: 7 },
];

const CYCLE: Record<string, ProviderStatus[]> = {
  'local-webgpu': ['loading-model', 'processing', 'synced', 'idle'],
  'byok-a': ['processing', 'synced', 'idle'],
  'byok-b': ['waiting-queue', 'processing', 'synced', 'idle'],
  'ai-horde-critic': ['waiting-queue', 'processing', 'synced', 'idle'],
  'ai-horde-image': ['waiting-queue', 'processing', 'synced', 'idle'],
};

interface ProvidersState {
  providers: ProviderInfo[];
  decaLayers: DecaLayerInfo[];
  instantRouteTable: InstantRouteTable;
  executionMode: DecaExecutionMode;
  ctoAutopilot: boolean;
  fps: number;
  avgLatencyMs: number;
  lastSubmitLatencyMs: number;
  parseErrorCount: number;
  localLlmNegativeCacheUntil: number;
  snapshots: SnapshotRecord[];
  autoIssues: AutoIssueRecord[];
  isSimulating: boolean;
  simulate: () => void;
  setLayerStatus: (layer: number, status: ProviderStatus, latencyMs?: number) => void;
  setExecutionMode: (mode: DecaExecutionMode) => void;
  toggleCtoAutopilot: () => void;
  recordTelemetry: (partial: { fps?: number; latencyMs?: number; submitLatencyMs?: number; parseError?: boolean }) => void;
  setLocalLlmNegativeCache: (untilTimestamp: number) => void;
  updateInstantRouteTable: (partial: Partial<InstantRouteTable>) => void;
  initBackgroundPreWarming: () => void;
  addSnapshot: (snapshot: SnapshotRecord) => void;
  addAutoIssue: (issue: AutoIssueRecord) => void;
}

export const useProvidersStore = create<ProvidersState>((set, get) => ({
  providers: INITIAL_PROVIDERS,
  decaLayers: INITIAL_DECA_LAYERS,
  instantRouteTable: {
    mcpDaemonReady: false,
    puterReady: false,
    localLlmBaseUrl: null,
    localLlmModel: 'llama3.2',
    nativeAiReady: false,
    prewarmed: false,
  },
  executionMode: 'multi-swarm',
  ctoAutopilot: true,
  fps: 60,
  avgLatencyMs: 18,
  lastSubmitLatencyMs: 12,
  parseErrorCount: 0,
  localLlmNegativeCacheUntil: 0,
  snapshots: [],
  autoIssues: [],
  isSimulating: false,
  simulate: () => {
    if (get().isSimulating) return;
    set({ isSimulating: true });
    const order = Object.keys(CYCLE);
    let step = 0;
    const tick = () => {
      const providers = get().providers.map((p, i): ProviderInfo => {
        const seq = CYCLE[order[i]] ?? [];
        const status = (seq[step % seq.length] ?? p.status) as ProviderStatus;
        const progress = status === 'processing' || status === 'loading-model'
          ? Math.round(((step + 1) * 15) % 100)
          : status === 'synced' ? 100 : 0;
        const elapsedMs = status === 'idle' || status === 'disabled' ? 0 : (step + 1) * 180;
        return { ...p, status, progress, elapsedMs };
      });
      set({ providers });
      step++;
      if (step <= 12) {
        setTimeout(tick, 450);
      } else {
        set({ isSimulating: false, providers: INITIAL_PROVIDERS });
      }
    };
    tick();
  },
  setLayerStatus: (layer, status, latencyMs) =>
    set((state) => ({
      decaLayers: state.decaLayers.map((item) =>
        item.layer === layer
          ? { ...item, status, latencyMs: latencyMs ?? item.latencyMs }
          : item
      ),
    })),
  setExecutionMode: (executionMode) => set({ executionMode }),
  toggleCtoAutopilot: () => set((state) => ({ ctoAutopilot: !state.ctoAutopilot })),
  recordTelemetry: ({ fps, latencyMs, submitLatencyMs, parseError }) =>
    set((state) => ({
      fps: fps ?? state.fps,
      avgLatencyMs: latencyMs !== undefined
        ? Math.max(1, Math.round((state.avgLatencyMs * 0.6) + (latencyMs * 0.4)))
        : state.avgLatencyMs,
      lastSubmitLatencyMs: submitLatencyMs ?? state.lastSubmitLatencyMs,
      parseErrorCount: parseError ? state.parseErrorCount + 1 : state.parseErrorCount,
    })),
  setLocalLlmNegativeCache: (untilTimestamp) =>
    set({ localLlmNegativeCacheUntil: untilTimestamp }),
  updateInstantRouteTable: (partial) =>
    set((state) => ({
      instantRouteTable: { ...state.instantRouteTable, ...partial },
    })),
  initBackgroundPreWarming: () => {
    if (typeof window === 'undefined' || get().instantRouteTable.prewarmed) return;
    get().updateInstantRouteTable({ prewarmed: true });

    const runIdle = (cb: () => void) => {
      const win = window as Window & { requestIdleCallback?: (fn: () => void) => number };
      if (typeof win.requestIdleCallback === 'function') {
        win.requestIdleCallback(cb);
      } else {
        setTimeout(cb, 120);
      }
    };

    runIdle(() => {
      // Verifica Native Browser AI em 0ms
      const nativeReady = Boolean(window.LanguageModel || window.ai?.languageModel || window.Summarizer);
      if (nativeReady) {
        get().updateInstantRouteTable({ nativeAiReady: true });
        get().setLayerStatus(5, 'synced', 12);
      }

      // Verifica WebGPU em 0ms
      if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
        get().setLayerStatus(4, 'synced', 10);
      }

      // Garante remoção imediata de qualquer modal/iframe residual do Puter
      document.querySelectorAll('iframe[src*="puter.com"], .puter-dialog, #puter-sdk-v2').forEach((el) => el.remove());

      // Ativa o Relay Cloud 100% Zero-Login (Pollinations OpenAI-Compatible + Web Search)
      get().updateInstantRouteTable({ puterReady: true });
      get().setLayerStatus(2, 'synced', 14);
    });
  },
  addSnapshot: (snapshot) =>
    set((state) => ({
      snapshots: [snapshot, ...state.snapshots.filter((s) => s.id !== snapshot.id)].slice(0, 15),
    })),
  addAutoIssue: (issue) =>
    set((state) => ({
      autoIssues: [issue, ...state.autoIssues].slice(0, 20),
    })),
}));
