import { notFound } from 'next/navigation';
import { getCardBySlug } from '@/lib/db/cards';
import { getTheme } from '@/lib/theme';
import InvitationView from './_components/InvitationView';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  const card = await getCardBySlug(params.slug);
  if (!card) return { title: '초대장' };
  return {
    title: `${card.title} · DearDay`,
    description: card.greeting_oneliner || '소중한 날에 초대합니다',
    openGraph: {
      title: card.title,
      description: card.greeting_oneliner || '소중한 날에 초대합니다'
    }
  };
}

export default async function InvitationPage({ params }: Props) {
  const card = await getCardBySlug(params.slug);
  if (!card) notFound();

  // 만료 체크
  const now = new Date();
  if (card.expiry_date && new Date(card.expiry_date) < now) {
    return <ExpiredView title={card.title} />;
  }

  const theme = getTheme(card.theme);
  return (
    <InvitationView card={card} />
  );
}

function ExpiredView({ title }: { title: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hydrangea-100 to-hydrangea-200 p-6">
      <div className="bg-white/95 rounded-3xl p-12 text-center max-w-sm shadow-xl">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-hydrangea-500 flex items-center justify-center">
          <span className="text-white text-2xl">❀</span>
        </div>
        <h2 className="text-xl font-serif text-hydrangea-700 mb-3">{title}</h2>
        <p className="text-sm text-hydrangea-400 leading-relaxed">이 초대장의 확인 기간이<br />종료되었습니다.</p>
      </div>
    </div>
  );
}
