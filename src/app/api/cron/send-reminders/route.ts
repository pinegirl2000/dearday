// Reminder 이메일 발송 cron — Vercel Cron에서 매일 1회 호출 (예: 08:00 SGT)
// 보안: CRON_SECRET 환경변수와 Authorization header 검증

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import webpush from 'web-push';
import { pool } from '@/lib/db';

// Web Push VAPID 설정 (env vars 있을 때만 유효)
const VAPID_PUB = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIV = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUB = process.env.VAPID_SUBJECT || 'mailto:reminders@dearday.sg';
if (VAPID_PUB && VAPID_PRIV) {
  webpush.setVapidDetails(VAPID_SUB, VAPID_PUB, VAPID_PRIV);
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'reminders@dearday.sg';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'DearDay';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://dearday.sg';

interface EmailCopy {
  subjectFmt: (name: string, occasion: string, daysText: string) => string;
  heading: (name: string, occasion: string, daysText: string) => string;
  intro: string;
  cta: string;
  footer: string;
  daysToText: (n: number) => string;
}

const COPY: Record<'en' | 'ko', EmailCopy> = {
  en: {
    subjectFmt: (n, o, d) => `🎂 ${n}'s ${o} ${d}`,
    heading:    (n, o, d) => `${n}'s ${o} is ${d}`,
    intro:      "A heartfelt card takes only 30 seconds.<br>Tap below to make one — we'll have everything ready.",
    cta:        '💝 Make a card',
    footer:     "You're receiving this because you registered a reminder on DearDay.",
    daysToText: (n) => (n === 0 ? 'is today' : n === 1 ? 'is tomorrow' : `in ${n} days`)
  },
  ko: {
    subjectFmt: (n, o, d) => `🎂 ${n}님의 ${o} ${d}`,
    heading:    (n, o, d) => `${n}님의 ${o}이 ${d}`,
    intro:      '마음을 담은 카드, 30초면 완성돼요.<br>아래 버튼으로 시작하면 미리 준비해 둘게요.',
    cta:        '💝 카드 만들기',
    footer:     'DearDay에 기념일 알림을 등록해 두셔서 이 메일을 받으셨습니다.',
    daysToText: (n) => (n === 0 ? '오늘이에요' : n === 1 ? '내일이에요' : `${n}일 남았어요`)
  }
};

const OCCASION_LABEL_BY_LOCALE: Record<string, { en: string; ko: string }> = {
  'birthday':              { en: 'Birthday',            ko: '생일' },
  'mothers-day':           { en: "Mother's Day",        ko: '어머니의 날' },
  'fathers-day':           { en: "Father's Day",        ko: '아버지의 날' },
  'wedding-anniversary':   { en: 'Wedding Anniversary', ko: '결혼기념일' },
  'graduation':            { en: 'Graduation',          ko: '졸업' }
};

function buildEmailHtml(
  locale: 'en' | 'ko',
  personName: string,
  occasionLabel: string,
  occasionEmoji: string,
  daysAway: number,
  occasionId: string
): { subject: string; html: string } {
  const c = COPY[locale];
  const daysText = c.daysToText(daysAway);
  const cardUrl = `${BASE_URL}/cards/new?type=${occasionId}`;
  const subject = c.subjectFmt(personName, occasionLabel, daysText);
  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f5f1fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1fa;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(123,94,167,0.1);">
        <tr><td style="padding:36px 32px;text-align:center;">
          <div style="font-size:48px;margin-bottom:8px;">${occasionEmoji}</div>
          <h1 style="margin:0 0 8px;font-size:22px;color:#5A3D7A;font-weight:600;">
            ${c.heading(personName, occasionLabel, daysText)}
          </h1>
          <p style="margin:0 0 24px;font-size:14px;color:#8B7A9E;line-height:1.6;">
            ${c.intro}
          </p>
          <a href="${cardUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7B5EA7,#5A3D7A);color:white;text-decoration:none;border-radius:999px;font-size:14px;font-weight:600;">
            ${c.cta}
          </a>
          <p style="margin:32px 0 0;font-size:11px;color:#B8AABE;line-height:1.5;">
            ${c.footer}<br>
            <a href="${BASE_URL}/reminders" style="color:#7B5EA7;">dearday.sg/reminders</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  return { subject, html };
}

export async function GET(req: NextRequest) {
  // 보안 — Vercel Cron의 Authorization header
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }
  const resend = new Resend(apiKey);

  const now = new Date();
  const currentYear = now.getFullYear();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();
  const todayMidnight = new Date(currentYear, todayMonth - 1, todayDay);

  try {
    // opt-in한 사용자의 reminder 중 알림 trigger 도달한 것
    const { rows } = await pool.query<{
      reminder_id: string;
      user_email: string | null;
      user_locale: string | null;
      push_subscription: any;
      person_name: string;
      occasion: string;
      occasion_label: string | null;
      event_month: number;
      event_day: number;
      notify_days_before: number;
      last_notified_year: number | null;
    }>(`
      SELECT r.id AS reminder_id, u.email AS user_email, u.preferred_locale AS user_locale,
             u.reminder_push_subscription AS push_subscription,
             r.person_name, r.occasion, r.occasion_label,
             r.event_month, r.event_day, r.notify_days_before, r.last_notified_year
      FROM dearday_reminder r
      JOIN dearday_user u ON u.id = r.user_id
      WHERE r.email_enabled = true
        AND (u.reminder_email_opt_in = true OR u.reminder_push_subscription IS NOT NULL)
    `);

    const occasionEmoji: Record<string, string> = {
      'birthday': '🎂', 'mothers-day': '💝', 'fathers-day': '💙',
      'wedding-anniversary': '💑', 'graduation': '🎓'
    };

    let emailCount = 0;
    let pushCount = 0;
    const errors: string[] = [];

    for (const r of rows) {
      // 이번 해 또는 내년 이벤트 중 가까운 것
      const thisYear = new Date(currentYear, r.event_month - 1, r.event_day);
      const nextYear = new Date(currentYear + 1, r.event_month - 1, r.event_day);
      const target = thisYear >= todayMidnight ? thisYear : nextYear;
      const targetYear = target.getFullYear();
      const daysAway = Math.round((target.getTime() - todayMidnight.getTime()) / (24 * 60 * 60 * 1000));

      // trigger 조건: 오늘 = D-N (또는 더 가까움) AND 이번 해 아직 안 보냄
      if (daysAway > r.notify_days_before) continue;
      if (r.last_notified_year === targetYear) continue;

      const locale: 'en' | 'ko' = (r.user_locale === 'ko' ? 'ko' : 'en');
      const localeLabels = OCCASION_LABEL_BY_LOCALE[r.occasion];
      const occasionLabel = localeLabels
        ? localeLabels[locale]
        : (r.occasion_label || (locale === 'ko' ? '특별한 날' : 'Special day'));
      const emoji = occasionEmoji[r.occasion] || '📅';

      let anySent = false;

      // (A) 이메일 — opt-in + email 있는 경우
      if (r.user_email) {
        const { subject, html } = buildEmailHtml(locale, r.person_name, occasionLabel, emoji, daysAway, r.occasion);
        try {
          await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: [r.user_email],
            subject,
            html
          });
          emailCount++;
          anySent = true;
        } catch (e: any) {
          errors.push(`email/${r.reminder_id}: ${e.message}`);
        }
      }

      // (B) Web Push — subscription 있는 경우
      if (r.push_subscription && VAPID_PUB && VAPID_PRIV) {
        try {
          const sub = typeof r.push_subscription === 'string'
            ? JSON.parse(r.push_subscription)
            : r.push_subscription;
          const c = COPY[locale];
          const daysText = c.daysToText(daysAway);
          const pushPayload = JSON.stringify({
            title: c.heading(r.person_name, occasionLabel, daysText),
            body: locale === 'ko' ? '카드 만들러 가기 💝' : 'Tap to make a card 💝',
            icon: '/icon-192.png',
            tag: `reminder-${r.reminder_id}`,
            data: { url: `/cards/new?type=${r.occasion}` }
          });
          await webpush.sendNotification(sub, pushPayload);
          pushCount++;
          anySent = true;
        } catch (e: any) {
          errors.push(`push/${r.reminder_id}: ${e.message}`);
          // 만료된 subscription은 자동 제거 (410 Gone, 404)
          if (e.statusCode === 404 || e.statusCode === 410) {
            await pool.query('UPDATE dearday_user SET reminder_push_subscription=NULL WHERE id=(SELECT user_id FROM dearday_reminder WHERE id=$1)', [r.reminder_id]);
          }
        }
      }

      // 중복 방지 — 한 채널이라도 보냈으면 last_notified_year 갱신
      if (anySent) {
        await pool.query(
          'UPDATE dearday_reminder SET last_notified_year=$1 WHERE id=$2',
          [targetYear, r.reminder_id]
        );
      }
    }

    return NextResponse.json({
      ok: true,
      emails_sent: emailCount,
      push_sent: pushCount,
      total_candidates: rows.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (e: any) {
    console.error('send-reminders error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
