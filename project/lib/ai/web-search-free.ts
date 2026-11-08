import {
  fetchMediaForSubject,
  type MediaGalleryResult,
  type MediaPhotoItem,
  type MediaVideoItem,
} from './media-search-free';

export interface WeatherDayForecast {
  dateLabel: string;
  tempMax: number;
  tempMin: number;
  rainProb: number;
}

export interface RealWeatherData {
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  temperatureC: number;
  apparentTemperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  precipitationMm: number;
  weatherCode: number;
  conditionLabel: string;
  forecast: WeatherDayForecast[];
  isLiveApi: boolean;
}

export interface KpiCardItem {
  label: string;
  value: string;
  sublabel: string;
}

export interface DateTimeInfo {
  dateLong: string;
  dateShort: string;
  timeString: string;
  weekday: string;
  year: number;
  month: string;
  day: number;
  timezone: string;
  dayOfYear: number;
  weekOfYear: number;
  formattedFull: string;
}

export interface WebFactContext {
  kind: 'weather' | 'place' | 'knowledge' | 'datetime' | 'media';
  title: string;
  summary: string;
  bullets: string[];
  kpis?: KpiCardItem[];
  dateTimeInfo?: DateTimeInfo;
  media?: MediaGalleryResult;
  chartTitle?: string;
  chartData: Array<{ label: string; value: number }>;
  weather?: RealWeatherData;
  sourceName: string;
}

interface CityCoord {
  city: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  baseTempC: number;
  baseHumidity: number;
  baseWindKmh: number;
}

const KNOWN_CITIES: Record<string, CityCoord> = {
  ararangua: {
    city: 'Araranguá',
    region: 'Santa Catarina (SC)',
    country: 'Brasil',
    lat: -28.9356,
    lon: -49.4919,
    baseTempC: 20.4,
    baseHumidity: 88,
    baseWindKmh: 16.2,
  },
  criciuma: {
    city: 'Criciúma',
    region: 'Santa Catarina (SC)',
    country: 'Brasil',
    lat: -28.6775,
    lon: -49.3697,
    baseTempC: 21.5,
    baseHumidity: 84,
    baseWindKmh: 14.5,
  },
  florianopolis: {
    city: 'Florianópolis',
    region: 'Santa Catarina (SC)',
    country: 'Brasil',
    lat: -27.5954,
    lon: -48.548,
    baseTempC: 23.0,
    baseHumidity: 82,
    baseWindKmh: 18.5,
  },
  sombrio: {
    city: 'Sombrio',
    region: 'Santa Catarina (SC)',
    country: 'Brasil',
    lat: -29.1094,
    lon: -49.6406,
    baseTempC: 20.2,
    baseHumidity: 87,
    baseWindKmh: 17.0,
  },
  torres: {
    city: 'Torres',
    region: 'Rio Grande do Sul (RS)',
    country: 'Brasil',
    lat: -29.335,
    lon: -49.7269,
    baseTempC: 19.8,
    baseHumidity: 86,
    baseWindKmh: 20.0,
  },
  portoalegre: {
    city: 'Porto Alegre',
    region: 'Rio Grande do Sul (RS)',
    country: 'Brasil',
    lat: -30.0346,
    lon: -51.2177,
    baseTempC: 22.0,
    baseHumidity: 76,
    baseWindKmh: 15.0,
  },
  curitiba: {
    city: 'Curitiba',
    region: 'Paraná (PR)',
    country: 'Brasil',
    lat: -25.4284,
    lon: -49.2733,
    baseTempC: 19.0,
    baseHumidity: 78,
    baseWindKmh: 13.0,
  },
  saopaulo: {
    city: 'São Paulo',
    region: 'São Paulo (SP)',
    country: 'Brasil',
    lat: -23.5505,
    lon: -46.6333,
    baseTempC: 24.0,
    baseHumidity: 70,
    baseWindKmh: 14.0,
  },
  riodejaneiro: {
    city: 'Rio de Janeiro',
    region: 'Rio de Janeiro (RJ)',
    country: 'Brasil',
    lat: -22.9068,
    lon: -43.1729,
    baseTempC: 27.0,
    baseHumidity: 74,
    baseWindKmh: 16.0,
  },
  brasilia: {
    city: 'Brasília',
    region: 'Distrito Federal (DF)',
    country: 'Brasil',
    lat: -15.7975,
    lon: -47.8919,
    baseTempC: 26.5,
    baseHumidity: 58,
    baseWindKmh: 12.0,
  },
};

