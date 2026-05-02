'use server';

import { revalidatePath } from 'next/cache';
import { pool } from '@/lib/db';

interface AuthCheck {
  slug: string;
  ownerToken: string;
}

async function verifyOwner({ slug, ownerToken }: AuthCheck) {
  const { rows } = await pool.query<{ id: string; rsvp_max_per_card: number }>(
    'SELECT id, rsvp_max_per_card FROM dearday_card WHERE slug=$1 AND owner_token=$2',
    [slug, ownerToken]
  );
  return rows[0];
}

export async function listRecipients(slug: string, ownerToken: string) {
  const card = await verifyOwner({ slug, ownerToken });
  if (!card) return { ok: false as const, error: '권한이 없습니다.' };
  const { rows } = await pool.query(
    `SELECT
       r.id, r.num, r.name, r.group_name, r.created_at,
       v.attend AS rsvp_attend,
       v.count AS rsvp_count,
       v.adult_count AS rsvp_adult_count,
       v.child_count AS rsvp_child_count,
       v.attendee_names AS rsvp_attendee_names,
       v.created_at AS rsvp_created_at
     FROM dearday_recipient r
     LEFT JOIN LATERAL (
       SELECT attend, count, adult_count, child_count, attendee_names, created_at
       FROM dearday_rsvp
       WHERE recipient_id = r.id
       ORDER BY created_at DESC
       LIMIT 1
     ) v ON true
     WHERE r.card_id=$1
     ORDER BY r.num ASC`,
    [card.id]
  );
  return { ok: true as const, recipients: rows as Array<{
    id: string;
    num: string;
    name: string;
    group_name: string;
    created_at: string;
    rsvp_attend: boolean | null;
    rsvp_count: number | null;
    rsvp_adult_count: number | null;
    rsvp_child_count: number | null;
    rsvp_attendee_names: string[] | null;
    rsvp_created_at: string | null;
  }> };
}

export async function bulkAddRecipients(slug: string, ownerToken: string, names: string[]) {
  const card = await verifyOwner({ slug, ownerToken });
  if (!card) return { ok: false as const, error: '권한이 없습니다.' };

  const cleaned = names.map((n) => n.trim()).filter((n) => n.length > 0);
  if (cleaned.length === 0) return { ok: false as const, error: '이름이 비어있습니다.' };

  // 다음 num 시작점
  const { rows: maxRows } = await pool.query(
    'SELECT COALESCE(MAX(CAST(num AS INTEGER)), 0) as max FROM dearday_recipient WHERE card_id=$1',
    [card.id]
  );
  let next = (maxRows[0]?.max || 0) + 1;

  const inserted: string[] = [];
  for (const name of cleaned) {
    const num = String(next).padStart(3, '0');
    try {
      await pool.query(
        'INSERT INTO dearday_recipient (card_id, num, name, group_name) VALUES ($1, $2, $3, $4)',
        [card.id, num, name, '']
      );
      inserted.push(num);
      next++;
    } catch (e: any) {
      // duplicate num skip
      next++;
    }
  }
  revalidatePath(`/cards/${slug}/manage`);
  return { ok: true as const, count: inserted.length };
}

export async function deleteRecipient(slug: string, ownerToken: string, recipientId: string) {
  const card = await verifyOwner({ slug, ownerToken });
  if (!card) return { ok: false as const, error: '권한이 없습니다.' };
  await pool.query('DELETE FROM dearday_recipient WHERE id=$1 AND card_id=$2', [recipientId, card.id]);
  revalidatePath(`/cards/${slug}/manage`);
  return { ok: true as const };
}
