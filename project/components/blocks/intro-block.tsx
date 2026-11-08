'use client';

import type { ReactNode } from 'react';
import { Thermometer, Droplets, Wind, Sun, MapPin, Calendar } from 'lucide-react';
import { useBlocksStore } from '@/store/blocks-store';
import type { KpiCardItem } from '@/lib/ai/web-search-free';
import { MediaBlockView } from './media-block';

function renderInlineBold(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

function extractFallbackWeatherKpis(content: string): KpiCardItem[] | null {
  const plain = content.replace(/\*\*/g, '');
  const wxMatch =
    /temperatura atual é de ([\d.]+°C) com sensação térmica de ([\d.]+°C) e condição de ([^.]+)\. A umidade relativa do ar está em (\d+%), com ventos a ([\d.]+ km\/h)/i.exec(
      plain
    );
  if (!wxMatch) return null;

  return [
    { label: 'Temperatura Agora', value: wxMatch[1], sublabel: `Sensação: ${wxMatch[2]}` },
    { label: 'Condição Atual', value: wxMatch[3], sublabel: 'Open-Meteo Ao Vivo' },
    { label: 'Umidade Relativa', value: wxMatch[4], sublabel: 'Ar costeiro / regional' },
    { label: 'Velocidade do Vento', value: wxMatch[5], sublabel: 'Medição a 10m' },
  ];
}

export function IntroBlockView({ content }: { content: string }) {
  const liveFact = useBlocksStore((s) => s.liveFact);
  const kpis = liveFact?.kpis ?? extractFallbackWeatherKpis(content);
  const lines = content.split('\n').filter((l) => l.trim().length > 0);

  const icons = [
    <Thermometer key="0" className="h-3.5 w-3.5 text-[#60A5FA]" />,
    <Sun key="1" className="h-3.5 w-3.5 text-[#34D399]" />,
    <Droplets key="2" className="h-3.5 w-3.5 text-[#38BDF8]" />,
    <Wind key="3" className="h-3.5 w-3.5 text-[#818CF8]" />,
  ];

  return (
    <div className="space-y-4 px-4 py-3">
      {/* Componente de Fotos Reais, Vídeos e Data/Hora ao Vivo */}
      {(liveFact?.dateTimeInfo || liveFact?.media) && (
        <MediaBlockView
          dateTimeInfo={liveFact?.dateTimeInfo}
          photos={liveFact?.media?.photos}
          videos={liveFact?.media?.videos}
          subject={liveFact?.media?.subject}
        />
      )}

      {/* Grid de KPIs / Destaques Informativos */}
      {kpis && kpis.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {kpis.slice(0, 4).map((kpi, idx) => (
            <div key={kpi.label} className="rounded-lg border border-[#1F1F1F] bg-black/70 px-3 py-2">
              <div className="flex items-center gap-1.5 text-[10px] text-[#A3A3A3]">
                {kpi.label.includes('Data') || kpi.label.includes('Dia') ? (
                  <Calendar className="h-3.5 w-3.5 text-[#60A5FA]" />
                ) : liveFact?.kind === 'place' ? (
                  <MapPin className="h-3.5 w-3.5 text-[#60A5FA]" />
                ) : (
                  icons[idx % icons.length]
                )}
                <span className="truncate">{kpi.label}</span>
              </div>
              <p className="mt-0.5 truncate font-mono text-sm font-bold text-white">{kpi.value}</p>
              <p className="truncate text-[10px] text-[#60A5FA]">{kpi.sublabel}</p>
            </div>
          ))}
        </div>
      )}

      {/* Texto Factual Formatado */}
      <div className="space-y-1.5 text-xs leading-relaxed text-[#D4D4D8]">
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={i} className="pt-2 text-xs font-semibold text-white">
                {trimmed.slice(4)}
              </h4>
            );
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            return (
              <div key={i} className="flex items-start gap-2 pl-1 text-xs text-[#D4D4D8]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" />
                <span>{renderInlineBold(trimmed.slice(2))}</span>
              </div>
            );
          }
          return <p key={i}>{renderInlineBold(trimmed)}</p>;
        })}
      </div>
    </div>
  );
}
