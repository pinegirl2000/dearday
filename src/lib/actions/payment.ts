'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pool } from '@/lib/db';
import { getStripe, PRO_ENABLED, PRICING, type PlanType } from '@/lib/stripe';

/**
 * Stripe Checkout Session 생성 — 베타 기간엔 PRO_ENABLED=false라 차단됨.
 * 성공 시 Stripe checkout URL 반환, 클라이언트가 redirect.
 */
export async function createCheckoutSession(plan: PlanType): Promise<{ ok: boolean; url?: string; error?: string }> {
  if (!PRO_ENABLED) return { ok: false, error: 'Pro features are not available yet.' };

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const userEmail = session?.user?.email;
  if (!userId) return { ok: false, error: 'Login required' };

  const price = PRICING[plan];
  if (!price) return { ok: false, error: 'Invalid plan' };

  try {
    const stripe = getStripe();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://dearday.sg';
    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      currency: price.currency,
      line_items: [{
        price_data: {
          currency: price.currency,
          unit_amount: price.amount_cents,
          product_data: {
            name: price.label,
            description: price.description
          }
        },
        quantity: 1
      }],
      customer_email: userEmail || undefined,
      success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/billing/cancel`,
      metadata: {
        user_id: userId,
        plan_type: plan
      }
    });

    // pending payment row 기록 — webhook 도착 시 status='paid'로 갱신
    await pool.query(
      `INSERT INTO dearday_payment (user_id, user_email, stripe_session_id, amount_cents, currency, plan_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [userId, userEmail || null, checkout.id, price.amount_cents, price.currency, plan]
    );

    return { ok: true, url: checkout.url || undefined };
  } catch (e: any) {
    console.error('createCheckoutSession error:', e);
    return { ok: false, error: e.message || 'Checkout creation failed' };
  }
}

/**
 * 사용자의 사용 가능한 slot 개수 조회.
 * 베타엔 0 반환 (UI에서 호출해도 의미 없음).
 */
export async function getAvailableSlots(): Promise<number> {
  if (!PRO_ENABLED) return 0;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return 0;
  const { rows } = await pool.query<{ cnt: string }>(
    `SELECT COUNT(*)::text AS cnt FROM dearday_send_slot
     WHERE user_id=$1 AND status='unused'
     AND (expires_at IS NULL OR expires_at > NOW())`,
    [userId]
  );
  return Number(rows[0]?.cnt || 0);
}

/**
 * Slot을 카드+수신자에 할당 (reserve). 발송 직전 호출.
 * 미열람이면 회수 가능 (status='reserved' → 'unused').
 */
export async function reserveSlot(
  cardId: string,
  recipientId: string
): Promise<{ ok: boolean; slotId?: string; error?: string }> {
  if (!PRO_ENABLED) return { ok: false, error: 'Pro not enabled' };
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return { ok: false, error: 'Login required' };

  try {
    const { rows } = await pool.query<{ id: string }>(
      `UPDATE dearday_send_slot
       SET status='reserved', card_id=$2, recipient_id=$3, reserved_at=NOW()
       WHERE id = (
         SELECT id FROM dearday_send_slot
         WHERE user_id=$1 AND status='unused'
         AND (expires_at IS NULL OR expires_at > NOW())
         ORDER BY created_at ASC LIMIT 1
       )
       RETURNING id`,
      [userId, cardId, recipientId]
    );
    if (rows.length === 0) return { ok: false, error: 'No available slot' };
    return { ok: true, slotId: rows[0].id };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/**
 * 발송 완료 → slot status='sent'. 수신자 열람 전엔 여전히 회수 가능 (B안).
 */
export async function markSlotSent(slotId: string): Promise<{ ok: boolean; error?: string }> {
  if (!PRO_ENABLED) return { ok: false, error: 'Pro not enabled' };
  try {
    await pool.query(
      `UPDATE dearday_send_slot SET status='sent', sent_at=NOW() WHERE id=$1`,
      [slotId]
    );
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/**
 * 수신자 열람 → slot 영구 lock(박제). markRecipientRead에서 호출.
 */
export async function lockSlotByRecipient(recipientId: string): Promise<void> {
  if (!PRO_ENABLED) return;
  try {
    await pool.query(
      `UPDATE dearday_send_slot SET status='locked', locked_at=NOW()
       WHERE recipient_id=$1 AND status IN ('reserved', 'sent')`,
      [recipientId]
    );
  } catch (e) {
    console.error('lockSlotByRecipient error:', e);
  }
}

/**
 * 미열람 상태에서 slot 회수 (사용자가 잘못된 발송 취소).
 */
export async function reclaimSlot(slotId: string): Promise<{ ok: boolean; error?: string }> {
  if (!PRO_ENABLED) return { ok: false, error: 'Pro not enabled' };
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return { ok: false, error: 'Login required' };
  try {
    const { rowCount } = await pool.query(
      `UPDATE dearday_send_slot
       SET status='unused', card_id=NULL, recipient_id=NULL, reserved_at=NULL, sent_at=NULL
       WHERE id=$1 AND user_id=$2 AND status IN ('reserved', 'sent')`,
      [slotId, userId]
    );
    if (rowCount === 0) return { ok: false, error: 'Slot already locked or not found' };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
