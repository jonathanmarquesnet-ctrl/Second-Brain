'use client';

import { useEffect, useState } from 'react';
import { PROVIDER_OPTIONS, getAiSettings, modelsForProvider, type AiSettings } from '@/lib/ai/config';
import type { ProviderName } from '@/lib/ai/providers/types';
import { ModelSelect } from '@/components/layout/model-select';

interface ReviewMenuProps {
  onSubmit: (provider: ProviderName, model: string) => void;
}

export function ReviewMenu({ onSubmit }: ReviewMenuProps) {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [provider, setProvider] = useState<ProviderName>('claude-free-relay');
  const [model, setModel] = useState('claude-3-5-sonnet');

  useEffect(() => {
    void getAiSettings().then((value) => {
      setSettings(value);
      setProvider(value.routes.intro.provider);
      setModel(value.routes.intro.model);
    });
  }, []);

  if (!settings) {
    return <div className="border-b border-[#1F1F1F] px-4 py-3 text-xs text-[#A3A3A3]">Carregando configurações...</div>;
  }

  const models = modelsForProvider(provider, settings);

  return (
    <div className="space-y-2 border-b border-[#1F1F1F] px-4 py-3">
      <div className="grid grid-cols-2 gap-2">
        <select
          value={provider}
          onChange={(event) => {
            const nextProvider = event.target.value as ProviderName;
            setProvider(nextProvider);
            const nextModels = modelsForProvider(nextProvider, settings);
            if (nextModels[0]) setModel(nextModels[0]);
          }}
          className="w-full rounded-md border border-[#1F1F1F] bg-black px-2 py-2 text-xs text-white outline-none focus:border-[#2563EB]"
        >
          {PROVIDER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ModelSelect label="Modelo da revisão" value={model} models={models} onChange={setModel} />
      </div>
      <button
        type="button"
        onClick={() => onSubmit(provider, model)}
        className="rounded-md bg-[#2563EB] px-3 py-2 text-xs font-medium text-white"
      >
        Gerar revisão
      </button>
    </div>
  );
}
