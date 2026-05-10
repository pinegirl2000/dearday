'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { pool } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';

export type EventCardType = 'invitation' | 'thankcard' | 'congrats';

export interface EventRow {
  id: string;
  label: string;
  emoji: string;
  is_default: boolean;
  sort_order: number;
  card_type: EventCardType;
}

/** event_type → card_type lookup. 발행된 카드 렌더링에 사용 */
export async function getEventCardType(eventType: string | null | undefined): Promise<EventCardType> {
  if (!eventType) return 'invitation';
  try {
    const { rows } = await pool.query<{ card_type: EventCardType }>(
      "SELECT COALESCE(card_type, 'invitation') AS card_type FROM dearday_event WHERE id=$1",
      [eventType]
    );
    return rows[0]?.card_type || 'invitation';
  } catch {
    return 'invitation';
  }
}

/** 모든 이벤트 — DB가 source of truth (default 6개 + 커스텀) */
export async function getAllEvents(): Promise<EventRow[]> {
  try {
    const { rows } = await pool.query<EventRow>(
      "SELECT id, label, emoji, is_default, sort_order, COALESCE(card_type, 'invitation') AS card_type FROM dearday_event ORDER BY sort_order ASC, created_at ASC"
    );
    return rows;
  } catch (e) {
    console.error('getAllEvents error:', e);
    return [];
  }
}

const ID_RE = /^[a-z0-9][a-z0-9_-]{0,30}$/i;

export async function addEvent(
  id: string,
  label: string,
  emoji: string,
  cardType: EventCardType = 'invitation'
): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) return { ok: false, error: 'Permission denied' };
  const cleanId = id.trim().toLowerCase();
  const cleanLabel = label.trim();
  const cleanEmoji = (emoji || '🎉').trim();
  const ct: EventCardType = (cardType === 'thankcard' || cardType === 'congrats') ? cardType : 'invitation';
  if (!ID_RE.test(cleanId)) return { ok: false, error: 'id는 영문/숫자/-/_ 만 사용 (1~30자)' };
  if (!cleanLabel) return { ok: false, error: 'label 누락' };
  try {
    await pool.query(
      `INSERT INTO dearday_event (id, label, emoji, is_default, sort_order, card_type, created_by)
       VALUES ($1, $2, $3, false, 100, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [cleanId, cleanLabel, cleanEmoji, ct, session?.user?.email || null]
    );
    revalidatePath('/admin/templates');
    revalidatePath('/cards/new');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** label/emoji/card_type 수정 — default 이벤트도 admin이 수정 가능 (id는 못 바꿈) */
export async function updateEvent(
  id: string,
  label: string,
  emoji: string,
  cardType?: EventCardType
): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) return { ok: false, error: 'Permission denied' };
  const cleanLabel = label.trim();
  const cleanEmoji = (emoji || '🎉').trim();
  if (!cleanLabel) return { ok: false, error: 'label 누락' };
  try {
    if (cardType !== undefined) {
      const ct: EventCardType = (cardType === 'thankcard' || cardType === 'congrats') ? cardType : 'invitation';
      await pool.query(
        'UPDATE dearday_event SET label=$1, emoji=$2, card_type=$3, updated_at=NOW() WHERE id=$4',
        [cleanLabel, cleanEmoji, ct, id]
      );
    } else {
      await pool.query(
        'UPDATE dearday_event SET label=$1, emoji=$2, updated_at=NOW() WHERE id=$3',
        [cleanLabel, cleanEmoji, id]
      );
    }
    revalidatePath('/admin/templates');
    revalidatePath('/cards/new');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** 이벤트 순서 일괄 저장 — id 배열을 받아 sort_order를 10/20/30... 식으로 재할당 */
export async function reorderEvents(orderedIds: string[]): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) return { ok: false, error: 'Permission denied' };
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return { ok: false, error: '순서 비어있음' };
  try {
    // 트랜잭션으로 일괄 update
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < orderedIds.length; i++) {
        const newOrder = (i + 1) * 10;
        await client.query('UPDATE dearday_event SET sort_order=$1 WHERE id=$2', [newOrder, orderedIds[i]]);
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    revalidatePath('/admin/templates');
    revalidatePath('/cards/new');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** custom 이벤트만 삭제 가능 (default는 못 지움) */
export async function deleteEvent(id: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) return { ok: false, error: 'Permission denied' };
  try {
    const { rows } = await pool.query<{ is_default: boolean }>(
      'SELECT is_default FROM dearday_event WHERE id=$1',
      [id]
    );
    if (rows[0]?.is_default) return { ok: false, error: 'Default 이벤트는 삭제할 수 없습니다 (label/emoji만 수정 가능)' };
    await pool.query('DELETE FROM dearday_event WHERE id=$1', [id]);
    revalidatePath('/admin/templates');
    revalidatePath('/cards/new');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
