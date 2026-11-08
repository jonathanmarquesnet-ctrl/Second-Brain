export interface MediaPhotoItem {
  id: string;
  url: string;
  thumbUrl: string;
  title: string;
  description?: string;
  sourceUrl?: string;
  width?: number;
  height?: number;
}

export interface MediaVideoItem {
  id: string;
  title: string;
  videoUrl?: string;
  embedUrl: string;
  thumbnailUrl?: string;
  duration?: string;
  source: 'wikimedia' | 'youtube' | 'web';
  externalUrl?: string;
  videoId?: string;
}

export interface MediaGalleryResult {
  subject: string;
  photos: MediaPhotoItem[];
  videos: MediaVideoItem[];
}

export const CURATED_BRASIL_PHOTOS: MediaPhotoItem[] = [
  {
    id: 'br-rio-1',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d9/Rio_de_Janeiro_-_15535555826.jpg/1280px-Rio_de_Janeiro_-_15535555826.jpg',
    thumbUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d9/Rio_de_Janeiro_-_15535555826.jpg/960px-Rio_de_Janeiro_-_15535555826.jpg',
    title: 'Rio de Janeiro — Pão de Açúcar & Baía de Guanabara',
    description: 'Vista panorâmica do litoral fluminense e relevo costeiro do Brasil.',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Rio_de_Janeiro_-_15535555826.jpg',
    width: 1280,
    height: 853,
  },
  {
    id: 'br-sugarloaf-2',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/Sugarloaf_Sunrise_2.jpg/1280px-Sugarloaf_Sunrise_2.jpg',
    thumbUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/Sugarloaf_Sunrise_2.jpg/960px-Sugarloaf_Sunrise_2.jpg',
    title: 'Amanhecer no Pão de Açúcar — Rio de Janeiro',
    description: 'Nascer do sol sobre os morros cariocas e a orla atlântica.',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Sugarloaf_Sunrise_2.jpg',
    width: 1280,
    height: 853,
  },
  {
    id: 'br-parque-3',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/70/Panor%C3%A2mica_do_Parque_da_Cidade.jpg/1280px-Panor%C3%A2mica_do_Parque_da_Cidade.jpg',
    thumbUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/70/Panor%C3%A2mica_do_Parque_da_Cidade.jpg/960px-Panor%C3%A2mica_do_Parque_da_Cidade.jpg',
    title: 'Niterói & Rio — Parque da Cidade',
    description: 'Visual panorâmico integrando Mata Atlântica e oceano.',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Panor%C3%A2mica_do_Parque_da_Cidade.jpg',
    width: 1280,
    height: 850,
  },
  {
    id: 'br-hercules-4',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/87/Amanhecer_no_Hercules_--.jpg/1280px-Amanhecer_no_Hercules_--.jpg',
    thumbUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/87/Amanhecer_no_Hercules_--.jpg/960px-Amanhecer_no_Hercules_--.jpg',
    title: 'Serra dos Órgãos — Amanhecer nos Picos',
    description: 'Cadeia de montanhas e biodiversidade da Mata Atlântica no Brasil.',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Amanhecer_no_Hercules_--.jpg',
    width: 1280,
    height: 853,
  },
  {
    id: 'br-ilha-5',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/Isla_Grande%2C_R%C3%ADo_de_Janeiro_A74304820241125.jpg/1280px-Isla_Grande%2C_R%C3%ADo_de_Janeiro_A74304820241125.jpg',
    thumbUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/Isla_Grande%2C_R%C3%ADo_de_Janeiro_A74304820241125.jpg/960px-Isla_Grande%2C_R%C3%ADo_de_Janeiro_A74304820241125.jpg',
    title: 'Ilha Grande — Litoral Sudeste do Brasil',
    description: 'Águas cristalinas e preservação costeira no litoral brasileiro.',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Isla_Grande,_R%C3%ADo_de_Janeiro_A74304820241125.jpg',
    width: 1280,
    height: 853,
  },
  {
    id: 'br-iguacu-6',
    url: 'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=1280&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=960&auto=format&fit=crop&q=80',
    title: 'Cataratas do Iguaçu — Patrimônio Mundial da UNESCO',
    description: 'Maior conjunto de quedas de água do mundo e biodiversidade da Mata Atlântica.',
    sourceUrl: 'https://unsplash.com/photos/waterfalls-during-daytime-e6e52b1b7b5f',
    width: 1280,
    height: 853,
  },
];

