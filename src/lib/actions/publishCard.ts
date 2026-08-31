'use server';

import { pool } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { generateSlug, generateOwnerToken } from '@/lib/slug';
import type { CardDraft } from '@/types/card';

/**
 * 카드 소유권 검증 — admin OR 로그인 사용자 user_id 일치 OR ownerToken 일치
 * 셋 중 하나라도 매치되면 ownership 인정.
 */
async function verifyCardOwnership(slug: string, ownerToken?: string | null) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || null;
  const email = session?.user?.email || null;

  if (isAdminEmail(email)) {
    const { rows } = await pool.query<{ id: string }>(
      'SELECT id FROM dearday_card WHERE slug=$1 LIMIT 1',
      [slug]
    );
    return rows[0] || null;
  }

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
  if (conds.length === 0) return null;

  const { rows } = await pool.query<{ id: string }>(
    `SELECT id FROM dearday_card WHERE slug=$1 AND (${conds.join(' OR ')}) LIMIT 1`,
    params
  );
  return rows[0] || null;
}

/**
 * 클라이언트에서 호출 가능한 소유권 검증 — Edit/Manage 페이지 진입 시
 * localStorage의 owner_token으로 확인. true 반환 시 렌더 진행.
 */
export async function checkCardAccess(slug: string, ownerToken?: string | null): Promise<boolean> {
  const row = await verifyCardOwnership(slug, ownerToken);
  return !!row;
}

interface PublishResult {
  ok: boolean;
  slug?: string;
  ownerToken?: string;
  error?: string;
}

export async function publishCard(draft: CardDraft): Promise<PublishResult> {
  if (!draft.event_type || !draft.title) {
    return { ok: false, error: '필수 정보가 누락되었습니다.' };
  }

  const slug = generateSlug();
  const ownerToken = generateOwnerToken();
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || null;

  try {
    await pool.query(
      `INSERT INTO dearday_card (
        slug, owner_token, user_id, event_type, title,
        theme, bg_id, layout_id, envelope_anim, custom_bg_url, font_family,
        body, event_date, event_place, map_url,
        contact_name, contact_phone, extra_info, greeting_oneliner, recipient_template,
        rsvp_enabled, rsvp_deadline, rsvp_max_per_card, rsvp_collect_names, rsvp_allow_oneliner, rsvp_allow_change,
        expiry_date, plan
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15,
        $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26,
        $27, $28
      )`,
      [
        slug,
        ownerToken,
        userId,
        draft.event_type,
        draft.title,
        draft.theme || 'hydrangea',
        draft.bg_id || 'bg-none',
        draft.layout_id || 'layout-classic',
        draft.envelope_anim || 'envelope-1',
        draft.custom_bg_url || null,
        draft.font_family || 'serif',
        draft.body || null,
        draft.event_date || null,
        draft.event_place || null,
        draft.map_url || null,
        draft.contact_name || null,
        draft.contact_phone || null,
        draft.extra_info || null,
        draft.greeting_oneliner || null,
        draft.recipient_template || null,
        draft.rsvp_enabled ?? true,
        draft.rsvp_deadline || null,
        draft.rsvp_max_per_card || 1,
        draft.rsvp_collect_names ?? false,
        draft.rsvp_allow_oneliner ?? false,
        draft.rsvp_allow_change ?? true,
        draft.expiry_date || null,
        draft.plan || 'free'
      ]
    );

    // 사용량 카운트 silent 증가 (UI 노출 X — 향후 paid tier 한도 결정용 데이터 수집)
    if (userId) {
      pool.query(
        'UPDATE dearday_user SET cards_created_count = cards_created_count + 1 WHERE id = $1',
        [userId]
      ).catch((e) => console.error('cards_created_count update failed:', e));
    }

    return { ok: true, slug, ownerToken };
  } catch (e: any) {
    console.error('publishCard error:', e);
    return { ok: false, error: e.message || '발행 중 오류가 발생했습니다.' };
  }
}

interface UpdateResult {
  ok: boolean;
  slug?: string;
  error?: string;
}

/**
 * 기존 카드 수정. slug로 식별.
 * 향후 인증 시 owner_token 검증 추가 필요.
 */
