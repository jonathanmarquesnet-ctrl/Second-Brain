'use client';

import { useState } from 'react';
import { KeyRound } from 'lucide-react';

interface ApiKeyFormProps {
  hasKey: boolean;
  onSave: (key: string) => Promise<void>;
  onCancel: () => void;
}

export function ApiKeyForm({ hasKey, onSave, onCancel }: ApiKeyFormProps) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  async function save(): Promise<void> {
    if (!value.trim()) return;
    setSaving(true);
    await onSave(value);
    setSaving(false);
    setValue('');
    onCancel();
  }

  return (
    <div className="space-y-3 border-t border-[#1F1F1F] p-4">
      <div className="flex items-center gap-2 text-sm text-white">
        <KeyRound className="h-4 w-4 text-[#2563EB]" />
        {hasKey ? 'Trocar chave da Anthropic' : 'Adicione sua chave da Anthropic'}
      </div>
      <p className="text-xs leading-5 text-[#A3A3A3]">A chave fica salva apenas neste navegador e nunca aparece nos registros.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="password"
          autoComplete="off"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="sk-ant-..."
          aria-label="Chave da API da Anthropic"
          className="min-w-0 flex-1 rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] px-3 py-2 text-sm text-white outline-none placeholder:text-[#8A8A8A] focus:border-[#2563EB]"
        />
        <div className="flex gap-2">
          {hasKey && (
            <button type="button" onClick={onCancel} className="rounded-lg border border-[#1F1F1F] px-3 py-2 text-sm text-[#A3A3A3] transition-colors hover:text-white">Cancelar</button>
          )}
          <button type="button" onClick={() => void save()} disabled={saving || !value.trim()} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-40">Salvar chave</button>
        </div>
      </div>
    </div>
  );
}
