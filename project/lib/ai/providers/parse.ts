import type { AiField, AiJson } from './types';
import { synthesizeDomainFieldsJson } from '@/lib/ai/domain-synthesizer';

export class InvalidAiResponseError extends Error {
  constructor() {
    super('Resposta inválida da IA. Tente novamente.');
    this.name = 'InvalidAiResponseError';
  }
}

export async function readJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new InvalidAiResponseError();
  }
}

export function parseJsonText(text: string): unknown {
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      } catch {
        throw new InvalidAiResponseError();
      }
    }
    throw new InvalidAiResponseError();
  }
}

export function normalizeAiJson(text: string): AiJson {
  const parsed = parseJsonText(text);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as AiJson;
  }
  throw new InvalidAiResponseError();
}

export function buildStructuredFallbackJson(prompt: string, fields: AiField[]): string {
  const domainPayload = synthesizeDomainFieldsJson(prompt, fields);
  return JSON.stringify(domainPayload);
}
