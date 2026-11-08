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
