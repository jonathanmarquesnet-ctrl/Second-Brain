import type { AiField, AiJson, AiProvider } from './types';
import { parseJsonText, readJsonResponse } from './parse';

export const GEMINI_MODEL = 'gemini-flash-latest';
export const GEMINI_FALLBACK_MODEL = 'gemini-flash-lite-latest';
class HttpError extends Error { constructor(status: number) { super(`HTTP ${status}`); } }

const provider: AiProvider = {
  async ask(prompt, fields, key, model): Promise<AiJson> { return request(instruction(prompt, fields), key, model); },
  async askCustom(prompt, key, model): Promise<AiJson> { return request(prompt, key, model); },
  async listModels(key): Promise<string[]> { const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`); if (!response.ok) throw new HttpError(response.status); return readGeminiModels(await readJsonResponse(response)); },
};

async function request(text: string, key: string, model: string): Promise<AiJson> { const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text }] }], generationConfig: { responseMimeType: 'application/json' } }) }); if (!response.ok) throw new HttpError(response.status); return readGeminiJson(await readJsonResponse(response)); }
function instruction(prompt: string, fields: AiField[]): string { return `Responda em português apenas com JSON válido, sem markdown. Retorne somente estes campos: ${fields.join(', ')}. Use intro como texto, businessCritique como array de strings, code como código TypeScript, slides como array de {heading, body}, chart como array de {label, value}. Pergunta: ${prompt}`; }
function readGeminiJson(value: unknown): AiJson { if (!value || typeof value !== 'object') return {}; const candidates = (value as Record<string, unknown>).candidates; if (!Array.isArray(candidates) || !candidates[0] || typeof candidates[0] !== 'object') return {}; const content = (candidates[0] as Record<string, unknown>).content; if (!content || typeof content !== 'object') return {}; const parts = (content as Record<string, unknown>).parts; if (!Array.isArray(parts) || !parts[0] || typeof parts[0] !== 'object') return {}; const text = (parts[0] as Record<string, unknown>).text; return typeof text === 'string' ? parseJson(text) : {}; }
function parseJson(text: string): AiJson { const value = parseJsonText(text.replace(/```json/g, '').replace(/```/g, '').trim()); return value && typeof value === 'object' && !Array.isArray(value) ? value as AiJson : {}; }
function readGeminiModels(value: unknown): string[] { if (!value || typeof value !== 'object') return []; const models = (value as Record<string, unknown>).models; if (!Array.isArray(models)) return []; return models.filter((model): model is Record<string, unknown> => Boolean(model) && typeof model === 'object' && Array.isArray(model.supportedGenerationMethods) && model.supportedGenerationMethods.includes('generateContent') && typeof model.name === 'string').map((model) => (model.name as string).replace(/^models\//, '')); }
export default provider;
