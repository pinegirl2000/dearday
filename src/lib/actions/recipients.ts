'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { pool } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { generateRecipientToken } from '@/lib/slug';

interface AuthCheck {
  slug: string;
  ownerToken?: string | null;
}

async function verifyOwner({ slug, ownerToken }: AuthCheck) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || null;
  const email = session?.user?.email || null;

  // 시스템 관리자는 모든 카드 접근 가능
  if (isAdminEmail(email)) {
    const { rows } = await pool.query<{ id: string; rsvp_max_per_card: number }>(
      'SELECT id, rsvp_max_per_card FROM dearday_card WHERE slug=$1 LIMIT 1',
      [slug]
    );
    return rows[0];
  }

  // owner_token 또는 로그인 사용자 user_id 일치 시 소유자 인정
  const params: any[] = [slug];
  const conds: string[] = [];
  if (ownerToken) {
    params.push(ownerToken);
    conds.push(`owner_token = $${params.length}`);
  }
  if (userId) {
    params.push(userId);
    conds.push(`user_id = $${params.length}`);
  }
  if (conds.length === 0) return undefined;

  const { rows } = await pool.query<{ id: string; rsvp_max_per_card: number }>(
    `SELECT id, rsvp_max_per_card FROM dearday_card WHERE slug=$1 AND (${conds.join(' OR ')}) LIMIT 1`,
    params
  );
  return rows[0];
}

export async function listRecipients(slug: string, ownerToken?: string | null) {
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
       v.oneliner AS rsvp_oneliner,
       v.created_at AS rsvp_created_at
     FROM dearday_recipient r
     LEFT JOIN LATERAL (
       SELECT attend, count, adult_count, child_count, attendee_names, oneliner, created_at
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
    rsvp_oneliner: string | null;
    rsvp_created_at: string | null;
  }> };
}

export async function bulkAddRecipients(slug: string, ownerToken: string | null, names: string[]) {
  const card = await verifyOwner({ slug, ownerToken });
  if (!card) return { ok: false as const, error: '권한이 없습니다.' };

  const cleaned = names.map((n) => n.trim()).filter((n) => n.length > 0);
  if (cleaned.length === 0) return { ok: false as const, error: '이름이 비어있습니다.' };

  const inserted: string[] = [];
  for (const name of cleaned) {
    // 충돌 시 재시도 — 6자 31진수 nanoid는 ~10억 조합이라 사실상 안 나지만 안전하게
    let attempt = 0;
    while (attempt < 5) {
      const token = generateRecipientToken();
      try {
        await pool.query(
          'INSERT INTO dearday_recipient (card_id, num, name, group_name) VALUES ($1, $2, $3, $4)',
          [card.id, token, name, '']
        );
        inserted.push(token);
        break;
      } catch (e: any) {
        attempt++;
      }
    }
  }
  revalidatePath(`/cards/${slug}/manage`);
  return { ok: true as const, count: inserted.length };
}

export async function deleteCard(slug: string, ownerToken: string | null) {
  const card = await verifyOwner({ slug, ownerToken });
  if (!card) return { ok: false as const, error: 'Permission denied' };
  await pool.query('DELETE FROM dearday_card WHERE id=$1', [card.id]);
  revalidatePath('/cards');
  return { ok: true as const };
}

export async function deleteRecipient(slug: string, ownerToken: string | null, recipientId: string) {
  const card = await verifyOwner({ slug, ownerToken });
  if (!card) return { ok: false as const, error: '권한이 없습니다.' };
  await pool.query('DELETE FROM dearday_recipient WHERE id=$1 AND card_id=$2', [recipientId, card.id]);
  revalidatePath(`/cards/${slug}/manage`);
  return { ok: true as const };
}