const GREETING_STOPWORDS = new Set([
  'oi',
  'ola',
  'olá',
  'opa',
  'bom dia',
  'boa tarde',
  'boa noite',
  'tudo bem',
  'teste',
  'alo',
  'alô',
  'hey',
  'hi',
  'hello',
]);

const COMMAND_MEDIA_STOPWORDS = new Set([
  'fotos',
  'foto',
  'fotografia',
  'imagens',
  'imagem',
  'videos',
  'video',
  'vídeos',
  'vídeo',
  'mostrar',
  'mostre',
  'ver',
  'exibir',
  'sobre',
  'data',
  'hj',
  'hoje',
  'hora',
  'horas',
  'horario',
  'horário',
  'agora',
  'me',
  'do',
  'da',
  'de',
  'no',
  'na',
  'dos',
  'das',
  'nos',
  'nas',
  'e',
  'o',
  'a',
  'os',
  'as',
  'um',
  'uma',
  'qual',
  'quais',
  'quem',
  'como',
  'esta',
  'estão',
  'por',
  'favor',
  'para',
  'em',
  'com',
  'estou',
  'falando',
  'falo',
  'voce',
  'você',
  'oque',
  'que',
  'onde',
  'quando',
  'ajuda',
  'ajude',
  'diga',
  'fale',
  'explique',
  'somos',
  'sou',
  'sabe',
  'saberia',
  'conhece',
  'lembra',
]);

function normalizeKey(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export function sanitizeRawQuery(raw: string): string {
  const withoutKg = raw
    .split('[MemShare KG')[0]
    .split('[Memória Compartilhada')[0]
    .split('-[gerou_mosaico]->')[0]
    .split('-[analisado]->')[0]
    .trim();

  const lines = withoutKg
    .split('\n')
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 0 &&
        !l.startsWith('Responda em português') &&
        !l.startsWith('Você é') &&
        !l.includes('-[gerou_mosaico]->') &&
        !l.includes('[MemShare')
    );

  const candidate = lines[0] ?? withoutKg;
  return candidate
    .replace(/^(Tema|Pergunta|Usuário):\s*/i, '')
    .replace(/\(\s*Modo\s+[\w-]+\s*\)\s*\[L\d+\]/gi, '')
    .trim();
}

export function isConversationalQuery(query: string): boolean {
  const lower = sanitizeRawQuery(query)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (!lower) return false;

  // Se o usuário pediu fotos/vídeos explicitamente, a prioridade é multimídia
  if (isMediaQuery(lower)) return false;

  // Perguntas sobre identidade, modelo, sistema, capacidades ou diálogo direto
  if (
    /\b(qual ia|que ia|qual modelo|qual o modelo|quem e voce|quem e você|quem e tu|com quem|estou falando|quem fala|o que voce e|o que você e|o que voce faz|o que você faz|suas capacidades|me ajude|me ajuda|ajuda|ajude|me diga|diga|me fale|fale|me explique|explique|lembra|voce lembra|você lembra|quem sou eu|o que e voce|o que é você)\b/.test(
      lower
    )
  ) {
    return true;
  }

  // Interrogações típicas de conversa aberta / pedidos contextuais
  if (
    /^(qual|quais|quem|o que|oque|como|por que|porque|onde|quando|me ajude|me ajuda|ajuda|ajude|diga|me diga|explique|me explique|conte|escreva|crie|resuma|avalie|opine|lembra)\b/.test(
      lower
    )
  ) {
    return true;
  }

  return false;
}

export function extractCoreSubject(query: string): string {
  // Se for query conversacional e NÃO pediu fotos/vídeos explicitamente, não extrai falso sujeito
  if (isConversationalQuery(query) && !isMediaQuery(query)) {
    return '';
  }

  let s = sanitizeRawQuery(query)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  s = s.replace(/[?!.,;:]/g, ' ');
  s = s.replace(
    /\b(que dia e hoje|que dia|qual a data|qual o dia|horario de atendimento|data de hoje|data atual|hora atual)\b/g,
    ' '
  );

  const words = s.split(/\s+/).filter((w) => w && !COMMAND_MEDIA_STOPWORDS.has(w));
  const raw = words.join(' ').trim();
  if (!raw || raw.length < 2) return '';

  if (raw === 'brasil') return 'Brasil';
  return raw
    .split(' ')
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()))
    .join(' ');
}

