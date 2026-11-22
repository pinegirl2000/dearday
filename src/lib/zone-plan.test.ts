import { describe, expect, it } from 'vitest';
import { planZone, ZONE_INITIAL, type ZoneMeasure } from './zone-plan';

const m = (over: Partial<ZoneMeasure>): ZoneMeasure => ({
  zoneH: 300, labelH: 20, subtitleH: 24, titleH: 40, bodyH: 80, gap: 8, titleSize: 30, minTitleSize: 18, ...over
});

describe('planZone', () => {
  it('keeps everything on the cover when it fits', () => {
    expect(planZone(m({}))).toEqual({ ...ZONE_INITIAL, titleSize: 30 });
  });

  it('moves body below first', () => {
    // 20+24+40+80 + gap 3개(24) = 188 > 150 → 본문만 내림 (64+40+16=108... 제목부는 들어감)
    expect(planZone(m({ zoneH: 150 }))).toEqual({ bodyBelow: true, subtitleBelow: false, headBelow: false, titleSize: 30 });
  });

  it('then shrinks the title by one step, never below the minimum', () => {
    const r = planZone(m({ zoneH: 90, bodyH: 0 }));
    expect(r).toMatchObject({ bodyBelow: true, subtitleBelow: false, headBelow: false, titleSize: 28 });
    expect(planZone(m({ zoneH: 90, titleSize: 19 })).titleSize).toBe(18);
  });

  it('then moves the subtitle below once the title is at minimum', () => {
    // 최소 크기에서도 20+24+40+16=100 > 90 → 부제 내림 (20+40+8=68 은 들어감)
    expect(planZone(m({ zoneH: 90, titleSize: 18 }))).toMatchObject({ bodyBelow: true, subtitleBelow: true, headBelow: false, titleSize: 18 });
  });

  it('finally moves the whole head below (cover shows art only)', () => {
    expect(planZone(m({ zoneH: 50, titleSize: 18 }))).toMatchObject({ bodyBelow: true, subtitleBelow: true, headBelow: true });
  });

  it('missing subtitle or body adds no gap', () => {
    // 라벨 20 + 제목 40 + gap 1개 8 = 68
    expect(planZone(m({ zoneH: 68, subtitleH: 0, bodyH: 0 }))).toEqual({ ...ZONE_INITIAL, titleSize: 30 });
  });

  it('zero zone height waits without moving anything', () => {
    expect(planZone(m({ zoneH: 0 }))).toEqual({ ...ZONE_INITIAL, titleSize: 30 });
  });
});
