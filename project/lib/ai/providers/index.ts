import gemini from './gemini';
import openAiCompatible from './openai-compatible';
import claudeFreeRelay from './claude-free-relay';
import mcpBridge from './mcp-bridge';
import localLlm from './local-llm';
import browserWebGpu from './browser-webgpu';
import nativeBrowserAi from './native-browser-ai';
import type { AiProvider, ProviderName } from './types';

const REGISTRY: Record<ProviderName, AiProvider> = {
  gemini,
  'openai-compatible': openAiCompatible,
  'claude-free-relay': claudeFreeRelay,
  'mcp-bridge': mcpBridge,
  'local-llm': localLlm,
  'browser-webgpu': browserWebGpu,
  'native-browser-ai': nativeBrowserAi,
};

export function providerFor(name: ProviderName): AiProvider {
  return REGISTRY[name] ?? claudeFreeRelay;
}

export function isZeroKeyProvider(name: ProviderName): boolean {
  return name !== 'gemini' && name !== 'openai-compatible';
}