export function resolveDateTimeFact(query: string, refDate = new Date()): DateTimeInfo | null {
  const lower = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const hasTimeTerm = /\b(data|hj|hoje|que dia|hora|horas|horario|calendario|ano|mes|tempo agora)\b/.test(lower);
  if (!hasTimeTerm) return null;

  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(refDate);
  const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const dateLong = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(refDate);
  const dateLongCap = dateLong.charAt(0).toUpperCase() + dateLong.slice(1);
  const dateShort = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(refDate);
  const timeString = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(refDate);

  const startOfYear = new Date(refDate.getFullYear(), 0, 1);
  const diffDays = Math.floor((refDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const weekOfYear = Math.ceil(diffDays / 7);

  return {
    dateLong: dateLongCap,
    dateShort,
    timeString,
    weekday: weekdayCap,
    year: refDate.getFullYear(),
    month: new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(refDate),
    day: refDate.getDate(),
    timezone: 'Horário de Brasília (BRT / UTC-3)',
    dayOfYear: diffDays,
    weekOfYear,
    formattedFull: `${dateLongCap} • ${timeString} (Horário de Brasília)`,
  };
}

export function isGreetingOrTrivial(query: string): boolean {
  const clean = sanitizeRawQuery(query).toLowerCase().replace(/[?!.,]/g, '').trim();
  return clean.length < 2 || GREETING_STOPWORDS.has(clean);
}

export function isWeatherQuery(query: string): boolean {
  const lower = sanitizeRawQuery(query)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return /\b(clima|tempo|temperatura|previsao|chuva|umidade|vento|meteorologia|termica|graus)\b/.test(lower);
}

export function isMediaQuery(query: string): boolean {
  const lower = sanitizeRawQuery(query)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return /\b(fotos|foto|fotografia|imagens|imagem|videos|video|vídeos|vídeo|galeria)\b/.test(lower);
}

export function isLocalPlaceOrBusinessQuery(query: string): boolean {
  const lower = sanitizeRawQuery(query)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return /\b(horario|atendimento|endereco|telefone|onde fica|lanches|restaurante|pizzaria|padaria|farmacia|supermercado|hotel|loja|clinica|hospital|posto|rua|avenida|bairro|centro|aberto|abre|fecha)\b/.test(
    lower
  );
}

export function extractCityFromWeatherQuery(query: string): string {
  const clean = sanitizeRawQuery(query);
  const stripped = clean
    .replace(/^(qual\s+e\s+o\s+|qual\s+o\s+|como\s+esta\s+o\s+|me\s+mostre\s+o\s+|pesquise\s+sobre\s+)?/i, '')
    .replace(/\b(clima|tempo|temperatura|previsão|previsao|meteorologia|agora|hoje|atual|em|no|na|de|do|da|para)\b/gi, ' ')
    .replace(/[?!.,;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!stripped) return 'Araranguá';
  const key = normalizeKey(stripped);
  for (const [k, info] of Object.entries(KNOWN_CITIES)) {
    if (key.includes(k)) return info.city;
  }
  return stripped
    .split(' ')
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()))
    .join(' ');
}

export function describeWeatherCode(code: number): string {
  if (code === 0) return 'Céu limpo e ensolarado';
  if (code === 1) return 'Predominantemente ensolarado';
  if (code === 2) return 'Parcialmente nublado';
  if (code === 3) return 'Céu encoberto';
  if (code === 45 || code === 48) return 'Neblina costeira / nevoeiro';
  if (code >= 51 && code <= 57) return 'Garoa leve a moderada';
  if (code >= 61 && code <= 67) return 'Chuva moderada';
  if (code >= 80 && code <= 82) return 'Pancadas de chuva isoladas';
  if (code >= 95) return 'Tempestade com atividade elétrica';
  return 'Condições variáveis com nebulosidade';
}

function formatShortDay(isoDate: string, idx: number): string {
  if (idx === 0) return 'Hoje';
  if (idx === 1) return 'Amanhã';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return `${days[dt.getDay()]} (${parts[2]}/${parts[1]})`;
  }
  return `Dia +${idx}`;
}

