import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryBar } from '@/components/layout/query-bar';
import { useBlocksStore } from '@/store/blocks-store';

describe('Camada 3 (UI & E2E) - Command Bar Input', () => {
  beforeEach(() => {
    useBlocksStore.setState({
      question: '',
      isRefining: false,
    });
  });

  it('permite digitação rápida com estado local isolado sem disparar submit prematuro', () => {
    const submitSpy = vi.fn();
    useBlocksStore.setState({ submitPrompt: submitSpy });

    render(React.createElement(QueryBar));

    const input = screen.getByRole('textbox', { name: /pergunte algo/i }) as HTMLInputElement;

    // Digitação rápida de múltiplos caracteres
    fireEvent.change(input, { target: { value: 'f' } });
    fireEvent.change(input, { target: { value: 'fo' } });
    fireEvent.change(input, { target: { value: 'fot' } });
    fireEvent.change(input, { target: { value: 'foto' } });
    fireEvent.change(input, { target: { value: 'fotos do brasil e data hj' } });

    // O estado local reflete o valor imediatamente
    expect(input.value).toBe('fotos do brasil e data hj');

    // Nenhuma submissão deve ter ocorrido apenas com digitação
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it('ao submeter o formulário, aciona submitPrompt com a query limpa e reseta o campo local', () => {
    const submitSpy = vi.fn();
    useBlocksStore.setState({ submitPrompt: submitSpy });

    render(React.createElement(QueryBar));

    const input = screen.getByRole('textbox', { name: /pergunte algo/i }) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /enviar pergunta/i });

    fireEvent.change(input, { target: { value: '   previsão do tempo em curitiba   ' } });
    expect((submitButton as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(submitButton);

    // Deve ter chamado o submit com o texto trim
    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(submitSpy).toHaveBeenCalledWith('previsão do tempo em curitiba');

    // O input local deve ser limpo imediatamente após o envio
    expect(input.value).toBe('');
  });

  it('botão de envio permanece desabilitado para inputs vazios ou só espaços', () => {
    const submitSpy = vi.fn();
    useBlocksStore.setState({ submitPrompt: submitSpy });

    render(React.createElement(QueryBar));

    const input = screen.getByRole('textbox', { name: /pergunte algo/i }) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /enviar pergunta/i });

    fireEvent.change(input, { target: { value: '    ' } });
    expect((submitButton as HTMLButtonElement).disabled).toBe(true);

    fireEvent.submit(input.closest('form')!);
    expect(submitSpy).not.toHaveBeenCalled();
  });
});
