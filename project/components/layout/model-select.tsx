'use client';

import { useMemo } from 'react';

const OTHER = '__outro__';
interface ModelSelectProps { value: string; models: string[]; onChange: (value: string) => void; label: string; }

export function ModelSelect({ value, models, onChange, label }: ModelSelectProps) {
  const options = useMemo(() => [...new Set([...models, value].filter(Boolean))], [models, value]);
  const custom = !options.includes(value);
  return <div><select aria-label={label} value={custom ? OTHER : value} onChange={(event) => { if (event.target.value !== OTHER) onChange(event.target.value); }} className="mt-1 w-full rounded-md border border-[#1F1F1F] bg-black px-2 py-2 text-xs text-white outline-none focus:border-[#2563EB]"><option value="" disabled>Escolha um modelo</option>{options.map((model) => <option key={model} value={model}>{model}</option>)}<option value={OTHER}>Outro (digitar)</option></select>{custom && <input aria-label={`${label}: outro`} value={value} onChange={(event) => onChange(event.target.value)} placeholder="Nome do modelo" className="mt-1 w-full rounded-md border border-[#1F1F1F] bg-black px-2 py-2 text-xs text-white outline-none focus:border-[#2563EB]" />}</div>;
}