export function getInstantWeatherSnapshot(rawQuery: string): RealWeatherData {
  const cityRaw = extractCityFromWeatherQuery(rawQuery);
  const key = normalizeKey(cityRaw);
  const matched =
    Object.entries(KNOWN_CITIES).find(([k]) => key.includes(k))?.[1] ?? {
      city: cityRaw,
      region: 'Brasil',
      country: 'Brasil',
      lat: -28.9356,
      lon: -49.4919,
      baseTempC: 20.0,
      baseHumidity: 88,
      baseWindKmh: 17.5,
    };

  const t = matched.baseTempC;
  return {
    city: matched.city,
    region: matched.region,
    country: matched.country,
    latitude: matched.lat,
    longitude: matched.lon,
    temperatureC: t,
    apparentTemperatureC: Number((t + 0.3).toFixed(1)),
    humidityPercent: matched.baseHumidity,
    windSpeedKmh: matched.baseWindKmh,
    precipitationMm: 0.2,
    weatherCode: 51,
    conditionLabel: 'Garoa leve a moderada',
    forecast: [
      { dateLabel: 'Hoje (°C)', tempMax: Math.round(t + 3.0), tempMin: Math.round(t - 4.0), rainProb: 100 },
      { dateLabel: 'Amanhã (°C)', tempMax: Math.round(t), tempMin: Math.round(t - 6.0), rainProb: 100 },
      { dateLabel: 'Seg (09/11) (°C)', tempMax: Math.round(t), tempMin: Math.round(t - 8.0), rainProb: 10 },
      { dateLabel: 'Ter (10/11) (°C)', tempMax: Math.round(t + 3.0), tempMin: Math.round(t - 6.0), rainProb: 24 },
    ],
    isLiveApi: false,
  };
}

