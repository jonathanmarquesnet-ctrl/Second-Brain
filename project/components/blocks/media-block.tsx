'use client';

import { useState } from 'react';
import {
  Calendar,
  Clock,
  ExternalLink,
  Film,
  Image as ImageIcon,
  Play,
  X,
  ZoomIn,
} from 'lucide-react';
import type { DateTimeInfo } from '@/lib/ai/web-search-free';
import type { MediaPhotoItem, MediaVideoItem } from '@/lib/ai/media-search-free';

interface MediaBlockViewProps {
  dateTimeInfo?: DateTimeInfo;
  photos?: MediaPhotoItem[];
  videos?: MediaVideoItem[];
  subject?: string;
}

export function MediaBlockView({
  dateTimeInfo,
  photos = [],
  videos = [],
  subject,
}: MediaBlockViewProps) {
  const [activePhoto, setActivePhoto] = useState<MediaPhotoItem | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});

  const hasMedia = photos.length > 0 || videos.length > 0;
  if (!dateTimeInfo && !hasMedia) return null;

  return (
    <div className="space-y-4">
      {/* Banner de Data & Horário ao Vivo */}
      {dateTimeInfo && (
        <div className="rounded-xl border border-[#1F1F1F] bg-gradient-to-r from-blue-950/40 via-black to-indigo-950/30 p-3.5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#2563EB]/40 bg-[#2563EB]/15 text-[#60A5FA]">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{dateTimeInfo.weekday}</span>
                  <span className="rounded bg-[#2563EB]/20 px-1.5 py-0.2 font-mono text-[10px] text-[#60A5FA]">
                    {dateTimeInfo.dateShort}
                  </span>
                </div>
                <p className="text-xs text-[#D4D4D8]">{dateTimeInfo.dateLong}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-lg border border-[#1F1F1F] bg-black/70 px-3 py-1.5">
              <Clock className="h-4 w-4 text-[#34D399]" />
              <div>
                <p className="font-mono text-xs font-bold text-white">{dateTimeInfo.timeString}</p>
                <p className="text-[10px] text-[#A3A3A3]">{dateTimeInfo.timezone}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Fotos Reais — 3 Colunas Elegantes */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <ImageIcon className="h-3.5 w-3.5 text-[#2563EB]" />
              <span>Fotos Reais do Acervo {subject ? `(${subject})` : ''}</span>
            </div>
            <span className="font-mono text-[10px] text-[#A3A3A3]">
              {photos.length} imagens verificadas • Wikimedia Commons & Acervo Aberto
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setActivePhoto(photo)}
                className="group relative aspect-video cursor-pointer overflow-hidden rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] shadow-sm transition-all duration-200 hover:border-[#2563EB] hover:shadow-[0_0_18px_rgba(37,99,235,0.25)]"
              >
                {/* Imagem */}
                <img
                  src={photo.thumbUrl || photo.url}
                  alt={photo.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Overlay de gradiente */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent opacity-85 transition-opacity group-hover:opacity-100" />

                {/* Legenda na base */}
                <div className="absolute inset-x-0 bottom-0 p-2.5 text-left">
                  <p className="truncate text-[11px] font-medium text-white">{photo.title}</p>
                  {photo.description && (
                    <p className="truncate text-[9px] text-[#A3A3A3]">{photo.description}</p>
                  )}
                </div>

                {/* Ícone de zoom */}
                <div className="absolute right-2 top-2 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <ZoomIn className="h-3.5 w-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seção de Vídeos e Documentários — Fallback Triplo */}
      {videos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <Film className="h-3.5 w-3.5 text-[#60A5FA]" />
              <span>Vídeos & Documentários</span>
            </div>
            <span className="font-mono text-[10px] text-[#A3A3A3]">
              {videos.length} disponíveis • HTML5 & YouTube HD
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {videos.map((vid) => {
              const isPlaying = playingVideoId === vid.id;
              const isDirectVideo =
                vid.source === 'wikimedia' ||
                Boolean(
                  vid.videoUrl &&
                    (vid.videoUrl.endsWith('.webm') ||
                      vid.videoUrl.endsWith('.mp4') ||
                      vid.videoUrl.endsWith('.ogv'))
                );
              const hasError = videoErrors[vid.id];

              if (isPlaying) {
                // Caso 1: Player Nativo HTML5 para Wikimedia Commons
                if (isDirectVideo && (vid.videoUrl || vid.embedUrl)) {
                  return (
                    <div
                      key={vid.id}
                      className="relative aspect-video overflow-hidden rounded-xl border border-[#2563EB] bg-black shadow-lg"
                    >
                      <video
                        controls
                        autoPlay
                        preload="metadata"
                        className="h-full w-full object-cover"
                        poster={vid.thumbnailUrl}
                      >
                        <source
                          src={vid.videoUrl || vid.embedUrl}
                          type={
                            (vid.videoUrl || vid.embedUrl).endsWith('.mp4')
                              ? 'video/mp4'
                              : 'video/webm'
                          }
                        />
                        Seu navegador não suporta reprodução direta deste formato.
                      </video>
                      <button
                        type="button"
                        onClick={() => setPlayingVideoId(null)}
                        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/80 text-white transition-colors hover:bg-[#2563EB]"
                        aria-label="Fechar reprodutor"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                }

                // Caso 3: Fallback Interativo quando o iframe falha ou bloqueia
                if (hasError) {
                  return (
                    <div
                      key={vid.id}
                      className="relative flex aspect-video flex-col justify-between overflow-hidden rounded-xl border border-red-900/60 bg-gradient-to-t from-black via-black/85 to-[#141414] p-3.5 shadow-lg"
                    >
                      {vid.thumbnailUrl && (
                        <img
                          src={vid.thumbnailUrl}
                          alt={vid.title}
                          className="absolute inset-0 h-full w-full object-cover opacity-25"
                        />
                      )}
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="rounded border border-red-500/40 bg-red-600/30 px-2 py-0.5 text-[10px] font-semibold text-red-300">
                          {vid.duration || 'YouTube HD'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPlayingVideoId(null)}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-white hover:bg-white/20"
                          aria-label="Fechar"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="relative z-10 space-y-2">
                        <p className="line-clamp-2 text-xs font-semibold text-white">{vid.title}</p>
                        <p className="text-[10px] text-[#A3A3A3]">
                          Reprodução incorporada restrita pelo YouTube. Assista com qualidade máxima em nova aba segura:
                        </p>
                        <a
                          href={vid.externalUrl || `https://www.youtube.com/watch?v=${vid.videoId || ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-[#E11D48] px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_0_15px_rgba(225,29,72,0.45)] transition-all hover:scale-105 hover:bg-[#BE123C]"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>▶ Assistir no YouTube</span>
                          <ExternalLink className="ml-0.5 h-3 w-3 opacity-80" />
                        </a>
                      </div>
                    </div>
                  );
                }

                // Caso 2: Iframe sem cookies com allow completo e detecção de erro
                return (
                  <div
                    key={vid.id}
                    className="relative aspect-video overflow-hidden rounded-xl border border-[#2563EB] bg-black shadow-lg"
                  >
                    <iframe
                      ref={(el) => {
                        if (el) {
                          el.onerror = () => setVideoErrors((prev) => ({ ...prev, [vid.id]: true }));
                        }
                      }}
                      src={vid.embedUrl}
                      title={vid.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      onError={() => setVideoErrors((prev) => ({ ...prev, [vid.id]: true }))}
                      onErrorCapture={() => setVideoErrors((prev) => ({ ...prev, [vid.id]: true }))}
                      className="h-full w-full border-none"
                    />
                    <div className="absolute right-2 top-2 z-10 flex items-center gap-1.5">
                      {vid.externalUrl && (
                        <a
                          href={vid.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded bg-black/80 px-2 py-1 text-[10px] text-white shadow-md transition-colors hover:bg-[#E11D48]"
                          title="Abrir no YouTube"
                        >
                          <span>YouTube</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setPlayingVideoId(null)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-white transition-colors hover:bg-[#2563EB]"
                        aria-label="Fechar reprodutor"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }

              // Card Interativo Idle
              return (
                <div
                  key={vid.id}
                  className="group relative flex aspect-video cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] p-3 shadow-sm transition-all duration-200 hover:border-[#2563EB] hover:shadow-[0_0_18px_rgba(37,99,235,0.25)]"
                >
                  {/* Poster / Thumbnail de fundo */}
                  {vid.thumbnailUrl && (
                    <img
                      src={vid.thumbnailUrl}
                      alt={vid.title}
                      className="absolute inset-0 h-full w-full object-cover opacity-40 transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                  {/* Topo do Card */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="rounded border border-[#2563EB]/40 bg-[#2563EB]/30 px-2 py-0.5 text-[10px] font-semibold text-[#93C5FD] backdrop-blur-sm">
                      {vid.duration || (isDirectVideo ? 'Vídeo Aberto' : 'Vídeo HD')}
                    </span>
                    <div
                      onClick={() => setPlayingVideoId(vid.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-md transition-transform group-hover:scale-110"
                      title="Reproduzir vídeo"
                    >
                      <Play className="ml-0.5 h-4 w-4 fill-current" />
                    </div>
                  </div>

                  {/* Base do Card com Ação Direta */}
                  <div className="relative z-10 space-y-1.5">
                    <h4
                      onClick={() => setPlayingVideoId(vid.id)}
                      className="line-clamp-2 text-xs font-semibold text-white transition-colors group-hover:text-[#60A5FA]"
                    >
                      {vid.title}
                    </h4>
                    <div className="flex items-center justify-between pt-0.5">
                      <p
                        onClick={() => setPlayingVideoId(vid.id)}
                        className="text-[10px] text-[#A3A3A3]"
                      >
                        {isDirectVideo
                          ? '▶ Player Nativo (Wikimedia Commons)'
                          : '▶ Reproduzir inline'}
                      </p>
                      {vid.externalUrl && (
                        <a
                          href={vid.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded bg-[#E11D48] px-2 py-0.5 text-[10px] font-semibold text-white shadow-[0_0_10px_rgba(225,29,72,0.4)] transition-all hover:scale-105 hover:bg-[#BE123C]"
                        >
                          <Play className="h-2.5 w-2.5 fill-current" />
                          <span>Assistir</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal / Lightbox de Foto em Tela Cheia */}
      {activePhoto && (
        <div
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl border border-[#1F1F1F] bg-[#0A0A0A] p-2 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setActivePhoto(null)}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/80 text-white transition-colors hover:bg-[#2563EB]"
              aria-label="Fechar visualização"
            >
              <X className="h-4 w-4" />
            </button>

            <img
              src={activePhoto.url || activePhoto.thumbUrl}
              alt={activePhoto.title}
              className="max-h-[75vh] w-full rounded-xl object-contain"
            />

            <div className="flex items-center justify-between px-3 py-2 text-xs text-white">
              <div>
                <p className="font-semibold">{activePhoto.title}</p>
                {activePhoto.description && (
                  <p className="text-[11px] text-[#A3A3A3]">{activePhoto.description}</p>
                )}
              </div>
              {activePhoto.sourceUrl && (
                <a
                  href={activePhoto.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-[#60A5FA] hover:underline"
                >
                  <span>Ver original</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
