export interface PuterChatStreamChunk {
  text?: string;
  message?: { content?: string };
}

export interface PuterChatResponse {
  message?: { content?: string | Array<{ text?: string }> };
  text?: string;
  toString(): string;
  [Symbol.asyncIterator]?: () => AsyncIterator<PuterChatStreamChunk>;
}

export interface PuterAI {
  chat(
    prompt: string | Array<{ role: string; content: string }>,
    options?: { model?: string; stream?: boolean; tools?: unknown[] }
  ): Promise<PuterChatResponse & AsyncIterable<PuterChatStreamChunk>>;
}

export interface PuterSDK {
  ai: PuterAI;
  auth?: {
    isSignedIn?: () => boolean;
  };
}

export interface NativeLanguageModelSession {
  prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  promptStreaming?(input: string, options?: { signal?: AbortSignal }): ReadableStream<string>;
  destroy?(): void;
}

export interface NativeLanguageModelFactory {
  capabilities?(): Promise<{ available: 'readily' | 'after-download' | 'no' }>;
  availability?(): Promise<'readily' | 'after-download' | 'unavailable' | 'no'>;
  create(options?: { systemPrompt?: string }): Promise<NativeLanguageModelSession>;
}

export interface NativeSummarizerSession {
  summarize(input: string): Promise<string>;
  destroy?(): void;
}

export interface NativeSummarizerFactory {
  availability?(): Promise<string>;
  create(options?: { type?: string; format?: string; length?: string }): Promise<NativeSummarizerSession>;
}

export interface WebMCPToolDescriptor {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<unknown> | unknown;
}

export interface DocumentModelContext {
  registerTool(tool: WebMCPToolDescriptor): void;
  unregisterTool?(name: string): void;
  getTools?(): WebMCPToolDescriptor[];
}

declare global {
  interface Window {
    puter?: PuterSDK;
    LanguageModel?: NativeLanguageModelFactory;
    Summarizer?: NativeSummarizerFactory;
    ai?: {
      languageModel?: NativeLanguageModelFactory;
      summarizer?: NativeSummarizerFactory;
    };
  }

  interface Document {
    modelContext?: DocumentModelContext;
  }
}
