import { describe, expect, it } from 'vitest';
import { sanitizeTypography, typographySchema } from './typography-schema';

describe('typographySchema', () => {
  it('accepts valid partial', () => {
    expect(typographySchema.safeParse({ title: { font: 'cormorant', size: 34, spacing: 0.18 } }).success).toBe(true);
  });

  it('boundary values', () => {
    for (const v of [{ size: 8 }, { size: 80 }, { spacing: -0.02 }, { spacing: 0.6 }]) {
      expect(typographySchema.safeParse({ title: v }).success).toBe(true);
    }
    for (const v of [{ size: 7 }, { size: 81 }, { spacing: 0.61 }]) {
      expect(typographySchema.safeParse({ title: v }).success).toBe(false);
    }
  });

  it('rejects unknown font and unknown key', () => {
    expect(typographySchema.safeParse({ title: { font: 'arial' } }).success).toBe(false);
    expect(typographySchema.safeParse({ title: { color: '#000' } }).success).toBe(false);
    expect(typographySchema.safeParse({ header: {} }).success).toBe(false);
  });
});

describe('sanitizeTypography', () => {
  it('sanitize drops empty roles', () => {
    expect(sanitizeTypography({ title: {}, body: { size: 15 } })).toEqual({ body: { size: 15 } });
    expect(sanitizeTypography({ title: {} })).toBeNull();
    expect(sanitizeTypography('garbage')).toBeNull();
  });

  it('sanitize keeps valid properties when one is invalid', () => {
    expect(sanitizeTypography({ title: { font: 'arial', size: 30 }, header: { size: 12 } })).toEqual({ title: { size: 30 } });
  });
});
