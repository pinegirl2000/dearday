import { describe, expect, it } from 'vitest';
import { FONT_KEYS, FONT_LABELS, FONT_STACKS, isFontKey } from './font-keys';
import { typographySchema } from './typography-schema';

describe('font registry', () => {
  it('every key has a stack that starts with its own CSS variable and a label', () => {
    for (const k of FONT_KEYS) {
      expect(FONT_STACKS[k]).toMatch(/^var\(--font-[a-z0-9-]+\), /);
      expect(FONT_LABELS[k].length).toBeGreaterThan(0);
    }
  });

  it('includes the added English and Korean fonts', () => {
    for (const k of ['alexBrush', 'allura', 'cinzel', 'josefin', 'quicksand', 'abril', 'amatic', 'gmarket', 'gangwonModu', 'gangwonTeunteun', 'gangwonSaeeum', 'gangwonHyeonok']) {
      expect(isFontKey(k)).toBe(true);
      expect(typographySchema.safeParse({ title: { font: k } }).success).toBe(true);
    }
  });

  it('latin-only fonts fall back to a Korean font before the generic family', () => {
    for (const k of ['alexBrush', 'allura', 'cinzel', 'josefin', 'quicksand', 'abril', 'amatic'] as const) {
      expect(FONT_STACKS[k].split(',').length).toBeGreaterThanOrEqual(3);
    }
  });

  it('does not offer tvN 즐거운이야기 (its license forbids modifying the font, and web conversion modifies it)', () => {
    expect(isFontKey('tvnStory')).toBe(false);
  });
});
