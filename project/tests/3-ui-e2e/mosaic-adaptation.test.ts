import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BlockMosaic } from '@/components/blocks/block-mosaic';
import { useBlocksStore } from '@/store/blocks-store';
import { defaultVisibleBlockTypesForIntent } from '@/lib/ai/domain-synthesizer';
import type { Block } from '@/lib/blocks/types';

describe('Camada 3 (UI & E2E) - Mosaic Adaptation', () => {
  const mockAllBlocks: Block[] = [
    {
      id: 'block-intro',
      type: 'intro',
      title: 'Panorama Geral',
      content: 'Resumo sobre o Brasil e datas.',
      loading: false,
    },
    {
      id: 'block-critic',
      type: 'critic',
      title: 'Análise Crítica',
      points: ['Crítica analítica estruturada.'],
      loading: false,
    },
    {
      id: 'block-code',
      type: 'code',
      title: 'Exemplo de Código',
      code: 'console.log("hello world");',
      language: 'typescript',
      loading: false,
    },
    {
      id: 'block-slides',
      type: 'slides',
      title: 'Apresentação em Slides',
      slides: [{ heading: 'Slide 1', body: 'Conteúdo do slide' }],
      loading: false,
    },
    {
      id: 'block-chart',
      type: 'chart',
      title: 'Métricas e Gráficos',
      data: [{ label: 'Q1', value: 100 }],
      loading: false,
    },
  ];

  beforeEach(() => {
    useBlocksStore.setState({
      blocks: mockAllBlocks,
      question: 'fotos do brasil e data hj',
      intent: 'media_or_datetime',
      visibleTypes: defaultVisibleBlockTypesForIntent('media_or_datetime'),
      isRefining: false,
    });
  });

  it('determina que intenção "media_or_datetime" oculta código e crítica por padrão', () => {
    const visible = defaultVisibleBlockTypesForIntent('media_or_datetime');
    expect(visible).toEqual(['intro']);
    expect(visible).not.toContain('critic');
    expect(visible).not.toContain('code');
    expect(visible).not.toContain('chart');
    expect(visible).not.toContain('slides');
  });

  it('no modo "media_or_datetime", renderiza apenas o bloco intro no mosaico e expõe os demais na barra de expansão', () => {
    render(React.createElement(BlockMosaic));

    // Bloco intro está visível
    expect(screen.getByText('Panorama Geral')).toBeDefined();

    // Blocos secundários não estão visíveis no grid principal
    expect(screen.queryByText('Crítica analítica estruturada.')).toBeNull();
    expect(screen.queryByText('console.log("hello world");')).toBeNull();

    // A barra inferior de formatos/alternativas está aberta com as opções ocultas
    expect(screen.getByText('Explorar mais formatos para este tema:')).toBeDefined();
    expect(screen.getByRole('button', { name: /Análise Crítica/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Exemplo em Código/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Ver em Slides/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Gráfico de Dados/i })).toBeDefined();
  });

  it('ao clicar em um botão de expansão (ex: Análise Crítica), invoca enableBlockType e ativa o bloco', () => {
    const enableSpy = vi.fn((type) => {
      const current = useBlocksStore.getState().visibleTypes;
      useBlocksStore.setState({ visibleTypes: [...current, type] });
    });
    useBlocksStore.setState({ enableBlockType: enableSpy });

    render(React.createElement(BlockMosaic));

    const criticBtn = screen.getByRole('button', { name: /Análise Crítica/i });
    fireEvent.click(criticBtn);

    expect(enableSpy).toHaveBeenCalledTimes(1);
    expect(enableSpy).toHaveBeenCalledWith('critic');
  });
});
