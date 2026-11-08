import type { AiField, AiJson, AiProvider } from './types';
import { normalizeAiJson } from './parse';
import {
  extractCleanTopic,
  synthesizeDomainFieldsJson,
  synthesizeDomainProfile,
} from '@/lib/ai/domain-synthesizer';
import { isWeatherQuery, searchWebFree, type WebFactContext } from '@/lib/ai/web-search-free';
import { useProvidersStore } from '@/store/providers-store';
import { injectGuardrailsIntoSystemPrompt, sanitizeUserFacingOutput } from '@/lib/ai/omni-router';

const POLLINATIONS_OPENAI_URL = 'https://text.pollinations.ai/openai';

export function purgePuterModals(): void {
  if (typeof document === 'undefined') return;
  document
    .querySelectorAll('iframe[src*="puter.com"], .puter-dialog, [class*="puter-dialog"], [id*="puter-dialog"]')
    .forEach((el) => el.remove());
}

export function isPuterAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  purgePuterModals();
  try {
    return window.puter?.auth?.isSignedIn?.() === true;
  } catch {
    return false;
  }
}

export function ensurePuterLoaded(): Promise<boolean> {
  purgePuterModals();
  return Promise.resolve(isPuterAuthenticated());
}

async function queryPollinationsAnonymous(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  jsonMode = false,
  signal?: AbortSignal
): Promise<string | null> {
  if (typeof fetch === 'undefined') return null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });

  try {
    const response = await fetch(POLLINATIONS_OPENAI_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai',
        messages,
        temperature: 0.3,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    if (!response.ok) return null;
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text && text.length > 0 ? text : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onAbort);
  }
}

export async function streamPuterClaude(
  prompt: string,
  onText: (chunk: string) => void,
  signal?: AbortSignal
): Promise<boolean> {
  purgePuterModals();
  const start = Date.now();
  useProvidersStore.getState().setLayerStatus(2, 'processing');

  const cleanTopic = extractCleanTopic(prompt);
  const liveFact = await searchWebFree(cleanTopic);

  // Para clima, data/hora ou fotos/multimídia, entrega os dados reais imediatamente com precisão exata
  if (
    liveFact?.kind === 'weather' ||
    liveFact?.media ||
    liveFact?.dateTimeInfo ||
    liveFact?.kind === 'datetime' ||
    liveFact?.kind === 'media'
  ) {
    const profile = synthesizeDomainProfile(cleanTopic, liveFact);
    onText(profile.chatAnswer);
    useProvidersStore.getState().setLayerStatus(2, 'synced', Date.now() - start);
    return true;
  }

  // Motor Cloud Zero-Login (Pollinations OpenAI-compatible 100% anônimo + Fatos Reais da Web)
  const factInjection = liveFact
    ? `\n\n[Fatos Verificados em Tempo Real (${liveFact.sourceName})]:\nTítulo: ${liveFact.title}\nResumo: ${liveFact.summary}`
    : '';

  const systemPrompt = injectGuardrailsIntoSystemPrompt(
    'Você é um assistente especialista integrado ao Second Brain. Responda em português de forma direta, clara, factual e bem formatada em Markdown. Nunca invente jargões corporativos.'
  );

  const cloudReply = await queryPollinationsAnonymous(
    [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `${cleanTopic}${factInjection}`,
      },
    ],
    false,
    signal
  );

  if (cloudReply) {
    onText(sanitizeUserFacingOutput(cloudReply));
    useProvidersStore.getState().setLayerStatus(2, 'synced', Date.now() - start);
    return true;
  }

  // Se o usuário já estiver autenticado no Puter (sem abrir modal de login), permite uso opcional
  if (isPuterAuthenticated() && window.puter?.ai) {
    try {
      const response = await window.puter.ai.chat(prompt, {
        model: 'claude-3-5-sonnet',
        stream: false,
      });
      const text =
        typeof response?.text === 'string'
          ? response.text
          : typeof response?.message?.content === 'string'
            ? response.message.content
            : '';
      if (text) {
        onText(text);
        useProvidersStore.getState().setLayerStatus(2, 'synced', Date.now() - start);
        return true;
      }
    } catch {
      purgePuterModals();
    }
  }

  if (liveFact) {
    const profile = synthesizeDomainProfile(cleanTopic, liveFact);
    onText(profile.chatAnswer);
    useProvidersStore.getState().setLayerStatus(2, 'synced', Date.now() - start);
    return true;
  }

  useProvidersStore.getState().setLayerStatus(2, 'synced', 15);
  return false;
}

function buildJsonInstruction(prompt: string, fields: AiField[], liveFact: WebFactContext | null): string {
  const factBlock = liveFact
    ? `Use obrigatoriamente estes dados reais (${liveFact.sourceName}): ${liveFact.summary}. `
    : '';
  return `Responda em português apenas com JSON válido, sem markdown. ${factBlock}Retorne somente estes campos: ${fields.join(', ')}. Use intro como síntese factual direta e clara, businessCritique como array de 3 a 4 strings com pontos reais, code como código curto e útil, slides como array de 3 objetos {heading, body}, chart como array de 4 objetos {label, value}. Tema: ${prompt}`;
}

const provider: AiProvider = {
  async ask(prompt: string, fields: AiField[]): Promise<AiJson> {
    purgePuterModals();
    const start = Date.now();
    useProvidersStore.getState().setLayerStatus(2, 'processing');

    const cleanTopic = extractCleanTopic(prompt);
    const liveFact = await searchWebFree(cleanTopic);

    // Se for consulta de clima, multimídia ou data/hora, usa diretamente os dados reais sem risco de alucinação
    if (
      liveFact?.kind === 'weather' ||
      liveFact?.media ||
      liveFact?.dateTimeInfo ||
      liveFact?.kind === 'datetime' ||
      liveFact?.kind === 'media' ||
      isWeatherQuery(cleanTopic)
    ) {
      const realPayload = JSON.stringify(synthesizeDomainFieldsJson(cleanTopic, fields, liveFact));
      const parsed = normalizeAiJson(realPayload);
      useProvidersStore.getState().setLayerStatus(2, 'synced', Math.max(5, Date.now() - start));
      return parsed;
    }

    // Tenta enriquecer via motor Cloud Zero-Login (Pollinations) com os fatos reais da Wikipedia
    const rawCloud = await queryPollinationsAnonymous(
      [
        {
          role: 'system',
          content: 'Retorne apenas um objeto JSON estrito em português conforme solicitado.',
        },
        {
          role: 'user',
          content: buildJsonInstruction(cleanTopic, fields, liveFact),
        },
      ],
      true
    );

    if (rawCloud) {
      try {
        const parsed = normalizeAiJson(rawCloud);
        useProvidersStore.getState().setLayerStatus(2, 'synced', Date.now() - start);
        return parsed;
      } catch {
        // Fallback para síntese baseada nos fatos reais coletados
      }
    }

    const fallbackPayload = JSON.stringify(synthesizeDomainFieldsJson(cleanTopic, fields, liveFact));
    const fallback = normalizeAiJson(fallbackPayload);
    useProvidersStore.getState().setLayerStatus(2, 'synced', Math.max(4, Date.now() - start));
    return fallback;
  },

  async askCustom(prompt: string): Promise<AiJson> {
    return this.ask(prompt, ['intro', 'code', 'businessCritique'], '', 'claude-3-5-sonnet');
  },

  async listModels(): Promise<string[]> {
    return ['claude-3-5-sonnet', 'openai', 'searchgpt'];
  },
};

export default provider;
