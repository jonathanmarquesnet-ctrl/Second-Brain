'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
  Cell,
} from 'recharts';
import { TrendingUp, Award, BarChart3, Thermometer, Droplets, Wind } from 'lucide-react';
import { useBlocksStore } from '@/store/blocks-store';
import { getInstantWeatherSnapshot } from '@/lib/ai/web-search-free';

interface ChartDatum {
  label: string;
  value: number;
}

const BAR_GRADIENT_IDS = ['gradBlue', 'gradIndigo', 'gradCyan', 'gradEmerald'];

export function ChartBlockView({ data }: { data: ChartDatum[] }) {
  const intent = useBlocksStore((s) => s.intent);
  const question = useBlocksStore((s) => s.question);
  const liveFact = useBlocksStore((s) => s.liveFact);

  const isWeather = intent === 'weather_or_metric' || liveFact?.kind === 'weather' || data.some((d) => d.label.includes('°C'));
  const wx = isWeather ? (liveFact?.weather ?? getInstantWeatherSnapshot(question || 'Araranguá')) : null;

  if (!isWeather && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-[#A3A3A3]">
        <BarChart3 className="mb-2 h-6 w-6 text-[#2563EB]/60" />
        <p className="font-semibold text-white">Sem indicadores numéricos para este tema</p>
        <p className="mt-1 max-w-sm text-[11px] text-[#A3A3A3]">
          O gráfico quantitativo é preenchido automaticamente quando a busca envolve previsões climáticas, indicadores econômicos ou estatísticas oficiais reais.
        </p>
      </div>
    );
  }

  const safeData =
    isWeather && wx
      ? wx.forecast.slice(0, 4).map((f) => ({ label: f.dateLabel, value: f.tempMax }))
      : data;

  const values = safeData.map((d) => d.value);
  const maxVal = Math.max(...values, 1);
  const avgVal = Math.round(values.reduce((acc, v) => acc + v, 0) / safeData.length);
  const topItem = safeData.reduce((best, cur) => (cur.value >= best.value ? cur : best), safeData[0]);
  const unitSuffix = isWeather ? '°C' : ' pts';

  return (
    <div className="grid gap-3 p-3 md:grid-cols-[1.55fr_1.05fr] md:items-center">
      <div className="h-[195px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={safeData} margin={{ top: 22, right: 12, left: -16, bottom: 6 }}>
            <defs>
              <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60A5FA" stopOpacity={1} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0.85} />
              </linearGradient>
              <linearGradient id="gradIndigo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818CF8" stopOpacity={1} />
                <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.85} />
              </linearGradient>
              <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity={1} />
                <stop offset="100%" stopColor="#0284C7" stopOpacity={0.85} />
              </linearGradient>
              <linearGradient id="gradEmerald" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34D399" stopOpacity={1} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.85} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" vertical={false} />
            <XAxis
              dataKey="label"
              interval={0}
              tick={{ fontSize: 11, fill: '#A1A1AA' }}
              axisLine={{ stroke: '#1F1F1F' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#A1A1AA' }}
              axisLine={false}
              tickLine={false}
              domain={[0, Math.ceil(maxVal * 1.18)]}
            />
            <Tooltip
              cursor={{ fill: 'rgba(37, 99, 235, 0.08)' }}
              contentStyle={{
                backgroundColor: '#0A0A0A',
                border: '1px solid #2563EB',
                borderRadius: '0.5rem',
                color: '#FFFFFF',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={52} isAnimationActive={false}>
              {safeData.map((entry, idx) => (
                <Cell
                  key={`cell-${entry.label}-${idx}`}
                  fill={`url(#${BAR_GRADIENT_IDS[idx % BAR_GRADIENT_IDS.length]})`}
                />
              ))}
              <LabelList
                dataKey="value"
                position="top"
                fill="#FFFFFF"
                fontSize={11}
                fontWeight={600}
                formatter={(val: number) => (isWeather ? `${val}°C` : `${val}`)}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Painel Lateral "Síntese de Indicadores" */}
      <div className="flex flex-col justify-between gap-2.5 rounded-xl border border-[#1F1F1F] bg-black/60 p-3">
        <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <BarChart3 className="h-3.5 w-3.5 text-[#2563EB]" />
            Síntese de Indicadores
          </span>
          <span className="rounded bg-[#2563EB]/20 px-1.5 py-0.5 font-mono text-[10px] text-[#60A5FA]">
            {wx ? `Open-Meteo • ${wx.city}` : `${safeData.length} vetores`}
          </span>
        </div>

        {wx ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] px-2.5 py-2">
              <div className="flex items-center gap-1 text-[10px] text-[#A3A3A3]">
                <Thermometer className="h-3 w-3 text-[#60A5FA]" />
                <span>Temperatura Atual</span>
              </div>
              <p className="mt-0.5 font-mono text-sm font-bold text-white">{wx.temperatureC}°C</p>
            </div>

            <div className="rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] px-2.5 py-2">
              <div className="flex items-center gap-1 text-[10px] text-[#A3A3A3]">
                <TrendingUp className="h-3 w-3 text-[#34D399]" />
                <span>Sensação Térmica</span>
              </div>
              <p className="mt-0.5 font-mono text-sm font-bold text-[#34D399]">{wx.apparentTemperatureC}°C</p>
            </div>

            <div className="rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] px-2.5 py-2">
              <div className="flex items-center gap-1 text-[10px] text-[#A3A3A3]">
                <Droplets className="h-3 w-3 text-[#38BDF8]" />
                <span>Umidade</span>
              </div>
              <p className="mt-0.5 font-mono text-sm font-bold text-[#38BDF8]">{wx.humidityPercent}%</p>
            </div>

            <div className="rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] px-2.5 py-2">
              <div className="flex items-center gap-1 text-[10px] text-[#A3A3A3]">
                <Wind className="h-3 w-3 text-[#818CF8]" />
                <span>Vento</span>
              </div>
              <p className="mt-0.5 font-mono text-sm font-bold text-[#818CF8]">{wx.windSpeedKmh} km/h</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] p-2.5">
              <div className="flex items-center gap-1 text-[10px] text-[#A3A3A3]">
                <Award className="h-3 w-3 text-[#34D399]" />
                <span>Vetor Líder</span>
              </div>
              <p className="mt-1 truncate text-xs font-semibold text-white">{topItem.label}</p>
              <p className="font-mono text-sm font-bold text-[#34D399]">
                {topItem.value}
                {unitSuffix}
              </p>
            </div>

            <div className="rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] p-2.5">
              <div className="flex items-center gap-1 text-[10px] text-[#A3A3A3]">
                <TrendingUp className="h-3 w-3 text-[#60A5FA]" />
                <span>Média Global</span>
              </div>
              <p className="mt-1 truncate text-xs font-semibold text-white">Índice Consolidado</p>
              <p className="font-mono text-sm font-bold text-[#60A5FA]">
                {avgVal}
                {unitSuffix}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-1 pt-0.5">
          {safeData.map((item) => {
            const pct = Math.min(100, Math.round((item.value / maxVal) * 100));
            return (
              <div key={item.label} className="flex items-center gap-2 text-[11px]">
                <span className="w-28 truncate text-[#A3A3A3]">{item.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1F1F1F]">
                  <div
                    className="h-full rounded-full bg-[#2563EB]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-9 text-right font-mono text-white">
                  {isWeather ? `${item.value}°C` : item.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
