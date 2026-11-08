import { create } from 'zustand';
import { ChatError, streamClaude } from '@/lib/chat/anthropic';
import { streamPuterClaude } from '@/lib/ai/providers/claude-free-relay';
import { loadChatState, saveApiKey, saveConversations } from '@/lib/chat/history';
import { createId } from '@/lib/blocks/operations';
import type { ChatMessage, Conversation } from '@/lib/chat/types';
import { formatSystemPrompt } from '@/lib/chat/context';
import { synthesizeDomainProfile } from '@/lib/ai/domain-synthesizer';

const SYSTEM_PROMPT = 'Você é o Claude Desktop integrado ao Second Brain. Responda em português com clareza. Use Markdown quando apropriado. Quando o usuário pedir para analisar, salvar blocos no mosaico ou ler arquivos locais do projeto, utilize as ferramentas MCP disponíveis.';
const TITLE_LENGTH = 48;
const SAVE_ERROR = 'Não foi possível salvar o histórico do chat.';
const MAX_ATTEMPTS = 2;

interface ChatState {
  conversations: Conversation[];
  activeId: string | null;
  apiKey: string;
  streaming: boolean;
  error: string | null;
  controller: AbortController | null;
  load: () => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  selectChat: (id: string | null) => void;
  deleteChat: (id: string) => void;
  stop: () => void;
  send: (text: string, context: string | null) => void;
}

function appendText(conversations: Conversation[], conversationId: string, messageId: string, chunk: string): Conversation[] {
  return conversations.map((conv) => (conv.id !== conversationId ? conv : {
    ...conv,
    messages: conv.messages.map((msg) => (msg.id === messageId ? { ...msg, content: msg.content + chunk } : msg)),
  }));
}

function persist(set: (partial: Partial<ChatState>) => void, conversations: Conversation[]): void {
  saveConversations(conversations).catch(() => set({ error: SAVE_ERROR }));
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeId: null,
  apiKey: '',
  streaming: false,
  error: null,
  controller: null,
  load: async () => {
    const { conversations, apiKey } = await loadChatState();
    set((state) => ({
      conversations: state.conversations.length > 0 ? state.conversations : conversations,
      apiKey: state.apiKey || apiKey,
    }));
  },
  setApiKey: async (key) => {
    const trimmed = key.trim();
    set({ apiKey: trimmed, error: null });
    await saveApiKey(trimmed);
  },
  selectChat: (id) => set({ activeId: id, error: null }),
  deleteChat: (id) => {
    const conversations = get().conversations.filter((conv) => conv.id !== id);
    set((state) => ({ conversations, activeId: state.activeId === id ? null : state.activeId }));
    persist(set, conversations);
  },
  stop: () => get().controller?.abort(),
  send: (text, context) => {
    const { apiKey, activeId, conversations, streaming } = get();
    const content = text.trim();
    if (!content || streaming) return;
    const now = new Date().toISOString();
    const conversationId = activeId ?? createId();
    const existing = conversations.find((conv) => conv.id === conversationId);
    const userMessage: ChatMessage = { id: createId(), role: 'user', content };
    const history = [...(existing?.messages ?? []), userMessage];
    const assistantId = createId();
    const isImplicitTool = /nota atual|ler nota|get_current_note|ler arquivo/i.test(content);
    const instantZeroKeyAnswer = !apiKey.trim() && !isImplicitTool
      ? synthesizeDomainProfile(content).chatAnswer
      : '';

    const updated: Conversation = {
      id: conversationId,
      title: existing?.title ?? content.slice(0, TITLE_LENGTH),
      updatedAt: now,
      messages: [...history, { id: assistantId, role: 'assistant', content: instantZeroKeyAnswer }],
    };

    if (instantZeroKeyAnswer) {
      set({
        conversations: [updated, ...conversations.filter((conv) => conv.id !== conversationId)],
        activeId: conversationId,
        streaming: false,
        error: null,
        controller: null,
      });
      persist(set, get().conversations);

      // Refina assincronamente em background com dados ao vivo (Open-Meteo / Wikipedia / Pollinations)
      void (async () => {
        let liveBuffer = '';
        const ok = await streamPuterClaude(content, (chunk) => {
          liveBuffer += chunk;
        });
        if (ok && liveBuffer.trim()) {
          set((state) => ({
            conversations: state.conversations.map((conv) =>
              conv.id !== conversationId
                ? conv
                : {
                    ...conv,
                    messages: conv.messages.map((msg) =>
                      msg.id === assistantId ? { ...msg, content: liveBuffer.trim() } : msg
                    ),
                  }
            ),
          }));
          persist(set, get().conversations);
        }
      })();
      return;
    }

    const controller = new AbortController();
    set({
      conversations: [updated, ...conversations.filter((conv) => conv.id !== conversationId)],
      activeId: conversationId,
      streaming: true,
      error: null,
      controller,
    });

    const systemBlocks = formatSystemPrompt(SYSTEM_PROMPT, context);

    void (async () => {
      let attempts = 0;
      let lastError: unknown = null;

      while (attempts < MAX_ATTEMPTS) {
        try {
          attempts++;
          await streamClaude({
            key: apiKey,
            system: systemBlocks,
            messages: history,
            signal: controller.signal,
            onText: (chunk) => set((state) => ({ conversations: appendText(state.conversations, conversationId, assistantId, chunk) })),
          });
          lastError = null;
          break;
        } catch (reason) {
          lastError = reason;
          if (controller.signal.aborted) break;
          const msg = reason instanceof Error ? reason.message : '';
          const isRetryable = msg.includes('429') || msg.includes('503') || msg.includes('529') || msg.includes('conexão');
          if (isRetryable && attempts < MAX_ATTEMPTS) {
            set((state) => ({
              conversations: appendText(state.conversations, conversationId, assistantId, '\n\n*(Serviço sobrecarregado. Reconectando em 2 segundos...)*\n\n'),
            }));
            await new Promise((resolve) => setTimeout(resolve, 2000));
            continue;
          }
          break;
        }
      }

      if (lastError && !controller.signal.aborted) {
        set({ error: lastError instanceof ChatError ? lastError.message : 'Falha ao comunicar com o Claude.' });
      }
      set({ streaming: false, controller: null });
      persist(set, get().conversations);
    })();
  },
}));
