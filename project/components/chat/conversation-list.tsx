import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/lib/chat/types';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}

export function ConversationList({ conversations, activeId, onSelect }: ConversationListProps) {
  return (
    <nav aria-label="Conversas" className="flex gap-2 overflow-x-auto border-b border-[#1F1F1F] p-3 scrollbar-thin md:w-60 md:shrink-0 md:flex-col md:overflow-y-auto md:border-b-0 md:border-r">
      <button type="button" onClick={() => onSelect(null)} className="flex shrink-0 items-center gap-2 rounded-md border border-[#1F1F1F] px-3 py-2 text-sm text-white transition-colors hover:bg-[#0A0A0A]">
        <Plus className="h-4 w-4 text-[#2563EB]" />
        Nova conversa
      </button>
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          type="button"
          onClick={() => onSelect(conversation.id)}
          className={cn(
            'max-w-[200px] shrink-0 truncate rounded-md px-3 py-2 text-left text-sm transition-colors md:max-w-none',
            conversation.id === activeId ? 'bg-[#2563EB]/15 text-white' : 'text-[#A3A3A3] hover:bg-[#0A0A0A] hover:text-white',
          )}
        >
          {conversation.title}
        </button>
      ))}
    </nav>
  );
}
