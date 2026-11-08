'use client';

import { useEffect, useRef } from 'react';
import { ChatBubble } from '@/components/chat/chat-message';
import type { ChatMessage } from '@/lib/chat/types';

interface ChatThreadProps {
  messages: ChatMessage[];
  streaming: boolean;
}

export function ChatThread({ messages, streaming }: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, streaming]);

  const visible = messages.filter((message) => message.role === 'user' || message.content !== '');
  const waiting = streaming && (messages[messages.length - 1]?.content ?? '') === '';

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 scrollbar-thin md:p-6">
      {visible.length === 0 && !waiting && (
        <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center">
          <p className="text-base font-medium text-white">Converse com o Claude</p>
          <p className="max-w-sm text-sm text-[#A3A3A3]">As respostas aparecem em tempo real. Marque a opção de incluir a nota aberta para o Claude usar o que você está vendo.</p>
        </div>
      )}
      {visible.map((message) => <ChatBubble key={message.id} message={message} />)}
      {waiting && <p className="animate-pulse text-sm text-[#A3A3A3]">Claude está pensando...</p>}
    </div>
  );
}