export const CURATED_BRASIL_VIDEOS: MediaVideoItem[] = [
  {
    id: 'wm-flight-rio',
    title: 'Voo Panorâmico sobre o Rio de Janeiro (720p HD)',
    videoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/transcoded/3/36/A_Flight_over_Rio_de_Janeiro_-_Brazil.webm/A_Flight_over_Rio_de_Janeiro_-_Brazil.webm.720p.vp9.webm',
    embedUrl:
      'https://upload.wikimedia.org/wikipedia/commons/transcoded/3/36/A_Flight_over_Rio_de_Janeiro_-_Brazil.webm/A_Flight_over_Rio_de_Janeiro_-_Brazil.webm.720p.vp9.webm',
    thumbnailUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d9/Rio_de_Janeiro_-_15535555826.jpg/960px-Rio_de_Janeiro_-_15535555826.jpg',
    duration: 'Vídeo Aberto Wikimedia (720p HD)',
    source: 'wikimedia',
  },
  {
    id: 'yt-brazil-doc',
    title: 'Brasil 4K — Natureza, Praias e Paisagens Aéreas',
    embedUrl: 'https://www.youtube-nocookie.com/embed/l1m3p_e6z4E?rel=0&modestbranding=1',
    externalUrl: 'https://www.youtube.com/watch?v=l1m3p_e6z4E',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&auto=format&fit=crop&q=80',
    duration: 'YouTube 4K Ultra HD',
    source: 'youtube',
    videoId: 'l1m3p_e6z4E',
  },
  {
    id: 'wm-copacabana',
    title: 'Copacabana Beach — Orla e Litoral Fluminense',
    videoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/transcoded/7/7b/Copacabana_Beach_-_Rio_de_Janeiro_-_Brazil.webm/Copacabana_Beach_-_Rio_de_Janeiro_-_Brazil.webm.720p.vp9.webm',
    embedUrl:
      'https://upload.wikimedia.org/wikipedia/commons/transcoded/7/7b/Copacabana_Beach_-_Rio_de_Janeiro_-_Brazil.webm/Copacabana_Beach_-_Rio_de_Janeiro_-_Brazil.webm.720p.vp9.webm',
    thumbnailUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/Sugarloaf_Sunrise_2.jpg/960px-Sugarloaf_Sunrise_2.jpg',
    duration: 'Vídeo Aberto Wikimedia (720p HD)',
    source: 'wikimedia',
  },
];

interface WikimediaPage {
  pageid?: number;
  title?: string;
  imageinfo?: Array<{
    url?: string;
    thumburl?: string;
    descriptionurl?: string;
    width?: number;
    height?: number;
    mime?: string;
    extmetadata?: {
      ImageDescription?: { value?: string };
    };
  }>;
}

export async function fetchWikimediaCommonsPhotos(subject: string): Promise<MediaPhotoItem[]> {
  if (typeof fetch === 'undefined') return [];
  const searchQuery =
    subject.toLowerCase() === 'brasil'
      ? 'Brazil landscape Rio de Janeiro nature'
      : `${subject} landscape nature`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3200);
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
      searchQuery
    )}&gsrlimit=10&prop=imageinfo&iiprop=url|extmetadata|dimensions&iiurlwidth=960&format=json&origin=*`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return [];

    const json = (await res.json()) as {
      query?: { pages?: Record<string, WikimediaPage> };
    };
    const pages = Object.values(json.query?.pages ?? {});

    const photos: MediaPhotoItem[] = [];
    for (const p of pages) {
      const info = p.imageinfo?.[0];
      if (!info || !info.url) continue;

      const mime = info.mime?.toLowerCase() ?? '';
      if (mime.includes('svg') || mime.includes('icon') || mime.includes('pdf')) continue;

      const w = info.width ?? 0;
      const h = info.height ?? 0;
      if (w < 300 || h < 200) continue;

      const cleanTitle = (p.title ?? '')
        .replace(/^File:/i, '')
        .replace(/\.(jpg|jpeg|png|webp)$/i, '')
        .replace(/[_-]+/g, ' ')
        .trim();

      const desc = info.extmetadata?.ImageDescription?.value
        ? info.extmetadata.ImageDescription.value.replace(/<[^>]+>/g, '').trim().slice(0, 140)
        : `Registro fotográfico verificado no acervo Wikimedia Commons: ${cleanTitle}`;

      photos.push({
        id: `wm-${p.pageid ?? Math.random().toString(36).slice(2, 8)}`,
        url: info.url,
        thumbUrl: info.thumburl || info.url,
        title: cleanTitle,
        description: desc,
        sourceUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title ?? '')}`,
        width: w,
        height: h,
      });

      if (photos.length >= 6) break;
    }

    return photos;
  } catch {
    return [];
  }
}

