import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PRO_ENABLED } from '@/lib/stripe';
import CheckoutClient from './_CheckoutClient';

export const metadata = {
  title: 'Checkout · DearDay',
  robots: { index: false, follow: false }
};

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { plan?: string };
}

export default async function CheckoutPage({ searchParams }: Props) {
  if (!PRO_ENABLED) notFound();
  const plan = searchParams.plan === 'single' ? 'single' : null;
  if (!plan) notFound();
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/cards');     // 로그인 페이지로 (cards 페이지가 로그인 prompt)
  }
  return <CheckoutClient plan={plan as 'single'} />;
}
