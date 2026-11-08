import { create } from 'zustand';
import type { Block, BlockType } from '@/lib/blocks/types';
import { reorderBlocks, removeBlock, createId } from '@/lib/blocks/operations';
import { buildBlocksFromProfile, createMockBlocks, resolveLoading } from '@/lib/blocks/mock-data';
import { applyAiField, blockField } from '@/lib/blocks/from-ai';
import { getAiSettings } from '@/lib/ai/config';
import { providerFor } from '@/lib/ai/providers';
import { InvalidAiResponseError } from '@/lib/ai/providers/parse';
import type { AiField, AiJson, ProviderName } from '@/lib/ai/providers/types';
import { setOpenAiBaseUrl } from '@/lib/ai/providers/openai-compatible';
import { saveNote } from '@/lib/storage/notes';
import type { Note } from '@/lib/storage/types';
import { useProvidersStore } from '@/store/providers-store';
import { saveMilestoneSnapshot } from '@/lib/ai/layers/layer8-universal-mesh';
import { registerWebMcpTools } from '@/lib/ai/layers/layer9-webmcp-a2a';
import { reportAnomalyToCtoLoop } from '@/lib/ai/layers/layer10-telemetry-ctoloop';
import { recordTriple } from '@/lib/ai/memory/llm-memshare-kg';
import {
  defaultVisibleBlockTypesForIntent,
  detectQueryIntent,
  synthesizeDomainProfile,
  type QueryIntent,
} from '@/lib/ai/domain-synthesizer';
import {
  extractCoreSubject,
  formatWeatherToWebFact,
  getInstantWeatherSnapshot,
  isWeatherQuery,
  resolveDateTimeFact,
  sanitizeRawQuery,
  searchWebFree,
  type WebFactContext,
} from '@/lib/ai/web-search-free';
import { buildYouTubeSearchVideo, CURATED_BRASIL_PHOTOS, CURATED_BRASIL_VIDEOS } from '@/lib/ai/media-search-free';

const ALL_BLOCK_TYPES: BlockType[] = ['intro', 'critic', 'code', 'slides', 'chart'];

interface BlocksState {
  blocks: Block[];
  intent: QueryIntent;
  visibleTypes: BlockType[];
  liveFact: WebFactContext | null;
  hasSubmitted: boolean;
  isRefining: boolean;
  error: string | null;
  noteId: string | null;
  question: string;
  submitPrompt: (prompt: string) => void;
  enableBlockType: (type: BlockType) => void;
  openNote: (note: Note) => void;
  resetSearch: () => void;
  moveBlock: (from: number, to: number) => void;
  deleteBlock: (id: string) => void;
  clearBlockLoading: (id: string) => void;
  reviewBlock: (id: string, provider: ProviderName, model: string) => void;
  applyReview: (id: string) => void;
  rollbackLatestSnapshot: (snapshotId?: string) => void;
}

function noteFromBlocks(prompt: string, blocks: Block[], id = createId()): Note {
  const now = new Date().toISOString();
  return {
    id,
    title: prompt.trim() || 'Nova nota',
    question: prompt.trim(),
    blocks: blocks.map((block) => ({ id: block.id, type: block.type, content: JSON.stringify(block) })),
    createdAt: now,
    updatedAt: now,
  };
}

function isBlock(value: unknown): value is Block {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  const types: BlockType[] = ['intro', 'critic', 'code', 'slides', 'chart'];
  return typeof record.id === 'string' && typeof record.title === 'string' && types.includes(record.type as BlockType);
}

function blocksFromNote(note: Note): Block[] {
  return note.blocks
    .map((saved) => {
      try {
        const value: unknown = JSON.parse(saved.content);
        if (isBlock(value)) return { ...value, id: saved.id, type: saved.type, loading: false };
      } catch {
        return null;
      }
      return null;
    })
    .filter((block): block is Block => block !== null);
}

function statusMessage(error: unknown): string {
  if (error instanceof InvalidAiResponseError) return error.message;
  const text = error instanceof Error ? error.message : '';
  if (text.includes('404')) return 'Modelo não encontrado. Usando síntese rápida.';
  if (text.includes('429') || text.includes('503')) return 'IA sobrecarregada. Tente novamente em instantes.';
  return 'Falha ao consultar a IA.';
}

