import type { AiJson } from '@/lib/ai/providers/types';
import { forgeAssetManifest } from './layer7-asset-forge';
import { validateFileOwnership, type ProjectPlanContract } from './layer8-universal-mesh';
import { delegateA2ATask, registerWebMcpTools } from './layer9-webmcp-a2a';
import { releaseVRAM } from '@/lib/ai/providers/browser-webgpu';
import { recordTriple, getTopTriplesContext } from '@/lib/ai/memory/llm-memshare-kg';
import { useProvidersStore } from '@/store/providers-store';

export function buildProjectPlanContract(prompt: string): ProjectPlanContract {
  const safeName = prompt.trim().slice(0, 42) || 'SecondBrainApp';
  return {
    projectName: safeName,
    version: '1.0.0-deca',
    fileOwnership: {
      'DESIGN.md': 'stitch',
      'src/engine/core.ts': 'claude',
      'src/math/simulation.ts': 'astra',
      'tests/audit.spec.ts': 'antigravity',
    },
    contractsDts: `// project-contracts.d.ts (Contract-First)\nexport interface AppStateContract {\n  project: "${safeName}";\n  fpsTarget: number;\n  entities: number;\n  ready: boolean;\n}`,
  };
}

export async function runGameDevPipeline(
  prompt: string,
  onProgress?: (stageLabel: string, partialData: AiJson) => void
): Promise<AiJson> {
  const start = Date.now();
  registerWebMcpTools();
  useProvidersStore.getState().setLayerStatus(6, 'processing');

  const kgContext = await getTopTriplesContext(prompt);
  const enrichedPrompt = kgContext ? `${prompt}\n\n${kgContext}` : prompt;

  // Etapa 1: Router & Contract-First (PROJECT_PLAN.json + project-contracts.d.ts)
  const plan = buildProjectPlanContract(prompt);
  const manifest = forgeAssetManifest(prompt);

  // Etapa 2 (Paralela): Stitch Worker (DESIGN.md -> intro & slides) + Claude Code Worker (Arquitetura)
  const [stitchData, claudeArchData] = await Promise.all([
    delegateA2ATask(
      'stitch',
      `[DESIGN.md | Paleta: ${manifest.palette.join(', ')}] Crie introdução e slides de design para: ${enrichedPrompt}`,
      ['intro', 'slides'],
      0
    ),
    delegateA2ATask(
      'claude',
      `[Arquitetura Contract-First]\n${plan.contractsDts}\nEstruture o código base para: ${enrichedPrompt}`,
      ['code'],
      0
    ),
  ]);

  const combined: AiJson = {
    ...stitchData,
    ...claudeArchData,
  };
  onProgress?.('Etapa 2 concluída: Design & Arquitetura', combined);

  // Etapa 3: Lógica & Matemática (Claude Code Worker + GPT Astra Worker -> code & chart)
  await releaseVRAM();
  if (validateFileOwnership(plan, 'src/math/simulation.ts', 'astra')) {
    const astraData = await delegateA2ATask(
      'astra',
      `Gere métricas matemáticas e telemetria de gráfico para: ${enrichedPrompt}`,
      ['chart'],
      1
    );
    Object.assign(combined, astraData);
  }
  onProgress?.('Etapa 3 concluída: Lógica & Matemática', combined);

  // Etapa 4: Antigravity Tester Loop (Validação de stack traces & contratos -> businessCritique)
  if (validateFileOwnership(plan, 'tests/audit.spec.ts', 'antigravity')) {
    const qaData = await delegateA2ATask(
      'antigravity',
      `Audite os contratos TypeScript, sprites procedurais (${manifest.assets.length} ativos) e aponte críticas e melhorias para: ${enrichedPrompt}`,
      ['businessCritique'],
      1
    );
    Object.assign(combined, qaData);
  }

  await recordTriple(plan.projectName, 'executou_pipeline', 'Camada 6 GameDev Contract-First', 6);
  useProvidersStore.getState().setLayerStatus(6, 'synced', Date.now() - start);
  return combined;
}
