import { Suspense } from 'react';
import SinglePageWizard from './_components/SinglePageWizard';
import { getAllTemplateConfigs } from '@/lib/actions/templateConfig';
import { getAllTemplateEventOrders } from '@/lib/actions/templateOrder';

export const dynamic = 'force-dynamic';

export default async function NewCardPage() {
  // admin DB 설정 (allowedLayouts override + 이벤트별 노출 순서)
  const [configsMap, ordersMap] = await Promise.all([
    getAllTemplateConfigs(),
    getAllTemplateEventOrders()
  ]);
  const configs: Record<string, string[]> = {};
  configsMap.forEach((v, k) => { configs[k] = v; });
  const eventOrders: Record<string, string[]> = {};
  ordersMap.forEach((v, k) => { eventOrders[k] = v; });
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩...</div>}>
      <SinglePageWizard templateConfigs={configs} eventOrders={eventOrders} />
    </Suspense>
  );
}
