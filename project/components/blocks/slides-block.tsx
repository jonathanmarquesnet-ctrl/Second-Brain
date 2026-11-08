'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide { heading: string; body: string; }

export function SlidesBlockView({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const total = slides.length;
  const current = slides[index] ?? slides[0];
  return (
    <div className="px-3.5 py-2.5">
      <div className="rounded-lg border border-[#1F1F1F] bg-black p-3"><h4 className="mb-1.5 text-xs font-semibold text-white">{current.heading}</h4><p className="text-xs leading-relaxed text-[#D4D4D8]">{current.body}</p></div>
      <div className="mt-2.5 flex items-center justify-between"><button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className="flex h-7 w-7 items-center justify-center rounded-md border border-[#1F1F1F] text-[#A3A3A3] hover:text-white disabled:opacity-30" aria-label="Slide anterior"><ChevronLeft className="h-3.5 w-3.5" /></button><span className="text-[11px] text-[#A3A3A3]">{index + 1} / {total}</span><button onClick={() => setIndex((i) => Math.min(total - 1, i + 1))} disabled={index === total - 1} className="flex h-7 w-7 items-center justify-center rounded-md border border-[#1F1F1F] text-[#A3A3A3] hover:text-white disabled:opacity-30" aria-label="Próximo slide"><ChevronRight className="h-3.5 w-3.5" /></button></div>
    </div>
  );
}
