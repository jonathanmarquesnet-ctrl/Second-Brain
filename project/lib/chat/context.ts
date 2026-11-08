import type { Block } from '@/lib/blocks/types';

const MAX_CONTEXT_BUDGET = 9000;

export interface SystemPromptBlock {
  type: 'text';
  text: string;
  cache_control?: { type: 'ephemeral' };
}

function stringifyBlockContent(block: Block): string {
  if (block.type === 'intro') return `${block.title}: ${block.content}`;
  if (block.type === 'code') return `${block.title} (${block.language}):\n${block.code}`;
  if (block.type === 'critic') return `${block.title}:\n${block.points.map((p) => `- ${p}`).join('\n')}`;
  if (block.type === 'slides') return `${block.title}:\n${block.slides.map((s) => `## ${s.heading}\n${s.body}`).join('\n')}`;
  if (block.type === 'chart') return `${block.title}:\n${block.data.map((d) => `${d.label}: ${d.value}`).join(', ')}`;
  return '';
}

function scoreRelevance(text: string, queryWords: string[]): number {
  if (queryWords.length === 0) return 1;
  const lower = text.toLowerCase();
  let score = 0;
  for (const word of queryWords) {
    if (word.length >= 3 && lower.includes(word)) score += 3;
  }
  return score;
}

export function rankBlocks(blocks: Block[], query = ''): Block[] {
  if (blocks.length <= 1) return blocks;
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length >= 3);
  const scored = blocks.map((block) => ({
    block,
    score: scoreRelevance(stringifyBlockContent(block), terms),
    length: JSON.stringify(block).length,
  }));

  scored.sort((a, b) => b.score - a.score);

  let accumulated = 0;
  const selected: Block[] = [];
  for (const item of scored) {
    if (accumulated + item.length > MAX_CONTEXT_BUDGET && selected.length > 0) continue;
    accumulated += item.length;
    selected.push(item.block);
  }
  return selected.length > 0 ? selected : blocks;
}

export function noteContext(question: string, blocks: Block[], query?: string): string | null {
  if (blocks.length === 0) return null;
  const relevant = rankBlocks(blocks, query ?? question);
  return JSON.stringify({ pergunta: question, blocos: relevant });
}

export function formatSystemPrompt(baseSystem: string, context: string | null): SystemPromptBlock[] {
  const fullText = context
    ? `${baseSystem}\n\n[Contexto Estruturado do Second Brain - Notas/Blocos Ativos]:\n${context}`
    : baseSystem;

  return [
    {
      type: 'text',
      text: fullText,
      cache_control: { type: 'ephemeral' },
    },
  ];
}
