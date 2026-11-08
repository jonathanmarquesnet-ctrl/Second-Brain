export type ProviderKind = 'local' | 'byok' | 'horde';

export type ProviderStatus =
  | 'idle'
  | 'loading-model'
  | 'processing'
  | 'waiting-queue'
  | 'synced'
  | 'error'
  | 'disabled';

export interface AIRequest {
  prompt: string;
  context?: string;
  blockTypes?: string[];
}

export type AIChunk =
  | { kind: 'text'; text: string }
  | { kind: 'block'; blockType: string; payload: unknown }
  | { kind: 'done' };

export interface AIProvider {
  id: string;
  label: string;
  kind: ProviderKind;
  status: ProviderStatus;
  isAvailable(): Promise<boolean>;
  generate(request: AIRequest): AsyncIterable<AIChunk>;
}
