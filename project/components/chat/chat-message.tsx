import { Sparkles } from 'lucide-react';
import { MarkdownText } from '@/components/chat/markdown-text';
import type { ChatMessage } from '@/lib/chat/types';

export function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-[#2563EB] px-4 py-2.5 text-sm leading-6 text-white">{message.content}</div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#1F1F1F] bg-[#0A0A0A] text-[#2563EB]">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <MarkdownText source={message.content} />
      </div>
    </div>
  );
}
