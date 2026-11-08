import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MediaBlockView } from '@/components/blocks/media-block';
import type { MediaPhotoItem } from '@/lib/ai/media-search-free';

describe('Camada 3 (UI & E2E) - Media Block Lightbox', () => {
  const mockPhotos: MediaPhotoItem[] = [
    {
      id: 'photo-1',
      title: 'Cristo Redentor - Rio de Janeiro',
      url: 'https://images.unsplash.com/photo-cristo-hq.jpg',
      thumbUrl: 'https://images.unsplash.com/photo-cristo-thumb.jpg',
      description: 'Vista panorâmica do Corcovado',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Cristo.jpg',
    },
    {
      id: 'photo-2',
      title: 'Cataratas do Iguaçu',
      url: 'https://images.unsplash.com/photo-iguacu-hq.jpg',
      thumbUrl: 'https://images.unsplash.com/photo-iguacu-thumb.jpg',
      description: 'Maior conjunto de quedas de água do mundo',
    },
    {
      id: 'photo-3',
      title: 'Teatro Amazonas - Manaus',
      url: 'https://images.unsplash.com/photo-teatro-hq.jpg',
      thumbUrl: 'https://images.unsplash.com/photo-teatro-thumb.jpg',
      description: 'Arquitetura histórica renascentista',
    },
  ];

  it('renderiza o grid de fotos com 3 itens e layout responsivo de 3 colunas', () => {
    const { container } = render(
      React.createElement(MediaBlockView, {
        photos: mockPhotos,
        subject: 'Brasil',
      })
    );

    const grid = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.md\\:grid-cols-3');
    expect(grid).not.toBeNull();

    const renderedImgs = screen.getAllByRole('img');
    expect(renderedImgs.length).toBe(3);

    expect(screen.getByText('Cristo Redentor - Rio de Janeiro')).toBeDefined();
    expect(screen.getByText('Cataratas do Iguaçu')).toBeDefined();
    expect(screen.getByText('Teatro Amazonas - Manaus')).toBeDefined();
  });

  it('abre o modal Lightbox em tela cheia ao clicar na foto e fecha ao clicar no botão fechar', () => {
    render(
      React.createElement(MediaBlockView, {
        photos: mockPhotos,
        subject: 'Brasil',
      })
    );

    // Antes de clicar, o botão de fechar visualização não deve existir
    expect(screen.queryByLabelText('Fechar visualização')).toBeNull();

    // Clica no primeiro card de foto
    const firstPhotoCard = screen.getByText('Cristo Redentor - Rio de Janeiro').closest('.group')!;
    fireEvent.click(firstPhotoCard);

    // O modal Lightbox deve estar visível
    const closeBtn = screen.getByLabelText('Fechar visualização');
    expect(closeBtn).toBeDefined();

    // Modal exibe a foto e descrição
    const modal = closeBtn.closest('.fixed')!;
    expect(modal).not.toBeNull();
    expect(screen.getAllByText('Vista panorâmica do Corcovado').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Ver original')).toBeDefined();

    // Clica para fechar o modal
    fireEvent.click(closeBtn);

    // O modal Lightbox deve ter sumido
    expect(screen.queryByLabelText('Fechar visualização')).toBeNull();
  });
});