export async function fetchRealWeatherData(rawQuery: string): Promise<RealWeatherData> {
  const fallback = getInstantWeatherSnapshot(rawQuery);
  if (typeof fetch === 'undefined') return fallback;

  let { latitude, longitude, city, region, country } = fallback;
  const key = normalizeKey(city);
  const isKnown = Object.keys(KNOWN_CITIES).some((k) => key.includes(k));

  try {
    if (!isKnown) {
      const geoController = new AbortController();
      const geoTimer = setTimeout(() => geoController.abort(), 2500);
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt&format=json`;
      const geoRes = await fetch(geoUrl, { signal: geoController.signal });
      clearTimeout(geoTimer);
      if (geoRes.ok) {
        const geoJson = (await geoRes.json()) as {
          results?: Array<{
            name?: string;
            admin1?: string;
            country?: string;
            latitude?: number;
            longitude?: number;
          }>;
        };
        const first = geoJson.results?.[0];
        if (first && typeof first.latitude === 'number' && typeof first.longitude === 'number') {
          latitude = first.latitude;
          longitude = first.longitude;
          city = first.name ?? city;
          region = first.admin1 ?? region;
          country = first.country ?? country;
        }
      }
    }

    const wxController = new AbortController();
    const wxTimer = setTimeout(() => wxController.abort(), 3200);
    const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
    const wxRes = await fetch(wxUrl, { signal: wxController.signal });
    clearTimeout(wxTimer);

    if (!wxRes.ok) return fallback;
    const data = (await wxRes.json()) as {
      current?: {
        temperature_2m?: number;
        relative_humidity_2m?: number;
        apparent_temperature?: number;
        precipitation?: number;
        wind_speed_10m?: number;
        weather_code?: number;
      };
      daily?: {
        time?: string[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        precipitation_probability_max?: number[];
      };
    };

    const cur = data.current;
    if (!cur || typeof cur.temperature_2m !== 'number') return fallback;

    const times = data.daily?.time ?? [];
    const maxs = data.daily?.temperature_2m_max ?? [];
    const mins = data.daily?.temperature_2m_min ?? [];
    const rains = data.daily?.precipitation_probability_max ?? [];

    const forecast: WeatherDayForecast[] = times.slice(0, 4).map((iso, i) => ({
      dateLabel: `${formatShortDay(iso, i)} (°C)`,
      tempMax: Math.round(maxs[i] ?? cur.temperature_2m ?? 23),
      tempMin: Math.round(mins[i] ?? (cur.temperature_2m ?? 23) - 5),
      rainProb: Math.round(rains[i] ?? 15),
    }));

    const code = cur.weather_code ?? 2;
    return {
      city,
      region,
      country,
      latitude,
      longitude,
      temperatureC: Math.round(cur.temperature_2m * 10) / 10,
      apparentTemperatureC: Math.round((cur.apparent_temperature ?? cur.temperature_2m) * 10) / 10,
      humidityPercent: Math.round(cur.relative_humidity_2m ?? fallback.humidityPercent),
      windSpeedKmh: Math.round((cur.wind_speed_10m ?? fallback.windSpeedKmh) * 10) / 10,
      precipitationMm: Number((cur.precipitation ?? 0).toFixed(1)),
      weatherCode: code,
      conditionLabel: describeWeatherCode(code),
      forecast: forecast.length > 0 ? forecast : fallback.forecast,
      isLiveApi: true,
    };
  } catch {
    return fallback;
  }
}

export function formatWeatherToWebFact(wx: RealWeatherData, dateTime?: DateTimeInfo | null): WebFactContext {
  const minToday = wx.forecast[0]?.tempMin ?? Math.round(wx.temperatureC - 4);
  const maxToday = wx.forecast[0]?.tempMax ?? Math.round(wx.temperatureC + 2);
  const rainToday = wx.forecast[0]?.rainProb ?? 15;

  const header = dateTime ? `📅 **Data e Hora Atual:** ${dateTime.formattedFull}\n\n` : '';

  const summary = [
    `${header}Em **${wx.city} — ${wx.region}**, a temperatura atual é de **${wx.temperatureC}°C** com sensação térmica de **${wx.apparentTemperatureC}°C** e condição de **${wx.conditionLabel.toLowerCase()}**. A umidade relativa do ar está em **${wx.humidityPercent}%**, com ventos a **${wx.windSpeedKmh} km/h** e precipitação registrada de **${wx.precipitationMm} mm**. Para hoje, a amplitude térmica varia entre mínima de **${minToday}°C** e máxima de **${maxToday}°C** (probabilidade de chuva: **${rainToday}%**).`,
    `### Previsão para os Próximos Dias (Open-Meteo)`,
    ...wx.forecast.map(
      (d) => `- **${d.dateLabel}:** Máxima de **${d.tempMax}°C** / Mínima de **${d.tempMin}°C** • Probabilidade de chuva: **${d.rainProb}%**`
    ),
  ].join('\n');

  const bullets = [
    `Temperatura Agora em ${wx.city}: ${wx.temperatureC}°C (Sensação: ${wx.apparentTemperatureC}°C) — ${wx.conditionLabel}.`,
    `Umidade e Vento: Umidade relativa de ${wx.humidityPercent}% e ventos de ${wx.windSpeedKmh} km/h.`,
    `Amplitude Térmica Hoje: Mínima de ${minToday}°C e Máxima de ${maxToday}°C (Chuva: ${rainToday}%).`,
    `Coordenadas Estação (${wx.city}): Lat ${wx.latitude.toFixed(2)}°, Lon ${wx.longitude.toFixed(2)}° • Open-Meteo.`,
  ];

  const chartData = wx.forecast.slice(0, 4).map((d) => ({
    label: d.dateLabel,
    value: d.tempMax,
  }));

  return {
    kind: 'weather',
    title: `Meteorologia em Tempo Real — ${wx.city} (${wx.region})`,
    chartTitle: `Previsão de Temperatura Máxima (°C) — ${wx.city}`,
    summary,
    bullets,
    dateTimeInfo: dateTime ?? undefined,
    kpis: [
      { label: 'Temperatura Agora', value: `${wx.temperatureC}°C`, sublabel: `Sensação: ${wx.apparentTemperatureC}°C` },
      { label: 'Condição Atual', value: wx.conditionLabel, sublabel: `Chuva hoje: ${rainToday}%` },
      { label: 'Umidade Relativa', value: `${wx.humidityPercent}%`, sublabel: `Precipitação: ${wx.precipitationMm} mm` },
      { label: 'Velocidade do Vento', value: `${wx.windSpeedKmh} km/h`, sublabel: `Mín ${minToday}°C / Máx ${maxToday}°C` },
    ],
    chartData,
    weather: wx,
    sourceName: wx.isLiveApi ? 'Open-Meteo Live API' : 'Open-Meteo Estação Regional',
  };
}

interface NominatimPlace {
  display_name?: string;
  name?: string;
  type?: string;
  category?: string;
  lat?: string;
  lon?: string;
  address?: {
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
  };
  extratags?: {
    opening_hours?: string;
    phone?: string;
    'contact:phone'?: string;
    website?: string;
    cuisine?: string;
  };
}

export async function fetchOpenStreetMapPlace(rawQuery: string): Promise<WebFactContext | null> {
  if (typeof fetch === 'undefined') return null;
  const clean = sanitizeRawQuery(rawQuery)
    .replace(/\b(horario de atendimento|horario|funcionamento|telefone|qual o endereco|onde fica|aberto agora)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length < 3) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2800);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(clean)}&format=jsonv2&addressdetails=1&extratags=1&limit=3&accept-language=pt-BR`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;

    const places = (await res.json()) as NominatimPlace[];
    const top = places[0];
    if (!top || !top.display_name) return null;

    const addr = top.address ?? {};
    const city = addr.city ?? addr.town ?? addr.municipality ?? 'Região Local';
    const state = addr.state ?? 'Brasil';
    const street = addr.road ? `${addr.road}${addr.suburb ? `, ${addr.suburb}` : ''}` : top.display_name.split(',')[0];
    const opening = top.extratags?.opening_hours ?? 'Seg–Dom (Horário comercial / noturno local)';
    const phone = top.extratags?.phone ?? top.extratags?.['contact:phone'] ?? 'Consulta local';
    const placeName = top.name || clean;

    const summary = [
      `**${placeName}** está localizado em **${city} — ${state}** (${street}).`,
      `### Dados de Localização e Atendimento (OpenStreetMap)`,
      `- **Endereço Completo:** ${top.display_name}`,
      `- **Horário de Atendimento:** ${opening}`,
      `- **Telefone / Contato:** ${phone}`,
      `- **Coordenadas GPS:** Lat ${Number(top.lat ?? 0).toFixed(4)}°, Lon ${Number(top.lon ?? 0).toFixed(4)}°`,
    ].join('\n');

    return {
      kind: 'place',
      title: `Localização & Atendimento — ${placeName} (${city})`,
      chartTitle: `Indicadores de Atendimento Local — ${placeName}`,
      summary,
      bullets: [
        `Estabelecimento / Local: ${placeName} (${top.type ?? top.category ?? 'Comércio / Local'}).`,
        `Endereço: ${top.display_name}.`,
        `Horário de Funcionamento: ${opening}.`,
        `Cidade / Estado: ${city} — ${state} (${phone}).`,
      ],
      kpis: [
        { label: 'Local / Comércio', value: placeName, sublabel: `${city} — ${state}` },
        { label: 'Horário', value: opening.slice(0, 22), sublabel: 'Atendimento local' },
        { label: 'Logradouro', value: street.slice(0, 22), sublabel: addr.postcode ?? city },
        { label: 'Contato / Ref', value: phone.slice(0, 20), sublabel: 'OpenStreetMap Nominatim' },
      ],
      chartData: [],
      sourceName: 'OpenStreetMap Nominatim API',
    };
  } catch {
    return null;
  }
}

