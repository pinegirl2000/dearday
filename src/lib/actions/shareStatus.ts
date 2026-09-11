'use server';

import { customAlphabet } from 'nanoid';
import { getServerSession } from 'next-auth';
import { pool } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';

/**
 * 응답 현황 공유 링크 — 로그인 없이 볼 수 있는 읽기 전용 페이지(/r/[slug]/[token]).
 *
 * - share_token은 owner_token과 별개. 편집·삭제 권한 없음, 명단+응답 상태만 열람.
 * - 발급/재발급은 소유자만. 재발급하면 이전 링크는 즉시 무효.
 * - 조회는 slug + token 일치 시에만. 개인 초대 링크(num)는 절대 내려주지 않음
 *   (열람자가 남의 초대장을 열어 대신 응답하는 것 방지).
 */

const shareNano = customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 12);

async function verifyOwner(slug: string, ownerToken?: string | null) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || null;
  const email = session?.user?.email || null;

  if (isAdminEmail(email)) {
    const { rows } = await pool.query<{ id: string }>('SELECT id FROM dearday_card WHERE slug=$1 LIMIT 1', [slug]);
    return rows[0];
  }
  const params: any[] = [slug];
  const conds: string[] = [];
  if (ownerToken) { params.push(ownerToken); conds.push(`owner_token = $${params.length}`); }
  if (userId) { params.push(userId); conds.push(`user_id = $${params.length}`); }
  if (conds.length === 0) return undefined;
  const { rows } = await pool.query<{ id: string }>(
    `SELECT id FROM dearday_card WHERE slug=$1 AND (${conds.join(' OR ')}) LIMIT 1`,
    params
  );
  return rows[0];
}

/** 소유자: 공유 토큰을 가져오고, 없으면 새로 발급 */
export async function ensureShareToken(slug: string, ownerToken?: string | null): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const card = await verifyOwner(slug, ownerToken);
  if (!card) return { ok: false, error: '권한이 없습니다.' };
  try {
    const { rows } = await pool.query<{ share_token: string | null }>('SELECT share_token FROM dearday_card WHERE id=$1', [card.id]);
    if (rows[0]?.share_token) return { ok: true, token: rows[0].share_token };
    const token = shareNano();
    await pool.query('UPDATE dearday_card SET share_token=$1 WHERE id=$2', [token, card.id]);
    return { ok: true, token };
  } catch (e: any) {
    console.error('ensureShareToken error:', e);
    return { ok: false, error: e.message || '토큰 발급 실패' };
  }
}

/** 소유자: 공유 토큰 재발급 — 기존 링크 무효화 */
export async function regenerateShareToken(slug: string, ownerToken?: string | null): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const card = await verifyOwner(slug, ownerToken);
  if (!card) return { ok: false, error: '권한이 없습니다.' };
  try {
    const token = shareNano();
    await pool.query('UPDATE dearday_card SET share_token=$1 WHERE id=$2', [token, card.id]);
    return { ok: true, token };
  } catch (e: any) {
    console.error('regenerateShareToken error:', e);
    return { ok: false, error: e.message || '토큰 재발급 실패' };
  }
}

export interface ShareRecipient {
  id: string;
  name: string;
  group_name: string;
  read_at: string | null;
  rsvp_attend: boolean | null;
  rsvp_count: number | null;
  rsvp_attendee_names: string[] | null;
  rsvp_oneliner: string | null;
  rsvp_created_at: string | null;
}

export interface ShareStatus {
  card: {
    slug: string;
    title: string;
    event_date: string | null;
    event_place: string | null;
    rsvp_deadline: string | null;
    expired: boolean;
  };
  recipients: ShareRecipient[];
}

/** 공개(토큰) 조회 — 소유자 검증 없음. slug+token이 정확히 맞을 때만 반환 */
export async function getShareStatus(slug: string, token: string): Promise<ShareStatus | null> {
  if (!slug || !token) return null;
  try {
    const { rows: cards } = await pool.query<{
      id: string; slug: string; title: string; event_date: string | null; event_place: string | null;
      rsvp_deadline: string | null; expiry_date: string | null;
    }>(
      `SELECT id, slug, title, event_date, event_place, rsvp_deadline, expiry_date
         FROM dearday_card WHERE slug=$1 AND share_token=$2 LIMIT 1`,
      [slug, token]
    );
    const card = cards[0];
    if (!card) return null;
    const expired = !!card.expiry_date && new Date(card.expiry_date).getTime() < Date.now();

    // 개인 초대 링크(num)·이메일·전송 상태는 의도적으로 제외
    const { rows } = await pool.query<ShareRecipient>(
      `SELECT
         r.id, r.name, r.group_name, r.read_at,
         v.attend AS rsvp_attend,
         v.count AS rsvp_count,
         v.attendee_names AS rsvp_attendee_names,
         v.oneliner AS rsvp_oneliner,
         v.created_at AS rsvp_created_at
       FROM dearday_recipient r
       LEFT JOIN LATERAL (
         SELECT attend, count, attendee_names, oneliner, created_at
         FROM dearday_rsvp WHERE recipient_id = r.id
         ORDER BY created_at DESC LIMIT 1
       ) v ON true
       WHERE r.card_id=$1
       ORDER BY r.created_at ASC, r.id ASC`,
      [card.id]
    );
    // pg는 timestamptz를 Date 객체로 돌려줌 — 클라이언트로 넘기기 전에 ISO 문자열로 정규화
    const iso = (v: unknown): string | null => {
      if (!v) return null;
      const d = v instanceof Date ? v : new Date(v as string);
      return isNaN(d.getTime()) ? null : d.toISOString();
    };
    return {
      card: {
        slug: card.slug,
        title: card.title,
        event_date: iso(card.event_date),
        event_place: card.event_place,
        rsvp_deadline: iso(card.rsvp_deadline),
        expired
      },
      recipients: rows.map((r) => ({
        ...r,
        read_at: iso(r.read_at),
        rsvp_created_at: iso(r.rsvp_created_at)
      }))
    };
  } catch (e) {
    console.error('getShareStatus error:', e);
    return null;
  }
}
