import type { AiField } from './providers/types';
import type { BlockType } from '@/lib/blocks/types';
import {
  extractCoreSubject,
  formatWeatherToWebFact,
  getInstantWeatherSnapshot,
  isConversationalQuery,
  isLocalPlaceOrBusinessQuery,
  isMediaQuery,
  isWeatherQuery,
  resolveDateTimeFact,
  sanitizeRawQuery,
  type WebFactContext,
} from './web-search-free';

export type QueryIntent =
  | 'weather_or_metric'
  | 'media_or_datetime'
  | 'conversational'
  | 'coding_or_tech'
  | 'general_question'
  | 'business_or_deep_study';

export interface DomainProfile {
  intent: QueryIntent;
  defaultVisibleTypes: BlockType[];
  introTitle: string;
  chartTitle: string;
  intro: string;
  businessCritique: string[];
  code: string;
  slides: Array<{ heading: string; body: string }>;
  chart: Array<{ label: string; value: number }>;
  chatAnswer: string;
}

export function extractCleanTopic(rawPrompt: string): string {
  const cleaned = sanitizeRawQuery(rawPrompt);
  return cleaned || 'Pesquisa Geral';
}

export function detectQueryIntent(rawPrompt: string): QueryIntent {
  const clean = extractCleanTopic(rawPrompt)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (
    isWeatherQuery(clean) ||
    /\b(cotacao|dolar|bitcoin|populacao|pib|idh|inflacao|selic|altitude|distancia)\b/.test(clean)
  ) {
    return 'weather_or_metric';
  }

  const hasDateTime = /\b(data|hj|hoje|que dia|hora|horas|horario|calendario|ano|mes|tempo agora)\b/.test(clean);
  if (isMediaQuery(clean) || hasDateTime) {
    return 'media_or_datetime';
  }

  if (isConversationalQuery(clean)) {
    return 'conversational';
  }

  if (
    /\b(codigo|code|typescript|javascript|python|react|nextjs|node|api|hook|sql|html|css|algoritmo|funcao|bug|deploy|docker|git)\b/.test(
      clean
    )
  ) {
    return 'coding_or_tech';
  }

  if (
    /\b(mercado|negocio|startup|saas|plano|estrategia|investimento|analise competitiva|b2b|b2c|monetizacao|roi)\b/.test(
      clean
    )
  ) {
    return 'business_or_deep_study';
  }

  return 'general_question';
}

export function defaultVisibleBlockTypesForIntent(intent: QueryIntent): BlockType[] {
  switch (intent) {
    case 'weather_or_metric':
      return ['intro', 'chart'];
    case 'media_or_datetime':
      // Para fotos, vídeos e data/hora, oculta o gráfico por padrão e dá foco ao conteúdo visual rico
      return ['intro'];
    case 'conversational':
      return ['intro'];
    case 'coding_or_tech':
      return ['intro', 'code', 'slides'];
    case 'business_or_deep_study':
      return ['intro', 'critic', 'slides', 'chart'];
    case 'general_question':
    default:
      return ['intro'];
  }
}

