'use client';

import { AlertCircle } from 'lucide-react';
import { useBlocksStore } from '@/store/blocks-store';
import { Shell } from '@/components/layout/shell';
import { EmptyState } from '@/components/layout/empty-state';
import { BlockMosaic } from '@/components/blocks/block-mosaic';

export default function Home() {
  const hasSubmitted = useBlocksStore((s) => s.hasSubmitted);
  const error = useBlocksStore((s) => s.error);

  return (
    <Shell>
      {!hasSubmitted ? (
        <EmptyState />
      ) : (
        <>
          {error && (
            <div className="mx-auto mb-4 flex max-w-5xl items-center gap-2 rounded-lg border border-[#7F1D1D] bg-[#450A0A] px-4 py-3 text-sm text-white">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <BlockMosaic />
        </>
      )}
    </Shell>
  );
}
