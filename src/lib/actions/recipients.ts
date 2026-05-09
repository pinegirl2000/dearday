'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { pool } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { generateRecipientToken } from '@/lib/slug';
import { sendInvitationEmail } from '@/lib/email/sendInvitation';
import { COLOR_PALETTES, resolveColorId, type EnvelopeColorId } from '@/components/envelopes/palettes';

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
       r.email, r.delivery_method, r.sent_at, r.sent_status, r.read_at,
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
     ORDER BY r.created_at ASC, r.id ASC`,
    [card.id]
  );
  return { ok: true as const, recipients: rows as Array<{
    id: string;
    num: string;
    name: string;
    group_name: string;
    created_at: string;
    email: string | null;
    delivery_method: string | null;
    sent_at: string | null;
    sent_status: string | null;
    read_at: string | null;
    rsvp_attend: boolean | null;
    rsvp_count: number | null;
    rsvp_adult_count: number | null;
    rsvp_child_count: number | null;
    rsvp_attendee_names: string[] | null;
    rsvp_oneliner: string | null;
    rsvp_created_at: string | null;
  }> };
}

// 단일/벌크 — name + 선택적 email + delivery_method 함께 추가
export async function addRecipientsWithDetails(
  slug: string,
  ownerToken: string | null,
  items: Array<{ name: string; email?: string | null }>,
  deliveryMethod: 'link' | 'email'
) {
  const card = await verifyOwner({ slug, ownerToken });
  if (!card) return { ok: false as const, error: '권한이 없습니다.' };

  const cleaned = items
    .map((it) => ({ name: (it.name || '').trim(), email: (it.email || '').trim() || null }))
    .filter((it) => it.name.length > 0);
  if (cleaned.length === 0) return { ok: false as const, error: '이름이 비어있습니다.' };

  // email 모드인데 이메일 없는 항목이 있으면 거부
  if (deliveryMethod === 'email') {
    const missing = cleaned.filter((it) => !it.email);
    if (missing.length > 0) {
      return { ok: false as const, error: `이메일 발송 모드에서는 모든 수신자에게 이메일이 필요합니다. 누락된 ${missing.length}명: ${missing.map((m) => m.name).join(', ')}` };
    }
  }

  const insertedIds: string[] = [];
  for (const item of cleaned) {
    let attempt = 0;
    while (attempt < 5) {
      const token = generateRecipientToken();
      try {
        const { rows } = await pool.query<{ id: string }>(
          `INSERT INTO dearday_recipient (card_id, num, name, group_name, email, delivery_method, sent_status)
           VALUES ($1, $2, $3, $4, $5, $6, 'pending')
           RETURNING id`,
          [card.id, token, item.name, '', item.email, deliveryMethod]
        );
        insertedIds.push(rows[0].id);
        break;
      } catch (e: any) {
        attempt++;
      }
    }
  }
  revalidatePath(`/cards/${slug}/manage`);
  return { ok: true as const, count: insertedIds.length, recipientIds: insertedIds };
}

// 이메일 발송 — 등록된 recipient들 중 email이 있는 대상에게만 발송
export async function sendInvitationsToRecipients(
  slug: string,
  ownerToken: string | null,
  recipientIds: string[]
) {
  const card = await verifyOwner({ slug, ownerToken });
  if (!card) return { ok: false as const, error: '권한이 없습니다.' };

  const { rows: cardRow } = await pool.query<{
    slug: string; title: string; greeting_oneliner: string | null;
    envelope_anim: string | null; contact_name: string | null; event_date: string | null;
  }>(
    'SELECT slug, title, greeting_oneliner, envelope_anim, contact_name, event_date FROM dearday_card WHERE id=$1 LIMIT 1',
    [card.id]
  );
  const cardData = cardRow[0];
  if (!cardData) return { ok: false as const, error: 'Card not found' };

  // 카드 envelope_anim에서 palette 파싱 — 'type:color' 또는 legacy 'envelope-N'
  const envColorId = ((): EnvelopeColorId => {
    const a = cardData.envelope_anim || '';
    if (a.includes(':')) return resolveColorId(a.split(':')[1]);
    const legacy: Record<string, string> = {
      'envelope-1': 'lavender', 'envelope-2': 'beige', 'envelope-3': 'mint',
      'envelope-4': 'coral', 'envelope-5': 'lightblue', 'envelope-6': 'blackgold'
    };
    return resolveColorId(legacy[a] || 'lavender');
  })();
  const palette = COLOR_PALETTES[envColorId];

  if (!recipientIds || recipientIds.length === 0) {
    return { ok: false as const, error: 'No recipients selected' };
  }

  const { rows: rs } = await pool.query<{ id: string; num: string; name: string; email: string | null }>(
    `SELECT id, num, name, email FROM dearday_recipient
     WHERE card_id=$1 AND id = ANY($2::uuid[])`,
    [card.id, recipientIds]
  );

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://dearday.sg';
  let sent = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const r of rs) {
    if (!r.email) {
      failed++;
      failures.push(`${r.name}: 이메일 없음`);
      await pool.query(
        'UPDATE dearday_recipient SET sent_status=$1 WHERE id=$2',
        ['failed', r.id]
      );
      continue;
    }
    const url = `${baseUrl}/i/${cardData.slug}/${r.num}?v=2`;
    const result = await sendInvitationEmail({
      to: r.email,
      recipientName: r.name,
      cardTitle: cardData.title,
      greeting: cardData.greeting_oneliner,
      senderName: cardData.contact_name,
      eventDate: cardData.event_date,
      invitationUrl: url,
      palette: {
        body: palette.body,
        bodyTint: palette.bodyTint,
        bodyMid: palette.bodyMid,
        bodyDark: palette.bodyDark,
        flap: palette.flap,
        flapShadow: palette.flapShadow,
        ink: palette.ink,
        goldHighlight: palette.goldHighlight,
        goldLight: palette.goldLight,
        gold: palette.gold,
        goldDeep: palette.goldDeep
      }
    });
    if (result.ok) {
      sent++;
      await pool.query(
        'UPDATE dearday_recipient SET sent_status=$1, sent_at=NOW() WHERE id=$2',
        ['sent', r.id]
      );
    } else {
      failed++;
      failures.push(`${r.name}: ${result.error}`);
      await pool.query(
        'UPDATE dearday_recipient SET sent_status=$1 WHERE id=$2',
        ['failed', r.id]
      );
    }
  }

  revalidatePath(`/cards/${slug}/manage`);
  return { ok: true as const, sent, failed, failures };
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

export async function updateRecipientName(
  slug: string,
  ownerToken: string | null,
  recipientId: string,
  name: string
) {
  const card = await verifyOwner({ slug, ownerToken });
  if (!card) return { ok: false as const, error: '권한이 없습니다.' };
  const trimmed = name.trim();
  if (!trimmed) return { ok: false as const, error: '이름을 입력하세요.' };
  await pool.query(
    'UPDATE dearday_recipient SET name=$1 WHERE id=$2 AND card_id=$3',
    [trimmed, recipientId, card.id]
  );
  revalidatePath(`/cards/${slug}/manage`);
  return { ok: true as const };
}