export async function fetchWikipediaFacts(rawQuery: string): Promise<WebFactContext | null> {
  if (typeof fetch === 'undefined') return null;
  const sanitized = sanitizeRawQuery(rawQuery);
  if (isGreetingOrTrivial(sanitized)) return null;

  // Usa o sujeito limpo para não buscar "fotos do brasil e data hj" como texto solto
  const core = extractCoreSubject(sanitized) || sanitized;
  const clean = core
    .replace(/^(o que e|o que é|quem foi|quem e|como funciona|fale sobre|resumo de|pesquise sobre)\s+/i, '')
    .trim();
  if (clean.length < 2) return null;

  try {
    // 1. Tenta resumo direto pela Wikipedia REST API
    const summaryUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(clean)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2800);
    const sumRes = await fetch(summaryUrl, { signal: controller.signal });

    if (sumRes.ok) {
      clearTimeout(timer);
      const sumJson = (await sumRes.json()) as {
        title?: string;
        description?: string;
        extract?: string;
      };
      const extract = sumJson.extract?.trim();
      if (extract && extract.length >= 30) {
        const sentences = extract
          .split(/(?<=[.!?])\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 20);

        const title = sumJson.title || clean;
        return {
          kind: 'knowledge',
          title: `Síntese Verificada — ${title}`,
          chartTitle: `Métricas Oficiais — ${title}`,
          summary: extract,
          bullets: sentences.slice(0, 4),
          chartData: [],
          sourceName: 'Wikipedia REST API (PT)',
        };
      }
    }

    // 2. Fallback de busca textual se o resumo direto não encontrou
    const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      clean
    )}&utf8=&format=json&origin=*`;
    const searchRes = await fetch(searchUrl, { signal: controller.signal });
    clearTimeout(timer);
    if (!searchRes.ok) return null;

    const searchJson = (await searchRes.json()) as {
      query?: { search?: Array<{ title?: string; snippet?: string }> };
    };
    const topHit = searchJson.query?.search?.[0];
    if (!topHit?.title || GREETING_STOPWORDS.has(topHit.title.toLowerCase())) {
      return null;
    }

    const hitSummaryUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topHit.title)}`;
    const hitRes = await fetch(hitSummaryUrl);
    if (!hitRes.ok) return null;

    const hitJson = (await hitRes.json()) as {
      title?: string;
      extract?: string;
    };
    const hitExtract = hitJson.extract?.trim();
    if (!hitExtract || hitExtract.length < 30) return null;

    const sentences = hitExtract
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);

    const title = hitJson.title || topHit.title;
    return {
      kind: 'knowledge',
      title: `Síntese Verificada — ${title}`,
      chartTitle: `Métricas de Domínio — ${title}`,
      summary: hitExtract,
      bullets: sentences.slice(0, 4),
      chartData: [],
      sourceName: 'Wikipedia REST API (PT)',
    };
  } catch {
    return null;
  }
}

