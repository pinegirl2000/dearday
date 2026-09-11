import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getShareStatus } from '@/lib/actions/shareStatus';
import ShareStatusView from './_ShareStatusView';

interface Props {
  params: { slug: string; token: string };
}

// 항상 최신 응답을 보여야 하므로 캐시하지 않음
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations('ShareStatus');
  const data = await getShareStatus(params.slug, params.token);
  // 명단·숫자는 OG에 절대 노출하지 않음 — 제목만
  const title = data ? `${data.card.title} · ${t('title')}` : t('title');
  return {
    title,
    robots: { index: false, follow: false },
    openGraph: { title, siteName: 'DearDay', type: 'website' }
  };
}

export default async function ShareStatusPage({ params }: Props) {
  const t = await getTranslations('ShareStatus');
  const data = await getShareStatus(params.slug, params.token);

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hydrangea-50 to-hydrangea-100 p-6">
        <div className="bg-white/95 rounded-3xl p-10 text-center max-w-sm shadow-xl">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-hydrangea-100 flex items-center justify-center text-hydrangea-500 text-2xl">🔗</div>
          <h1 className="text-lg font-semibold text-hydrangea-700 mb-2">{t('notFound')}</h1>
          <p className="text-sm text-hydrangea-400 leading-relaxed">{t('notFoundHint')}</p>
        </div>
      </main>
    );
  }

  return <ShareStatusView data={data} />;
}