export async function updateCard(slug: string, draft: CardDraft): Promise<UpdateResult> {
  if (!slug) return { ok: false, error: 'slug 누락' };
  if (!draft.title) return { ok: false, error: '제목은 필수입니다.' };

  try {
    const result = await pool.query(
      `UPDATE dearday_card SET
        event_type = $1,
        title = $2,
        theme = $3,
        bg_id = $4,
        layout_id = $5,
        envelope_anim = $6,
        custom_bg_url = $7,
        font_family = $8,
        body = $9,
        event_date = $10,
        event_place = $11,
        map_url = $12,
        contact_name = $13,
        contact_phone = $14,
        extra_info = $15,
        greeting_oneliner = $16,
        recipient_template = $17,
        rsvp_enabled = $18,
        rsvp_deadline = $19,
        rsvp_max_per_card = $20,
        rsvp_collect_names = $21,
        rsvp_allow_oneliner = $22,
        rsvp_allow_change = $23,
        expiry_date = $24,
        plan = $25,
        updated_at = NOW()
      WHERE slug = $26`,
      [
        draft.event_type,
        draft.title,
        draft.theme || 'hydrangea',
        draft.bg_id || 'bg-none',
        draft.layout_id || 'layout-classic',
        draft.envelope_anim || 'envelope-1',
        draft.custom_bg_url || null,
        draft.font_family || 'serif',
        draft.body || null,
        draft.event_date || null,
        draft.event_place || null,
        draft.map_url || null,
        draft.contact_name || null,
        draft.contact_phone || null,
        draft.extra_info || null,
        draft.greeting_oneliner || null,
        draft.recipient_template || null,
        draft.rsvp_enabled ?? true,
        draft.rsvp_deadline || null,
        draft.rsvp_max_per_card || 1,
        draft.rsvp_collect_names ?? false,
        draft.rsvp_allow_oneliner ?? false,
        draft.rsvp_allow_change ?? true,
        draft.expiry_date || null,
        draft.plan || 'free',
        slug
      ]
    );

    if (result.rowCount === 0) return { ok: false, error: '카드를 찾을 수 없습니다.' };
    // 공개 초청장 페이지(/i/[slug] 및 /i/[slug]/[num]) 캐시 무효화 — 수정 즉시 반영되도록
    revalidatePath(`/i/${slug}`, 'layout');
    revalidatePath(`/cards/${slug}/edit`);
    revalidatePath(`/cards/${slug}/manage`);
    return { ok: true, slug };
  } catch (e: any) {
    console.error('updateCard error:', e);
    return { ok: false, error: e.message || '수정 중 오류가 발생했습니다.' };
  }
}

/**
 * 기존 카드를 복제해 새 slug로 발행 — lock된(첫 수신자가 열람한) 카드를 수정하고 싶을 때 사용.
 * 원본 카드는 그대로 유지(이미 본 수신자 경험 보존), 새 카드는 편집 가능 상태로 시작.
 * 수신자 목록은 복사하지 않음(필요 시 사용자가 다시 추가).
 */
export async function duplicateCard(slug: string, ownerToken?: string | null): Promise<PublishResult> {
  const card = await verifyCardOwnership(slug, ownerToken);
  if (!card) return { ok: false, error: '권한이 없거나 카드를 찾을 수 없습니다.' };
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || null;
  const userEmail = session?.user?.email || null;
  const newSlug = generateSlug();
  const newOwnerToken = generateOwnerToken();
  try {
    // 원본 모든 컬럼 복사 — id/slug/owner_token/user_id/created_at/updated_at만 새로 부여
    await pool.query(
      `INSERT INTO dearday_card (
        slug, owner_token, user_id, user_email,
        event_type, title, theme, bg_id, layout_id, envelope_anim, custom_bg_url, font_family,
        body, event_date, event_place, map_url, contact_name, contact_phone, extra_info,
        greeting_oneliner, recipient_template, event_label,
        rsvp_enabled, rsvp_deadline, rsvp_max_per_card, rsvp_collect_names, rsvp_allow_oneliner, rsvp_allow_change,
        expiry_date, plan
      )
      SELECT
        $1, $2, $3, $4,
        event_type, title, theme, bg_id, layout_id, envelope_anim, custom_bg_url, font_family,
        body, event_date, event_place, map_url, contact_name, contact_phone, extra_info,
        greeting_oneliner, recipient_template, event_label,
        rsvp_enabled, rsvp_deadline, rsvp_max_per_card, rsvp_collect_names, rsvp_allow_oneliner, rsvp_allow_change,
        expiry_date, plan
      FROM dearday_card WHERE slug=$5`,
      [newSlug, newOwnerToken, userId, userEmail, slug]
    );
    revalidatePath('/cards');
    return { ok: true, slug: newSlug, ownerToken: newOwnerToken };
  } catch (e: any) {
    console.error('duplicateCard error:', e);
    return { ok: false, error: e.message || '복제 중 오류가 발생했습니다.' };
  }
}
