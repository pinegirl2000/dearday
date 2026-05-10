'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { pool } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';

export interface CustomEvent {
  id: string;
  label: string;
  emoji: string;
}

export async function getAllCustomEvents(): Promise<CustomEvent[]> {
  try {
    const { rows } = await pool.query<CustomEvent>(
      'SELECT id, label, emoji FROM dearday_event_custom ORDER BY sort_order ASC, created_at ASC'
    );
    return rows;
  } catch (e) {
    console.error('getAllCustomEvents error:', e);
    return [];
  }
}

const ID_RE = /^[a-z0-9][a-z0-9_-]{0,30}$/i;

export async function addCustomEvent(
  id: string,
  label: string,
  emoji: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) return { ok: false, error: 'Permission denied' };
  const cleanId = id.trim().toLowerCase();
  const cleanLabel = label.trim();
  const cleanEmoji = (emoji || '🎉').trim();
  if (!ID_RE.test(cleanId)) return { ok: false, error: 'id는 영문/숫자/-/_ 만 사용 (1~30자)' };
  if (!cleanLabel) return { ok: false, error: 'label 누락' };
  // 코드 EVENT_TYPES와 충돌 방지
  const reserved = ['wedding', 'birthday', 'baptism', 'meeting', 'opening', 'etc'];
  if (reserved.includes(cleanId)) return { ok: false, error: '예약된 id입니다' };
  try {
    await pool.query(
      `INSERT INTO dearday_event_custom (id, label, emoji, created_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [cleanId, cleanLabel, cleanEmoji, session?.user?.email || null]
    );
    revalidatePath('/admin/templates');
    revalidatePath('/cards/new');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function deleteCustomEvent(id: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) return { ok: false, error: 'Permission denied' };
  try {
    await pool.query('DELETE FROM dearday_event_custom WHERE id=$1', [id]);
    revalidatePath('/admin/templates');
    revalidatePath('/cards/new');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
