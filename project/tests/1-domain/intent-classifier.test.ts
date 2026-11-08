import { describe, it, expect } from 'vitest';
import { detectQueryIntent } from '@/lib/ai/domain-synthesizer';
import { isConversationalQuery, isMediaQuery, searchWebFree } from '@/lib/ai/web-search-free';

describe('Camada 1 (Domínio Puro) - Intent Classifier', () => {
  it('classifica perguntas conversacionais de identidade como "conversational" sem fotos', async () => {
    const q1 = 'qual ia você é?';
    const q2 = 'quem é você?';
    const q3 = 'qual o seu modelo?';
    const q4 = 'com quem estou falando?';

    expect(isConversationalQuery(q1)).toBe(true);
    expect(isConversationalQuery(q2)).toBe(true);
    expect(isConversationalQuery(q3)).toBe(true);
    expect(isConversationalQuery(q4)).toBe(true);

    expect(detectQueryIntent(q1)).toBe('conversational');
    expect(detectQueryIntent(q2)).toBe('conversational');
    expect(detectQueryIntent(q3)).toBe('conversational');
    expect(detectQueryIntent(q4)).toBe('conversational');

    // NUNCA deve disparar busca de mídia nem gerar galeria fotográfica cega
    const fact = await searchWebFree(q1);
    expect(fact).toBeNull();
  });

  it('classifica pedidos explícitos de fotos/vídeos como "media_or_datetime"', async () => {
    const q1 = 'fotos e videos do brasil';
    const q2 = 'fotos de toquio';
    const q3 = 'me mostre fotos de carros esportivos';

    expect(isMediaQuery(q1)).toBe(true);
    expect(isMediaQuery(q2)).toBe(true);
    expect(isMediaQuery(q3)).toBe(true);

    expect(detectQueryIntent(q1)).toBe('media_or_datetime');
    expect(detectQueryIntent(q2)).toBe('media_or_datetime');
    expect(detectQueryIntent(q3)).toBe('media_or_datetime');
  });

  it('classifica consultas técnicas e meteorológicas adequadamente', () => {
    expect(detectQueryIntent('clima ararangua')).toBe('weather_or_metric');
    expect(detectQueryIntent('temperatura em florianopolis hoje')).toBe('weather_or_metric');
    expect(detectQueryIntent('codigo typescript para websocket')).toBe('coding_or_tech');
    expect(detectQueryIntent('estrategia de monetizacao saas')).toBe('business_or_deep_study');
  });
});
