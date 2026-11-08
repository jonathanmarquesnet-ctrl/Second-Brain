'use client';

import { useState, memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Block } from '@/lib/blocks/types';
import { useBlocksStore } from '@/store/blocks-store';
import { cn } from '@/lib/utils';
import { BlockHeader } from './block-header';
import { BlockSkeleton } from './block-skeleton';
import { ReviewMenu } from './review-menu';
import { IntroBlockView } from './intro-block';
import { CriticBlockView } from './critic-block';
import { CodeBlockView } from './code-block';
import { SlidesBlockView } from './slides-block';
import { ChartBlockView } from './chart-block';

export const SortableBlock = memo(function SortableBlock({
  block,
  fullWidth = false,
}: {
  block: Block;
  fullWidth?: boolean;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const deleteBlock = useBlocksStore((state) => state.deleteBlock);
  const reviewBlock = useBlocksStore((state) => state.reviewBlock);
  const applyReview = useBlocksStore((state) => state.applyReview);

  function handleCopy() {
    let textToCopy = '';
    switch (block.type) {
      case 'intro':
        textToCopy = block.content;
        break;
      case 'critic':
        textToCopy = (block.points ?? []).join('\n');
        break;
      case 'code':
        textToCopy = block.code;
        break;
      case 'slides':
        textToCopy = (block.slides ?? []).map((s) => `## ${s.heading}\n${s.body}`).join('\n\n');
        break;
      case 'chart':
        textToCopy = (block.data ?? []).map((d) => `${d.label}: ${d.value}`).join('\n');
        break;
      default:
        textToCopy = JSON.stringify(block);
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] shadow-sm transition-shadow hover:shadow-[0_0_22px_rgba(37,99,235,0.1)]',
        (block.type === 'chart' || fullWidth) && 'md:col-span-2',
        isDragging && 'z-50 opacity-80 shadow-lg ring-1 ring-[#2563EB]'
      )}
    >
      <BlockHeader
        title={block.title}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        onRemove={() => deleteBlock(block.id)}
        onReview={() => setReviewOpen((open) => !open)}
        onCopy={handleCopy}
        copied={copied}
      />
      {reviewOpen && (
        <ReviewMenu
          onSubmit={(provider, model) => {
            setReviewOpen(false);
            reviewBlock(block.id, provider, model);
          }}
        />
      )}
      {block.loading ? (
        <BlockSkeleton />
      ) : (
        <>
          <BlockError message={block.error} />
          <div className="flex-1">
            <BlockContent block={block} />
          </div>
          {block.reviewLoading && (
            <div className="border-t border-[#1F1F1F] px-4 py-3 text-xs text-[#A3A3A3]">
              Carregando revisão...
            </div>
          )}
          {block.reviewError && (
            <div className="border-t border-[#7F1D1D] bg-[#450A0A] px-4 py-2 text-xs text-white">
              {block.reviewError}
            </div>
          )}
          {block.review && (
            <details open className="border-t border-[#1F1F1F] px-4 py-3">
              <summary className="cursor-pointer text-xs font-medium text-white">
                Sugestão de revisão
              </summary>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#A3A3A3]">
                {block.review}
              </p>
              <button
                type="button"
                onClick={() => applyReview(block.id)}
                className="mt-3 rounded-md bg-[#2563EB] px-3 py-2 text-xs font-medium text-white"
              >
                Aplicar sugestão
              </button>
            </details>
          )}
        </>
      )}
    </div>
  );
});

function BlockError({ message }: { message?: string }) {
  return message ? (
    <div className="border-b border-[#7F1D1D] bg-[#450A0A] px-4 py-2 text-xs text-white">
      {message}
    </div>
  ) : null;
}

function BlockContent({ block }: { block: Block }) {
  switch (block.type) {
    case 'intro':
      return <IntroBlockView content={block.content} />;
    case 'critic':
      return <CriticBlockView points={block.points} />;
    case 'code':
      return <CodeBlockView code={block.code} language={block.language} />;
    case 'slides':
      return <SlidesBlockView slides={block.slides} />;
    case 'chart':
      return <ChartBlockView data={block.data} />;
    default:
      return null;
  }
}
