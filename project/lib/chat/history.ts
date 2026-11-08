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

export async function loadChatState(): Promise<{ conversations: Conversation[]; apiKey: string }> {
  const stores = getStores();
  if (!stores) return { conversations: [], apiKey: '' };
  try {
    const [saved, key] = await Promise.all([
      stores.chat.getItem<Conversation[]>(CONVERSATIONS_KEY),
      stores.settings.getItem<string>(API_KEY_KEY),
    ]);
    return { conversations: Array.isArray(saved) ? saved : [], apiKey: typeof key === 'string' ? key : '' };
  } catch {
    return { conversations: [], apiKey: '' };
  }
}

export async function saveConversations(conversations: Conversation[]): Promise<void> {
  const stores = getStores();
  if (!stores) return;
  try {
    await stores.chat.setItem(CONVERSATIONS_KEY, conversations);
  } catch {}
}

export async function saveApiKey(key: string): Promise<void> {
  const stores = getStores();
  if (!stores) return;
  try {
    await stores.settings.setItem(API_KEY_KEY, key);
  } catch {}
}
