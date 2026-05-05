import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { PageContainer } from '@/components/layout/PageContainer';
import { MobileHeader } from '@/components/layout/MobileHeader';
import EnvelopesAdminClient from './_EnvelopesAdminClient';

export const dynamic = 'force-dynamic';

export default async function EnvelopesAdminPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) redirect('/');

  return (
    <PageContainer noPadding>
      <MobileHeader title="봉투 관리" back />
      <div className="px-4 pt-3 pb-12">
        <p className="text-xs text-hydrangea-400 mb-3">
          현재 사용 가능한 봉투 카탈로그입니다. 추가/수정은 코드에서 관리합니다 (`src/components/envelopes/`).
        </p>
        <EnvelopesAdminClient />
      </div>
    </PageContainer>
  );
}
