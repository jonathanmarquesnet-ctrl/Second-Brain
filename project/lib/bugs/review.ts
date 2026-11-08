import type { AiSettings } from '@/lib/ai/config';
import { providerFor } from '@/lib/ai/providers';
import { setOpenAiBaseUrl } from '@/lib/ai/providers/openai-compatible';
import { InvalidAiResponseError } from '@/lib/ai/providers/parse';
import type { ProviderName } from '@/lib/ai/providers/types';

export interface BugReview {
  linhas_com_erro: number[];
  critica_explicativa: string;
  codigo_corrigido: string;
}

export interface BugEdit {
  codigo_novo: string;
  resumo: string;
}

export function keyFor(settings: AiSettings, provider: ProviderName): string {
  if (provider === 'gemini') return settings.geminiKey || 'zero-key-fallback';
  if (provider === 'openai-compatible') return settings.openAiKey || 'zero-key-fallback';
  return 'zero-key-native';
}

export function askBug(settings: AiSettings, provider: ProviderName, model: string, prompt: string): Promise<Record<string, unknown>> {
  setOpenAiBaseUrl(settings.openAiBaseUrl);
  const rawKey = provider === 'gemini' ? settings.geminiKey : provider === 'openai-compatible' ? settings.openAiKey : '';
  const effectiveProvider: ProviderName =
    (provider === 'gemini' || provider === 'openai-compatible') && !rawKey.trim()
      ? 'claude-free-relay'
      : provider;
  return providerFor(effectiveProvider).askCustom(prompt, rawKey, model);
}

export function buildReviewPrompt(path: string, content: string): string {
  return `Analise este arquivo e responda somente JSON válido com exatamente {"linhas_com_erro": number[], "critica_explicativa": string, "codigo_corrigido": string}. A crítica deve ser em português. Arquivo: ${path}\n\n${content}`;
}

export function buildEditPrompt(path: string, content: string, instruction: string): string {
  return `Altere o arquivo conforme o pedido e responda somente JSON válido com exatamente {"codigo_novo": string, "resumo": string}. codigo_novo deve ser o arquivo completo. O resumo deve ser em português. Pedido: ${instruction}\nArquivo: ${path}\n\n${content}`;
}

export function reviewErrorMessage(error: unknown): string {
  if (error instanceof InvalidAiResponseError) return error.message;
  const text = error instanceof Error ? error.message : '';
  if (text.includes('401') || text.includes('403')) return 'Chave inválida ou sem permissão.';
  if (text.includes('404')) return 'Modelo não encontrado. Escolha outro em Configurações.';
  if (text.includes('429') || text.includes('503')) return 'IA sobrecarregada. Tente novamente em instantes.';
  return 'Falha ao consultar a IA.';
}

function numbersOf(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const numbers: number[] = [];
  for (const item of value) {
    if (typeof item !== 'number') return null;
    numbers.push(item);
  }
  return numbers;
}

export function parseReview(value: Record<string, unknown>): BugReview {
  const lines = numbersOf(value.linhas_com_erro);
  if (!lines || typeof value.critica_explicativa !== 'string' || typeof value.codigo_corrigido !== 'string') {
    return {
      linhas_com_erro: [],
      critica_explicativa: typeof value.intro === 'string' ? value.intro : 'Nenhum bug crítico detectado pelo motor Zero-Key.',
      codigo_corrigido: typeof value.code === 'string' ? value.code : '',
    };
  }
  return { linhas_com_erro: lines, critica_explicativa: value.critica_explicativa, codigo_corrigido: value.codigo_corrigido };
}

export function parseEdit(value: Record<string, unknown>): BugEdit {
  if (typeof value.codigo_novo !== 'string' || typeof value.resumo !== 'string') {
    if (typeof value.code === 'string') {
      return { codigo_novo: value.code, resumo: typeof value.intro === 'string' ? value.intro : 'Alteração gerada via Deca-Engine.' };
    }
    throw new InvalidAiResponseError();
  }
  return { codigo_novo: value.codigo_novo, resumo: value.resumo };
}
