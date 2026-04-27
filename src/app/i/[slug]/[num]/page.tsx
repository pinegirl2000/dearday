import { notFound } from 'next/navigation';
import { pool } from '@/lib/db';
import { getCardBySlug } from '@/lib/db/cards';
import { getTheme } from '@/lib/theme';
import InvitationView from '../_components/InvitationView';
import FeedSection from '../_components/FeedSection';

interface Props {
  params: { slug: string; num: string };
}

export async function generateMetadata({ params }: Props) {
  const card = await getCardBySlug(params.slug);
  if (!card) return { title: '초대장' };
  const { rows } = await pool.query<{ name: string }>(
    'SELECT name FROM dearday_recipient WHERE card_id=$1 AND num=$2',
    [card.id, params.num]
  );
  const recipientName = rows[0]?.name;
  const title = recipientName ? `${recipientName}님께 · ${card.title}` : card.title;
  return {
    title: `${title} · DearDay`,
    description: card.greeting_oneliner || '소중한 날에 초대합니다'
  };
}

export default async function PersonalInvitationPage({ params }: Props) {
  const card = await getCardBySlug(params.slug);
  if (!card) notFound();

  // 수신자 조회
  const { rows } = await pool.query<{ id: string; name: string }>(
    'SELECT id, name FROM dearday_recipient WHERE card_id=$1 AND num=$2',
    [card.id, params.num]
  );
  const recipient = rows[0];

  // 만료 체크
  const now = new Date();
  if (card.expiry_date && new Date(card.expiry_date) < now) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hydrangea-100 to-hydrangea-200 p-6">
        <div className="bg-white/95 rounded-3xl p-12 text-center max-w-sm shadow-xl">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-hydrangea-500 flex items-center justify-center">
            <span className="text-white text-2xl">❀</span>
          </div>
          <h2 className="text-xl font-serif text-hydrangea-700 mb-3">{card.title}</h2>
          <p className="text-sm text-hydrangea-400 leading-relaxed">이 초대장의 확인 기간이<br />종료되었습니다.</p>
        </div>
      </div>
    );
  }

  const theme = getTheme(card.theme);
  return (
    <InvitationView
      card={card}
      recipientName={recipient?.name}
      recipientId={recipient?.id}
      feed={<FeedSection cardId={card.id} theme={theme} />}
    />
  );
}
