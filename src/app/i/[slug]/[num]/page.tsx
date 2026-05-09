import { notFound } from 'next/navigation';
import { pool } from '@/lib/db';
import { getCardBySlug } from '@/lib/db/cards';
import { getTheme } from '@/lib/theme';
import { getMyRsvpByRecipient } from '@/lib/actions/submitRsvp';
import { markRecipientRead } from '@/lib/actions/markRecipientRead';
import { getAllTemplateColors } from '@/lib/actions/templateConfig';
import { findTemplateByPair } from '@/lib/templates';
import InvitationView from '../_components/InvitationView';

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
  // 메신저 공유 시 행사 제목이 카드 미리보기에 노출되도록 — recipient명은 description으로
  const title = card.title;
  const description = recipientName
    ? `${recipientName}님께 — ${card.greeting_oneliner || '소중한 날에 초대합니다'}`
    : (card.greeting_oneliner || '소중한 날에 초대합니다');
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'DearDay'
    },
    twitter: {
      card: 'summary',
      title,
      description
    }
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

  // 최초 열람 시 read_at 기록 (fire-and-forget — 통계 외 동작에 영향 없음)
  if (recipient?.id) {
    markRecipientRead(recipient.id).catch(() => {});
  }

  const existingRsvp = recipient?.id ? await getMyRsvpByRecipient(recipient.id) : null;
  const colorsMap = await getAllTemplateColors();
  const tpl = findTemplateByPair(card.bg_id, card.layout_id);
  const templateColorOverride = tpl ? colorsMap.get(tpl.id) : undefined;

  return (
    <InvitationView
      card={card}
      recipientName={recipient?.name}
      recipientId={recipient?.id}
      existingRsvp={existingRsvp}
      templateColorOverride={templateColorOverride}
    />
  );
}
