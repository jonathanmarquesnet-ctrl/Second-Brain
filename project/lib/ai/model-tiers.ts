export type DeviceTier = 'mobile' | 'desktop-basic' | 'desktop-gpu';

export interface LocalModelConfig {
  id: string;
  label: string;
  tier: DeviceTier;
  approxSizeMB: number;
  optional: boolean;
  defaultOnMobile: boolean;
}

export const LOCAL_MODEL_TIERS: LocalModelConfig[] = [
  {
    id: 'tiny-mobile',
    label: 'Tiny (mobile)',
    tier: 'mobile',
    approxSizeMB: 120,
    optional: true,
    defaultOnMobile: false,
  },
  {
    id: 'desktop-1b',
    label: 'Desktop Basic ~1B',
    tier: 'desktop-basic',
    approxSizeMB: 650,
    optional: true,
    defaultOnMobile: false,
  },
  {
    id: 'desktop-3b',
    label: 'Desktop GPU ~3B',
    tier: 'desktop-gpu',
    approxSizeMB: 1900,
    optional: true,
    defaultOnMobile: false,
  },
  {
    id: 'hermes',
    label: 'Hermes',
    tier: 'desktop-gpu',
    approxSizeMB: 3500,
    optional: true,
    defaultOnMobile: false,
  },
];

export function getModelsForTier(tier: DeviceTier): LocalModelConfig[] {
  return LOCAL_MODEL_TIERS.filter((m) => m.tier === tier);
}

export function isOptionalModel(modelId: string): boolean {
  const model = LOCAL_MODEL_TIERS.find((m) => m.id === modelId);
  return model ? model.optional : false;
}