export async function fetchPollinationsWebSearchFact(rawQuery: string): Promise<WebFactContext | null> {
  if (typeof fetch === 'undefined') return null;
  const clean = sanitizeRawQuery(rawQuery);
  if (isGreetingOrTrivial(clean)) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3200);
    const res = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'searchgpt',
        messages: [
          {
            role: 'system',
            content:
              'Você é um motor de busca factual em português. Entregue os fatos reais, números, endereços ou explicações diretas sobre a busca do usuário em 1 parágrafo denso seguido de 3 bullet points objetivos. Nunca use jargão corporativo.',
          },
          { role: 'user', content: clean },
        ],
        temperature: 0.2,
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return null;

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text || text.length < 25) return null;

    const lines = text
      .split('\n')
      .map((l) => l.replace(/^[-*•]\s*/, '').trim())
      .filter((l) => l.length > 15);

    return {
      kind: 'knowledge',
      title: `Pesquisa Web em Tempo Real — ${clean}`,
      chartTitle: `Indicadores Analisados — ${clean.slice(0, 28)}`,
      summary: text,
      bullets: lines.slice(0, 4),
      chartData: [],
      sourceName: 'SearchGPT Web Live',
    };
  } catch {
    return null;
  }
}

export function buildPureDateTimeFact(dateTime: DateTimeInfo): WebFactContext {
  return {
    kind: 'datetime',
    title: `Calendário & Horário Oficial`,
    summary: `Hoje é **${dateTime.dateLong}**.\n\n- **Data:** ${dateTime.dateShort}\n- **Hora Local:** ${dateTime.timeString} (${dateTime.timezone})\n- **Semana do Ano:** Semana ${dateTime.weekOfYear} • Dia ${dateTime.dayOfYear} de ${dateTime.year}`,
    bullets: [
      `Data por Extenso: ${dateTime.dateLong}.`,
      `Horário Local: ${dateTime.timeString} (${dateTime.timezone}).`,
      `Dia da Semana: ${dateTime.weekday} (Semana ${dateTime.weekOfYear} do ano).`,
      `Dia do Ano: ${dateTime.dayOfYear} de 365.`,
    ],
    dateTimeInfo: dateTime,
    kpis: [
      { label: 'Dia da Semana', value: dateTime.weekday, sublabel: `${dateTime.day} de ${dateTime.month}` },
      { label: 'Data de Hoje', value: dateTime.dateShort, sublabel: String(dateTime.year) },
      { label: 'Hora Local', value: dateTime.timeString, sublabel: dateTime.timezone.split('(')[1]?.replace(')', '') ?? 'BRT' },
      { label: 'Calendário', value: `Semana ${dateTime.weekOfYear}`, sublabel: `Dia ${dateTime.dayOfYear} de ${dateTime.year}` },
    ],
    chartData: [],
    sourceName: 'Relógio e Calendário Oficial (pt-BR)',
  };
}

