/**
 * 기념일 리마인더 — 보내는 문구와 발송 날짜 계산.
 *
 * 발송(cron)과 등록 화면 미리보기가 같은 함수를 쓰게 하려고 한곳에 모았다.
 * 미리보기가 실제와 다르면 사용자가 엉뚱한 알림을 기대하게 되기 때문.
 * next/server·DB 를 import 하지 않는 순수 모듈 — 테스트와 브라우저에서 모두 쓴다.
 */

export type ReminderLocale = 'en' | 'ko';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
/** 싱가포르 UTC+8 (서머타임 없음) */
const SG_OFFSET_MS = 8 * 60 * 60 * 1000;
/**
 * 매일 발송 시각(싱가포르 시간). vercel.json 의 cron "0 1 * * *"(UTC 01:00) 과 같아야 한다.
 * 이 시각 전에 등록하면 오늘 발송분에 포함된다.
 */
export const SEND_HOUR_SG = 9;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://dearday.sg';

export const OCCASION_EMOJI: Record<string, string> = {
  'birthday': '🎂', 'mothers-day': '💝', 'fathers-day': '💙', 'wedding-anniversary': '💑', 'graduation': '🎓'
};
const DEFAULT_EMOJI = '📅';

const OCCASION_LABEL: Record<string, Record<ReminderLocale, string>> = {
  'birthday': { en: 'Birthday', ko: '생일' },
  'mothers-day': { en: "Mother's Day", ko: '어머니의 날' },
  'fathers-day': { en: "Father's Day", ko: '아버지의 날' },
  'wedding-anniversary': { en: 'Wedding Anniversary', ko: '결혼기념일' },
  'graduation': { en: 'Graduation', ko: '졸업' }
};

interface Copy {
  daysText: (n: number) => string;
  subject: (name: string, occasion: string, days: string) => string;
  heading: (name: string, occasion: string, days: string) => string;
  intro: string;
  cta: string;
  footer: string;
  pushBody: string;
  fallbackOccasion: string;
}

const COPY: Record<ReminderLocale, Copy> = {
  en: {
    // "is today" / "is tomorrow" / "in 7 days" — 동사를 여기서 붙이므로 제목에는 "is" 를 다시 넣지 않음
    daysText: (n) => (n === 0 ? 'is today' : n === 1 ? 'is tomorrow' : `in ${n} days`),
    subject: (n, o, d) => `${n}'s ${o} ${d}`,
    heading: (n, o, d) => `${n}'s ${o} ${d}`,
    intro: "A heartfelt card takes only 30 seconds.<br>Tap below to make one — we'll have everything ready.",
    cta: '💝 Make a card',
    footer: "You're receiving this because you registered a reminder on DearDay.",
    pushBody: 'Tap to make a card 💝',
    fallbackOccasion: 'Special day'
  },
  ko: {
    daysText: (n) => (n === 0 ? '오늘이에요' : n === 1 ? '내일이에요' : `${n}일 남았어요`),
    subject: (n, o, d) => `${n}님의 ${o} ${d}`,
    heading: (n, o, d) => `${n}님의 ${o}이 ${d}`,
    intro: '마음을 담은 카드, 30초면 완성돼요.<br>아래 버튼으로 시작하면 미리 준비해 둘게요.',
    cta: '💝 카드 만들기',
    footer: 'DearDay에 기념일 알림을 등록해 두셔서 이 메일을 받으셨습니다.',
    pushBody: '카드 만들러 가기 💝',
    fallbackOccasion: '특별한 날'
  }
};

/** 사용자가 입력한 이름·행사명을 이메일 HTML 에 넣기 전 이스케이프 — 태그가 해석되면 메일 내용을 바꿀 수 있음 */
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export interface ReminderMessageInput {
  locale: ReminderLocale;
  personName: string;
  occasion: string;
  /** occasion='other' 일 때 사용자가 정한 이름 */
  occasionLabel?: string | null;
  daysAway: number;
}

function parts(i: ReminderMessageInput) {
  const c = COPY[i.locale];
  const label = OCCASION_LABEL[i.occasion]?.[i.locale] || i.occasionLabel?.trim() || c.fallbackOccasion;
  const emoji = OCCASION_EMOJI[i.occasion] || DEFAULT_EMOJI;
  // 'other' 는 카드 만들기에 같은 id 가 없어 범용(etc) 으로 연다 — 등록 화면의 링크와 같은 규칙
  const cardType = i.occasion === 'other' ? 'etc' : i.occasion;
  return { c, label, emoji, cardUrl: `${BASE_URL}/cards/new?type=${cardType}`, days: c.daysText(i.daysAway) };
}

