import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { PageContainer } from '@/components/layout/PageContainer';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { ChevronRight, Mail, Layers, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

const ITEMS = [
  { href: '/admin/cards', icon: FileText, title: 'All Invitations', desc: '발행된 모든 초대장 / 사용자별 카드 관리' },
  { href: '/admin/envelopes', icon: Mail, title: '봉투 관리', desc: '사용 가능한 봉투 5종 카탈로그' },
  { href: '/admin/templates', icon: Layers, title: '템플릿 관리', desc: '배경 + 레이아웃 페어링 카탈로그' }
];

export default async function AdminHomePage() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) redirect('/');

  return (
    <PageContainer noPadding>
      <MobileHeader title="Admin" back />
      <div className="px-4 pt-3 pb-12 space-y-2">
        {ITEMS.map(({ href, icon: Icon, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 p-4 rounded-2xl border border-hydrangea-100 bg-white hover:bg-hydrangea-50/40 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-hydrangea-100 flex items-center justify-center">
              <Icon className="w-5 h-5 text-hydrangea-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-hydrangea-700">{title}</div>
              <div className="text-xs text-hydrangea-400">{desc}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-hydrangea-400" />
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
