import type { AiField, AiJson, AiProvider } from './types';
import { buildStructuredFallbackJson, normalizeAiJson, readJsonResponse } from './parse';
import { useProvidersStore } from '@/store/providers-store';

export const OLLAMA_BASE_URL = 'http://localhost:11434/v1';
export const LM_STUDIO_BASE_URL = 'http://localhost:1234/v1';
const NEGATIVE_CACHE_MS = 60_000;

interface DiscoveredLocalEndpoint {
  baseUrl: string;
  model: string;
}

async function probeEndpoint(baseUrl: string): Promise<DiscoveredLocalEndpoint | null> {
  try {
    const response = await fetch(`${baseUrl}/models`, {
      signal: AbortSignal.timeout(800),
    });
    if (!response.ok) return null;
    const json = await readJsonResponse(response);
    if (!json || typeof json !== 'object') return null;
    const data = (json as Record<string, unknown>).data;
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
      const id = (data[0] as Record<string, unknown>).id;
      if (typeof id === 'string') return { baseUrl, model: id };
    }
    return { baseUrl, model: 'llama3.2' };
  } catch {
    return null;
  }
}

export async function discoverLocalLlm(): Promise<DiscoveredLocalEndpoint | null> {
  if (typeof window === 'undefined') return null;
  const store = useProvidersStore.getState();
  if (Date.now() < store.localLlmNegativeCacheUntil) {
    return null;
  }

  const ollama = await probeEndpoint(OLLAMA_BASE_URL);
  if (ollama) {
    store.setLayerStatus(3, 'synced', 25);
    return ollama;
  }

  const lmStudio = await probeEndpoint(LM_STUDIO_BASE_URL);
  if (lmStudio) {
    store.setLayerStatus(3, 'synced', 30);
    return lmStudio;
  }

  store.setLocalLlmNegativeCache(Date.now() + NEGATIVE_CACHE_MS);
  store.setLayerStatus(3, 'idle', 0);
  return null;
}

function buildInstruction(prompt: string, fields: AiField[]): string {
  return `Responda em português apenas com JSON válido, sem markdown. Retorne somente estes campos: ${fields.join(', ')}. Use intro como texto, businessCritique como array de strings, code como código TypeScript, slides como array de {heading, body}, chart como array de {label, value}. Pergunta: ${prompt}`;
}

async function queryLocalEndpoint(endpoint: DiscoveredLocalEndpoint, text: string, preferredModel?: string): Promise<string | null> {
  try {
    const response = await fetch(`${endpoint.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: preferredModel || endpoint.model,
        messages: [{ role: 'user', content: text }],
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return null;
    const value = await readJsonResponse(response);
    if (!value || typeof value !== 'object') return null;
    const choices = (value as Record<string, unknown>).choices;
    if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== 'object') return null;
    const message = (choices[0] as Record<string, unknown>).message;
    if (!message || typeof message !== 'object') return null;
    const content = (message as Record<string, unknown>).content;
    return typeof content === 'string' ? content : null;
  } catch {
    return null;
  }
}

export async function askLocalLlmText(prompt: string): Promise<string | null> {
  const endpoint = await discoverLocalLlm();
  if (!endpoint) return null;
  try {
    const response = await fetch(`${endpoint.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: endpoint.model,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return null;
    const value = await readJsonResponse(response);
    if (!value || typeof value !== 'object') return null;
    const choices = (value as Record<string, unknown>).choices;
    if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== 'object') return null;
    const message = (choices[0] as Record<string, unknown>).message;
    if (!message || typeof message !== 'object') return null;
    const content = (message as Record<string, unknown>).content;
    return typeof content === 'string' ? content : null;
  } catch {
    return null;
  }
}

const provider: AiProvider = {
  async ask(prompt, fields, _key, model): Promise<AiJson> {
    const start = Date.now();
    const endpoint = await discoverLocalLlm();
    if (endpoint) {
      useProvidersStore.getState().setLayerStatus(3, 'processing');
      const raw = await queryLocalEndpoint(endpoint, buildInstruction(prompt, fields), model);
      if (raw) {
        useProvidersStore.getState().setLayerStatus(3, 'synced', Date.now() - start);
        return normalizeAiJson(raw);
      }
    }
    return normalizeAiJson(buildStructuredFallbackJson(prompt, fields));
  },
  async askCustom(prompt, _key, model): Promise<AiJson> {
    const endpoint = await discoverLocalLlm();
    if (endpoint) {
      const raw = await queryLocalEndpoint(endpoint, prompt, model);
      if (raw) return normalizeAiJson(raw);
    }
    return normalizeAiJson(buildStructuredFallbackJson(prompt, ['intro', 'code']));
  },
  async listModels(): Promise<string[]> {
    const endpoint = await discoverLocalLlm();
    return endpoint ? [endpoint.model, 'llama3.2', 'qwen2.5-coder'] : ['llama3.2 (Ollama)', 'qwen2.5-coder (LM Studio)'];
  },
};

export default provider;
