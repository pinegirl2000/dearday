import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PRO_ENABLED } from '@/lib/stripe';

export const metadata = {
  title: 'Payment success · DearDay',
  robots: { index: false, follow: false }
};

interface Props {
  searchParams: { session_id?: string };
}

export default function SuccessPage({ searchParams }: Props) {
  if (!PRO_ENABLED) notFound();
  return (
    <PageContainer noPadding>
      <section className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg mb-5"
          style={{ background: 'linear-gradient(135deg, #A990CC 0%, #7B5EA7 60%, #5A3D7A 100%)' }}>
          <Check className="w-10 h-10 text-white" strokeWidth={3} />
        </div>
        <h1 className="text-2xl font-bold text-hydrangea-700 mb-2">Payment successful</h1>
        <p className="text-sm text-hydrangea-500 mb-1">
          Your card slot is ready.
        </p>
        <p className="text-xs text-hydrangea-400 mb-6">
          We'll attach it to your next card automatically.
        </p>
        <Link
          href="/cards/new"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-semibold shadow-lg active:scale-95 transition"
          style={{ background: 'linear-gradient(135deg, #7B5EA7 0%, #5A3D7A 100%)' }}
        >
          <Sparkles className="w-4 h-4" /> Make your card now
        </Link>
        <p className="text-[10px] text-hydrangea-400 mt-6">
          Session: <code>{searchParams.session_id?.slice(0, 12) || '—'}…</code>
        </p>
      </section>
    </PageContainer>
  );
}
