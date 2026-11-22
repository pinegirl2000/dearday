// Reminder 이메일 발송 cron — Vercel Cron에서 매일 1회 호출 (예: 08:00 SGT)
// 보안: CRON_SECRET 환경변수와 Authorization header 검증

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import webpush from 'web-push';
import { pool } from '@/lib/db';
import { buildReminderEmail, buildReminderPush, reminderChannels } from '@/lib/reminder-message';

// Web Push VAPID 설정 (env vars 있을 때만 유효)
const VAPID_PUB = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIV = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUB = process.env.VAPID_SUBJECT || 'mailto:reminders@dearday.sg';
if (VAPID_PUB && VAPID_PRIV) {
  webpush.setVapidDetails(VAPID_SUB, VAPID_PUB, VAPID_PRIV);
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 문구·발송 경로는 등록 화면 미리보기와 같은 공유 모듈을 쓴다 — 미리보기와 실제가 달라지지 않게
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'reminders@dearday.sg';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'DearDay';

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
      email_opt_in: boolean | null;
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
             u.reminder_email_opt_in AS email_opt_in,
             u.reminder_push_subscription AS push_subscription,
             r.person_name, r.occasion, r.occasion_label,
             r.event_month, r.event_day, r.notify_days_before, r.last_notified_year
      FROM dearday_reminder r
      JOIN dearday_user u ON u.id = r.user_id
      WHERE r.email_enabled = true
        AND (u.reminder_email_opt_in = true OR u.reminder_push_subscription IS NOT NULL)
    `);

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
      const msgInput = { locale, personName: r.person_name, occasion: r.occasion, occasionLabel: r.occasion_label, daysAway };
      // 이메일은 수신 동의한 사용자에게만 — 예전에는 동의를 꺼도 주소가 있으면 보냈음
      const channels = reminderChannels({ emailOptIn: !!r.email_opt_in, hasEmail: !!r.user_email, pushSubscribed: !!r.push_subscription });

      let anySent = false;

      // (A) 이메일 — opt-in + email 있는 경우
      if (channels.email && r.user_email) {
        const { subject, html } = buildReminderEmail(msgInput);
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
      if (channels.push && VAPID_PUB && VAPID_PRIV) {
        try {
          const sub = typeof r.push_subscription === 'string'
            ? JSON.parse(r.push_subscription)
            : r.push_subscription;
          const push = buildReminderPush(msgInput);
          const pushPayload = JSON.stringify({
            title: push.title,
            body: push.body,
            icon: '/icon-192.png',
            tag: `reminder-${r.reminder_id}`,
            data: { url: new URL(push.url).pathname + new URL(push.url).search }
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
