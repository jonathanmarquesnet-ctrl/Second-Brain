import localforage from 'localforage';
import { GEMINI_MODEL, GEMINI_FALLBACK_MODEL } from './providers/gemini';
import { providerFor } from './providers';
import type { AiField, ProviderName } from './providers/types';

export interface Route {
  provider: ProviderName;
  model: string;
}

export interface AiSettings {
  geminiKey: string;
  openAiKey: string;
  openAiBaseUrl: string;
  openAiPreset: string;
  geminiModels: string[];
  openAiModels: string[];
  routes: Record<AiField, Route>;
}

export const AI_FIELDS: AiField[] = ['intro', 'businessCritique', 'code', 'slides', 'chart'];

export const FIELD_LABELS: Record<AiField, string> = {
  intro: 'Introdução',
  businessCritique: 'Crítica de negócio',
  code: 'Código',
  slides: 'Slides',
  chart: 'Gráfico',
};

export const PROVIDER_OPTIONS: { value: ProviderName; label: string }[] = [
  { value: 'claude-free-relay', label: 'Camada 2: Claude 3.5 Sonnet (Zero-Key)' },
  { value: 'mcp-bridge', label: 'Camada 1: MCP & VFS Bridge (Zero-Key)' },
  { value: 'local-llm', label: 'Camada 3: Local LLM Ollama/LM Studio (Zero-Key)' },
  { value: 'browser-webgpu', label: 'Camada 4: WebGPU In-Browser (Zero-Key)' },
  { value: 'native-browser-ai', label: 'Camada 5: Chrome/Edge Native AI (Zero-Key)' },
  { value: 'gemini', label: 'Google Gemini (BYOK Opcional)' },
  { value: 'openai-compatible', label: 'OpenAI / OpenRouter / Groq (BYOK Opcional)' },
];

export const ZERO_KEY_MODELS: Record<Exclude<ProviderName, 'gemini' | 'openai-compatible'>, string[]> = {
  'claude-free-relay': ['claude-3-5-sonnet', 'claude-3-7-sonnet', 'claude-3-haiku'],
  'mcp-bridge': ['mcp-vfs-local', 'mcp-cli-daemon-3005'],
  'local-llm': ['llama3.2', 'qwen2.5-coder', 'deepseek-r1'],
  'browser-webgpu': ['hermes-3-llama-3.2-3b-webgpu', 'gemma-2-2b-it-webgpu'],
  'native-browser-ai': ['gemini-nano-chrome-ai', 'edge-phi-3-mini-native'],
};

export const OPENAI_PRESETS = {
  OpenRouter: { url: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini' },
  Groq: { url: 'https://api.groq.com/openai/v1', model: 'llama-3.1-8b-instant' },
  OpenAI: { url: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
} as const;

let settingsStoreInstance: LocalForage | null = null;

function getSettingsStore(): LocalForage | null {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return null;
  if (!settingsStoreInstance) {
    settingsStoreInstance = localforage.createInstance({ name: 'second-brain-settings', storeName: 'settings' });
  }
  return settingsStoreInstance;
}

const defaults: AiSettings = {
  geminiKey: '',
  openAiKey: '',
  openAiBaseUrl: OPENAI_PRESETS.OpenRouter.url,
  openAiPreset: 'OpenRouter',
  geminiModels: [GEMINI_MODEL, GEMINI_FALLBACK_MODEL],
  openAiModels: [],
  routes: {
    intro: { provider: 'claude-free-relay', model: 'claude-3-5-sonnet' },
    businessCritique: { provider: 'claude-free-relay', model: 'claude-3-5-sonnet' },
    code: { provider: 'claude-free-relay', model: 'claude-3-5-sonnet' },
    slides: { provider: 'claude-free-relay', model: 'claude-3-5-sonnet' },
    chart: { provider: 'claude-free-relay', model: 'claude-3-5-sonnet' },
  },
};

export async function getAiSettings(): Promise<AiSettings> {
  const store = getSettingsStore();
  if (!store) return defaults;
  try {
    const saved = await store.getItem<Partial<AiSettings>>('ai-settings');
    const legacyKey = await store.getItem<string>('gemini-api-key');
    return {
      geminiKey: saved?.geminiKey ?? legacyKey ?? '',
      openAiKey: saved?.openAiKey ?? '',
      openAiBaseUrl: saved?.openAiBaseUrl ?? defaults.openAiBaseUrl,
      openAiPreset: saved?.openAiPreset ?? defaults.openAiPreset,
      geminiModels: saved?.geminiModels?.length ? saved.geminiModels : defaults.geminiModels,
      openAiModels: saved?.openAiModels ?? defaults.openAiModels,
      routes: { ...defaults.routes, ...(saved?.routes ?? {}) },
    };
  } catch {
    return defaults;
  }
}

export async function saveAiSettings(settings: AiSettings): Promise<void> {
  const store = getSettingsStore();
  if (!store) return;
  try {
    await store.setItem('ai-settings', settings);
  } catch {}
}

export async function refreshModels(provider: ProviderName, settings: AiSettings): Promise<AiSettings> {
  const key = provider === 'gemini' ? settings.geminiKey : settings.openAiKey;
  const models = await providerFor(provider).listModels(key, settings.openAiBaseUrl);
  const next = provider === 'gemini'
    ? { ...settings, geminiModels: models }
    : provider === 'openai-compatible'
      ? { ...settings, openAiModels: models }
      : settings;
  await saveAiSettings(next);
  return next;
}

export function modelsForProvider(provider: ProviderName, settings: AiSettings): string[] {
  if (provider === 'gemini') return settings.geminiModels;
  if (provider === 'openai-compatible') {
    const preset = OPENAI_PRESETS[settings.openAiPreset as keyof typeof OPENAI_PRESETS];
    return [...settings.openAiModels, ...(preset ? [preset.model] : [])];
  }
  return ZERO_KEY_MODELS[provider] ?? ['claude-3-5-sonnet'];
}

export { GEMINI_MODEL };