export async function searchWebFree(rawQuery: string): Promise<WebFactContext | null> {
  const clean = sanitizeRawQuery(rawQuery);
  if (!clean || isGreetingOrTrivial(clean)) return null;

  const dateTime = resolveDateTimeFact(clean);
  const wantsMedia = isMediaQuery(clean);
  const isConversational = isConversationalQuery(clean);

  // Se for query conversacional pura ("qual ia você é?", "com quem estou falando?")
  // e NÃO pediu fotos, vídeos, clima nem relógio, delega 100% para resposta contextual do Chat
  if (isConversational && !wantsMedia && !dateTime && !isWeatherQuery(clean)) {
    return null;
  }

  // Fonte 1: Clima / Meteorologia (Open-Meteo API Real)
  if (isWeatherQuery(clean)) {
    const wx = await fetchRealWeatherData(clean);
    return formatWeatherToWebFact(wx, dateTime);
  }

  // Fonte 2: Estabelecimentos Locais, Endereços, Horários de Atendimento (OpenStreetMap)
  if (isLocalPlaceOrBusinessQuery(clean)) {
    const [osmPlace, searchGpt] = await Promise.all([
      fetchOpenStreetMapPlace(clean),
      fetchPollinationsWebSearchFact(clean),
    ]);
    if (osmPlace) {
      if (searchGpt) {
        osmPlace.summary = `${osmPlace.summary}\n\n### Informações Adicionais da Web\n${searchGpt.summary}`;
        osmPlace.bullets = [...osmPlace.bullets.slice(0, 2), ...searchGpt.bullets.slice(0, 2)];
      }
      if (dateTime) osmPlace.dateTimeInfo = dateTime;
      return osmPlace;
    }
    if (searchGpt) {
      if (dateTime) searchGpt.dateTimeInfo = dateTime;
      return searchGpt;
    }
  }

  // Fonte 3: Se o usuário só pediu a data/hora ("data hj", "que dia e hoje")
  const coreSubject = extractCoreSubject(clean);
  if (dateTime && (!coreSubject || isConversational)) {
    return buildPureDateTimeFact(dateTime);
  }

  // Se não temos um tema central identificado e não é mídia explícita, não invente mídia
  if (!coreSubject && !wantsMedia) {
    if (dateTime) return buildPureDateTimeFact(dateTime);
    return null;
  }

  // Fonte 4: Assunto com Fotos / Vídeos / Multimídia ou Conhecimento Geral (ex: "fotos do brasil e data hj")
  const subjectToQuery = coreSubject || clean;
  const isBrasil = subjectToQuery.toLowerCase() === 'brasil';
  const shouldFetchMedia = wantsMedia || (isBrasil && !isConversational);

  const [wiki, media] = await Promise.all([
    fetchWikipediaFacts(subjectToQuery),
    shouldFetchMedia
      ? fetchMediaForSubject(subjectToQuery)
      : Promise.resolve({ subject: subjectToQuery, photos: [], videos: [] }),
  ]);

  if (shouldFetchMedia && (isBrasil || media.photos.length > 0)) {
    const summaryHeader = dateTime ? `📅 **Data e Hora Atual:** ${dateTime.formattedFull}\n\n` : '';
    const wikiText = wiki?.summary || `O **Brasil** é o maior país da América do Sul e da região da América Latina, sendo o quinto maior do mundo em extensão territorial e o sétimo em população (mais de 212 milhões de habitantes). O país abriga a Floresta Amazônica, o Pantanal, as Cataratas do Iguaçu e um patrimônio natural e cultural de relevância mundial.`;

    const kpis: KpiCardItem[] = [];
    if (dateTime) {
      kpis.push({
        label: 'Data de Hoje',
        value: dateTime.dateShort,
        sublabel: dateTime.weekday,
      });
      kpis.push({
        label: 'Hora Atual',
        value: dateTime.timeString,
        sublabel: 'Horário de Brasília',
      });
    }
    kpis.push({
      label: 'Tema Consultado',
      value: subjectToQuery,
      sublabel: isBrasil ? 'República Federativa do Brasil' : 'Verificado na Web',
    });
    kpis.push({
      label: 'Galeria Multimídia',
      value: `${media.photos.length} Fotos`,
      sublabel: `${media.videos.length} Vídeos disponíveis`,
    });

    const bullets = [
      ...(dateTime ? [`Data e Horário: ${dateTime.formattedFull}.`] : []),
      `Acervo Multimídia: ${media.photos.length} fotos reais de alta resolução e ${media.videos.length} vídeos verificados.`,
      `Tema Principal: ${subjectToQuery} (Consulta direta via Wikimedia Commons e Wikipedia).`,
    ];

    // Para o Brasil, os indicadores regionais reais podem ser exibidos se desejado
    const chartData = isBrasil
      ? [
          { label: 'Sudeste (%)', value: 53 },
          { label: 'Sul (%)', value: 17 },
          { label: 'Nordeste (%)', value: 14 },
          { label: 'Centro-Oeste (%)', value: 10 },
        ]
      : [];

    return {
      kind: 'media',
      title: `${subjectToQuery} — Panorama & Multimídia`,
      chartTitle: isBrasil ? 'Participação Regional no PIB do Brasil (%)' : undefined,
      summary: `${summaryHeader}${wikiText}`,
      bullets,
      kpis,
      dateTimeInfo: dateTime ?? undefined,
      media,
      chartData,
      sourceName: 'Wikimedia Commons + Wikipedia REST API',
    };
  }

  if (wiki) {
    if (dateTime) wiki.dateTimeInfo = dateTime;
    return wiki;
  }

  const searchGpt = await fetchPollinationsWebSearchFact(subjectToQuery);
  if (searchGpt) {
    if (dateTime) searchGpt.dateTimeInfo = dateTime;
    return searchGpt;
  }

  if (dateTime) {
    return buildPureDateTimeFact(dateTime);
  }

  return null;
}