function applyGroup(blocks: Block[], fields: AiField[], data: AiJson): Block[] {
  return blocks.map((block) => {
    const field = blockField(block.type);
    return fields.includes(field) ? applyAiField(block, field, data) : block;
  });
}

function resolveZeroKeyRoute(
  provider: ProviderName,
  model: string,
  settings: Awaited<ReturnType<typeof getAiSettings>>
): { provider: ProviderName; model: string; key: string } {
  if (provider === 'gemini') {
    if (settings.geminiKey.trim()) return { provider: 'gemini', model, key: settings.geminiKey.trim() };
    return { provider: 'claude-free-relay', model: 'claude-3-5-sonnet', key: '' };
  }
  if (provider === 'openai-compatible') {
    if (settings.openAiKey.trim()) return { provider: 'openai-compatible', model, key: settings.openAiKey.trim() };
    return { provider: 'claude-free-relay', model: 'claude-3-5-sonnet', key: '' };
  }
  return { provider, model: model || 'claude-3-5-sonnet', key: '' };
}

function reviewPrompt(block: Block): string {
  return `Revise e melhore este bloco em português. Aponte problemas e entregue uma sugestão pronta para substituir o conteúdo. Retorne apenas o campo solicitado em JSON. Conteúdo atual: ${JSON.stringify(block)}`;
}

