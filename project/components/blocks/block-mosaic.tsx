'use client';

import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Sparkles, CheckCircle2, Plus, Layers } from 'lucide-react';
import { useBlocksStore } from '@/store/blocks-store';
import { useProvidersStore } from '@/store/providers-store';
import { SortableBlock } from '@/components/blocks/sortable-block';
import type { BlockType } from '@/lib/blocks/types';

const EXPANSION_LABELS: Record<BlockType, string> = {
  slides: '+ Ver em Slides',
  critic: '+ Análise Crítica',
  code: '+ Exemplo em Código',
  chart: '+ Gráfico de Dados',
  intro: '+ Resumo Principal',
};

const INTENT_BADGES: Record<string, string> = {
  weather_or_metric: 'Meteorologia & Dados Reais (Open-Meteo)',
  coding_or_tech: 'Modo Engenharia & Código',
  business_or_deep_study: 'Modo Estudo Estratégico',
  general_question: 'Síntese Direta Adaptativa',
};

export function BlockMosaic() {
  const blocks = useBlocksStore((s) => s.blocks);
  const visibleTypes = useBlocksStore((s) => s.visibleTypes);
  const intent = useBlocksStore((s) => s.intent);
  const enableBlockType = useBlocksStore((s) => s.enableBlockType);
  const question = useBlocksStore((s) => s.question);
  const isRefining = useBlocksStore((s) => s.isRefining);
  const moveBlock = useBlocksStore((s) => s.moveBlock);
  const lastSubmitLatencyMs = useProvidersStore((s) => s.lastSubmitLatencyMs);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = blocks.findIndex((b) => b.id === active.id);
    const toIndex = blocks.findIndex((b) => b.id === over.id);
    if (fromIndex < 0 || toIndex < 0) return;
    moveBlock(fromIndex, toIndex);
  }

  const visibleBlocks = blocks.filter((b) => visibleTypes.includes(b.type));
  const hiddenBlocks = blocks.filter((b) => !visibleTypes.includes(b.type));
  const liveFact = useBlocksStore((s) => s.liveFact);
  const nonChartVisible = visibleBlocks.filter((b) => b.type !== 'chart');
  const makeFirstHeroFullWidth = nonChartVisible.length % 2 === 1;

  return (
    <div className="mx-auto max-w-5xl space-y-3">
      {question && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] px-3.5 py-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#2563EB]" />
            <h1 className="text-sm font-semibold text-white">
              Tópico: <span className="text-[#60A5FA]">{question}</span>
            </h1>
            <span className="hidden rounded-md border border-[#1F1F1F] bg-black px-2 py-0.5 text-[10px] font-medium text-[#A3A3A3] sm:inline-block">
              {liveFact?.sourceName ?? INTENT_BADGES[intent] ?? 'Mosaico Adaptativo'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#34D399]" />
            <span>
              {isRefining
                ? `🔍 Pesquisando dados reais ao vivo para "${question}"...`
                : `Dados verificados (${lastSubmitLatencyMs}ms)`}
            </span>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleBlocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="grid gap-3 md:grid-cols-2">
            {visibleBlocks.map((block) => {
              const isHeroOdd =
                makeFirstHeroFullWidth && nonChartVisible[0]?.id === block.id;
              return (
                <SortableBlock
                  key={block.id}
                  block={block}
                  fullWidth={block.type === 'chart' || isHeroOdd}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {hiddenBlocks.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#1F1F1F] bg-[#0A0A0A]/90 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
            <Layers className="h-3.5 w-3.5 text-[#2563EB]" />
            <span>Explorar mais formatos para este tema:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {hiddenBlocks.map((b) => (
              <button
                key={b.type}
                type="button"
                onClick={() => enableBlockType(b.type)}
                className="inline-flex items-center gap-1 rounded-lg border border-[#1F1F1F] bg-black px-2.5 py-1 text-xs font-medium text-[#D4D4D8] transition-all hover:border-[#2563EB] hover:bg-[#2563EB]/15 hover:text-white"
              >
                <Plus className="h-3 w-3 text-[#60A5FA]" />
                <span>{EXPANSION_LABELS[b.type].replace(/^\+\s*/, '')}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { arrayMove };