export function buildReminderEmail(i: ReminderMessageInput) {
  const { c, label, emoji, cardUrl, days } = parts(i);
  const heading = c.heading(i.personName, label, days);
  const subject = `${emoji} ${c.subject(i.personName, label, days)}`;
  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f5f1fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1fa;padding:24px 12px;">
    <tr><td align="center">
      <!-- 고정 폭 대신 100% + max-width — 휴대폰 메일 앱에서 오른쪽이 잘리지 않게 -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(123,94,167,0.1);">
        <tr><td style="padding:32px 24px;text-align:center;">
          <div style="font-size:48px;margin-bottom:8px;">${emoji}</div>
          <h1 style="margin:0 0 8px;font-size:22px;color:#5A3D7A;font-weight:600;">${escapeHtml(heading)}</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#8B7A9E;line-height:1.6;">${c.intro}</p>
          <a href="${cardUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7B5EA7,#5A3D7A);color:white;text-decoration:none;border-radius:999px;font-size:14px;font-weight:600;">${c.cta}</a>
          <p style="margin:32px 0 0;font-size:11px;color:#8B7A9E;line-height:1.5;">
            ${c.footer}<br>
            <a href="${BASE_URL}/reminders" style="color:#7B5EA7;">dearday.sg/reminders</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  return { subject, heading, html, cardUrl };
}

export function buildReminderPush(i: ReminderMessageInput) {
  const { c, label, days, cardUrl } = parts(i);
  return { title: c.heading(i.personName, label, days), body: c.pushBody, url: cardUrl };
}

/**
 * 어떤 경로로 보낼지 — 이메일은 수신 동의 + 주소가 있을 때만.
 * (이전 발송 코드는 동의를 끈 사용자에게도 주소만 있으면 이메일을 보냈다)
 */
export function reminderChannels(u: { emailOptIn: boolean; hasEmail: boolean; pushSubscribed: boolean }) {
  return { email: u.emailOptIn && u.hasEmail, push: u.pushSubscribed };
}

/** 싱가포르 날짜(자정)를 UTC 기준 Date 로 — 날짜 비교 전용 */
function sgDay(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * 다음 행사일과 실제 발송일.
 * 발송 규칙(cron 과 동일): 매일 SEND_HOUR_SG 시에 "행사까지 남은 날 ≤ N" 이고 올해 아직 안 보낸 리마인더를 보낸다.
 * 그래서 등록 시점에 이미 N일 이내라면 바로 다음 발송 시각에 나간다.
 * 존재하지 않는 날짜(2월 30일 등)는 cron 과 같게 다음 달로 넘어간 날로 계산한다.
 */
export function reminderSchedule(
  r: { month: number; day: number; notifyDaysBefore: number },
  now: Date = new Date()
): { eventDate: Date; sendDate: Date; daysAwayAtSend: number } {
  const sgNow = new Date(now.getTime() + SG_OFFSET_MS);
  const today = sgDay(sgNow.getUTCFullYear(), sgNow.getUTCMonth() + 1, sgNow.getUTCDate());
  const thisYear = sgDay(today.getUTCFullYear(), r.month, r.day);
  const eventDate = thisYear >= today ? thisYear : sgDay(today.getUTCFullYear() + 1, r.month, r.day);
  const trigger = new Date(eventDate.getTime() - r.notifyDaysBefore * MS_PER_DAY);
  const firstRun = sgNow.getUTCHours() < SEND_HOUR_SG ? today : new Date(today.getTime() + MS_PER_DAY);
  const sendDate = trigger >= firstRun ? trigger : firstRun;
  // 행사 당일 발송 시각이 이미 지났으면 올해 분은 보낼 수 없어 내년 기준으로 다시 계산
  if (sendDate > eventDate) {
    return reminderSchedule(r, new Date(eventDate.getTime() + MS_PER_DAY - SG_OFFSET_MS + SEND_HOUR_SG * 60 * 60 * 1000));
  }
  return { eventDate, sendDate, daysAwayAtSend: Math.round((eventDate.getTime() - sendDate.getTime()) / MS_PER_DAY) };
}
