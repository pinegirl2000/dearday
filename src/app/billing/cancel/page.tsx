import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';
import { PRO_ENABLED } from '@/lib/stripe';

export const metadata = {
  title: 'Payment cancelled · DearDay',
  robots: { index: false, follow: false }
};

export default function CancelPage() {
  if (!PRO_ENABLED) notFound();
  return (
    <PageContainer noPadding>
      <section className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center max-w-md mx-auto">
        <p className="text-xl font-bold text-hydrangea-700 mb-2">Payment cancelled</p>
        <p className="text-sm text-hydrangea-400 mb-6">No charge was made. You can try again any time.</p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-hydrangea-500 text-white text-sm font-semibold active:scale-95 transition"
        >
          Back to pricing →
        </Link>
      </section>
    </PageContainer>
  );
}
