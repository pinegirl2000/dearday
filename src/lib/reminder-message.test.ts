import { describe, expect, it } from 'vitest';
import { buildReminderEmail, buildReminderPush, reminderChannels, reminderSchedule } from './reminder-message';

// 싱가포르 시간 기준 시각을 UTC Date 로 — 테스트 가독성용
const sg = (y: number, m: number, d: number, h = 12) => new Date(Date.UTC(y, m - 1, d, h - 8));
const ymd = (d: Date) => d.toISOString().slice(0, 10);

describe('reminderSchedule', () => {
  it('sends N days before the next occurrence', () => {
    const s = reminderSchedule({ month: 12, day: 20, notifyDaysBefore: 7 }, sg(2026, 11, 22));
    expect(ymd(s.eventDate)).toBe('2026-12-20');
    expect(ymd(s.sendDate)).toBe('2026-12-13');
    expect(s.daysAwayAtSend).toBe(7);
  });

  it('uses next year when the date has already passed this year', () => {
    const s = reminderSchedule({ month: 3, day: 1, notifyDaysBefore: 1 }, sg(2026, 11, 22));
    expect(ymd(s.eventDate)).toBe('2027-03-01');
    expect(ymd(s.sendDate)).toBe('2027-02-28');
  });

  it('when the reminder window has already started, sends at the next daily run', () => {
    // 오늘 오후(발송 시각 09:00 이후) 등록, 행사 3일 뒤, 1주 전 알림 → 내일 아침, 2일 전 알림
    const s = reminderSchedule({ month: 11, day: 25, notifyDaysBefore: 7 }, sg(2026, 11, 22, 15));
    expect(ymd(s.sendDate)).toBe('2026-11-23');
    expect(s.daysAwayAtSend).toBe(2);
    // 오늘 아침 발송 전 등록이면 오늘
    const early = reminderSchedule({ month: 11, day: 25, notifyDaysBefore: 7 }, sg(2026, 11, 22, 7));
    expect(ymd(early.sendDate)).toBe('2026-11-22');
    expect(early.daysAwayAtSend).toBe(3);
  });

  it('rolls over to next year when today is the event and today\'s send time has passed', () => {
    const s = reminderSchedule({ month: 11, day: 22, notifyDaysBefore: 0 }, sg(2026, 11, 22, 15));
    expect(ymd(s.eventDate)).toBe('2027-11-22');
    expect(ymd(s.sendDate)).toBe('2027-11-22');
  });

  it('event today with "day of" reminder', () => {
    const s = reminderSchedule({ month: 11, day: 22, notifyDaysBefore: 0 }, sg(2026, 11, 22, 7));
    expect(ymd(s.sendDate)).toBe('2026-11-22');
    expect(s.daysAwayAtSend).toBe(0);
  });
});

describe('reminderChannels', () => {
  it('email only when the user opted in and has an address; push only when subscribed', () => {
    expect(reminderChannels({ emailOptIn: false, hasEmail: true, pushSubscribed: true })).toEqual({ email: false, push: true });
    expect(reminderChannels({ emailOptIn: true, hasEmail: true, pushSubscribed: false })).toEqual({ email: true, push: false });
    expect(reminderChannels({ emailOptIn: true, hasEmail: false, pushSubscribed: false })).toEqual({ email: false, push: false });
  });
});

describe('reminder copy', () => {
  it('email subject and heading follow locale and days away', () => {
    expect(buildReminderEmail({ locale: 'en', personName: 'Mom', occasion: 'birthday', daysAway: 7 }).subject).toBe("🎂 Mom's Birthday in 7 days");
    expect(buildReminderEmail({ locale: 'en', personName: 'Mom', occasion: 'birthday', daysAway: 1 }).heading).toBe("Mom's Birthday is tomorrow");
    expect(buildReminderEmail({ locale: 'ko', personName: '엄마', occasion: 'birthday', daysAway: 0 }).heading).toBe('엄마님의 생일이 오늘이에요');
  });

  it('custom occasions use their own label and open the generic card maker', () => {
    const e = buildReminderEmail({ locale: 'en', personName: 'Sam', occasion: 'other', occasionLabel: 'Promotion', daysAway: 3 });
    expect(e.subject).toBe("📅 Sam's Promotion in 3 days");
    expect(e.cardUrl).toMatch(/\/cards\/new\?type=etc$/);
  });

  it('escapes names so they cannot inject HTML into the email', () => {
    const e = buildReminderEmail({ locale: 'en', personName: '<b>Eve</b>', occasion: 'birthday', daysAway: 2 });
    expect(e.html).not.toContain('<b>Eve</b>');
    expect(e.html).toContain('&lt;b&gt;Eve&lt;/b&gt;');
  });

  it('push uses the same heading as the email', () => {
    const p = buildReminderPush({ locale: 'en', personName: 'Mom', occasion: 'mothers-day', daysAway: 7 });
    expect(p.title).toBe("Mom's Mother's Day in 7 days");
    expect(p.body).toBe('Tap to make a card 💝');
  });

  it('email body shrinks to narrow screens instead of a fixed 480px width', () => {
    const { html } = buildReminderEmail({ locale: 'en', personName: 'Mom', occasion: 'birthday', daysAway: 7 });
    expect(html).not.toMatch(/width="480"/);
    expect(html).toMatch(/max-width:480px/);
  });
});
