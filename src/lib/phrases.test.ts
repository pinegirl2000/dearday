import { describe, expect, it } from 'vitest';
import { PHRASES, PHRASES_PER_FIELD, getPhraseSuggestions } from './phrases';

const HOME_OCCASIONS = [
  'birthday', 'baby-full-month', 'first-birthday', 'housewarming', 'engagement', 'baptism', 'meeting',
  'mothers-day', 'fathers-day', 'teachers-day', 'graduation', 'thank-you', 'get-well', 'promotion', 'sorry',
  'wedding-anniversary', 'cny', 'hari-raya', 'deepavali', 'mid-autumn', 'christmas', 'national-day', 'valentines',
  'opening', 'etc'
];
/** 카드 만들기 화면의 입력 제한과 같아야 함 — 넘으면 넣는 순간 잘림 */
const BODY_MAX = 200;
const ONELINER_MAX = 40;

describe('phrase library', () => {
  it('covers every occasion offered on the home screen', () => {
    for (const id of HOME_OCCASIONS) expect(PHRASES[id], id).toBeDefined();
  });

  it('has exactly 6 one-liners and 6 messages per occasion, all different', () => {
    for (const [id, set] of Object.entries(PHRASES)) {
      expect(set.oneLiners, id).toHaveLength(PHRASES_PER_FIELD);
      expect(set.messages, id).toHaveLength(PHRASES_PER_FIELD);
      expect(new Set(set.oneLiners).size, id).toBe(PHRASES_PER_FIELD);
      expect(new Set(set.messages).size, id).toBe(PHRASES_PER_FIELD);
    }
  });

  it('fits the input limits and stays within 3 lines', () => {
    for (const [id, set] of Object.entries(PHRASES)) {
      for (const s of set.oneLiners) expect(s.length, `${id}: ${s}`).toBeLessThanOrEqual(ONELINER_MAX);
      for (const s of set.messages) {
        expect(s.length, `${id}: ${s}`).toBeLessThanOrEqual(BODY_MAX);
        expect(s.split('\n').length, `${id}: ${s}`).toBeLessThanOrEqual(3);
      }
    }
  });

  it('reads like something people actually write (no long dashes, no leftover placeholders)', () => {
    for (const [id, set] of Object.entries(PHRASES)) {
      for (const s of [...set.oneLiners, ...set.messages]) {
        expect(s, `${id}: ${s}`).not.toMatch(/[—–]|\[|\]|\$NAME|\s{2,}|^\s|\s$/);
      }
    }
  });

  it('returns suggestions by field and falls back for unknown occasions', () => {
    expect(getPhraseSuggestions('birthday', 'body')).toBe(PHRASES.birthday.messages);
    expect(getPhraseSuggestions('birthday', 'greeting_oneliner')).toBe(PHRASES.birthday.oneLiners);
    expect(getPhraseSuggestions('some-custom-event', 'body')).toBe(PHRASES.etc.messages);
    expect(getPhraseSuggestions(undefined, 'body')).toBe(PHRASES.etc.messages);
    expect(getPhraseSuggestions('birthday', 'title')).toEqual([]);
  });
});

describe('korean phrase library', () => {
  it('covers the same occasions as English with 6 + 6 different phrases each', async () => {
    const { PHRASES_KO } = await import('./phrases-ko');
    expect(Object.keys(PHRASES_KO).sort()).toEqual(Object.keys(PHRASES).sort());
    for (const [id, set] of Object.entries(PHRASES_KO)) {
      expect(set.oneLiners, id).toHaveLength(PHRASES_PER_FIELD);
      expect(set.messages, id).toHaveLength(PHRASES_PER_FIELD);
      expect(new Set(set.oneLiners).size, id).toBe(PHRASES_PER_FIELD);
      expect(new Set(set.messages).size, id).toBe(PHRASES_PER_FIELD);
    }
  });

  it('fits the input limits, stays within 3 lines, and is written in Korean', async () => {
    const { PHRASES_KO } = await import('./phrases-ko');
    for (const [id, set] of Object.entries(PHRASES_KO)) {
      for (const s of set.oneLiners) expect(s.length, `${id}: ${s}`).toBeLessThanOrEqual(ONELINER_MAX);
      for (const s of set.messages) {
        expect(s.length, `${id}: ${s}`).toBeLessThanOrEqual(BODY_MAX);
        expect(s.split('\n').length, `${id}: ${s}`).toBeLessThanOrEqual(3);
        expect(s, `${id}: ${s}`).toMatch(/[가-힣]/);
      }
      for (const s of [...set.oneLiners, ...set.messages]) {
        expect(s, `${id}: ${s}`).not.toMatch(/[—–]|\[|\]|\$NAME|\s{2,}|^\s|\s$/);
      }
      // 한 줄 문구는 현지 인사말(Gong Xi Fa Cai 등)도 허용하되, 6개 중 절반 이상은 한국어
      expect(set.oneLiners.filter((s) => /[가-힣]/.test(s)).length, id).toBeGreaterThanOrEqual(3);
    }
  });

  it('returns Korean suggestions when asked, English by default', async () => {
    const { PHRASES_KO } = await import('./phrases-ko');
    expect(getPhraseSuggestions('birthday', 'body', 'ko')).toBe(PHRASES_KO.birthday.messages);
    expect(getPhraseSuggestions('birthday', 'greeting_oneliner', 'ko')).toBe(PHRASES_KO.birthday.oneLiners);
    expect(getPhraseSuggestions('unknown', 'body', 'ko')).toBe(PHRASES_KO.etc.messages);
    expect(getPhraseSuggestions('birthday', 'body')).toBe(PHRASES.birthday.messages);
    expect(getPhraseSuggestions('birthday', 'title', 'ko')).toEqual([]);
  });
});
