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
        theme, envelope_anim, custom_bg_url, font_family,
        body, event_date, event_place, map_url,
        contact_name, contact_phone, extra_info, greeting_oneliner,
        rsvp_enabled, rsvp_deadline, rsvp_max_per_card, rsvp_collect_names,
        expiry_date, plan
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15, $16,
        $17, $18, $19, $20,
        $21, $22
      )`,
      [
        slug,
        ownerToken,
        draft.event_type,
        draft.title,
        draft.theme || 'hydrangea',
        draft.envelope_anim || 'flip',
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
