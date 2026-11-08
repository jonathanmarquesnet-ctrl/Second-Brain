'use client';

import { AlertTriangle } from 'lucide-react';

export function CriticBlockView({ points }: { points: string[] }) {
  return (
    <ul className="max-h-[152px] space-y-1.5 overflow-y-auto px-3.5 py-2.5 scrollbar-thin">
      {points.map((point, i) => <li key={i} className="flex items-start gap-2 text-xs leading-snug text-[#D4D4D8]"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2563EB]" /><span>{point}</span></li>)}
    </ul>
  );
}
