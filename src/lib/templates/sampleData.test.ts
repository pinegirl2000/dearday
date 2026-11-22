import { describe, expect, it } from 'vitest';
import { SAMPLE_BY_EVENT, upcomingSampleDate } from './sampleData';

const DAY = 24 * 60 * 60 * 1000;

describe('sample event dates', () => {
  it('are always in the future so an unedited card is never published with a past date', () => {
    for (const [id, sample] of Object.entries(SAMPLE_BY_EVENT)) {
      if (!sample.event_date) continue;
      expect(new Date(sample.event_date).getTime(), id).toBeGreaterThan(Date.now() + 7 * DAY);
    }
  });

  it('lands on the requested weekday and hour (Singapore time), at least the given weeks ahead', () => {
    const now = new Date('2026-11-22T06:00:00.000Z'); // 일요일
    const d = new Date(upcomingSampleDate({ weeksAhead: 3, weekday: 6, hour: 19, minute: 30 }, now));
    // 싱가포르(UTC+8) 19:30 = UTC 11:30, 토요일
    expect(d.getUTCHours()).toBe(11);
    expect(d.getUTCMinutes()).toBe(30);
    expect(new Date(d.getTime() + 8 * 60 * 60 * 1000).getUTCDay()).toBe(6);
    expect(d.getTime() - now.getTime()).toBeGreaterThanOrEqual(21 * DAY);
    expect(d.getTime() - now.getTime()).toBeLessThan(28 * DAY);
  });
});
