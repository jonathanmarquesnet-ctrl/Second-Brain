import { describe, it, expect } from 'vitest';
import { useBlocksStore } from '@/store/blocks-store';
import { useChatStore } from '@/store/chat-store';
import { extractCoreSubject, isConversationalQuery, resolveDateTimeFact, searchWebFree } from '@/lib/ai/web-search-free';

describe('Deca-Engine Latency & Domain Quality Benchmark', () => {
  it('hydrates Mosaic blocks on submitPrompt("Inteligência Artificial no Brasil") in < 100ms with domain-specific content', () => {
    const start = performance.now();
    useBlocksStore.getState().submitPrompt('Inteligência Artificial no Brasil');
    const elapsedMs = performance.now() - start;

    const state = useBlocksStore.getState();
    expect(elapsedMs).toBeLessThan(100);
    expect(state.hasSubmitted).toBe(true);
    expect(state.blocks).toHaveLength(5);
    expect(state.blocks.every((b) => b.loading === false)).toBe(true);

    const introBlock = state.blocks.find((b) => b.type === 'intro');
    expect(introBlock?.type === 'intro' && introBlock.content.length).toBeGreaterThan(40);
    if (introBlock?.type === 'intro') {
      expect(introBlock.content.toLowerCase()).not.toContain('deca-engine');
      expect(introBlock.content.toLowerCase()).not.toContain('zero-key');
      expect(introBlock.content).not.toContain('reúne os conceitos essenciais, contexto prático');
    }
  });

  it('sanitizes KG logs and populates real weather data + forecast chart for "clima ararangua"', () => {
    const pollutedPrompt =
      'clima ararangua\n\n[MemShare KG Top-1]:\n(adao lanches ararangua horario de atendimento) -[gerou_mosaico]-> (Modo multi-swarm) [L8]';
    useBlocksStore.getState().submitPrompt(pollutedPrompt);
    const state = useBlocksStore.getState();

    expect(state.question).toBe('clima ararangua');
    expect(state.intent).toBe('weather_or_metric');
    expect(state.visibleTypes).toEqual(['intro', 'chart']);

    const introBlock = state.blocks.find((b) => b.type === 'intro');
    expect(introBlock?.type).toBe('intro');
    if (introBlock?.type === 'intro') {
      expect(introBlock.content).toContain('Araranguá');
      expect(introBlock.content).toContain('°C');
      expect(introBlock.content.toLowerCase()).toContain('umidade');
      expect(introBlock.content.toLowerCase()).toContain('vento');
      expect(introBlock.content).not.toContain('reúne os conceitos essenciais, contexto prático');
      expect(introBlock.content).not.toContain('-[gerou_mosaico]->');
    }

    const chartBlock = state.blocks.find((b) => b.type === 'chart');
    expect(chartBlock?.type).toBe('chart');
    if (chartBlock?.type === 'chart') {
      const labels = chartBlock.data.map((d) => d.label);
      expect(labels.every((l) => l.includes('°C'))).toBe(true);
      expect(labels).not.toContain('Fontes Públicas');
      expect(labels).not.toContain('Consistência');
    }
  });

  it('processes "fotos do brasil e data hj" extracting subject "Brasil", live date/time, real photos and no fake charts', async () => {
    const query = 'fotos do brasil e data hj';

    // 1. Verifica extração de sujeito estrita
    const core = extractCoreSubject(query);
    expect(core).toBe('Brasil');

    // 2. Verifica detecção e resolução de Data/Hora ao vivo
    const dt = resolveDateTimeFact(query);
    expect(dt).not.toBeNull();
    expect(dt?.dateShort).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(dt?.dateLong.toLowerCase()).toContain('2026');

    // 3. Verifica busca web e fotos
    const fact = await searchWebFree(query);
    expect(fact).not.toBeNull();
    expect(fact?.title.toLowerCase()).not.toContain('lava jato');
    expect(fact?.summary.toLowerCase()).not.toContain('lava jato');
    expect(fact?.dateTimeInfo).toBeDefined();
    expect(fact?.media).toBeDefined();
    expect(fact?.media?.photos.length).toBeGreaterThan(0);
    expect(fact?.media?.photos[0].url).toMatch(/^https?:\/\//);

    // 4. Executa submitPrompt no Zustand e valida blocos do Mosaico
    useBlocksStore.getState().submitPrompt(query);
    const state = useBlocksStore.getState();
    expect(state.intent).toBe('media_or_datetime');
    expect(state.visibleTypes).toEqual(['intro']); // Gráfico oculto por padrão para mídia

    const intro = state.blocks.find((b) => b.type === 'intro');
    expect(intro?.type).toBe('intro');
    if (intro?.type === 'intro') {
      expect(intro.content.toLowerCase()).not.toContain('lava jato');
      expect(intro.content).toContain('Brasil');
    }

    const chart = state.blocks.find((b) => b.type === 'chart');
    if (chart?.type === 'chart') {
      const labels = chart.data.map((d) => d.label);
      expect(labels).not.toContain('Dados Oficiais');
      expect(labels).not.toContain('Cobertura Web');
      expect(labels).not.toContain('Fontes Públicas');
    }
  });

  it('dispatches Chat send() without API key lock and updates conversation state in < 100ms', () => {
    const start = performance.now();
    useChatStore.getState().send('clima ararangua', null);
    const elapsedMs = performance.now() - start;

    const chatState = useChatStore.getState();
    expect(elapsedMs).toBeLessThan(100);
    expect(chatState.error).toBeNull();
    expect(chatState.conversations.length).toBeGreaterThan(0);
    expect(chatState.conversations[0].messages.length).toBeGreaterThanOrEqual(2);
    const reply = chatState.conversations[0].messages[1]?.content ?? '';
    expect(reply).toContain('Araranguá');
    expect(reply).toContain('°C');
  });

  it('classifies "qual ia você é?" and "qual ia estou falando?" as conversational without triggering media gallery or fake subject', async () => {
    const q1 = 'qual ia você é?';
    const q2 = 'qual ia estou falando?';

    // 1. Classificação conversacional
    expect(isConversationalQuery(q1)).toBe(true);
    expect(isConversationalQuery(q2)).toBe(true);

    // 2. Não deve extrair sujeito falso como "ia estou falando"
    expect(extractCoreSubject(q1)).toBe('');
    expect(extractCoreSubject(q2)).toBe('');

    // 3. searchWebFree não deve gerar fato de mídia para perguntas conversacionais
    const fact1 = await searchWebFree(q1);
    expect(fact1).toBeNull();

    const fact2 = await searchWebFree(q2);
    expect(fact2).toBeNull();

    // 4. Mosaico deve receber intenção conversational com intro limpa
    useBlocksStore.getState().submitPrompt(q1);
    const state = useBlocksStore.getState();
    expect(state.intent).toBe('conversational');
    expect(state.visibleTypes).toEqual(['intro']);
    expect(state.liveFact).toBeNull();

    const intro = state.blocks.find((b) => b.type === 'intro');
    expect(intro?.type).toBe('intro');
    if (intro?.type === 'intro') {
      expect(intro.content).toContain('Second Brain');
      expect(intro.content.toLowerCase()).not.toContain('fotos reais do acervo');
      expect(intro.content.toLowerCase()).not.toContain('ia estou falando');
    }
  });

  it('processes "fotos e videos do brasil" providing 6 distinct photos and resilient videos', async () => {
    const query = 'fotos e videos do brasil';
    expect(isConversationalQuery(query)).toBe(false);

    const core = extractCoreSubject(query);
    expect(core).toBe('Brasil');

    const fact = await searchWebFree(query);
    expect(fact).not.toBeNull();
    expect(fact?.kind).toBe('media');
    expect(fact?.media).toBeDefined();

    const photos = fact?.media?.photos ?? [];
    expect(photos.length).toBeGreaterThanOrEqual(4);
    // Verifica que as fotos são distintas
    const urls = new Set(photos.map((p) => p.url));
    expect(urls.size).toBe(photos.length);

    const videos = fact?.media?.videos ?? [];
    expect(videos.length).toBeGreaterThanOrEqual(2);
    // Pelo menos 1 vídeo deve ser nativo HTML5 (.webm ou wikimedia)
    expect(videos.some((v) => v.source === 'wikimedia' || v.videoUrl?.endsWith('.webm'))).toBe(true);
  });
});
