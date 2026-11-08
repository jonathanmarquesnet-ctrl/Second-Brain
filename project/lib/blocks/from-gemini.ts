import { createId } from './operations';
import type { Block } from './types';
import type { GeminiResponse } from '@/lib/ai/gemini';

export function blocksFromGemini(data: GeminiResponse): Block[] {
  return [
    { id: createId(), type: 'intro', title: 'Introdução', loading: false, content: data.intro },
    { id: createId(), type: 'critic', title: 'Crítica de negócio', loading: false, points: data.businessCritique },
    { id: createId(), type: 'code', title: 'Código de exemplo', loading: false, language: 'typescript', code: data.code },
    { id: createId(), type: 'slides', title: 'Slides principais', loading: false, slides: data.slides },
    { id: createId(), type: 'chart', title: 'Gráfico de crescimento', loading: false, data: data.chart },
  ];
}