export async function fetchWikimediaVideos(subject: string): Promise<MediaVideoItem[]> {
  if (typeof fetch === 'undefined') return [];
  const isBrasil = subject.toLowerCase() === 'brasil';
  const query = isBrasil
    ? 'filetype:video brasil paisagem OR floresta OR rio OR natureza'
    : `filetype:video ${subject}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
      query
    )}&gsrlimit=5&prop=imageinfo&iiprop=url|extmetadata|dimensions&format=json&origin=*`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return [];

    const json = (await res.json()) as {
      query?: { pages?: Record<string, WikimediaPage> };
    };
    const pages = Object.values(json.query?.pages ?? {});

    const videos: MediaVideoItem[] = [];
    for (const p of pages) {
      const info = p.imageinfo?.[0];
      if (!info || !info.url) continue;

      const cleanTitle = (p.title ?? '')
        .replace(/^File:/i, '')
        .replace(/\.(webm|ogv|mp4)$/i, '')
        .replace(/[_-]+/g, ' ')
        .trim();

      if (isBrasil && !/brasil|brazil|rio|amazonia|pantanal|cerrado|mata|fauna|flora|natureza/i.test(cleanTitle)) {
        continue;
      }

      videos.push({
        id: `wm-vid-${p.pageid ?? Math.random().toString(36).slice(2, 7)}`,
        title: cleanTitle,
        videoUrl: info.url,
        embedUrl: info.url,
        duration: 'Vídeo Aberto Wikimedia Commons',
        source: 'wikimedia',
      });
      if (videos.length >= 2) break;
    }
    return videos;
  } catch {
    return [];
  }
}

export function buildYouTubeSearchVideo(subject: string): MediaVideoItem {
  const isBrasil = subject.toLowerCase() === 'brasil';
  const videoId = isBrasil ? 'l1m3p_e6z4E' : '';
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${subject} 4k documentario turismo`
  )}`;

  return {
    id: `yt-search-${encodeURIComponent(subject)}`,
    title: isBrasil
      ? 'Brasil 4K — Natureza, Praias e Paisagens Aéreas'
      : `Documentário & Panorama Visual — ${subject}`,
    embedUrl: videoId
      ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`
      : searchUrl,
    externalUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : searchUrl,
    thumbnailUrl: isBrasil
      ? 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&auto=format&fit=crop&q=80'
      : `https://image.pollinations.ai/prompt/${encodeURIComponent(
          `${subject} scenic 4k documentary photography wallpaper`
        )}?width=800&height=500&nologo=true&seed=888`,
    duration: 'YouTube 4K Ultra HD',
    source: 'youtube',
    videoId: videoId || undefined,
  };
}

export async function fetchMediaForSubject(rawSubject: string): Promise<MediaGalleryResult> {
  const subject = rawSubject.trim() || 'Brasil';
  const isBrasil = subject.toLowerCase() === 'brasil';

  // Busca fotos e vídeos reais na Wikimedia Commons
  const [apiPhotos, apiVideos] = await Promise.all([
    fetchWikimediaCommonsPhotos(subject),
    fetchWikimediaVideos(subject),
  ]);

  // Se for o Brasil, combina as fotos verificadas de alta resolução
  let photos = isBrasil
    ? [...CURATED_BRASIL_PHOTOS, ...apiPhotos]
    : apiPhotos;

  // Garante fotos únicas pelo URL
  const seenUrls = new Set<string>();
  photos = photos.filter((p) => {
    if (seenUrls.has(p.url) || seenUrls.has(p.thumbUrl)) return false;
    seenUrls.add(p.url);
    seenUrls.add(p.thumbUrl);
    return true;
  });

  // Complementa com variações fotográficas ricas via Pollinations AI se tiver menos de 4 fotos distintas
  const VARIATIONS = [
    { suffix: 'iconic landmark scenic panoramic view 4k wallpaper', titleSuffix: 'Vista Panorâmica', seed: 101 },
    { suffix: 'sunset landscape horizon travel photography 4k', titleSuffix: 'Pôr do Sol & Paisagem', seed: 202 },
    { suffix: 'natural beauty aerial drone perspective 4k', titleSuffix: 'Perspectiva Aérea', seed: 303 },
    { suffix: 'vibrant daylight architecture scenic 4k', titleSuffix: 'Patrimônio & Cenário', seed: 404 },
    { suffix: 'golden hour cinematic photographic composition 4k', titleSuffix: 'Composição Fotográfica', seed: 505 },
    { suffix: 'heritage landscape wallpaper 4k', titleSuffix: 'Cenário Panorâmico', seed: 606 },
  ];

  let varIdx = 0;
  while (photos.length < 6 && varIdx < VARIATIONS.length) {
    const v = VARIATIONS[varIdx++];
    const prompt = `${subject} ${v.suffix}`;
    const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=500&nologo=true&seed=${v.seed}`;
    photos.push({
      id: `poll-${subject.slice(0, 5)}-${v.seed}`,
      url: imgUrl,
      thumbUrl: imgUrl,
      title: `${subject} — ${v.titleSuffix}`,
      description: `Composição visual em alta definição de ${subject}.`,
      sourceUrl: 'https://pollinations.ai',
      width: 800,
      height: 500,
    });
  }

  // Prepara vídeos resilientes (Fallback Triplo)
  const ytVideo = buildYouTubeSearchVideo(subject);
  const videos: MediaVideoItem[] = isBrasil
    ? CURATED_BRASIL_VIDEOS
    : [...apiVideos, ytVideo].slice(0, 3);

  return {
    subject,
    photos: photos.slice(0, 6),
    videos: videos.slice(0, 3),
  };
}