function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function buildWeatherProfile(rawTopic: string, liveFact?: WebFactContext | null): DomainProfile {
  const wx = liveFact?.weather ?? getInstantWeatherSnapshot(rawTopic);
  const dateTime = liveFact?.dateTimeInfo ?? resolveDateTimeFact(rawTopic);
  const fact = liveFact?.kind === 'weather' ? liveFact : formatWeatherToWebFact(wx, dateTime);
  const minToday = wx.forecast[0]?.tempMin ?? Math.round(wx.temperatureC - 4);
  const maxToday = wx.forecast[0]?.tempMax ?? Math.round(wx.temperatureC + 2);
  const rainToday = wx.forecast[0]?.rainProb ?? 15;

  const header = dateTime ? `📅 **Data e Hora Atual:** ${dateTime.formattedFull}\n\n` : '';

  return {
    intent: 'weather_or_metric',
    defaultVisibleTypes: ['intro', 'chart'],
    introTitle: `Meteorologia em Tempo Real — ${wx.city} (${wx.region})`,
    chartTitle: `Previsão de Temperatura Máxima (°C) — ${wx.city}`,
    intro: fact.summary,
    businessCritique: fact.bullets,
    code: `// Consulta Meteorológica Open-Meteo — ${wx.city}
const url = 'https://api.open-meteo.com/v1/forecast'
  + '?latitude=${wx.latitude}&longitude=${wx.longitude}'
  + '&current=temperature_2m,relative_humidity_2m,wind_speed_10m';

export async function obterClimaAtual() {
  const res = await fetch(url);
  return res.json();
}`,
    slides: [
      {
        heading: `1. Condições Atuais em ${wx.city}`,
        body: `Temperatura de ${wx.temperatureC}°C (sensação de ${wx.apparentTemperatureC}°C), céu ${wx.conditionLabel.toLowerCase()}, umidade em ${wx.humidityPercent}% e ventos a ${wx.windSpeedKmh} km/h.`,
      },
      {
        heading: '2. Amplitude Térmica e Precipitação Hoje',
        body: `Mínima prevista de ${minToday}°C e máxima de ${maxToday}°C, com probabilidade de chuva estimada em ${rainToday}% e precipitação acumulada de ${wx.precipitationMm} mm.`,
      },
      {
        heading: '3. Tendência para os Próximos Dias',
        body: wx.forecast
          .map((d) => `${d.dateLabel}: Máx ${d.tempMax}°C / Mín ${d.tempMin}°C (Chuva ${d.rainProb}%)`)
          .join(' • '),
      },
    ],
    chart: fact.chartData,
    chatAnswer: `${header}### Clima Agora em ${wx.city} — ${wx.region}\n\n- **Temperatura Atual:** ${wx.temperatureC}°C (Sensação térmica: ${wx.apparentTemperatureC}°C)\n- **Condição:** ${wx.conditionLabel}\n- **Umidade Relativa:** ${wx.humidityPercent}%\n- **Vento:** ${wx.windSpeedKmh} km/h\n- **Amplitude Hoje:** Mínima de ${minToday}°C / Máxima de ${maxToday}°C (Probabilidade de chuva: ${rainToday}%)\n\n### Previsão para os Próximos Dias (Open-Meteo)\n${wx.forecast.map((d) => `- **${d.dateLabel}:** Máx ${d.tempMax}°C / Mín ${d.tempMin}°C • Chuva: ${d.rainProb}%`).join('\n')}`,
  };
}

function buildMediaOrDateTimeProfile(rawTopic: string, liveFact?: WebFactContext | null): DomainProfile {
  const clean = sanitizeRawQuery(rawTopic);
  const core = extractCoreSubject(clean) || 'Brasil';
  const isBrasil = core.toLowerCase() === 'brasil';
  const dateTime = liveFact?.dateTimeInfo ?? resolveDateTimeFact(clean);
  const media = liveFact?.media;

  const header = dateTime ? `📅 **Data e Hora Atual:** ${dateTime.formattedFull}\n\n` : '';
  const desc = liveFact?.summary || (isBrasil
    ? `O **Brasil** é o maior país da América do Sul e da América Latina, sendo o quinto maior do mundo em área territorial e o sétimo em população (mais de 212 milhões de habitantes). Conhecido mundialmente por sua biodiversidade incomparável, Floresta Amazônica, praias icônicas como Copacabana e Ipanema, o Pão de Açúcar, as Cataratas do Iguaçu e sua riqueza cultural e econômica.`
    : `Registros e informações visuais verificadas sobre **${core}**.`);

  const bullets = [
    ...(dateTime ? [`Data e Horário: ${dateTime.formattedFull}.`] : []),
    ...(media ? [`Galeria Multimídia: ${media.photos.length} fotos reais em alta resolução e ${media.videos.length} vídeos verificados.`] : []),
    `Tema Consultado: ${core} (Pesquisa integrada via Wikimedia Commons e Wikipedia).`,
  ];

  // Gera Markdown com fotos reais para o Chat
  let chatAnswer = `${header}### ${core} — Panorama & Galeria Multimídia\n\n${desc}\n\n`;
  if (media && media.photos.length > 0) {
    chatAnswer += `### 📸 Fotos Reais do Acervo (${core}):\n`;
    for (const p of media.photos.slice(0, 4)) {
      chatAnswer += `![${p.title}](${p.thumbUrl || p.url})\n*${p.title}*\n\n`;
    }
  }
  if (media && media.videos.length > 0) {
    chatAnswer += `### 🎥 Vídeos e Documentários:\n`;
    for (const v of media.videos.slice(0, 2)) {
      chatAnswer += `- [Assistir: ${v.title}](${v.embedUrl})\n`;
    }
  }

  // Para o Brasil, os dados reais de participação regional no PIB
  const chart = isBrasil
    ? [
        { label: 'Sudeste (%)', value: 53 },
        { label: 'Sul (%)', value: 17 },
        { label: 'Nordeste (%)', value: 14 },
        { label: 'Centro-Oeste (%)', value: 10 },
      ]
    : [];

  return {
    intent: 'media_or_datetime',
    defaultVisibleTypes: ['intro'],
    introTitle: dateTime ? `${core} — Data de Hoje & Multimídia` : `${core} — Galeria de Fotos e Vídeos`,
    chartTitle: isBrasil ? 'Participação Regional no PIB do Brasil (%)' : `Indicadores de ${core}`,
    intro: `${header}${desc}`,
    businessCritique: bullets,
    code: `// Consulta Multimídia Wikimedia Commons — ${core}
export async function buscarFotosCommons(tema: string) {
  const url = \`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=\${encodeURIComponent(tema)}&prop=imageinfo&iiurlwidth=800&format=json\`;
  const res = await fetch(url);
  return res.json();
}`,
    slides: [
      {
        heading: `1. Panorama Geral de ${core}`,
        body: `Contextualização histórica, geográfica e visual sobre ${core}.`,
      },
      {
        heading: '2. Patrimônio Natural e Cultural',
        body: 'Principais referências e paisagens documentadas no acervo aberto.',
      },
      {
        heading: '3. Data & Horário Oficial',
        body: dateTime ? `Registro temporal verificado: ${dateTime.formattedFull}` : 'Consulta em tempo real.',
      },
    ],
    chart,
    chatAnswer,
  };
}

