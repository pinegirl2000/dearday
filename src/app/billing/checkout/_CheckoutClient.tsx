'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { createCheckoutSession } from '@/lib/actions/payment';
import type { PlanType } from '@/lib/stripe';

export default function CheckoutClient({ plan }: { plan: PlanType }) {
  const [status, setStatus] = useState<'starting' | 'redirecting' | 'failed'>('starting');

  useEffect(() => {
    (async () => {
      const res = await createCheckoutSession(plan);
      if (!res.ok || !res.url) {
        toast.error(res.error || 'Checkout failed');
        setStatus('failed');
        return;
      }
      setStatus('redirecting');
      window.location.href = res.url;
    })();
  }, [plan]);

  return (
    <PageContainer noPadding>
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
        {status === 'failed' ? (
          <>
            <p className="text-base font-semibold text-hydrangea-700">Couldn't start checkout</p>
            <p className="text-xs text-hydrangea-400 mt-2">Please try again or contact support.</p>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 text-hydrangea-500 animate-spin mb-4" />
            <p className="text-sm text-hydrangea-700">
              {status === 'redirecting' ? 'Redirecting to secure checkout…' : 'Starting checkout…'}
            </p>
          </>
        )}
      </div>
    </PageContainer>
  );
}
