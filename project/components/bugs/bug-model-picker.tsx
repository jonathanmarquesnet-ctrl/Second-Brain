'use client';

import { PROVIDER_OPTIONS } from '@/lib/ai/config';
import type { ProviderName } from '@/lib/ai/providers/types';
import { ModelSelect } from '@/components/layout/model-select';

export interface ModelChoice {
  provider: ProviderName;
  model: string;
  models: string[];
  onProviderChange: (value: ProviderName) => void;
  onModelChange: (value: string) => void;
}

export function BugModelPicker({ provider, model, models, onProviderChange, onModelChange }: ModelChoice) {
  return (
    <>
      <label className="text-xs text-[#A3A3A3]">
        Provedor
        <select
          value={provider}
          onChange={(event) => onProviderChange(event.target.value as ProviderName)}
          className="mt-1 rounded-md border border-[#1F1F1F] bg-black px-2 py-2 text-xs text-white"
        >
          {PROVIDER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <div className="min-w-48">
        <ModelSelect label="Modelo" value={model} models={models} onChange={onModelChange} />
      </div>
    </>
  );
}