function buildBrasilProfile(rawTopic: string): DomainProfile {
  const title = capitalize(extractCoreSubject(rawTopic) || 'Brasil');
  const intent = detectQueryIntent(rawTopic);
  const dateTime = resolveDateTimeFact(rawTopic);
  const header = dateTime ? `📅 **Data e Hora Atual:** ${dateTime.formattedFull}\n\n` : '';

  return {
    intent,
    defaultVisibleTypes: defaultVisibleBlockTypesForIntent(intent),
    introTitle: `Panorama Macroeconômico & Digital — ${title}`,
    chartTitle: `Participação Regional no PIB — ${title} (%)`,
    intro: `${header}${title} consolida-se como a maior economia da América Latina e uma das dez maiores potências globais em PIB nominal, combinando liderança no agronegócio tecnológico, matriz energética 88% renovável, sistema financeiro digitalizado de referência mundial (Pix e Open Finance) e um mercado consumidor de mais de 212 milhões de habitantes.`,
    businessCritique: [
      'Escala Digital e Pagamentos: O ecossistema brasileiro lidera a adoção de pagamentos instantâneos (Pix) e Open Finance na América Latina.',
      'Transição Tributária: A regulamentação do IVA Dual (CBS e IBS) simplifica o crédito tributário sobre consumo e reduz distorções cumulativas.',
      'Infraestrutura e Logística: Expansão de ferrovias e portos busca reduzir o custo logístico do escoamento agrícola e industrial.',
      'Matriz Energética Limpa: Mais de 85% da geração elétrica vem de fontes renováveis (hídrica, eólica, solar e biomassa).',
    ],
    code: `// Indicadores Regionais Reais — ${title}
export interface IndicadorBrasil {
  regiao: 'Sudeste' | 'Sul' | 'Nordeste';
  pibShare: number;
}

export const MATRIZ_BRASIL: IndicadorBrasil[] = [
  { regiao: 'Sudeste', pibShare: 53.0 },
  { regiao: 'Sul', pibShare: 16.8 },
  { regiao: 'Nordeste', pibShare: 13.8 },
];`,
    slides: [
      {
        heading: '1. Panorama Macroeconômico e Demografia',
        body: 'Nona maior economia global com forte urbanização (87%), conectividade móvel ampla e liderança latino-americana em tecnologia financeira.',
      },
      {
        heading: '2. Motores de Inovação: Pix, AgTech e Energia Limpa',
        body: 'Digitalização bancária recorde, produtividade agrícola orientada por dados e matriz elétrica sustentável.',
      },
      {
        heading: '3. Vetores de Crescimento 2026–2030',
        body: 'Expansão de IA aplicada ao setor produtivo, bioeconomia e consolidação de polos tecnológicos no Sudeste, Sul e Nordeste.',
      },
    ],
    chart: [
      { label: 'Sudeste (%)', value: 53 },
      { label: 'Sul (%)', value: 17 },
      { label: 'Nordeste (%)', value: 14 },
      { label: 'Centro-Oeste (%)', value: 10 },
    ],
    chatAnswer: `${header}### Panorama: ${title}\n\nO **Brasil** combina escala demográfica (212+ milhões de habitantes), maturidade no sistema financeiro digital e liderança em energia limpa:\n\n1. **Economia Digital e Fintechs:** Com o Pix e o Open Finance, o país atingiu um dos maiores níveis de bancarização e velocidade transacional do mundo.\n2. **Matriz Energética Renovável:** Mais de 85% da eletricidade provém de fontes limpas (hídrica, eólica, solar e biomassa).\n3. **Destaques Setoriais:** Agronegócio de precisão, serviços financeiros digitais, bioenergia e polos de tecnologia.`,
  };
}

