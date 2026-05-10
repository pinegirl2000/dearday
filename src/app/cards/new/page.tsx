import { Suspense } from 'react';
import SinglePageWizard from './_components/SinglePageWizard';
import { getAllTemplateConfigs, getAllTemplateColors, type TemplateColors } from '@/lib/actions/templateConfig';
import { getAllTemplateEventOrders } from '@/lib/actions/templateOrder';
import { getAllTemplateEventExcludes } from '@/lib/actions/templateEventExclude';
import { getAllTemplateEventIncludes } from '@/lib/actions/templateEventInclude';
import { getAllEvents } from '@/lib/actions/events';

export const dynamic = 'force-dynamic';

export default async function NewCardPage() {
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩...</div>}>
      <SinglePageWizard
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
