import localforage from 'localforage';

export interface KnowledgeTriple {
  id: string;
  subject: string;
  predicate: string;
  object: string;
  sourceLayer: number;
  createdAt: string;
}

let kgStoreInstance: LocalForage | null = null;

function getKgStore(): LocalForage | null {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return null;
  if (!kgStoreInstance) {
    kgStoreInstance = localforage.createInstance({
      name: 'second-brain-kg',
      storeName: 'memshare-kg',
    });
  }
  return kgStoreInstance;
}

const TRIPLES_KEY = 'kg_triples_v1';
const MAX_STORED_TRIPLES = 120;
const MAX_TOKENS_BUDGET_CHARS = 1350; // ~350 tokens

function scoreTriple(triple: KnowledgeTriple, terms: string[]): number {
  if (terms.length === 0) return 1;
  const full = `${triple.subject} ${triple.predicate} ${triple.object}`.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (term.length >= 3 && full.includes(term)) score += 3;
  }
  return score;
}

export async function loadTriples(): Promise<KnowledgeTriple[]> {
  const kgStore = getKgStore();
  if (!kgStore) return [];
  try {
    const saved = await kgStore.getItem<KnowledgeTriple[]>(TRIPLES_KEY);
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export async function recordTriple(
  subject: string,
  predicate: string,
  object: string,
  sourceLayer = 10
): Promise<void> {
  const kgStore = getKgStore();
  if (!kgStore) return;
  try {
    const current = await loadTriples();
    const entry: KnowledgeTriple = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      subject: subject.trim().slice(0, 80),
      predicate: predicate.trim().slice(0, 60),
      object: object.trim().slice(0, 160),
      sourceLayer,
      createdAt: new Date().toISOString(),
    };
    const filtered = current.filter(
      (t) => !(t.subject === entry.subject && t.predicate === entry.predicate)
    );
    const updated = [entry, ...filtered].slice(0, MAX_STORED_TRIPLES);
    await kgStore.setItem(TRIPLES_KEY, updated);
  } catch {
    // Ignora falha de escrita silenciosamente em modo privado
  }
}

export async function getTopTriplesContext(query: string): Promise<string> {
  const triples = await loadTriples();
  if (triples.length === 0) return '';

  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  const scored = triples.map((triple) => ({
    triple,
    score: scoreTriple(triple, terms),
  }));

  scored.sort((a, b) => b.score - a.score);

  const top5 = scored.slice(0, 5).map((item) => item.triple);
  const lines: string[] = [];
  let chars = 0;

  for (const t of top5) {
    const line = `(${t.subject}) -[${t.predicate}]-> (${t.object}) [L${t.sourceLayer}]`;
    if (chars + line.length > MAX_TOKENS_BUDGET_CHARS) break;
    lines.push(line);
    chars += line.length;
  }

  return lines.length > 0
    ? `[MemShare KG Top-${lines.length}]:\n${lines.join('\n')}`
    : '';
}

// ============================================================================
// SUBSISTEMA: BANCO DE LIÇÕES TIPADAS DE PREVENÇÃO DE BUGS (CAMADA 10)
// ============================================================================

export interface BugConstraint {
  id: string;
  category: 'media' | 'query' | 'temporal' | 'layout';
  triggerCondition: string;
  enforcementRule: string;
  lastTriggeredAt: number;
}

export const INITIAL_BUG_LESSONS: BugConstraint[] = [
  {
    id: 'raw_query_wikipedia',
    category: 'query',
    triggerCondition: 'consulta de enciclopédia/wikipedia',
    enforcementRule:
      'Extrair o sujeito principal antes de consultar enciclopédias; comandos e datas não devem compor a busca do artigo.',
    lastTriggeredAt: 1700000000001,
  },
  {
    id: 'youtube_iframe_blackscreen',
    category: 'media',
    triggerCondition: 'incorporação de iframe de vídeo',
    enforcementRule:
      'Proibido exibir iframe de vídeo sem validação; falhas devem virar cards interativos com thumbnail.',
    lastTriggeredAt: 1700000000002,
  },
  {
    id: 'static_metadata_chart',
    category: 'layout',
    triggerCondition: 'geração de blocos de gráfico',
    enforcementRule:
      "Nunca gerar gráficos com 'Dados Oficiais', 'Cobertura Web' ou métricas genéricas abstratas.",
    lastTriggeredAt: 1700000000003,
  },
];

const BUG_CONSTRAINTS_KEY = 'bug_constraints_v1';
const MAX_BUG_CONSTRAINTS = 8;
const TOP_CONSTRAINTS_LIMIT = 5;

let inMemoryConstraints: Map<string, BugConstraint> = new Map(
  INITIAL_BUG_LESSONS.map((l) => [l.id, { ...l }])
);

export async function loadBugConstraints(): Promise<BugConstraint[]> {
  const kgStore = getKgStore();
  if (!kgStore) {
    return Array.from(inMemoryConstraints.values()).sort(
      (a, b) => b.lastTriggeredAt - a.lastTriggeredAt
    );
  }
  try {
    const saved = await kgStore.getItem<BugConstraint[]>(BUG_CONSTRAINTS_KEY);
    if (Array.isArray(saved) && saved.length > 0) {
      inMemoryConstraints = new Map(saved.map((c) => [c.id, c]));
      return saved.sort((a, b) => b.lastTriggeredAt - a.lastTriggeredAt);
    }
    const initial = [...INITIAL_BUG_LESSONS].sort((a, b) => b.lastTriggeredAt - a.lastTriggeredAt);
    await kgStore.setItem(BUG_CONSTRAINTS_KEY, initial);
    inMemoryConstraints = new Map(initial.map((c) => [c.id, c]));
    return initial;
  } catch {
    return Array.from(inMemoryConstraints.values()).sort(
      (a, b) => b.lastTriggeredAt - a.lastTriggeredAt
    );
  }
}

export async function saveBugLesson(lesson: BugConstraint): Promise<void> {
  const current = Array.from(inMemoryConstraints.values());
  const filtered = current.filter((c) => c.id !== lesson.id);
  const updated = [lesson, ...filtered];
  updated.sort((a, b) => b.lastTriggeredAt - a.lastTriggeredAt);
  const pruned = updated.slice(0, MAX_BUG_CONSTRAINTS);

  inMemoryConstraints = new Map(pruned.map((c) => [c.id, c]));

  const kgStore = getKgStore();
  if (kgStore) {
    try {
      await kgStore.setItem(BUG_CONSTRAINTS_KEY, pruned);
    } catch {
      // Ignora erro no armazenamento
    }
  }
}

export function getActiveConstraints(category?: string): string[] {
  const list = Array.from(inMemoryConstraints.values()).sort(
    (a, b) => b.lastTriggeredAt - a.lastTriggeredAt
  );
  const filtered = category
    ? list.filter((c) => c.category === category)
    : list;
  const top5 = filtered.slice(0, TOP_CONSTRAINTS_LIMIT);
  return top5.map((c) => `- ${c.enforcementRule}`);
}

export async function getActiveConstraintsAsync(category?: string): Promise<string[]> {
  await loadBugConstraints();
  return getActiveConstraints(category);
}

export function getRawBugConstraints(): BugConstraint[] {
  return Array.from(inMemoryConstraints.values()).sort(
    (a, b) => b.lastTriggeredAt - a.lastTriggeredAt
  );
}

export async function resetBugConstraints(): Promise<void> {
  inMemoryConstraints = new Map(INITIAL_BUG_LESSONS.map((l) => [l.id, { ...l }]));
  const kgStore = getKgStore();
  if (kgStore) {
    try {
      await kgStore.setItem(BUG_CONSTRAINTS_KEY, [...INITIAL_BUG_LESSONS]);
    } catch {
      // Ignora erro
    }
  }
}
