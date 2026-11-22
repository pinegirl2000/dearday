import { describe, expect, it } from 'vitest';
import { contrastRatio, readableTextOn } from './color-contrast';

describe('contrastRatio', () => {
  it('matches the WCAG formula at the extremes', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });
  it('accepts 3-digit hex and is order independent', () => {
    expect(contrastRatio('#fff', '#7B5EA7')).toBeCloseTo(contrastRatio('#7B5EA7', '#FFFFFF'), 5);
  });
});

describe('readableTextOn', () => {
  it('uses dark ink on light gold buttons (white text was unreadable)', () => {
    expect(readableTextOn('#F1D58E')).not.toBe('#FFFFFF');
    expect(contrastRatio(readableTextOn('#F1D58E'), '#F1D58E')).toBeGreaterThanOrEqual(4.5);
  });
  it('keeps white on dark brand colours', () => {
    expect(readableTextOn('#7B5EA7')).toBe('#FFFFFF');
    expect(readableTextOn('#55705A')).toBe('#FFFFFF');
  });
  it('falls back to white when the colour cannot be read', () => {
    expect(readableTextOn('linear-gradient(red, blue)')).toBe('#FFFFFF');
    expect(readableTextOn('')).toBe('#FFFFFF');
  });
});
