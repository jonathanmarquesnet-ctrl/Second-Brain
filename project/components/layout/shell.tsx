'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from './sidebar';
import { QueryBar } from './query-bar';
import { ChatPanel } from '@/components/chat/chat-panel';
import { cn } from '@/lib/utils';
import { useBlocksStore } from '@/store/blocks-store';
import { useChatStore } from '@/store/chat-store';
import type { Note } from '@/lib/storage/types';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

const BugPanel = dynamic(() => import('@/components/bugs/bug-panel').then((module) => module.BugPanel), { ssr: false });

export function Shell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bugsOpen, setBugsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);

  const resetSearch = useBlocksStore((s) => s.resetSearch);
  const openNote = useBlocksStore((s) => s.openNote);
  const submitPrompt = useBlocksStore((s) => s.submitPrompt);
  const send = useChatStore((s) => s.send);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q && q.trim()) {
      submitPrompt(q.trim());
      send(q.trim(), null);
    }
  }, [submitPrompt, send]);

  function handleOpenNote(note: Note): void {
    setBugsOpen(false);
    openNote(note);
    setMobileOpen(false);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      <Sidebar
        className={cn(
          'fixed inset-y-0 left-0 z-40 h-screen w-60 transform transition-transform duration-200 md:static md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        onClose={() => setMobileOpen(false)}
        onNewSearch={() => { setBugsOpen(false); resetSearch(); }}
        onOpenNote={handleOpenNote}
        onOpenBugs={() => setBugsOpen(true)}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((v) => !v)}
      />

      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/80 md:hidden" onClick={() => setMobileOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center border-b border-[#1F1F1F] bg-black px-4 py-3 md:hidden">
          <Button variant="ghost" size="icon" className="text-white hover:bg-[#0A0A0A]" onClick={() => setMobileOpen((v) => !v)} aria-label="Abrir menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden">
          {chatOpen ? (
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
              <ResizablePanel defaultSize={65} minSize={35} className="min-w-0">
                <main className="h-full overflow-y-auto px-4 py-4 pb-20 scrollbar-thin md:px-5 md:py-3.5 md:pb-4">
                  {bugsOpen ? <BugPanel /> : children}
                </main>
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-[#1F1F1F] hover:bg-[#2563EB]/40 transition-colors" />

              <ResizablePanel defaultSize={35} minSize={25} maxSize={65} className="min-w-0 border-l border-[#1F1F1F]">
                <ChatPanel onClose={() => setChatOpen(false)} />
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <main className="h-full overflow-y-auto px-4 py-6 pb-24 scrollbar-thin md:px-8 md:py-10 md:pb-10">
              {bugsOpen ? <BugPanel /> : children}
            </main>
          )}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#1F1F1F] bg-black/95 p-3 glass md:hidden">
          <div className="mx-auto max-w-xl">
            <QueryBar />
          </div>
        </div>
      </div>
    </div>
  );
}
