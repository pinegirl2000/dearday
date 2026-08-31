import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Check } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { PRO_ENABLED, PRICING } from '@/lib/stripe';

export const metadata = {
  title: 'Pricing · DearDay',
  robots: { index: false, follow: false }    // 베타 검색 노출 차단
};

export const dynamic = 'force-dynamic';

export default function PricingPage() {
  // 베타 기간엔 PRO_ENABLED=false → 404 (사용자에게 안 보임)
  if (!PRO_ENABLED) notFound();

  return (
    <PageContainer noPadding>
      <MobileHeader title="Pricing" back />
      <section className="px-6 py-10 text-center max-w-md mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-hydrangea-100/60 text-xs text-hydrangea-700 font-medium mb-4">
          <Sparkles className="w-3 h-3" /> Simple pricing
        </div>
        <h1 className="text-3xl font-serif text-hydrangea-700 mb-2">Send a heartfelt card</h1>
        <p className="text-sm text-hydrangea-500 mb-8">
          Pay only for what you send. No subscription.
        </p>

        {/* Single Card tier */}
        <div className="rounded-3xl bg-white border-2 border-hydrangea-200 p-6 shadow-lg text-left mb-4">
          <div className="text-center mb-4">
            <div className="text-3xl mb-1">💝</div>
            <h2 className="text-lg font-bold text-hydrangea-700">{PRICING.single.label}</h2>
            <div className="mt-2 flex items-baseline justify-center gap-1">
              <span className="text-4xl font-extrabold text-hydrangea-700">
                ${(PRICING.single.amount_cents / 100).toFixed(2)}
              </span>
              <span className="text-sm text-hydrangea-400 uppercase">{PRICING.single.currency}</span>
            </div>
            <p className="text-xs text-hydrangea-400 mt-1">One card · One recipient</p>
          </div>
          <ul className="space-y-2 mb-5">
            {[
              'One personalized card link',
              '1 recipient slot — anti-abuse',
              'Unlimited validity (no expiry)',
              'Frozen after recipient views',
              'WhatsApp / Email / Link sharing'
            ].map((feat) => (
              <li key={feat} className="flex items-start gap-2 text-sm text-hydrangea-600">
                <Check className="w-4 h-4 text-hydrangea-500 flex-shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/billing/checkout?plan=single"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-md active:scale-95 transition"
            style={{ background: 'linear-gradient(135deg, #7B5EA7 0%, #5A3D7A 100%)' }}
          >
            Get this card →
          </Link>
        </div>

        <p className="text-[10px] text-hydrangea-400 mt-6 leading-relaxed">
          Secure checkout via Stripe. We accept all major cards + PayNow (coming soon).<br />
          All transactions in Singapore Dollars (SGD).
        </p>
      </section>
    </PageContainer>
  );
}
