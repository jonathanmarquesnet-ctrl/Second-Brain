import { describe, it, expect } from 'vitest';
import { resolveDateTimeFact } from '@/lib/ai/web-search-free';

describe('Camada 1 (Domínio Puro) - Temporal Resolver', () => {
  it('resolve data e hora atuais para "data hj" sem depender de rede externa', () => {
    const refDate = new Date(2026, 10, 8, 14, 30, 0); // 8 de novembro de 2026, domingo
    const fact = resolveDateTimeFact('data hj', refDate);

    expect(fact).not.toBeNull();
    expect(fact?.weekday).toBe('Domingo');
    expect(fact?.dateShort).toBe('08/11/2026');
    expect(fact?.year).toBe(2026);
    expect(fact?.month).toContain('novembro');
    expect(fact?.timeString).toContain('14:30');
    expect(fact?.timezone).toContain('Horário de Brasília');
    expect(fact?.formattedFull).toContain('8 de novembro de 2026');
  });

  it('detecta variações temporais como "que dia e hoje", "horario atual", "horas"', () => {
    const refDate = new Date(2026, 4, 15, 9, 15, 0); // 15 de maio de 2026
    const res1 = resolveDateTimeFact('que dia e hoje', refDate);
    expect(res1).not.toBeNull();
    expect(res1?.day).toBe(15);

    const res2 = resolveDateTimeFact('horas agora', refDate);
    expect(res2).not.toBeNull();

    const res3 = resolveDateTimeFact('qual o ano atual', refDate);
    expect(res3).not.toBeNull();
    expect(res3?.year).toBe(2026);
  });

  it('retorna null quando a query não possui termos temporais', () => {
    expect(resolveDateTimeFact('apenas um texto qualquer')).toBeNull();
    expect(resolveDateTimeFact('fotos de carros')).toBeNull();
  });
});
