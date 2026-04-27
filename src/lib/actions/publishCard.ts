'use server';

import { pool } from '@/lib/db';
import { generateSlug, generateOwnerToken } from '@/lib/slug';
import type { CardDraft } from '@/types/card';

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

  try {
    await pool.query(
      `INSERT INTO dearday_card (
        slug, owner_token, event_type, title,
        theme, bg_id, layout_id, envelope_anim, custom_bg_url, font_family,
        body, event_date, event_place, map_url,
        contact_name, contact_phone, extra_info, greeting_oneliner, recipient_template,
        rsvp_enabled, rsvp_deadline, rsvp_max_per_card, rsvp_collect_names,
        expiry_date, plan
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17, $18, $19,
        $20, $21, $22, $23,
        $24, $25
      )`,
      [
        slug,
        ownerToken,
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
        draft.rsvp_max_per_card || 4,
        draft.rsvp_collect_names ?? false,
        draft.expiry_date || null,
        draft.plan || 'free'
      ]
    );

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
        expiry_date = $22,
        plan = $23,
        updated_at = NOW()
      WHERE slug = $24`,
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
        draft.rsvp_max_per_card || 4,
        draft.rsvp_collect_names ?? false,
        draft.expiry_date || null,
        draft.plan || 'free',
        slug
      ]
    );

    if (result.rowCount === 0) return { ok: false, error: '카드를 찾을 수 없습니다.' };
    return { ok: true, slug };
  } catch (e: any) {
    console.error('updateCard error:', e);
    return { ok: false, error: e.message || '수정 중 오류가 발생했습니다.' };
  }
}
