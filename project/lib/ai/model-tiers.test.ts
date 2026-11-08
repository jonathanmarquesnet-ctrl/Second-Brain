import { describe, it, expect } from 'vitest';
import { LOCAL_MODEL_TIERS, getModelsForTier, isOptionalModel } from './model-tiers';

describe('model-tiers', () => {
  it('every model is optional', () => {
    for (const m of LOCAL_MODEL_TIERS) {
      expect(m.optional).toBe(true);
    }
  });

  it('no model defaults on mobile', () => {
    for (const m of LOCAL_MODEL_TIERS) {
      expect(m.defaultOnMobile).toBe(false);
    }
  });

  it('Hermes is present and optional and off on mobile', () => {
    const hermes = LOCAL_MODEL_TIERS.find((m) => m.id === 'hermes');
    expect(hermes).toBeDefined();
    expect(hermes?.optional).toBe(true);
    expect(hermes?.defaultOnMobile).toBe(false);
  });

  it('getModelsForTier returns only matching tier models', () => {
    const mobile = getModelsForTier('mobile');
    expect(mobile.every((m) => m.tier === 'mobile')).toBe(true);
  });

  it('isOptionalModel reflects config', () => {
    expect(isOptionalModel('hermes')).toBe(true);
    expect(isOptionalModel('nonexistent')).toBe(false);
  });
});