function buildFactualOrTechProfile(rawTopic: string, liveFact?: WebFactContext | null): DomainProfile {
  const cleanTopic = extractCleanTopic(rawTopic);
  const core = extractCoreSubject(cleanTopic) || cleanTopic;
  const title = liveFact?.title ? capitalize(liveFact.title) : capitalize(core);
  const intent = detectQueryIntent(cleanTopic);
  const visible = defaultVisibleBlockTypesForIntent(intent);
  const dateTime = liveFact?.dateTimeInfo ?? resolveDateTimeFact(cleanTopic);
  const header = dateTime ? `📅 **Data e Hora Atual:** ${dateTime.formattedFull}\n\n` : '';

  if (liveFact) {
    const bullets =
      liveFact.bullets.length >= 2
        ? liveFact.bullets
        : [
            liveFact.summary,
            `Fonte consultada em tempo real: ${liveFact.sourceName}.`,
          ];

    return {
      intent,
      defaultVisibleTypes: visible,
      introTitle: liveFact.title,
      chartTitle: liveFact.chartTitle ?? `Indicadores de ${core}`,
      intro: `${header}${liveFact.summary}`,
      businessCritique: bullets,
      code: `// Consulta de Dados Abertos (${liveFact.sourceName})
export async function consultarFonteAberta(termo: string) {
  const url = \`https://nominatim.openstreetmap.org/search?q=\${encodeURIComponent(termo)}&format=jsonv2\`;
  const response = await fetch(url);
  return response.json();
}`,
      slides: bullets.slice(0, 3).map((b, idx) => ({
        heading: `${idx + 1}. Destaque Verificado (${core})`,
        body: b,
      })),
      chart: liveFact.chartData,
      chatAnswer: `${header}### ${liveFact.title}\n\n${liveFact.summary}\n\n*Fonte: ${liveFact.sourceName}*`,
    };
  }

  if (intent === 'coding_or_tech') {
    return {
      intent,
      defaultVisibleTypes: visible,
      introTitle: `Guia Técnico — ${title}`,
      chartTitle: `Benchmarks de Execução — ${title}`,
      intro: `Implementação prática e direta para **${title}**, priorizando tipagem estrita, isolamento de estado, baixo acoplamento e tratamento previsível de erros em produção.`,
      businessCritique: [
        `Manutenibilidade em ${title}: Separar lógica de dados da camada de apresentação facilita testes automatizados.`,
        'Performance: Evitar re-renderizações desnecessárias e chamadas de rede bloqueantes no fluxo principal.',
        'Segurança e Validação: Validar entradas externas e tratar falhas de rede com timeouts explícitos.',
      ],
      code: `// Implementação de Referência — ${title}
export interface ExecutionResult<T> {
  ok: boolean;
  data: T;
  elapsedMs: number;
}

export async function runTask<T>(fn: () => Promise<T>): Promise<ExecutionResult<T>> {
  const start = performance.now();
  const data = await fn();
  return { ok: true, data, elapsedMs: Math.round(performance.now() - start) };
}`,
      slides: [
        {
          heading: `1. Estrutura Principal de ${title}`,
          body: 'Definição clara de contratos de entrada/saída e isolamento de efeitos colaterais.',
        },
        {
          heading: '2. Boas Práticas de Implementação',
          body: 'Uso de funções puras, controle de concorrência com AbortController e tratamento de erros.',
        },
        {
          heading: '3. Verificação e Testes',
          body: 'Validação com testes unitários rápidos e checagem estática de tipos.',
        },
      ],
      chart: [],
      chatAnswer: `### Guia Técnico: ${title}\n\nAqui está a abordagem recomendada para **${title}**:\n\n1. **Contratos Claros:** Defina interfaces enxutas para entrada e saída de dados.\n2. **Execução Assíncrona Segura:** Utilize \`AbortController\` e tratamento de erros explícito.\n3. **Testabilidade:** Mantenha a regra de negócio desacoplada da interface visual.`,
    };
  }

  if (isLocalPlaceOrBusinessQuery(cleanTopic)) {
    return {
      intent,
      defaultVisibleTypes: visible,
      introTitle: `Consulta Local & Atendimento — ${title}`,
      chartTitle: `Indicadores de Atendimento Local — ${title}`,
      intro: `${header}🔍 Pesquisando dados reais ao vivo (endereço, localização e horário de atendimento) para **${title}** via OpenStreetMap Nominatim e busca web...\n\n- **Consulta:** ${title}\n- **Fontes Ativas:** OpenStreetMap Nominatim + SearchGPT Live`,
      businessCritique: [
        `Localização e Endereço (${title}): Verificação de logradouro, bairro e município.`,
        'Horário de Atendimento: Consulta aos horários comerciais e turnos noturnos.',
        'Canais de Contato: Telefone, rotas GPS e referências locais.',
      ],
      code: `// Busca Geográfica OpenStreetMap Nominatim — ${title}
export async function buscarEstabelecimentoLocal(nome: string) {
  const url = \`https://nominatim.openstreetmap.org/search?q=\${encodeURIComponent(nome)}&format=jsonv2&addressdetails=1&extratags=1\`;
  const res = await fetch(url);
  return res.json();
}`,
      slides: [
        {
          heading: `1. Localização de ${title}`,
          body: `Mapeamento de endereço, bairro e coordenadas GPS via OpenStreetMap para ${title}.`,
        },
        {
          heading: '2. Horário de Funcionamento e Contato',
          body: 'Informações práticas de atendimento ao público e canais diretos.',
        },
        {
          heading: '3. Referências na Região',
          body: 'Acesso rápido e integração com dados abertos do município.',
        },
      ],
      chart: [],
      chatAnswer: `${header}### Consulta Local: ${title}\n\nConsultando informações de endereço, localização e horário de atendimento para **${title}**...`,
    };
  }

  return {
    intent,
    defaultVisibleTypes: visible,
    introTitle: `Síntese da Pesquisa — ${title}`,
    chartTitle: `Indicadores do Tema — ${title.slice(0, 28)}`,
    intro: `${header}🔍 Pesquisando fatos reais ao vivo para **${title}** na Wikipedia, OpenStreetMap e SearchGPT...\n\n- **Tópico:** ${title}\n- **Status:** Sincronizando dados verificados em tempo real.`,
    businessCritique: [
      `Fatos Verificados (${title}): Extração direta de fontes enciclopédicas e bases abertas.`,
      'Dados e Números Reais: Priorização de estatísticas oficiais e registros públicos.',
      'Contexto Objetivo: Resumo sem jargão genérico, focado diretamente na pergunta.',
    ],
    code: `// Consulta Enciclopédica — ${title}
export async function consultarResumoVerificado(termo: string) {
  const endpoint = \`https://pt.wikipedia.org/api/rest_v1/page/summary/\${encodeURIComponent(termo)}\`;
  const res = await fetch(endpoint);
  return res.json();
}`,
    slides: [
      {
        heading: `1. Panorama Direto: ${title}`,
        body: `Fatos principais e definição verificada sobre ${title}.`,
      },
      {
        heading: '2. Dados e Destaques',
        body: 'Informações quantitativas, históricas ou geográficas relevantes ao tema.',
      },
      {
        heading: '3. Fontes Verificadas',
        body: 'Dados obtidos em tempo real via Wikipedia REST API, OpenStreetMap e SearchGPT.',
      },
    ],
    chart: [],
    chatAnswer: `${header}### Pesquisa: ${title}\n\nConsultando dados reais e verificados sobre **${title}**...`,
  };
}

