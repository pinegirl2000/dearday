import { notFound } from 'next/navigation';
import InvitationView from '@/app/i/[slug]/_components/InvitationView';
import { TEMPLATES, getTemplateLayouts } from '@/lib/templates';
import { buildSamplePreviewCard } from '@/lib/templates/sampleData';

/**
 * 개발 전용 — 받는 사람이 보는 "봉투 → 카드" 전체 흐름을 DB 없이 확인하는 페이지.
 * 실제 초대장 화면(InvitationView)을 샘플 카드로 그대로 띄운다.
 * 예: /envelope-flow?tpl=tpl-sage-teddy&env=ribbon:blush
 */
export const metadata = { title: 'Envelope flow QA', robots: { index: false } };

const DEFAULT_TEMPLATE_ID = 'tpl-teddy-blue';
const DEFAULT_ENVELOPE = 'envelope-1';

export default function EnvelopeFlowPage({ searchParams }: { searchParams: { tpl?: string; env?: string } }) {
  if (process.env.NODE_ENV === 'production') notFound();
  const tpl = TEMPLATES.find((t) => t.id === (searchParams.tpl || DEFAULT_TEMPLATE_ID)) ?? TEMPLATES[0];
  const sample = buildSamplePreviewCard(tpl, undefined, getTemplateLayouts(tpl)[0]);
  const card = { ...sample, envelope_anim: searchParams.env || DEFAULT_ENVELOPE };
  return <InvitationView card={card} recipientName="Avery" />;
}