function reviewText(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

export const useBlocksStore = create<BlocksState>((set, get) => ({
  blocks: [],
  intent: 'general_question',
  visibleTypes: ALL_BLOCK_TYPES,
  liveFact: null,
  hasSubmitted: false,
  isRefining: false,
  error: null,
  noteId: null,
  question: '',

  submitPrompt: (rawPrompt) => {
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    registerWebMcpTools();

    // Sanitiza estritamente o tópico para NUNCA concatenar logs de grafo ou notas antigas
    const cleanPrompt = sanitizeRawQuery(rawPrompt) || rawPrompt.trim();
    const intent = detectQueryIntent(cleanPrompt);
    const visibleTypes = defaultVisibleBlockTypesForIntent(intent);

    let initialLiveFact: WebFactContext | null = null;
    if (intent === 'weather_or_metric' && isWeatherQuery(cleanPrompt)) {
      const snap = getInstantWeatherSnapshot(cleanPrompt);
      const dt = resolveDateTimeFact(cleanPrompt);
      initialLiveFact = formatWeatherToWebFact(snap, dt);
    } else if (intent === 'media_or_datetime') {
      const core = extractCoreSubject(cleanPrompt) || 'Brasil';
      const isBrasil = core.toLowerCase() === 'brasil';
      const dt = resolveDateTimeFact(cleanPrompt);
      initialLiveFact = {
        kind: 'media',
        title: `${core} — Data de Hoje & Multimídia`,
        summary: isBrasil
          ? 'O **Brasil** é o maior país da América do Sul e da América Latina, sendo o quinto maior do mundo em área territorial e o sétimo em população (mais de 212 milhões de habitantes). Conhecido mundialmente por sua biodiversidade incomparável, Floresta Amazônica, praias icônicas como Copacabana e Ipanema, o Pão de Açúcar, as Cataratas do Iguaçu e sua riqueza cultural e econômica.'
          : `Registros e informações visuais verificadas sobre **${core}**.`,
        bullets: [
          ...(dt ? [`Data e Horário: ${dt.formattedFull}.`] : []),
          `Tema Consultado: ${core} (Pesquisa integrada via Wikimedia Commons e Wikipedia).`,
        ],
        kpis: [
          ...(dt
            ? [
                { label: 'Data de Hoje', value: dt.dateShort, sublabel: dt.weekday },
                { label: 'Hora Atual', value: dt.timeString, sublabel: 'Horário Oficial' },
              ]
            : []),
          { label: 'Tema Consultado', value: core, sublabel: isBrasil ? 'República Federativa do Brasil' : 'Verificado na Web' },
          { label: 'Galeria Multimídia', value: `${isBrasil ? CURATED_BRASIL_PHOTOS.length : 0} Fotos`, sublabel: 'Acervo Wikimedia Commons' },
        ],
        dateTimeInfo: dt ?? undefined,
        media: {
          subject: core,
          photos: isBrasil ? CURATED_BRASIL_PHOTOS.slice(0, 6) : [],
          videos: isBrasil ? CURATED_BRASIL_VIDEOS : [buildYouTubeSearchVideo(core)],
        },
        chartData: [],
        sourceName: 'Relógio e Calendário Oficial (pt-BR)',
      };
    }

    const initialProfile = synthesizeDomainProfile(cleanPrompt, initialLiveFact);
    const initialBlocks = buildBlocksFromProfile(initialProfile, false);
    const provStore = useProvidersStore.getState();

    set({
      blocks: initialBlocks,
      intent,
      visibleTypes,
      liveFact: initialLiveFact,
      hasSubmitted: true,
      isRefining: true,
      error: null,
      question: cleanPrompt,
      noteId: null,
    });

    const elapsedMs = Math.max(1, Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0));
    provStore.recordTelemetry({ submitLatencyMs: elapsedMs, latencyMs: elapsedMs });
    provStore.initBackgroundPreWarming();

    // Pipeline Direto de Pesquisa Web em Tempo Real (Open-Meteo + OpenStreetMap + Wikipedia + SearchGPT)
    void (async () => {
      const start = Date.now();
      try {
        const liveFact = await searchWebFree(cleanPrompt);
        // Só aplica se o usuário ainda estiver na mesma busca
        if (get().question !== cleanPrompt) return;

        const liveProfile = synthesizeDomainProfile(cleanPrompt, liveFact);
        const hydratedBlocks = buildBlocksFromProfile(liveProfile, false, get().blocks);

        // Força atualização imutável no Zustand sobrescrevendo 100% dos blocos com os dados reais
        set({
          blocks: hydratedBlocks,
          intent: liveProfile.intent,
          visibleTypes: liveProfile.defaultVisibleTypes,
          liveFact,
          isRefining: false,
        });

        // Se o usuário tiver configurado chave BYOK explícita (Gemini ou OpenAI), permite enriquecimento adicional
        const timeoutOr = <T>(p: Promise<T>, fallback: T, ms = 180): Promise<T> =>
          Promise.race([p, new Promise<T>((r) => setTimeout(() => r(fallback), ms))]);

        const settings = await timeoutOr(getAiSettings(), null);
        if (settings && (settings.geminiKey.trim() || settings.openAiKey.trim())) {
          setOpenAiBaseUrl(settings.openAiBaseUrl);
          const byokProvider: ProviderName = settings.geminiKey.trim() ? 'gemini' : 'openai-compatible';
          const byokKey = settings.geminiKey.trim() || settings.openAiKey.trim();
          const byokModel = settings.geminiKey.trim()
            ? settings.geminiModels[0] || 'gemini-2.5-flash'
            : settings.openAiModels[0] || 'openai/gpt-4o-mini';

          if (!liveFact || liveFact.kind !== 'weather') {
            try {
              const allFields: AiField[] = ['intro', 'businessCritique', 'code', 'slides', 'chart'];
              const promptWithFacts = liveFact
                ? `${cleanPrompt}\n\n[Dados Verificados (${liveFact.sourceName})]: ${liveFact.summary}`
                : cleanPrompt;
              const data = await providerFor(byokProvider).ask(promptWithFacts, allFields, byokKey, byokModel);
              if (get().question === cleanPrompt) {
                set((state) => ({ blocks: applyGroup(state.blocks, allFields, data) }));
              }
            } catch (err) {
              reportAnomalyToCtoLoop(2, statusMessage(err), Date.now() - start, () => get().rollbackLatestSnapshot());
            }
          }
        }

        const finalBlocks = get().blocks;
        const note = noteFromBlocks(cleanPrompt, finalBlocks);
        await saveNote(note);
        if (get().question === cleanPrompt) {
          set({ noteId: note.id, isRefining: false });
        }
        await saveMilestoneSnapshot('Mosaico Gerado', cleanPrompt, finalBlocks);
        await recordTriple(cleanPrompt.slice(0, 48), 'pesquisado', liveFact?.sourceName ?? 'Web Live', 2);
      } catch (err) {
        if (get().question === cleanPrompt) {
          set({ isRefining: false });
        }
        reportAnomalyToCtoLoop(2, statusMessage(err), Date.now() - start, () => get().rollbackLatestSnapshot());
      }
    })();
  },

  enableBlockType: (type) =>
    set((state) => ({
      visibleTypes: state.visibleTypes.includes(type)
        ? state.visibleTypes
        : [...state.visibleTypes, type],
    })),

  openNote: (note) => {
    const cleanQ = sanitizeRawQuery(note.question) || note.question;
    const intent = detectQueryIntent(cleanQ);
    set({
      blocks: blocksFromNote(note),
      intent,
      visibleTypes: defaultVisibleBlockTypesForIntent(intent),
      liveFact: null,
      hasSubmitted: true,
      isRefining: false,
      error: null,
      noteId: note.id,
      question: cleanQ,
    });
  },

  resetSearch: () =>
    set({
      blocks: [],
      intent: 'general_question',
      visibleTypes: ALL_BLOCK_TYPES,
      liveFact: null,
      hasSubmitted: false,
      isRefining: false,
      error: null,
      noteId: null,
      question: '',
    }),

  moveBlock: (from, to) => set((state) => ({ blocks: reorderBlocks(state.blocks, from, to) })),

  deleteBlock: (id) =>
    set((state) => {
      const target = state.blocks.find((b) => b.id === id);
      if (target && state.visibleTypes.includes(target.type)) {
        return { visibleTypes: state.visibleTypes.filter((t) => t !== target.type) };
      }
      return { blocks: removeBlock(state.blocks, id) };
    }),

  clearBlockLoading: (id) => set((state) => ({ blocks: resolveLoading(state.blocks, id) })),

  reviewBlock: (id, provider, model) => {
    set((state) => ({
      blocks: state.blocks.map((block) => (block.id === id ? { ...block, reviewLoading: true, reviewError: undefined } : block)),
    }));
    void (async () => {
      const settings = await getAiSettings();
      setOpenAiBaseUrl(settings.openAiBaseUrl);
      const block = useBlocksStore.getState().blocks.find((item) => item.id === id);
      if (!block) return;
      const resolved = resolveZeroKeyRoute(provider, model, settings);
      try {
        const field = blockField(block.type);
        const data = await providerFor(resolved.provider).ask(reviewPrompt(block), [field], resolved.key, resolved.model);
        set((state) => ({
          blocks: state.blocks.map((item) =>
            item.id === id ? { ...item, reviewLoading: false, review: reviewText(data[field]) } : item
          ),
        }));
      } catch (err) {
        set((state) => ({
          blocks: state.blocks.map((item) =>
            item.id === id ? { ...item, reviewLoading: false, reviewError: statusMessage(err) } : item
          ),
        }));
      }
    })();
  },

  applyReview: (id) => {
    const updated = get().blocks.map((block) => {
      if (block.id !== id || !block.review) return block;
      if (block.type === 'intro') return { ...block, content: block.review, review: undefined };
      if (block.type === 'code') return { ...block, code: block.review, review: undefined };
      try {
        const parsed: unknown = JSON.parse(block.review);
        const field = blockField(block.type);
        return { ...applyAiField(block, field, { [field]: parsed }), review: undefined };
      } catch {
        return block;
      }
    });
    set({ blocks: updated });
  },

  rollbackLatestSnapshot: (snapshotId) => {
    const snapshots = useProvidersStore.getState().snapshots;
    if (snapshots.length === 0) return;
    const target = snapshotId ? snapshots.find((s) => s.id === snapshotId) ?? snapshots[0] : snapshots[0];
    try {
      const restored = JSON.parse(target.blocksJson) as Block[];
      if (Array.isArray(restored) && restored.length > 0) {
        set({
          blocks: restored,
          question: sanitizeRawQuery(target.question) || target.question,
          hasSubmitted: true,
          isRefining: false,
          error: null,
        });
      }
    } catch {
      // Ignora snapshot malformado
    }
  },
}));
