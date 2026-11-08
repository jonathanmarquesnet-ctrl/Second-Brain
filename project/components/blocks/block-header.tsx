'use client';

import { Check, Copy, GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlockHeaderProps {
  title: string;
  dragHandleProps?: Record<string, unknown>;
  onRemove?: () => void;
  onReview?: () => void;
  onCopy?: () => void;
  copied?: boolean;
  isDragging?: boolean;
}

export function BlockHeader({
  title,
  dragHandleProps,
  onRemove,
  onReview,
  onCopy,
  copied = false,
  isDragging,
}: BlockHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-[#1F1F1F] px-3.5 py-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={cn(
            'touch-none text-[#A3A3A3] transition-colors hover:text-white',
            isDragging && 'cursor-grabbing'
          )}
          aria-label="Alça de arrastar"
          {...dragHandleProps}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <h3 className="text-xs font-semibold text-white">{title}</h3>
      </div>
      <div className="flex items-center gap-2.5">
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="flex items-center gap-1 text-[11px] text-[#A3A3A3] transition-colors hover:text-white"
            aria-label={copied ? 'Copiado!' : 'Copiar conteúdo'}
            title={copied ? 'Copiado!' : 'Copiar'}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-[#34D399]" />
                <span className="text-[#34D399]">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copiar</span>
              </>
            )}
          </button>
        )}
        {onReview && (
          <button
            type="button"
            onClick={onReview}
            className="text-[11px] text-[#A3A3A3] transition-colors hover:text-white"
          >
            Revisar
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-[#A3A3A3] transition-colors hover:text-white"
            aria-label="Remover bloco"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
