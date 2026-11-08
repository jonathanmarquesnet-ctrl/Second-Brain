import type { AiField, AiJson, AiProvider } from './types';
import { buildStructuredFallbackJson, normalizeAiJson } from './parse';
import { useProvidersStore } from '@/store/providers-store';

const BRIDGE_URL = 'http://localhost:3005';

export async function isMcpDaemonOnline(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch(`${BRIDGE_URL}/health`, {
      signal: AbortSignal.timeout(700),
    });
    const ok = res.ok;
    useProvidersStore.getState().setLayerStatus(1, ok ? 'synced' : 'idle', 12);
    return ok;
  } catch {
    useProvidersStore.getState().setLayerStatus(1, 'idle', 0);
    return false;
  }
}

const provider: AiProvider = {
  async ask(prompt: string, fields: AiField[]): Promise<AiJson> {
    const start = Date.now();
    useProvidersStore.getState().setLayerStatus(1, 'processing');
    await isMcpDaemonOnline();
    const rawJson = buildStructuredFallbackJson(prompt, fields);
    const result = normalizeAiJson(rawJson);
    useProvidersStore.getState().setLayerStatus(1, 'synced', Date.now() - start);
    return result;
  },
  async askCustom(prompt: string): Promise<AiJson> {
    const rawJson = buildStructuredFallbackJson(prompt, ['intro', 'code', 'businessCritique']);
    return normalizeAiJson(rawJson);
  },
  async listModels(): Promise<string[]> {
    return ['mcp-vfs-local', 'mcp-cli-daemon-3005'];
  },
};

export default provider;
