import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BlockHeader } from '@/components/blocks/block-header';
import { Sidebar } from '@/components/layout/sidebar';
import { loadChatState, saveConversations, saveApiKey } from '@/lib/chat/history';

describe('Melhorias Gerais — Block Actions, Spaces & Chat Fallback', () => {
  it('BlockHeader: exibe botão de copiar e dispara onCopy quando acionado', () => {
    const copySpy = vi.fn();
    const { rerender } = render(
      React.createElement(BlockHeader, {
        title: 'Exemplo de Código',
        onCopy: copySpy,
        copied: false,
      })
    );

    const copyBtn = screen.getByRole('button', { name: /copiar/i });
    expect(copyBtn).toBeDefined();

    fireEvent.click(copyBtn);
    expect(copySpy).toHaveBeenCalledTimes(1);

    // Quando copied for true, exibe feedback visual
    rerender(
      React.createElement(BlockHeader, {
        title: 'Exemplo de Código',
        onCopy: copySpy,
        copied: true,
      })
    );
    expect(screen.getByRole('button', { name: /copiado/i })).toBeDefined();
  });

  it('Sidebar: clicar em "Espaços" abre o painel de espaços em vez de ser um botão morto', () => {
    render(
      React.createElement(Sidebar, {
        onOpenNote: vi.fn(),
      })
    );

    // Antes do clique, as opções de espaço não devem estar visíveis
    expect(screen.queryByText('Todos os Espaços')).toBeNull();

    // Clica no botão Espaços
    const spacesButton = screen.getByRole('button', { name: /espaços/i });
    fireEvent.click(spacesButton);

    // Agora o painel de espaços deve estar visível
    expect(screen.getByText('Todos os Espaços')).toBeDefined();
  });

  it('Chat History: salva e recupera conversas com fallback em memória mesmo sem IndexedDB', async () => {
    const mockConvs = [
      {
        id: 'conv-test-1',
        title: 'Conversa de Teste',
        updatedAt: new Date().toISOString(),
        messages: [{ id: 'msg-1', role: 'user' as const, content: 'Olá Claude' }],
      },
    ];

    await saveConversations(mockConvs);
    await saveApiKey('test-key-123');

    const state = await loadChatState();
    expect(state.conversations.length).toBeGreaterThanOrEqual(1);
    expect(state.conversations.some((c) => c.id === 'conv-test-1')).toBe(true);
    expect(state.apiKey).toBe('test-key-123');
  });
});
