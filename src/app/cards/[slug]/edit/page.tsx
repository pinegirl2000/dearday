import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getCardBySlug } from '@/lib/db/cards';
import { getAllTemplateConfigs, getAllTemplateColors, type TemplateColors } from '@/lib/actions/templateConfig';
import { getAllTemplateEventOrders } from '@/lib/actions/templateOrder';
import { getAllTemplateEventExcludes } from '@/lib/actions/templateEventExclude';
import { getAllTemplateEventIncludes } from '@/lib/actions/templateEventInclude';
import { getAllEvents } from '@/lib/actions/events';
import EditCardClient from './_EditCardClient';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
}

export default async function EditCardPage({ params }: Props) {
  const card = await getCardBySlug(params.slug);
  if (!card) notFound();

  // 사용자 wizard와 동일하게 admin DB 설정 + 이벤트 전체 전달 (수정 시에도 새로 추가된 이벤트 노출)
  const [configsMap, ordersMap, excludesMap, includesMap, colorsMap, allEvents] = await Promise.all([
    getAllTemplateConfigs(),
    getAllTemplateEventOrders(),
    getAllTemplateEventExcludes(),
    getAllTemplateEventIncludes(),
    getAllTemplateColors(),
    getAllEvents()
  ]);
  const configs: Record<string, string[]> = {};
  configsMap.forEach((v, k) => { configs[k] = v; });
  const eventOrders: Record<string, string[]> = {};
  ordersMap.forEach((v, k) => { eventOrders[k] = v; });
  const eventExcludes: Record<string, string[]> = {};
  excludesMap.forEach((v, k) => { eventExcludes[k] = v; });
  const eventIncludes: Record<string, string[]> = {};
  includesMap.forEach((v, k) => { eventIncludes[k] = v; });
  const templateColors: Record<string, TemplateColors> = {};
  colorsMap.forEach((v, k) => { templateColors[k] = v; });

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <EditCardClient
        card={card}
        templateConfigs={configs}
        eventOrders={eventOrders}
        eventExcludes={eventExcludes}
        eventIncludes={eventIncludes}
        templateColors={templateColors}
        allEvents={allEvents}
      />
    </Suspense>
  );
}
