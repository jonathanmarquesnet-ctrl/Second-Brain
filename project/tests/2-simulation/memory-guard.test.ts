import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveBugLesson,
  loadBugConstraints,
  getActiveConstraints,
  resetBugConstraints,
  getRawBugConstraints,
  INITIAL_BUG_LESSONS,
  type BugConstraint,
} from '@/lib/ai/memory/llm-memshare-kg';
import {
  injectGuardrailsIntoSystemPrompt,
  sanitizeUserFacingOutput,
  GUARDRAIL_HEADER,
} from '@/lib/ai/omni-router';
import { synthesizeDomainProfile } from '@/lib/ai/domain-synthesizer';

describe('Camada 2 (Simulação Headless) - Memory Guard & Prevenção de Bugs', () => {
  beforeEach(async () => {
    await resetBugConstraints();
  });

  it('inicializa o catálogo com as 3 lições aprendidas (bootstrap seed)', async () => {
    const raw = getRawBugConstraints();
    expect(raw.length).toBe(3);

    const ids = raw.map((r) => r.id);
    expect(ids).toContain('raw_query_wikipedia');
    expect(ids).toContain('youtube_iframe_blackscreen');
    expect(ids).toContain('static_metadata_chart');

    const constraints = getActiveConstraints();
    expect(constraints.length).toBe(3);
    expect(constraints[0]).toMatch(/^-\s+/);
  });

  it('o salvamento de uma nova lição atualiza o banco sem duplicatas (upsert)', async () => {
    // 1. Atualiza uma regra existente
    const updatedLesson: BugConstraint = {
      id: 'raw_query_wikipedia',
      category: 'query',
      triggerCondition: 'consulta de enciclopédia/wikipedia',
      enforcementRule: 'Extrair rigorosamente o sujeito principal sem nenhum termo temporal.',
      lastTriggeredAt: Date.now() + 5000,
    };

    await saveBugLesson(updatedLesson);

    const raw = getRawBugConstraints();
    // A quantidade não deve aumentar por se tratar do mesmo id
    expect(raw.length).toBe(3);

    // O item atualizado deve conter a nova regra
    const updatedItem = raw.find((r) => r.id === 'raw_query_wikipedia');
    expect(updatedItem?.enforcementRule).toBe('Extrair rigorosamente o sujeito principal sem nenhum termo temporal.');

    // 2. Insere uma nova lição com ID inédito
    const newLesson: BugConstraint = {
      id: 'temporal_leap_year',
      category: 'temporal',
      triggerCondition: 'cálculo de anos bissextos',
      enforcementRule: 'Verificar divisibilidade por 4 e 400 antes de fixar 29 dias em fevereiro.',
      lastTriggeredAt: Date.now() + 6000,
    };

    await saveBugLesson(newLesson);

    const rawAfterInsert = getRawBugConstraints();
    expect(rawAfterInsert.length).toBe(4);
    expect(rawAfterInsert.map((r) => r.id)).toContain('temporal_leap_year');
  });

  it('o limite de 8 regras elimina a mais antiga quando a 9ª é inserida (podagem LRU)', async () => {
    // Insere regras de rule-1 até rule-9 com timestamps estritamente crescentes
    const baseTime = 1700000000000;

    for (let i = 1; i <= 9; i++) {
      const lesson: BugConstraint = {
        id: `stress_rule_${i}`,
        category: 'query',
        triggerCondition: `gatilho de teste ${i}`,
        enforcementRule: `Regra de teste número ${i}`,
        lastTriggeredAt: baseTime + i * 1000,
      };
      await saveBugLesson(lesson);
    }

    const currentRules = getRawBugConstraints();

    // Deve respeitar o limite máximo de 8 regras ativas
    expect(currentRules.length).toBe(8);

    // A regra mais recente (stress_rule_9) DEVE estar presente
    expect(currentRules.some((r) => r.id === 'stress_rule_9')).toBe(true);

    // A regra mais antiga inserida (stress_rule_1) e as antigas iniciais com menor timestamp DEVEM ter sido eliminadas
    expect(currentRules.some((r) => r.id === 'stress_rule_1')).toBe(false);

    // As top-5 regras ativas devem ser as mais recentes
    const active = getActiveConstraints();
    expect(active.length).toBe(5);
    expect(active[0]).toContain('Regra de teste número 9');
  });

  it('o System Prompt recebe o bloco isolado e o texto gerado para o usuário NUNCA contém tags ou nomes internos de regras', () => {
    const baseSystem = 'Você é um assistente especialista.';
    const injected = injectGuardrailsIntoSystemPrompt(baseSystem);

    // O system prompt DEVE conter o bloco isolado de guardrails
    expect(injected).toContain(GUARDRAIL_HEADER);
    expect(injected).toContain('DIRETIVA ABSOLUTA DE SEGURANÇA E PRIVACIDADE');

    // Simula uma resposta acidentalmente poluída com identificadores internos
    const leakyResponse = `
      Olá! Eu analisei sua pergunta com base em [CRITICAL_SYSTEM_GUARDRAILS] raw_query_wikipedia e youtube_iframe_blackscreen.
      Aqui está a resposta limpa sobre o tema solicitado.
    `;

    const sanitized = sanitizeUserFacingOutput(leakyResponse);

    // O texto limpo para o usuário NUNCA deve conter tags nem nomes das regras
    expect(sanitized).not.toContain(GUARDRAIL_HEADER);
    expect(sanitized).not.toContain('raw_query_wikipedia');
    expect(sanitized).not.toContain('youtube_iframe_blackscreen');
    expect(sanitized).not.toContain('static_metadata_chart');
    expect(sanitized).toContain('Aqui está a resposta limpa sobre o tema solicitado.');

    // Valida também o perfil do usuário gerado pelo sintetizador de domínio
    const profile = synthesizeDomainProfile('quem é você?');
    expect(profile.chatAnswer).not.toContain(GUARDRAIL_HEADER);
    expect(profile.chatAnswer).not.toContain('raw_query_wikipedia');
    expect(profile.intro).not.toContain(GUARDRAIL_HEADER);
  });
});
