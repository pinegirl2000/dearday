'use server';

import { revalidatePath } from 'next/cache';
import { pool } from '@/lib/db';

interface RsvpInput {
  card_id: string;
  slug: string;
  recipient_id?: string;
  attend: boolean;
  adult_count: number;
  child_count: number;
  attendee_names: string[];
  oneliner: string;
}

interface RsvpResult {
  ok: boolean;
  error?: string;
}

export async function submitRsvp(input: RsvpInput): Promise<RsvpResult> {
  if (!input.card_id) return { ok: false, error: '카드 정보가 없습니다.' };

  try {
    // 카드 조회 (마감일/제한 검증)
    const { rows: cardRows } = await pool.query(
      'SELECT rsvp_enabled, rsvp_deadline, rsvp_max_per_card FROM dearday_card WHERE id = $1',
      [input.card_id]
    );
    const card = cardRows[0];
    if (!card) return { ok: false, error: '카드를 찾을 수 없습니다.' };
    if (!card.rsvp_enabled) return { ok: false, error: '이 카드는 RSVP를 받지 않습니다.' };
    if (card.rsvp_deadline && new Date(card.rsvp_deadline) < new Date()) {
      return { ok: false, error: 'RSVP 마감일이 지났습니다.' };
    }

    const max = card.rsvp_max_per_card || 4;
    const adult = input.attend ? Math.max(0, Math.min(max, input.adult_count ?? 1)) : 0;
    const child = input.attend ? Math.max(0, Math.min(max, input.child_count ?? 0)) : 0;
    const safeCount = input.attend ? Math.max(1, Math.min(max, adult + child)) : 0;
    const oneliner = (input.oneliner || '').trim().slice(0, 200) || null;

    await pool.query(
      `INSERT INTO dearday_rsvp (card_id, recipient_id, attend, count, adult_count, child_count, attendee_names, oneliner)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [input.card_id, input.recipient_id || null, input.attend, safeCount, adult, child, input.attendee_names || [], oneliner]
    );

    revalidatePath(`/i/${input.slug}`);
    return { ok: true };
  } catch (e: any) {
    console.error('submitRsvp error:', e);
    return { ok: false, error: e.message || '응답 저장 실패' };
  }
}

export async function getRsvpStats(cardId: string) {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE attend = true)::int AS attending_groups,
       COALESCE(SUM(count) FILTER (WHERE attend = true), 0)::int AS attending_count,
       COALESCE(SUM(adult_count) FILTER (WHERE attend = true), 0)::int AS attending_adults,
       COALESCE(SUM(child_count) FILTER (WHERE attend = true), 0)::int AS attending_children,
       COUNT(*) FILTER (WHERE attend = false)::int AS declined
     FROM dearday_rsvp WHERE card_id = $1`,
    [cardId]
  );
  return rows[0] as { attending_groups: number; attending_count: number; attending_adults: number; attending_children: number; declined: number };
}

export async function getOnelinerFeed(cardId: string, limit = 50) {
  const { rows } = await pool.query(
    `SELECT id, attend, count, oneliner, created_at
     FROM dearday_rsvp
     WHERE card_id = $1 AND oneliner IS NOT NULL AND length(trim(oneliner)) > 0
     ORDER BY created_at DESC
     LIMIT $2`,
    [cardId, limit]
  );
  return rows as Array<{ id: string; attend: boolean; count: number; oneliner: string; created_at: string }>;
}
