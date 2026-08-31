// Stripe 서버 인스턴스 — server-side only.
// 베타 기간엔 NEXT_PUBLIC_PRO_ENABLED=false → 모든 호출자가 사전 차단됨.

import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  _stripe = new Stripe(key, {
    apiVersion: '2024-12-18.acacia' as any,
    typescript: true
  });
  return _stripe;
}

export const PRO_ENABLED = process.env.NEXT_PUBLIC_PRO_ENABLED === 'true';

// 가격 정의 — 추후 Stripe Dashboard의 Price ID와 매핑
export const PRICING = {
  single: {
    id: 'single' as const,
    label: 'Single Card',
    amount_cents: 299,           // $2.99
    currency: 'sgd' as const,
    description: 'One personalized card with 1 recipient slot. Frozen after viewing.',
    slot_count: 1,
    expires_after_days: null     // 무제한 유효
  }
  // 추후: pack5, holiday_pass, annual_pass 추가
} as const;

export type PlanType = keyof typeof PRICING;
