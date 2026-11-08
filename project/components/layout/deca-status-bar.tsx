'use client';

import { useState } from 'react';
import { RotateCcw, ShieldCheck, Cpu, Activity, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { useProvidersStore, type DecaExecutionMode } from '@/store/providers-store';
import { useBlocksStore } from '@/store/blocks-store';

export function DecaStatusBar() {
  const [providersDrawerOpen, setProvidersDrawerOpen] = useState(false);
  const decaLayers = useProvidersStore((s) => s.decaLayers);
  const providers = useProvidersStore((s) => s.providers);
  const isSimulating = useProvidersStore((s) => s.isSimulating);
  const simulate = useProvidersStore((s) => s.simulate);
  const executionMode = useProvidersStore((s) => s.executionMode);
  const ctoAutopilot = useProvidersStore((s) => s.ctoAutopilot);
  const snapshots = useProvidersStore((s) => s.snapshots);
  const setExecutionMode = useProvidersStore((s) => s.setExecutionMode);
  const toggleCtoAutopilot = useProvidersStore((s) => s.toggleCtoAutopilot);
  const rollbackLatestSnapshot = useBlocksStore((s) => s.rollbackLatestSnapshot);

  function statusDotClass(status: string): string {
    if (status === 'processing' || status === 'loading-model') return 'bg-[#60A5FA] animate-pulse';
    if (status === 'synced') return 'bg-[#2563EB]';
    if (status === 'error') return 'bg-red-400';
    return 'bg-[#A3A3A3]/40';
  }

  return (
    <div className="space-y-2 border-b border-[#1F1F1F] bg-black px-3 py-2.5 text-xs text-white">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5 shrink-0 text-[#2563EB]" />
          <span className="text-[11px] font-semibold tracking-tight text-white">Deca-Engine</span>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <select
            aria-label="Modo de execução Deca-Engine"
            value={executionMode}
            onChange={(e) => setExecutionMode(e.target.value as DecaExecutionMode)}
            className="rounded border border-[#1F1F1F] bg-[#0A0A0A] px-1.5 py-0.5 text-[10px] text-white outline-none focus:border-[#2563EB]"
          >
            <option value="multi-swarm">Multi-Swarm Paralelo</option>
            <option value="gamedev-pipeline">GameDev Pipeline (L6)</option>
          </select>

          <button
            type="button"
            onClick={toggleCtoAutopilot}
            title="Alternar Autopilot CTOLoop (Camada 10)"
            className={`flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
              ctoAutopilot
                ? 'border-[#2563EB] bg-[#2563EB]/20 text-white'
                : 'border-[#1F1F1F] bg-[#0A0A0A] text-[#A3A3A3]'
            }`}
          >
            <ShieldCheck className="h-3 w-3 text-[#2563EB]" />
            <span>CTO {ctoAutopilot ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            disabled={snapshots.length === 0}
            onClick={() => rollbackLatestSnapshot()}
            title={
              snapshots.length > 0
                ? `Reverter para: ${snapshots[0].label}`
                : 'Nenhum snapshot salvo ainda'
            }
            className="flex items-center gap-1 rounded border border-[#1F1F1F] bg-[#0A0A0A] px-1.5 py-0.5 text-[10px] text-[#A3A3A3] transition-colors hover:border-[#2563EB] hover:text-white disabled:opacity-40"
          >
            <RotateCcw className="h-3 w-3 text-[#2563EB]" />
            <span>Rollback ({snapshots.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setProvidersDrawerOpen((v) => !v)}
            title="Abrir telemetria de Provedores de IA"
            className="flex items-center gap-1 rounded border border-[#1F1F1F] bg-[#0A0A0A] px-1.5 py-0.5 text-[10px] text-[#A3A3A3] transition-colors hover:border-[#2563EB] hover:text-white"
          >
            <Activity className="h-3 w-3 text-[#2563EB]" />
            <span>Provedores</span>
            {providersDrawerOpen ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
          </button>
        </div>
      </div>

      {/* Todos os 10 Badges Visíveis com flex-wrap (Zero Corte Horizontal) */}
      <div className="grid grid-cols-5 gap-1">
        {decaLayers.map((item) => (
          <div
            key={item.layer}
            title={`${item.label} — Status: ${item.status} (${item.latencyMs}ms)`}
            className="flex items-center justify-center gap-1 rounded border border-[#1F1F1F] bg-[#0A0A0A] px-1 py-0.5 text-[10px] text-[#A3A3A3]"
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDotClass(item.status)}`} />
            <span className="font-semibold text-white">L{item.layer}</span>
            <span className="truncate text-[9px] text-[#A3A3A3]">
              {item.shortLabel.replace(/^L\d+\s*/, '').split('/')[0]}
            </span>
          </div>
        ))}
      </div>

      {/* Drawer Integrado de Provedores de IA (Sem sobrepor o rodapé do chat) */}
      {providersDrawerOpen && (
        <div className="space-y-1.5 rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] p-2.5">
          <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-1.5">
            <span className="text-[11px] font-medium text-white">Telemetria de Provedores de IA</span>
            <button
              type="button"
              onClick={simulate}
              disabled={isSimulating}
              className="flex items-center gap-1 rounded bg-[#2563EB] px-2 py-0.5 text-[10px] font-medium text-white disabled:opacity-50"
            >
              <Play className="h-2.5 w-2.5" />
              {isSimulating ? 'Testando...' : 'Testar Malha'}
            </button>
          </div>
          <div className="space-y-1">
            {providers.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-white">
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(p.status)}`} />
                  {p.label}
                </span>
                <span className="font-mono text-[10px] text-[#A3A3A3]">
                  {p.elapsedMs > 0 ? `${p.elapsedMs}ms` : p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
