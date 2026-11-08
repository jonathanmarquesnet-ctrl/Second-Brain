import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MediaBlockView } from '@/components/blocks/media-block';
import type { MediaVideoItem } from '@/lib/ai/media-search-free';

describe('Camada 2 (Simulação Headless) - Media Fallback Mesh', () => {
  it('Estado 1: Vídeo direto (.webm/.mp4) do Wikimedia Commons renderiza player HTML5 nativo', () => {
    const directVideo: MediaVideoItem = {
      id: 'wm-flight-rio',
      title: 'Voo Panorâmico sobre o Rio de Janeiro (720p HD)',
      videoUrl: 'https://upload.wikimedia.org/file.webm',
      embedUrl: 'https://upload.wikimedia.org/file.webm',
      thumbnailUrl: 'https://thumb.wikimedia.org/poster.jpg',
      duration: 'Vídeo Aberto (720p)',
      source: 'wikimedia',
    };

    const { container } = render(
      React.createElement(MediaBlockView, {
        videos: [directVideo],
      })
    );

    // Clica para reproduzir o vídeo
    const playBtn = screen.getByTitle('Reproduzir vídeo');
    fireEvent.click(playBtn);

    // Deve renderizar a tag <video> nativa do HTML5 com preload e source
    const videoElement = container.querySelector('video');
    expect(videoElement).not.toBeNull();
    expect(videoElement?.getAttribute('controls')).toBeDefined();

    const source = videoElement?.querySelector('source');
    expect(source?.getAttribute('src')).toBe('https://upload.wikimedia.org/file.webm');
    expect(source?.getAttribute('type')).toBe('video/webm');
  });

  it('Estado 2: URL do YouTube utiliza endpoint seguro youtube-nocookie com atributos irrestritos', () => {
    const ytVideo: MediaVideoItem = {
      id: 'yt-brazil-doc',
      title: 'Brasil 4K — Paisagens Naturais',
      embedUrl: 'https://www.youtube-nocookie.com/embed/l1m3p_e6z4E?rel=0&modestbranding=1',
      externalUrl: 'https://www.youtube.com/watch?v=l1m3p_e6z4E',
      thumbnailUrl: 'https://images.unsplash.com/poster.jpg',
      duration: 'YouTube 4K Ultra HD',
      source: 'youtube',
      videoId: 'l1m3p_e6z4E',
    };

    const { container } = render(
      React.createElement(MediaBlockView, {
        videos: [ytVideo],
      })
    );

    const playBtn = screen.getByTitle('Reproduzir vídeo');
    fireEvent.click(playBtn);

    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('src')).toContain('youtube-nocookie.com/embed/l1m3p_e6z4E');
    expect(iframe?.getAttribute('allow')).toContain('accelerometer');
    expect(iframe?.getAttribute('allow')).toContain('autoplay');
    expect(iframe?.getAttribute('allow')).toContain('picture-in-picture');
    expect(iframe?.getAttribute('allowfullscreen')).toBeDefined();
  });

  it('Estado 3: Iframe restrito converte para card interativo com Thumbnail e botão seguro "Assistir no YouTube"', () => {
    const failingVideo: MediaVideoItem = {
      id: 'yt-restricted',
      title: 'Documentário Restrito 4K',
      embedUrl: 'https://www.youtube-nocookie.com/embed/error?rel=0',
      externalUrl: 'https://www.youtube.com/watch?v=error',
      thumbnailUrl: 'https://images.unsplash.com/thumbnail-hq.jpg',
      duration: 'YouTube HD',
      source: 'youtube',
    };

    const { container } = render(
      React.createElement(MediaBlockView, {
        videos: [failingVideo],
      })
    );

    // Inicia reprodução
    const playBtn = screen.getByTitle('Reproduzir vídeo');
    fireEvent.click(playBtn);

    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();

    // Simula erro de carregamento no iframe do YouTube
    fireEvent.error(iframe!);

    // O iframe deve ser substituído pelo card interativo de fallback
    expect(container.querySelector('iframe')).toBeNull();
    expect(screen.getByText('Reprodução incorporada restrita pelo YouTube. Assista com qualidade máxima em nova aba segura:')).toBeDefined();

    const watchBtn = screen.getByText('▶ Assistir no YouTube');
    expect(watchBtn).toBeDefined();
    const link = watchBtn.closest('a');
    expect(link?.getAttribute('href')).toBe('https://www.youtube.com/watch?v=error');
    expect(link?.getAttribute('target')).toBe('_blank');
  });
});
