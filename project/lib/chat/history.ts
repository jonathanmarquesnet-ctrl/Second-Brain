import localforage from 'localforage';
import type { Conversation } from '@/lib/chat/types';

let chatStoreInstance: LocalForage | null = null;
let settingsStoreInstance: LocalForage | null = null;

function getStores(): { chat: LocalForage; settings: LocalForage } | null {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return null;
  if (!chatStoreInstance) {
    chatStoreInstance = localforage.createInstance({ name: 'second-brain-chat', storeName: 'chat' });
  }
  if (!settingsStoreInstance) {
    settingsStoreInstance = localforage.createInstance({ name: 'second-brain-auth', storeName: 'settings' });
  }
  return { chat: chatStoreInstance, settings: settingsStoreInstance };
}

const CONVERSATIONS_KEY = 'conversations';
const API_KEY_KEY = 'anthropic_key';

const memoryConversationsFallback: Conversation[] = [];
let memoryApiKeyFallback = '';

export async function loadChatState(): Promise<{ conversations: Conversation[]; apiKey: string }> {
  const stores = getStores();
  if (!stores) {
    return { conversations: [...memoryConversationsFallback], apiKey: memoryApiKeyFallback };
  }
  try {
    const [saved, key] = await Promise.all([
      stores.chat.getItem<Conversation[]>(CONVERSATIONS_KEY),
      stores.settings.getItem<string>(API_KEY_KEY),
    ]);
    const conversations = Array.isArray(saved) ? saved : [...memoryConversationsFallback];
    const apiKey = typeof key === 'string' ? key : memoryApiKeyFallback;
    return { conversations, apiKey };
  } catch {
    return { conversations: [...memoryConversationsFallback], apiKey: memoryApiKeyFallback };
  }
}

export async function saveConversations(conversations: Conversation[]): Promise<void> {
  memoryConversationsFallback.length = 0;
  memoryConversationsFallback.push(...conversations);
  const stores = getStores();
  if (!stores) return;
  try {
    await stores.chat.setItem(CONVERSATIONS_KEY, conversations);
  } catch {}
}

export async function saveApiKey(key: string): Promise<void> {
  memoryApiKeyFallback = key;
  const stores = getStores();
  if (!stores) return;
  try {
    await stores.settings.setItem(API_KEY_KEY, key);
  } catch {}
}
