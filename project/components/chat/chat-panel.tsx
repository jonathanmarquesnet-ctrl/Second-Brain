'use client';

import { useEffect, useState } from 'react';
import { Bot, KeyRound, MessageSquarePlus, History, X, AlertCircle } from 'lucide-react';
import { useChatStore } from '@/store/chat-store';
import { useBlocksStore } from '@/store/blocks-store';
import { noteContext } from '@/lib/chat/context';
import { DecaStatusBar } from '@/components/layout/deca-status-bar';
import { ChatThread } from './chat-thread';
import { ChatComposer } from './chat-composer';
import { ApiKeyForm } from './api-key-form';
import { ConversationList } from './conversation-list';

interface ChatPanelProps {
  onClose: () => void;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const {
    conversations,
    activeId,
    apiKey,
    streaming,
    error,
    load,
    setApiKey,
    selectChat,
    send,
    stop,
  } = useChatStore();

  const question = useBlocksStore((s) => s.question);
  const blocks = useBlocksStore((s) => s.blocks);

  const [showKeyForm, setShowKeyForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [includeContext, setIncludeContext] = useState(true);

  useEffect(() => {
    void load();
  }, [load]);

  const activeConversation = conversations.find((c) => c.id === activeId);
  const messages = activeConversation?.messages ?? [];
  const hasContext = blocks.length > 0;

  function handleSend(text: string): void {
    const context = includeContext ? noteContext(question, blocks, text) : null;
    send(text, context);
  }

  return (
    <div className="flex h-full flex-col bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1F1F1F] px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-[#2563EB]" />
          <span className="text-sm font-semibold tracking-tight">Claude Desktop</span>
          <span className="rounded bg-[#2563EB]/20 px-1.5 py-0.5 text-[10px] font-medium text-[#2563EB]">
            {apiKey ? 'BYOK + MCP' : 'Zero-Key + MCP'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              selectChat(null);
              setShowHistory(false);
              setShowKeyForm(false);
            }}
            title="Nova conversa"
            className="rounded p-1.5 text-[#A3A3A3] transition-colors hover:bg-black hover:text-white"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setShowHistory((v) => !v);
              setShowKeyForm(false);
            }}
            title="Histórico de conversas"
            className={`rounded p-1.5 transition-colors ${
              showHistory ? 'bg-[#2563EB]/20 text-white' : 'text-[#A3A3A3] hover:bg-black hover:text-white'
            }`}
          >
            <History className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setShowKeyForm((v) => !v);
              setShowHistory(false);
            }}
            title="Chave BYOK da Anthropic (Opcional)"
            className={`rounded p-1.5 transition-colors ${
              showKeyForm ? 'bg-[#2563EB]/20 text-white' : 'text-[#A3A3A3] hover:bg-black hover:text-white'
            }`}
          >
            <KeyRound className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Fechar chat"
            className="rounded p-1.5 text-[#A3A3A3] transition-colors hover:bg-black hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Barra de Status Compacta das 10 Camadas Deca-Engine */}
      <DecaStatusBar />

      {/* Main Body — Zero-Key First: sempre visível a menos que o usuário clique em KeyForm ou Histórico */}
      {showKeyForm ? (
        <div className="flex-1 overflow-y-auto p-4">
          <ApiKeyForm
            hasKey={Boolean(apiKey)}
            onSave={setApiKey}
            onCancel={() => setShowKeyForm(false)}
          />
        </div>
      ) : showHistory ? (
        <div className="flex-1 overflow-y-auto p-2">
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={(id) => {
              selectChat(id);
              setShowHistory(false);
            }}
          />
        </div>
      ) : (
        <>
          {error && (
            <div className="flex items-center gap-2 border-b border-[#7F1D1D] bg-[#450A0A] px-4 py-2 text-xs text-red-200">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
          <ChatThread messages={messages} streaming={streaming} />
          <ChatComposer
            streaming={streaming}
            hasContext={hasContext}
            includeContext={includeContext}
            onToggleContext={setIncludeContext}
            onSend={handleSend}
            onStop={stop}
          />
        </>
      )}
    </div>
  );
}
