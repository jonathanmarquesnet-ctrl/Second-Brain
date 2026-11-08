import { useProvidersStore } from '@/store/providers-store';

export interface ProceduralAsset {
  id: string;
  name: string;
  kind: 'svg-sprite' | 'wav-sfx';
  dataUri: string;
  palette: string[];
}

export interface AssetManifest {
  noteTopic: string;
  generatedAt: string;
  palette: string[];
  assets: ProceduralAsset[];
}

export const STITCH_DEFAULT_PALETTE = ['#000000', '#0A0A0A', '#1F1F1F', '#2563EB', '#60A5FA', '#FFFFFF'];

export function generateProceduralSvgSprite(
  label: string,
  palette: string[] = STITCH_DEFAULT_PALETTE
): string {
  const accent = palette[3] ?? '#2563EB';
  const glow = palette[4] ?? '#60A5FA';
  const safeLabel = label.replace(/[<>&"']/g, '').slice(0, 18);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <rect width="120" height="120" rx="16" fill="#0A0A0A" stroke="#1F1F1F" stroke-width="2"/>
    <circle cx="60" cy="52" r="28" fill="none" stroke="${accent}" stroke-width="3" stroke-dasharray="6 4"/>
    <polygon points="60,30 78,64 42,64" fill="${accent}" opacity="0.85"/>
    <circle cx="60" cy="52" r="6" fill="${glow}"/>
    <text x="60" y="102" fill="#FFFFFF" font-family="sans-serif" font-size="10" text-anchor="middle">${safeLabel}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export function generateProceduralWavDataUri(freqHz = 520, durationMs = 140): string {
  const sampleRate = 8000;
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  const buffer = new ArrayBuffer(44 + numSamples);
  const view = new DataView(buffer);

  function writeStr(offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = 1 - i / numSamples;
    const sample = Math.sin(2 * Math.PI * freqHz * t) * envelope;
    view.setUint8(44 + i, Math.floor((sample + 1) * 127.5));
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = typeof btoa === 'function' ? btoa(binary) : '';
  return `data:audio/wav;base64,${base64}`;
}

export function playProceduralWebAudioPing(freqHz = 587.33): void {
  if (typeof window === 'undefined') return;
  const AudioCtx = window.AudioContext;
  if (!AudioCtx) return;
  try {
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqHz, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    // Silencioso se o navegador bloquear autoplay
  }
}

export function forgeAssetManifest(topic: string, palette: string[] = STITCH_DEFAULT_PALETTE): AssetManifest {
  const start = Date.now();
  if (typeof window !== 'undefined') {
    useProvidersStore.getState().setLayerStatus(7, 'processing');
  }

  const assets: ProceduralAsset[] = [
    {
      id: 'sprite-core',
      name: 'Core Entity Sprite',
      kind: 'svg-sprite',
      dataUri: generateProceduralSvgSprite(topic.slice(0, 14) || 'Core', palette),
      palette,
    },
    {
      id: 'sprite-hud',
      name: 'HUD Node Badge',
      kind: 'svg-sprite',
      dataUri: generateProceduralSvgSprite('HUD Node', palette),
      palette,
    },
    {
      id: 'sfx-action',
      name: 'Action Synth SFX',
      kind: 'wav-sfx',
      dataUri: generateProceduralWavDataUri(640, 120),
      palette,
    },
  ];

  if (typeof window !== 'undefined') {
    useProvidersStore.getState().setLayerStatus(7, 'synced', Date.now() - start);
  }

  return {
    noteTopic: topic,
    generatedAt: new Date().toISOString(),
    palette,
    assets,
  };
}
