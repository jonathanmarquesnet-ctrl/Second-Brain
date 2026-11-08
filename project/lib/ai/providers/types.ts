export type AiField = 'intro' | 'businessCritique' | 'code' | 'slides' | 'chart';
export type AiJson = Record<string, unknown>;
export type ProviderName =
  | 'gemini'
  | 'openai-compatible'
  | 'claude-free-relay'
  | 'mcp-bridge'
  | 'local-llm'
  | 'browser-webgpu'
  | 'native-browser-ai';

export interface AiProvider {
  ask(prompt: string, fields: AiField[], key: string, model: string): Promise<AiJson>;
  askCustom(prompt: string, key: string, model: string): Promise<AiJson>;
  listModels(key: string, baseUrl?: string): Promise<string[]>;
}
