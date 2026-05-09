import { Suspense } from 'react';
import SinglePageWizard from './_components/SinglePageWizard';
import { getAllTemplateConfigs, getAllTemplateColors, type TemplateColors } from '@/lib/actions/templateConfig';
import { getAllTemplateEventOrders } from '@/lib/actions/templateOrder';
import { getAllTemplateEventExcludes } from '@/lib/actions/templateEventExclude';

export const dynamic = 'force-dynamic';

export default async function NewCardPage() {
  // admin DB 설정 (allowedLayouts override + 이벤트별 노출 순서 + 이벤트별 제외)
  const [configsMap, ordersMap, excludesMap, colorsMap] = await Promise.all([
    getAllTemplateConfigs(),
    getAllTemplateEventOrders(),
    getAllTemplateEventExcludes(),
    getAllTemplateColors()
  ]);
  const configs: Record<string, string[]> = {};
  configsMap.forEach((v, k) => { configs[k] = v; });
  const eventOrders: Record<string, string[]> = {};
  ordersMap.forEach((v, k) => { eventOrders[k] = v; });
  const eventExcludes: Record<string, string[]> = {};
  excludesMap.forEach((v, k) => { eventExcludes[k] = v; });
  const templateColors: Record<string, TemplateColors> = {};
  colorsMap.forEach((v, k) => { templateColors[k] = v; });
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩...</div>}>
      <SinglePageWizard templateConfigs={configs} eventOrders={eventOrders} eventExcludes={eventExcludes} templateColors={templateColors} />
    </Suspense>
  );
}
