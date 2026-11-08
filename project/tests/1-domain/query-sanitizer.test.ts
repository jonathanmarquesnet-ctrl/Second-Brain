import { describe, it, expect } from 'vitest';
import { extractCoreSubject, sanitizeRawQuery } from '@/lib/ai/web-search-free';

describe('Camada 1 (Domínio Puro) - Query Sanitizer', () => {
  it('Cenário Happy Path: extrai estritamente o tema principal sem comandos ou stopwords', () => {
    const raw = 'fotos do brasil e data hj';
    const core = extractCoreSubject(raw);
    expect(core).toBe('Brasil');

    const simple = extractCoreSubject('fotos de toquio');
    expect(simple).toBe('Toquio');
  });

  it('Cenário de Borda/Falha Evitada: expurga metadados, logs de grafo e triplas de memória antigas', () => {
    const polluted = [
      'adao lanches ararangua horario de atendimento -[gerou_mosaico]-> (Modo multi-swarm) [L8]: reúne os conceitos essenciais',
      '[MemShare KG Top-1]:\n(consulta previa) -[analisado]-> dados',
      'Tema: previsão do tempo em curitiba\n(Modo deep-agent) [L10]',
      'Usuário: qual o clima em ararangua hoje?',
    ];

    const clean1 = sanitizeRawQuery(polluted[0]);
    expect(clean1).toBe('adao lanches ararangua horario de atendimento');
    expect(clean1).not.toContain('-[gerou_mosaico]->');
    expect(clean1).not.toContain('Modo multi-swarm');
    expect(clean1).not.toContain('[L8]');

    const clean2 = sanitizeRawQuery(polluted[1]);
    expect(clean2).not.toContain('[MemShare KG');

    const clean3 = sanitizeRawQuery(polluted[2]);
    expect(clean3).toBe('previsão do tempo em curitiba');
    expect(clean3).not.toContain('(Modo deep-agent)');

    const clean4 = sanitizeRawQuery(polluted[3]);
    expect(clean4).toBe('qual o clima em ararangua hoje?');
  });

  it('expurga ruídos conversacionais ao extrair sujeito para busca', () => {
    expect(extractCoreSubject('me mostre imagens do rio de janeiro')).toBe('Rio De Janeiro');
    expect(extractCoreSubject('qual ia estou falando?')).toBe('');
  });
});
