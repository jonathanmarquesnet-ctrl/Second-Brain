import type { AiField, AiJson, AiProvider } from './types';
import { buildStructuredFallbackJson, normalizeAiJson } from './parse';
import { rankBlocks } from '@/lib/chat/context';
import { useBlocksStore } from '@/store/blocks-store';
import { useProvidersStore } from '@/store/providers-store';
import type { NativeLanguageModelFactory } from '@/types/deca-engine';

const LOCAL_TOKEN_CHAR_LIMIT = 2400;

function getNativeFactory(): NativeLanguageModelFactory | null {
  if (typeof window === 'undefined') return null;
  if (window.LanguageModel) return window.LanguageModel;
  if (window.ai?.languageModel) return window.ai.languageModel;
  return null;
}

export function compactPromptWithContext(prompt: string): string {
  const blocks = useBlocksStore.getState().blocks;
  if (blocks.length === 0) return prompt.slice(0, LOCAL_TOKEN_CHAR_LIMIT);
  const topBlocks = rankBlocks(blocks, prompt).slice(0, 2);
  const compactContext = JSON.stringify(topBlocks).slice(0, 900);
  return `${prompt.slice(0, 1200)}\nContexto Compacto: ${compactContext}`;
}

export async function promptNativeBrowserAi(prompt: string, signal?: AbortSignal): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const compacted = compactPromptWithContext(prompt);
  const factory = getNativeFactory();

  if (factory) {
    try {
      useProvidersStore.getState().setLayerStatus(5, 'processing');
      const session = await factory.create({
        systemPrompt: 'Você é o motor local Chrome/Edge Native AI do Second Brain. Responda em português.',
      });
      const output = await session.prompt(compacted, { signal });
      session.destroy?.();
      useProvidersStore.getState().setLayerStatus(5, 'synced', 35);
      return output;
    } catch {
      useProvidersStore.getState().setLayerStatus(5, 'idle', 0);
    }
  }

  const summarizerFactory = window.Summarizer ?? window.ai?.summarizer;
  if (summarizerFactory) {
    try {
      const summarizer = await summarizerFactory.create({ type: 'key-points', format: 'markdown', length: 'medium' });
      const summary = await summarizer.summarize(compacted);
      summarizer.destroy?.();
      useProvidersStore.getState().setLayerStatus(5, 'synced', 40);
      return summary;
    } catch {
      useProvidersStore.getState().setLayerStatus(5, 'idle', 0);
    }
  }

  return null;
}

const provider: AiProvider = {
  async ask(prompt: string, fields: AiField[]): Promise<AiJson> {
    const start = Date.now();
    const instruction = `Gere apenas JSON válido para os campos [${fields.join(', ')}] sobre: ${prompt}`;
    const nativeReply = await promptNativeBrowserAi(instruction);
    if (nativeReply) {
      try {
        const parsed = normalizeAiJson(nativeReply);
        useProvidersStore.getState().setLayerStatus(5, 'synced', Date.now() - start);
        return parsed;
      } catch {
        // Fallback para JSON estruturado determinístico
      }
    }
    return normalizeAiJson(buildStructuredFallbackJson(prompt, fields));
  },
  async askCustom(prompt: string): Promise<AiJson> {
    const nativeReply = await promptNativeBrowserAi(prompt);
    if (nativeReply) {
      try {
        return normalizeAiJson(nativeReply);
      } catch {}
    }
    return normalizeAiJson(buildStructuredFallbackJson(prompt, ['intro', 'code']));
  },
  async listModels(): Promise<string[]> {
    return ['gemini-nano-chrome-ai', 'edge-phi-3-mini-native', 'browser-summarizer-v1'];
  },
};

export default provider;
