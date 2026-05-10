import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getCardBySlug } from '@/lib/db/cards';
import { getAllTemplateConfigs } from '@/lib/actions/templateConfig';
import EditCardClient from './_EditCardClient';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
}

export default async function EditCardPage({ params }: Props) {
  const card = await getCardBySlug(params.slug);
  if (!card) notFound();

  // 사용자 wizard와 동일하게 admin DB 설정 전달
  const configsMap = await getAllTemplateConfigs();
  const configs: Record<string, string[]> = {};
  configsMap.forEach((v, k) => { configs[k] = v; });

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <EditCardClient card={card} templateConfigs={configs} />
    </Suspense>
  );
}
