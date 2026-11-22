import { describe, expect, it } from 'vitest';
import { planFit, type FitMeasure } from './fit-plan';

// 가짜 측정: 글자 하나 폭 = size × (0.6 + spacing) — 실제 DOM 없이 알고리즘 순서만 검증
const charW = (size: number, spacing: number) => size * (0.6 + spacing);
const measureOf = (text: string): FitMeasure => ({
  widestLine: (size, spacing) => Math.max(...text.split('\n').map((l) => l.length * charW(size, spacing))),
  longestWord: (size, spacing) => Math.max(...text.split(/\s+/).map((w) => w.length * charW(size, spacing)))
});
const base = { size: 24, minSize: 17, spacing: 0.4, minSpacing: 0.04 };
const run = (text: string, available: number) => planFit(text, available, base, measureOf(text));

describe('planFit', () => {
  it('fits without change', () => {
    expect(run('Hi', 300)).toEqual({ size: 24, spacing: 0.4, wrap: false });
  });

  it('reduces spacing before size', () => {
    // 10글자: spacing 0.4 → 240px, 0.2 → 192px. 200px 이면 자간만 줄여 맞음
    const r = run('Gatherings', 200);
    expect(r.size).toBe(24);
    expect(r.spacing).toBeLessThan(0.4);
    expect(r.spacing).toBeGreaterThanOrEqual(0.04);
    expect(r.wrap).toBe(false);
  });

  it('reduces size after spacing floor', () => {
    // 10글자 at minSpacing 0.04: 24px → 153.6, 17px → 108.8. 130px 이면 크기 축소로 맞음
    const r = run('Gatherings', 130);
    expect(r.spacing).toBe(0.04);
    expect(r.size).toBeLessThan(24);
    expect(r.size).toBeGreaterThanOrEqual(17);
    expect(r.wrap).toBe(false);
  });

  it('wraps at minSize when line still too wide', () => {
    const r = run('Spring Garden Gathering Party', 150);
    expect(r).toMatchObject({ size: 17, spacing: 0.04, wrap: true });
  });

  it('widest explicit line governs', () => {
    expect(run('Hi\nSpring Garden Gathering', 200)).toEqual(
      planFit('Spring Garden Gathering', 200, base, measureOf('Spring Garden Gathering'))
    );
  });

  it('single long word shrinks below minSize down to floor', () => {
    const r = run('Congratulations!!!', 150);
    expect(r.wrap).toBe(true);
    expect(r.size).toBeLessThan(17);
    expect(r.size).toBeGreaterThanOrEqual(10);
    expect(measureOf('Congratulations!!!').longestWord(r.size, r.spacing)).toBeLessThanOrEqual(150);
  });

  it('zero available width returns base style', () => {
    expect(run('Spring Gathering', 0)).toEqual({ size: 24, spacing: 0.4, wrap: false });
  });

  it('empty text returns base style', () => {
    expect(run('   ', 100)).toEqual({ size: 24, spacing: 0.4, wrap: false });
  });

  it('never grows back above minSize when minSize is already below floor', () => {
    // eventLabel 11px → 기본 minSize 8px. 8px 에서도 넘치는 한 단어가 10px 로 다시 커지면 선을 넘음
    const style = { size: 11, minSize: 8, spacing: 0.5, minSpacing: 0.04 };
    const text = 'CONGRATULATIONS!!!';
    const r = planFit(text, 60, style, measureOf(text));
    expect(r.size).toBeLessThanOrEqual(8);
  });
});
