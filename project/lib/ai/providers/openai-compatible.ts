import type { AiField, AiJson, AiProvider } from './types';
import { parseJsonText, readJsonResponse } from './parse';

let baseUrl = '';
class HttpError extends Error { constructor(status: number) { super(`HTTP ${status}`); } }
const provider: AiProvider = {
  async ask(prompt, fields, key, model): Promise<AiJson> { return request(instruction(prompt, fields), key, model); },
  async askCustom(prompt, key, model): Promise<AiJson> { return request(prompt, key, model); },
  async listModels(key, url = baseUrl): Promise<string[]> { const response = await fetch(`${url.replace(/\/$/, '')}/models`, { headers: { Authorization: `Bearer ${key}` } }); if (!response.ok) throw new HttpError(response.status); const value: unknown = await readJsonResponse(response); if (!value || typeof value !== 'object') return []; const data = (value as Record<string, unknown>).data; return Array.isArray(data) ? data.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && typeof item.id === 'string').map((item) => item.id as string) : []; },
};
export function setOpenAiBaseUrl(value: string): void { baseUrl = value.replace(/\/$/, '') + '/'; }
async function request(text: string, key: string, model: string): Promise<AiJson> { const response = await fetch(`${baseUrl}chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify({ model, messages: [{ role: 'user', content: text }], response_format: { type: 'json_object' } }) }); if (!response.ok) throw new HttpError(response.status); return readJson(await readJsonResponse(response)); }
function instruction(prompt: string, fields: AiField[]): string { return `Responda em português apenas com JSON válido, sem markdown. Retorne somente estes campos: ${fields.join(', ')}. Use intro como texto, businessCritique como array de strings, code como código TypeScript, slides como array de {heading, body}, chart como array de {label, value}. Pergunta: ${prompt}`; }
function readJson(value: unknown): AiJson { if (!value || typeof value !== 'object') return {}; const choices = (value as Record<string, unknown>).choices; if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== 'object') return {}; const message = (choices[0] as Record<string, unknown>).message; if (!message || typeof message !== 'object') return {}; const content = (message as Record<string, unknown>).content; if (typeof content !== 'string') return {}; const parsed = parseJsonText(content); return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as AiJson : {}; }
export default provider;
