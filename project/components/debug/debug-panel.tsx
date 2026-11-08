'use client';

import { useState } from 'react';
import { Activity, Check, ChevronDown, ChevronUp, CircleAlert, Cpu, KeyRound, Play, Users } from 'lucide-react';
import { useProvidersStore, type ProviderInfo } from '@/store/providers-store';
import type { ProviderStatus } from '@/lib/ai/types';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<ProviderStatus, string> = { idle: 'ocioso', 'loading-model': 'carregando', processing: 'processando', 'waiting-queue': 'na fila', synced: 'concluído', error: 'erro', disabled: 'desativado' };

function iconFor(id: string) { if (id.startsWith('local')) return Cpu; if (id.startsWith('byok')) return KeyRound; return Users; }

function StatusIcon({ status }: { status: ProviderStatus }) {
  if (status === 'synced') return <Check className="h-3.5 w-3.5 text-white" />;
  if (status === 'error') return <CircleAlert className="h-3.5 w-3.5 text-white" />;
  return <span className={cn('h-2.5 w-2.5 rounded-full', status === 'processing' && 'animate-pulse bg-[#2563EB]', status === 'loading-model' && 'animate-pulse bg-[#2563EB]/70', status === 'waiting-queue' && 'bg-[#2563EB]/45', status === 'idle' && 'bg-[#A3A3A3]', status === 'disabled' && 'bg-[#1F1F1F]')} />;
}

function ProviderRow({ info }: { info: ProviderInfo }) {
  const Icon = iconFor(info.id);
  return <div className="flex items-center gap-3 py-2"><span className="flex h-5 w-5 items-center justify-center"><StatusIcon status={info.status} /></span><Icon className="h-4 w-4 text-[#A3A3A3]" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-white">{info.label}</p><p className="text-[10px] uppercase tracking-wide text-[#A3A3A3]">{STATUS_LABELS[info.status]}</p></div>{info.elapsedMs > 0 && <span className="text-[10px] text-[#A3A3A3] tabular-nums">{(info.elapsedMs / 1000).toFixed(1)}s</span>}{info.progress > 0 && <div className="h-1 w-12 overflow-hidden rounded-full bg-[#1F1F1F]"><div className="h-full bg-[#2563EB] transition-all" style={{ width: `${info.progress}%` }} /></div>}</div>;
}

export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const providers = useProvidersStore((s) => s.providers);
  const isSimulating = useProvidersStore((s) => s.isSimulating);
  const simulate = useProvidersStore((s) => s.simulate);
  return <div className="fixed bottom-20 right-3 z-50 w-72 overflow-hidden rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] shadow-lg md:bottom-4 md:right-4"><button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-3"><span className="flex items-center gap-2 text-sm font-medium text-white"><Activity className="h-4 w-4 text-[#2563EB]" />Provedores de IA</span>{open ? <ChevronDown className="h-4 w-4 text-[#A3A3A3]" /> : <ChevronUp className="h-4 w-4 text-[#A3A3A3]" />}</button>{open && <div className="border-t border-[#1F1F1F] px-4 py-2">{providers.map((p) => <ProviderRow key={p.id} info={p} />)}<button onClick={simulate} disabled={isSimulating} className="my-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-[#2563EB] py-2 text-xs font-medium text-white transition-opacity disabled:opacity-50"><Play className="h-3 w-3" />{isSimulating ? 'Simulando...' : 'Simular atividade'}</button></div>}</div>;
}
