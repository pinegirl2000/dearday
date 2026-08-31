import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { listEvaluations } from '@/lib/actions/evaluation';
import { PageContainer } from '@/components/layout/PageContainer';
import { MobileHeader } from '@/components/layout/MobileHeader';
import EvaluationClient from './_EvaluationClient';

export const dynamic = 'force-dynamic';

export default async function EvaluationPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) notFound();

  const evaluations = await listEvaluations(60);

  return (
    <PageContainer noPadding>
      <MobileHeader title="Site Evaluation" back />
      <EvaluationClient initial={evaluations} />
    </PageContainer>
  );
}
