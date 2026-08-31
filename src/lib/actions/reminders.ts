'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { pool } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export interface Reminder {
  id: string;
  user_id: string;
  person_name: string;
  occasion: string;
  occasion_label: string | null;
  event_month: number;
  event_day: number;
  notify_days_before: number;
  email_enabled: boolean;
  push_enabled: boolean;
  last_notified_year: number | null;
  created_at: string;
  updated_at: string;
}

async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id || null;
}

/** 본인 reminder 목록 (날짜 가까운 순) */
export async function listReminders(): Promise<Reminder[]> {
  const userId = await requireUserId();
  if (!userId) return [];
  const { rows } = await pool.query<Reminder>(
    'SELECT * FROM dearday_reminder WHERE user_id=$1 ORDER BY event_month, event_day',
    [userId]
  );
  return rows;
}

/** 다가오는 reminder (오늘부터 N일 이내) — 메인 banner 등에서 사용 */
export async function getUpcomingReminders(daysAhead: number = 14): Promise<Array<Reminder & { days_away: number }>> {
  const userId = await requireUserId();
  if (!userId) return [];
  const now = new Date();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();
  const currentYear = now.getFullYear();

  const { rows } = await pool.query<Reminder>(
    'SELECT * FROM dearday_reminder WHERE user_id=$1',
    [userId]
  );

  const upcoming: Array<Reminder & { days_away: number }> = [];
  for (const r of rows) {
    // 이번 해 또는 내년 발생일 중 가까운 것
    const thisYear = new Date(currentYear, r.event_month - 1, r.event_day);
    const nextYear = new Date(currentYear + 1, r.event_month - 1, r.event_day);
    const todayMidnight = new Date(currentYear, todayMonth - 1, todayDay);
    const target = thisYear >= todayMidnight ? thisYear : nextYear;
    const diffMs = target.getTime() - todayMidnight.getTime();
    const daysAway = Math.round(diffMs / (24 * 60 * 60 * 1000));
    if (daysAway >= 0 && daysAway <= daysAhead) {
      upcoming.push({ ...r, days_away: daysAway });
    }
  }
  upcoming.sort((a, b) => a.days_away - b.days_away);
  return upcoming;
}

export async function createReminder(input: {
  person_name: string;
  occasion: string;
  occasion_label?: string | null;
  event_month: number;
  event_day: number;
  notify_days_before?: number;
  email_enabled?: boolean;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Login required' };
  const name = input.person_name.trim();
  if (!name) return { ok: false, error: 'Name required' };
  if (input.event_month < 1 || input.event_month > 12) return { ok: false, error: 'Invalid month' };
  if (input.event_day < 1 || input.event_day > 31) return { ok: false, error: 'Invalid day' };

  try {
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO dearday_reminder
         (user_id, person_name, occasion, occasion_label, event_month, event_day, notify_days_before, email_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        userId,
        name,
        input.occasion,
        input.occasion_label || null,
        input.event_month,
        input.event_day,
        input.notify_days_before ?? 7,
        input.email_enabled ?? true
      ]
    );
    revalidatePath('/reminders');
    revalidatePath('/');
    return { ok: true, id: rows[0].id };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function updateReminder(id: string, input: Partial<Omit<Reminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Login required' };
  try {
    await pool.query(
      `UPDATE dearday_reminder SET
         person_name = COALESCE($2, person_name),
         occasion = COALESCE($3, occasion),
         occasion_label = COALESCE($4, occasion_label),
         event_month = COALESCE($5, event_month),
         event_day = COALESCE($6, event_day),
         notify_days_before = COALESCE($7, notify_days_before),
         email_enabled = COALESCE($8, email_enabled),
         updated_at = NOW()
       WHERE id = $1 AND user_id = $9`,
      [
        id,
        input.person_name ?? null,
        input.occasion ?? null,
        input.occasion_label ?? null,
        input.event_month ?? null,
        input.event_day ?? null,
        input.notify_days_before ?? null,
        input.email_enabled ?? null,
        userId
      ]
    );
    revalidatePath('/reminders');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function deleteReminder(id: string): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Login required' };
  try {
    await pool.query('DELETE FROM dearday_reminder WHERE id=$1 AND user_id=$2', [id, userId]);
    revalidatePath('/reminders');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** 사용자 이메일 알림 opt-in 상태 + locale 조회 */
export async function getReminderOptIn(): Promise<{ email: boolean; pushSubscribed: boolean; locale: 'en' | 'ko' }> {
  const userId = await requireUserId();
  if (!userId) return { email: false, pushSubscribed: false, locale: 'en' };
  const { rows } = await pool.query<{
    reminder_email_opt_in: boolean;
    reminder_push_subscription: any;
    preferred_locale: string | null;
  }>(
    'SELECT reminder_email_opt_in, reminder_push_subscription, preferred_locale FROM dearday_user WHERE id=$1',
    [userId]
  );
  const localeRaw = rows[0]?.preferred_locale || 'en';
  return {
    email: !!rows[0]?.reminder_email_opt_in,
    pushSubscribed: !!rows[0]?.reminder_push_subscription,
    locale: (localeRaw === 'ko' ? 'ko' : 'en')
  };
}

/** PWA push subscription 저장 (JSON 객체 — endpoint + keys) */
export async function savePushSubscription(subscription: any): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Login required' };
  try {
    await pool.query(
      'UPDATE dearday_user SET reminder_push_subscription=$2 WHERE id=$1',
      [userId, JSON.stringify(subscription)]
    );
    revalidatePath('/reminders');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function removePushSubscription(): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Login required' };
  try {
    await pool.query('UPDATE dearday_user SET reminder_push_subscription=NULL WHERE id=$1', [userId]);
    revalidatePath('/reminders');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function setReminderLocale(locale: 'en' | 'ko'): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Login required' };
  try {
    await pool.query('UPDATE dearday_user SET preferred_locale=$2 WHERE id=$1', [userId, locale]);
    revalidatePath('/reminders');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function setReminderEmailOptIn(optIn: boolean): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Login required' };
  try {
    await pool.query('UPDATE dearday_user SET reminder_email_opt_in=$2 WHERE id=$1', [userId, optIn]);
    revalidatePath('/reminders');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
