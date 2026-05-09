import { notFound } from 'next/navigation';
import { getCardBySlug } from '@/lib/db/cards';
import { getTheme } from '@/lib/theme';
import { getAllTemplateColors } from '@/lib/actions/templateConfig';
import { findTemplateByPair } from '@/lib/templates';
import { getBackground } from '@/lib/backgrounds';
import InvitationView from './_components/InvitationView';

interface Props {
  params: { slug: string };
  searchParams?: { preview_name?: string };
}

export async function generateMetadata({ params }: Props) {
  const card = await getCardBySlug(params.slug);
  if (!card) return { title: '초대장' };
  const description = card.greeting_oneliner || undefined;
  // og:image — 카드의 template 배경 이미지를 미리보기로 사용 (있으면)
  const bg = getBackground(card.bg_id);
  const ogImage = bg.imageUrl ? bg.imageUrl : undefined;
  return {
    title: card.title,
    description,
    openGraph: {
      title: card.title,
      description,
      type: 'website',
      siteName: 'DearDay',
      ...(ogImage && { images: [{ url: ogImage }] })
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: card.title,
      description,
      ...(ogImage && { images: [ogImage] })
    }
  };
}

export default async function InvitationPage({ params, searchParams }: Props) {
  const card = await getCardBySlug(params.slug);
  if (!card) notFound();

  // 만료 체크
  const now = new Date();
  if (card.expiry_date && new Date(card.expiry_date) < now) {
    return <ExpiredView title={card.title} />;
  }

  const theme = getTheme(card.theme);
  // template 색상 DB override 로드 — 카드의 (bg_id, layout_id) → template 매칭
  const colorsMap = await getAllTemplateColors();
  const tpl = findTemplateByPair(card.bg_id, card.layout_id);
  const templateColorOverride = tpl ? colorsMap.get(tpl.id) : undefined;
  // 미리보기 모드 — preview_name으로 봉투에 표시할 sample 이름 전달
  const previewName = (searchParams?.preview_name || '').trim() || undefined;
  return (
    <InvitationView card={card} recipientName={previewName} templateColorOverride={templateColorOverride} />
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
