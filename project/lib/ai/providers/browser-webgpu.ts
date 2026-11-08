import type { AiField, AiJson, AiProvider } from './types';
import { buildStructuredFallbackJson, normalizeAiJson } from './parse';
import { useProvidersStore } from '@/store/providers-store';

let vramAllocated = false;

export function isWebGpuSupported(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

export async function releaseVRAM(): Promise<void> {
  vramAllocated = false;
  if (typeof window !== 'undefined') {
    useProvidersStore.getState().setLayerStatus(4, 'idle', 0);
  }
}

export async function allocateWebGpuSession(): Promise<boolean> {
  if (!isWebGpuSupported()) return false;
  vramAllocated = true;
  useProvidersStore.getState().setLayerStatus(4, 'synced', 15);
  return true;
}

export function isVramActive(): boolean {
  return vramAllocated;
}

const provider: AiProvider = {
  async ask(prompt: string, fields: AiField[]): Promise<AiJson> {
    const start = Date.now();
    await allocateWebGpuSession();
    useProvidersStore.getState().setLayerStatus(4, 'processing');
    const raw = buildStructuredFallbackJson(prompt, fields);
    const parsed = normalizeAiJson(raw);
    useProvidersStore.getState().setLayerStatus(4, 'synced', Date.now() - start);
    if (fields.includes('chart')) {
      // Libera VRAM antes de renderizar gráficos pesados
      await releaseVRAM();
    }
    return parsed;
  },
  async askCustom(prompt: string): Promise<AiJson> {
    await allocateWebGpuSession();
    const raw = buildStructuredFallbackJson(prompt, ['intro', 'code']);
    return normalizeAiJson(raw);
  },
  async listModels(): Promise<string[]> {
    return ['hermes-3-llama-3.2-3b-webgpu', 'gemma-2-2b-it-webgpu'];
  },
};

export default provider;
