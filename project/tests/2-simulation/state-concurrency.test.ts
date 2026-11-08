import { describe, it, expect, beforeEach } from 'vitest';
import { enqueueMeshTransaction, saveMilestoneSnapshot } from '@/lib/ai/layers/layer8-universal-mesh';
import { useBlocksStore } from '@/store/blocks-store';
import { useProvidersStore } from '@/store/providers-store';
import type { Block } from '@/lib/blocks/types';

describe('Camada 2 (Simulação Headless) - State Concurrency & Rollback', () => {
  beforeEach(() => {
    useProvidersStore.setState({ snapshots: [] });
    useBlocksStore.setState({ blocks: [], question: '', hasSubmitted: false });
  });

  it('executa 5 operações concorrentes em fila FIFO sequencial sem conflito de estado', async () => {
    const executionOrder: number[] = [];

    // Dispara 5 transações simultaneamente
    const promises = [1, 2, 3, 4, 5].map((id) =>
      enqueueMeshTransaction(async () => {
        // Simula delay assíncrono invertido (id maior com delay menor)
        await new Promise((r) => setTimeout(r, (6 - id) * 10));
        executionOrder.push(id);
        return id;
      })
    );

    const results = await Promise.all(promises);

    // Deve preservar a ordem de inserção na fila FIFO (1, 2, 3, 4, 5)
    expect(results).toEqual([1, 2, 3, 4, 5]);
    expect(executionOrder).toEqual([1, 2, 3, 4, 5]);
  });

  it('preserva a fila se uma operação intermediária falhar e permite rollback seguro', async () => {
    const initialBlock: Block = {
      id: 'b-init',
      type: 'intro',
      title: 'Estado Estável Inicial',
      content: 'Conteúdo validado de produção',
      loading: false,
    };

    useBlocksStore.setState({
      blocks: [initialBlock],
      question: 'Estado Inicial',
      hasSubmitted: true,
    });

    // Salva snapshot estável
    await saveMilestoneSnapshot('Marco 1 - Estável', 'Estado Inicial', [initialBlock]);
    expect(useProvidersStore.getState().snapshots).toHaveLength(1);

    const executionLog: string[] = [];

    // Executa operações concorrentes onde a 2ª falha
    const p1 = enqueueMeshTransaction(async () => {
      executionLog.push('op-1');
      return 'ok-1';
    });

    const p2 = enqueueMeshTransaction(async () => {
      executionLog.push('op-2-fail');
      throw new Error('Falha de IO simulada');
    });

    const p3 = enqueueMeshTransaction(async () => {
      executionLog.push('op-3');
      return 'ok-3';
    });

    await expect(p1).resolves.toBe('ok-1');
    await expect(p2).rejects.toThrow('Falha de IO simulada');
    await expect(p3).resolves.toBe('ok-3');

    expect(executionLog).toEqual(['op-1', 'op-2-fail', 'op-3']);

    // Simula corrupção temporária e executa rollback
    useBlocksStore.setState({
      blocks: [
        {
          id: 'b-corrompido',
          type: 'intro',
          title: 'Corrompido',
          content: 'lixo',
          loading: false,
        },
      ],
    });

    useBlocksStore.getState().rollbackLatestSnapshot();

    const restoredState = useBlocksStore.getState();
    expect(restoredState.blocks[0].id).toBe('b-init');
    expect(restoredState.blocks[0].title).toBe('Estado Estável Inicial');
  });
});
