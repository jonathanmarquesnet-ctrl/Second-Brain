'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  AI_FIELDS,
  FIELD_LABELS,
  OPENAI_PRESETS,
  PROVIDER_OPTIONS,
  getAiSettings,
  modelsForProvider,
  refreshModels,
  saveAiSettings,
  type AiSettings,
} from '@/lib/ai/config';
import type { ProviderName } from '@/lib/ai/providers/types';
import { ModelSelect } from './model-select';
import { DecaStatusBar } from './deca-status-bar';

const INPUT =
  'mt-1 w-full rounded-md border border-[#1F1F1F] bg-black px-3 py-2 text-xs text-white outline-none focus:border-[#2563EB]';

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [refreshing, setRefreshing] = useState<ProviderName | null>(null);

  useEffect(() => {
    void getAiSettings().then(setSettings);
  }, []);

  if (!settings) return null;
  const current = settings;

  function change(next: AiSettings): void {
    setSettings(next);
    setSaved(false);
  }

  function updateRoute(field: (typeof AI_FIELDS)[number], provider: ProviderName, model: string): void {
    const availableModels = modelsForProvider(provider, current);
    const resolvedModel = availableModels.includes(model) ? model : (availableModels[0] ?? model);
    change({
      ...current,
      routes: { ...current.routes, [field]: { provider, model: resolvedModel } },
    });
  }

  function updatePreset(preset: string): void {
    const selected = OPENAI_PRESETS[preset as keyof typeof OPENAI_PRESETS];
    if (!selected) return;
    const routes = { ...current.routes };
    AI_FIELDS.forEach((field) => {
      if (routes[field].provider === 'openai-compatible') {
        routes[field] = { ...routes[field], model: selected.model };
      }
    });
    change({ ...current, openAiPreset: preset, openAiBaseUrl: selected.url, routes });
  }

  async function updateModels(provider: ProviderName): Promise<void> {
    setRefreshing(provider);
    try {
      setSettings(await refreshModels(provider, current));
    } finally {
      setRefreshing(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await saveAiSettings(current);
    setSaved(true);
  }

  return (
    <div className="absolute inset-x-3 bottom-20 z-10 max-h-[80vh] overflow-y-auto rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] p-4 shadow-lg scrollbar-thin">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-white">Configurações & Deca-Engine</h2>
        <button type="button" onClick={onClose} className="text-xs text-[#A3A3A3] hover:text-white">
          Fechar
        </button>
      </div>

      <div className="mb-4 overflow-hidden rounded-lg border border-[#1F1F1F]">
        <DecaStatusBar />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <section className="space-y-2">
          <h3 className="text-xs font-medium text-white">Chaves BYOK (Opcionais — Zero-Key Ativo por Padrão)</h3>
          <label className="block text-xs text-[#A3A3A3]">
            Chave da API Gemini (Opcional)
            <input
              type="password"
              value={current.geminiKey}
              onChange={(event) => change({ ...current, geminiKey: event.target.value })}
              placeholder="Vazio = Usa Deca-Engine Zero-Key"
              className={INPUT}
            />
          </label>
          <label className="block text-xs text-[#A3A3A3]">
            Chave OpenAI-compatible (Opcional)
            <input
              type="password"
              value={current.openAiKey}
              onChange={(event) => change({ ...current, openAiKey: event.target.value })}
              placeholder="Vazio = Usa Deca-Engine Zero-Key"
              className={INPUT}
            />
          </label>
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-medium text-white">OpenAI-compatible</h3>
          <label className="block text-xs text-[#A3A3A3]">
            Preset
            <select
              value={current.openAiPreset}
              onChange={(event) => updatePreset(event.target.value)}
              className={INPUT}
            >
              <option value="">Personalizado</option>
              {Object.keys(OPENAI_PRESETS).map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-[#A3A3A3]">
            URL base
            <input
              type="url"
              value={current.openAiBaseUrl}
              onChange={(event) =>
                change({ ...current, openAiBaseUrl: event.target.value, openAiPreset: '' })
              }
              className={INPUT}
            />
          </label>
          <button
            type="button"
            onClick={() => void updateModels('openai-compatible')}
            className="text-xs text-[#A3A3A3] hover:text-white"
          >
            {refreshing === 'openai-compatible' ? 'Atualizando...' : 'Atualizar modelos'}
          </button>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-white">Funções das IAs (Roteador Universal L8)</h3>
            <button
              type="button"
              onClick={() => void updateModels('gemini')}
              className="text-xs text-[#A3A3A3] hover:text-white"
            >
              {refreshing === 'gemini' ? 'Atualizando...' : 'Atualizar modelos'}
            </button>
          </div>
          {AI_FIELDS.map((field) => (
            <div key={field} className="space-y-1">
              <p className="text-xs text-[#A3A3A3]">{FIELD_LABELS[field]}</p>
              <select
                aria-label={`Provedor: ${FIELD_LABELS[field]}`}
                value={current.routes[field].provider}
                onChange={(event) =>
                  updateRoute(
                    field,
                    event.target.value as ProviderName,
                    current.routes[field].model
                  )
                }
                className={INPUT}
              >
                {PROVIDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ModelSelect
                label={`Modelo: ${FIELD_LABELS[field]}`}
                value={current.routes[field].model}
                models={modelsForProvider(current.routes[field].provider, current)}
                onChange={(model) => updateRoute(field, current.routes[field].provider, model)}
              />
            </div>
          ))}
        </section>

        <button
          type="submit"
          className="w-full rounded-md bg-[#2563EB] py-2 text-xs font-medium text-white"
        >
          {saved ? 'Configurações salvas' : 'Salvar configurações'}
        </button>
      </form>
    </div>
  );
}