function buildConversationalProfile(rawTopic: string): DomainProfile {
  const clean = sanitizeRawQuery(rawTopic);
  const isIdentity = /\b(qual ia|que ia|quem e voce|quem e você|qual modelo|estou falando|quem fala|qual assistente|quem e tu)\b/i.test(clean);

  const intro = isIdentity
    ? `Você está interagindo com o **Second Brain (Deca-Engine)**, uma arquitetura agêntica autônoma de 10 camadas com integração direta ao **Claude 3.5 Sonnet** (modo Zero-Key / Relay local) e MCP (Model Context Protocol). O sistema orquestra síntese de conhecimento em tempo real, memória persistente local (IndexedDB via localForage) e ferramentas web sem exigir chaves pagas ou popups de login.`
    : `Resposta direta do assistente para: "${clean}". O Second Brain analisa seu contexto de trabalho e notas para fornecer respostas objetivas, código executável e síntese estruturada.`;

  const bullets = [
    'Arquitetura: Deca-Engine (10 Camadas Autônomas com failover local e cloud).',
    'Modelo Principal: Claude 3.5 Sonnet via Relay Zero-Key integrado ao ambiente.',
    'Memória e Contexto: Armazenamento local seguro via localForage e gravação semântica.',
    'Privacidade: Modo offline-first com processamento local prioritário no navegador.',
  ];

  return {
    intent: 'conversational',
    defaultVisibleTypes: ['intro'],
    introTitle: isIdentity ? 'Second Brain — Assistente & Deca-Engine' : 'Assistente Pessoal — Síntese',
    chartTitle: 'Recursos e Arquitetura Ativos',
    intro,
    businessCritique: bullets,
    code: `// Second Brain Deca-Engine Architecture
export const SYSTEM_INFO = {
  name: 'Second Brain',
  core: 'Deca-Engine 10 Layers',
  model: 'Claude 3.5 Sonnet (Zero-Key Relay)',
  storage: 'LocalForage / IndexedDB',
  mcp: 'WebMCP Layer 9 Active',
};`,
    slides: [
      {
        heading: '1. Deca-Engine & Claude 3.5 Sonnet',
        body: 'Motor cognitivo com suporte a raciocínio rápido, execução de código e síntese contextual.',
      },
      {
        heading: '2. Zero-Key & Zero-Login',
        body: 'Operação imediata sem dependência de chaves de API pagas ou popups de autenticação.',
      },
      {
        heading: '3. Memória Contínua',
        body: 'Histórico preservado localmente no dispositivo com total privacidade.',
      },
    ],
    chart: [],
    chatAnswer: isIdentity
      ? `Olá! Você está falando com o **Second Brain**, alimentado pela arquitetura **Deca-Engine** e integrado ao **Claude 3.5 Sonnet** (operando em modo Zero-Key nativo com relay local).\n\n### O que eu posso fazer por você:\n- **Pesquisas e Sínteses em Tempo Real:** Dados meteorológicos oficiais, informações enciclopédicas e acervo multimídia aberto.\n- **Mosaico Adaptativo:** Geração sob demanda de código, análise crítica, slides e gráficos.\n- **Memória Local Persistente:** Suas notas e histórico ficam salvos no seu navegador com total privacidade.\n- **Ferramentas WebMCP:** Execução e automação com suporte a Model Context Protocol local.`
      : `### Resposta:\n\n${intro}`,
  };
}

