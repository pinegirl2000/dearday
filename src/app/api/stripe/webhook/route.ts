// Stripe Webhook 엔드포인트 — 결제 성공 시 slot 발급.
// 베타 기간엔 PRO_ENABLED=false라도 webhook 자체는 활성 (Stripe가 호출).
// 단, dearday.sg/api/stripe/webhook URL은 Stripe Dashboard에서 등록해야만 호출됨.

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getStripe, PRICING, type PlanType } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook signature missing' }, { status: 400 });
  }

  let event;
  try {
    const body = await req.text();
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (e: any) {
    console.error('Webhook signature verification failed:', e.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const sessionObj = event.data.object as any;
      const sessionId = sessionObj.id;
      const planType = (sessionObj.metadata?.plan_type || 'single') as PlanType;
      const userId = sessionObj.metadata?.user_id;
      const userEmail = sessionObj.customer_email || sessionObj.customer_details?.email || null;

      if (!userId) {
        console.error('Webhook: user_id missing in session metadata');
        return NextResponse.json({ received: true });
      }

      // payment row → status='paid'
      await pool.query(
        `UPDATE dearday_payment
         SET status='paid', paid_at=NOW(), stripe_payment_intent=$2
         WHERE stripe_session_id=$1`,
        [sessionId, sessionObj.payment_intent || null]
      );

      // payment_id 조회
      const { rows: payRows } = await pool.query<{ id: string }>(
        `SELECT id FROM dearday_payment WHERE stripe_session_id=$1`,
        [sessionId]
      );
      const paymentId = payRows[0]?.id;
      if (!paymentId) {
        console.error('Webhook: payment row not found for session', sessionId);
        return NextResponse.json({ received: true });
      }

      // plan에 맞는 slot 개수 발급
      const plan = PRICING[planType];
      const slotCount = plan?.slot_count || 1;
      const expiresAt = plan?.expires_after_days
        ? new Date(Date.now() + plan.expires_after_days * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const values: string[] = [];
      const params: any[] = [];
      for (let i = 0; i < slotCount; i++) {
        const base = i * 4;
        values.push(`($${base + 1}, $${base + 2}, 'unused', $${base + 3}::timestamptz, NOW())`);
        params.push(userId, paymentId, expiresAt);
      }
      // INSERT slots — 한 번에
      // (단순화: loop으로 INSERT)
      for (let i = 0; i < slotCount; i++) {
        await pool.query(
          `INSERT INTO dearday_send_slot (user_id, payment_id, status, expires_at, created_at)
           VALUES ($1, $2, 'unused', $3, NOW())`,
          [userId, paymentId, expiresAt]
        );
      }

      console.log(`✅ Stripe payment ${sessionId}: ${slotCount} slot(s) issued to user ${userId}`);
    } else if (event.type === 'charge.refunded') {
      // 환불 처리 — 미사용 slot은 만료, 사용된 slot은 그대로 둠 (정책 결정 필요)
      const charge = event.data.object as any;
      await pool.query(
        `UPDATE dearday_payment SET status='refunded' WHERE stripe_payment_intent=$1`,
        [charge.payment_intent]
      );
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error('Webhook handler error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
