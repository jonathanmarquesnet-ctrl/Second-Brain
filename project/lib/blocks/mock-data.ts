import type { Block } from './types';
import { createId } from './operations';
import { synthesizeDomainProfile, type DomainProfile } from '@/lib/ai/domain-synthesizer';
import type { WebFactContext } from '@/lib/ai/web-search-free';

export function buildBlocksFromProfile(
  profile: DomainProfile,
  loading = false,
  existingBlocks?: Block[]
): Block[] {
  const idFor = (type: Block['type']) =>
    existingBlocks?.find((b) => b.type === type)?.id ?? createId();

  const criticTitle =
    profile.intent === 'weather_or_metric'
      ? 'Destaques Meteorológicos'
      : profile.intent === 'general_question'
        ? 'Pontos-Chave e Contexto'
        : 'Análise Crítica';

  return [
    {
      id: idFor('intro'),
      type: 'intro',
      title: profile.introTitle || 'Introdução',
      loading,
      content: profile.intro,
    },
    {
      id: idFor('critic'),
      type: 'critic',
      title: criticTitle,
      loading,
      points: [...profile.businessCritique],
    },
    {
      id: idFor('code'),
      type: 'code',
      title: 'Código de exemplo',
      loading,
      language: 'typescript',
      code: profile.code,
    },
    {
      id: idFor('slides'),
      type: 'slides',
      title: 'Slides principais',
      loading,
      slides: profile.slides.map((s) => ({ ...s })),
    },
    {
      id: idFor('chart'),
      type: 'chart',
      title: profile.chartTitle || 'Gráfico de Dados',
      loading,
      data: profile.chart.map((d) => ({ ...d })),
    },
  ];
}

export function createMockBlocks(
  prompt: string,
  loading = true,
  liveFact?: WebFactContext | null
): Block[] {
  const profile = synthesizeDomainProfile(prompt, liveFact);
  return buildBlocksFromProfile(profile, loading);
}

export function resolveLoading(blocks: Block[], id: string): Block[] {
  return blocks.map((b) => (b.id === id ? { ...b, loading: false } : b));
}