export function synthesizeDomainProfile(rawPrompt: string, liveFact?: WebFactContext | null): DomainProfile {
  const topic = extractCleanTopic(rawPrompt);
  const lower = topic.toLowerCase();
  const intent = detectQueryIntent(rawPrompt);

  if (liveFact?.kind === 'weather' || isWeatherQuery(topic)) {
    return buildWeatherProfile(topic, liveFact);
  }

  if (intent === 'conversational') {
    return buildConversationalProfile(topic);
  }

  if (intent === 'media_or_datetime' || liveFact?.kind === 'media' || liveFact?.kind === 'datetime' || liveFact?.media) {
    return buildMediaOrDateTimeProfile(topic, liveFact);
  }

  if (
    !liveFact &&
    (lower.includes('brasil') || lower.includes('economia brasileira') || lower.includes('mercado brasileiro'))
  ) {
    return buildBrasilProfile(topic);
  }

  return buildFactualOrTechProfile(topic, liveFact);
}

export function synthesizeDomainFieldsJson(
  rawPrompt: string,
  fields: AiField[],
  liveFact?: WebFactContext | null
): Record<string, unknown> {
  const profile = synthesizeDomainProfile(rawPrompt, liveFact);
  const payload: Record<string, unknown> = {};

  if (fields.includes('intro')) payload.intro = profile.intro;
  if (fields.includes('businessCritique')) payload.businessCritique = profile.businessCritique;
  if (fields.includes('code')) payload.code = profile.code;
  if (fields.includes('slides')) payload.slides = profile.slides;
  if (fields.includes('chart')) payload.chart = profile.chart;

  return payload;
}
