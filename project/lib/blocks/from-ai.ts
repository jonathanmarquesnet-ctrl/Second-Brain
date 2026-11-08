import type { AiField, AiJson } from '@/lib/ai/providers/types';
import type { Block } from './types';

export function applyAiField(block: Block, field: AiField, data: AiJson): Block {
  const value = data[field];
  if (field === 'intro' && typeof value === 'string' && block.type === 'intro') return { ...block, content: value, loading: false, error: undefined };
  if (field === 'businessCritique' && block.type === 'critic') return { ...block, points: strings(value), loading: false, error: undefined };
  if (field === 'code' && typeof value === 'string' && block.type === 'code') return { ...block, code: value, loading: false, error: undefined };
  if (field === 'slides' && block.type === 'slides') return { ...block, slides: slides(value), loading: false, error: undefined };
  if (field === 'chart' && block.type === 'chart') return { ...block, data: chart(value), loading: false, error: undefined };
  return { ...block, loading: false, error: undefined };
}

export function blockField(type: Block['type']): AiField {
  return type === 'critic' ? 'businessCritique' : type;
}

function strings(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
function slides(value: unknown): { heading: string; body: string }[] { return Array.isArray(value) ? value.filter((item): item is { heading: string; body: string } => Boolean(item) && typeof item === 'object' && typeof (item as Record<string, unknown>).heading === 'string' && typeof (item as Record<string, unknown>).body === 'string') : []; }
function chart(value: unknown): { label: string; value: number }[] { return Array.isArray(value) ? value.filter((item): item is { label: string; value: number } => Boolean(item) && typeof item === 'object' && typeof (item as Record<string, unknown>).label === 'string' && typeof (item as Record<string, unknown>).value === 'number') : []; }
