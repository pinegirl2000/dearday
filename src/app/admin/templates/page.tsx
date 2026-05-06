import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { PageContainer } from '@/components/layout/PageContainer';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { TEMPLATES, getTemplateLayouts } from '@/lib/templates';
import { getAllTemplateConfigs } from '@/lib/actions/templateConfig';
import { getTemplateEventOrder } from '@/lib/actions/templateOrder';
import { EVENT_TYPES } from '@/lib/eventType';
import { LAYOUTS } from '@/lib/layouts';
import type { EventType, LayoutId } from '@/types/card';
import { ChevronLeft } from 'lucide-react';
import TemplateExpandList from './_TemplateExpandList';
import SortableTemplateList from './_SortableTemplateList';
import LayoutBrowser from './_LayoutBrowser';
import EventBrowser from './_EventBrowser';
import TemplateBrowser from './_TemplateBrowser';
import { getAllTemplateEventOrders } from '@/lib/actions/templateOrder';

export const dynamic = 'force-dynamic';

const ALL_EVENT_IDS: EventType[] = EVENT_TYPES.map((e) => e.id);

type ViewTab = 'template' | 'event' | 'layout';

interface PageProps {
  searchParams?: { event?: string; layout?: string; view?: string };
}

function getEffectiveLayouts(
  t: (typeof TEMPLATES)[number],
  configs: Record<string, string[]>
): LayoutId[] {
  const cfg = configs[t.id];
  if (cfg && cfg.length > 0) return cfg as LayoutId[];
  return getTemplateLayouts(t);
}

export default async function TemplatesAdminPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) redirect('/');

  const view: ViewTab = searchParams?.view === 'event'
    ? 'event'
    : searchParams?.view === 'layout'
      ? 'layout'
      : 'template';
  const eventParam = searchParams?.event;
  const selectedEvent: EventType | null = eventParam && ALL_EVENT_IDS.includes(eventParam as EventType)
    ? (eventParam as EventType)
    : null;
  const layoutParam = searchParams?.layout;
  const selectedLayout: LayoutId | null = layoutParam && LAYOUTS.some((l) => l.id === layoutParam)
    ? (layoutParam as LayoutId)
    : null;

  const configs = Object.fromEntries(await getAllTemplateConfigs());

  const ViewTabs = (
    <div className="flex gap-2 mb-4 border-b border-hydrangea-100">
      <Link
        href="/admin/templates?view=template"
        className={`px-3 py-2 text-sm font-medium border-b-2 transition ${
          view === 'template'
            ? 'border-hydrangea-500 text-hydrangea-700'
            : 'border-transparent text-hydrangea-400 hover:text-hydrangea-600'
        }`}
      >
        Template별
      </Link>
      <Link
        href="/admin/templates?view=event"
        className={`px-3 py-2 text-sm font-medium border-b-2 transition ${
          view === 'event'
            ? 'border-hydrangea-500 text-hydrangea-700'
            : 'border-transparent text-hydrangea-400 hover:text-hydrangea-600'
        }`}
      >
        Event별
      </Link>
      <Link
        href="/admin/templates?view=layout"
        className={`px-3 py-2 text-sm font-medium border-b-2 transition ${
          view === 'layout'
            ? 'border-hydrangea-500 text-hydrangea-700'
            : 'border-transparent text-hydrangea-400 hover:text-hydrangea-600'
        }`}
      >
        Layout별
      </Link>
    </div>
  );

  // ===== Template별 보기 — Template + Layout 드롭다운 + preview =====
  if (view === 'template') {
    return (
      <PageContainer noPadding>
        <MobileHeader title="템플릿 관리" back />
        <div className="px-4 pt-3 pb-12">
          {ViewTabs}
          <TemplateBrowser configs={configs} />
        </div>
      </PageContainer>
    );
  }

  // ===== Event별 보기 — 드롭다운 + 템플릿 버튼 + preview =====
  if (view === 'event') {
    const ordersMap = await getAllTemplateEventOrders();
    const eventOrdersObj: Record<string, string[]> = {};
    ordersMap.forEach((v, k) => { eventOrdersObj[k] = v; });
    return (
      <PageContainer noPadding>
        <MobileHeader title="템플릿 관리" back />
        <div className="px-4 pt-3 pb-12">
          {ViewTabs}
          <EventBrowser configs={configs} eventOrders={eventOrdersObj} />
        </div>
      </PageContainer>
    );
  }

  // ===== Layout별 보기 — 드롭다운 + 템플릿 버튼 + preview =====
  if (view === 'layout') {
    return (
      <PageContainer noPadding>
        <MobileHeader title="템플릿 관리" back />
        <div className="px-4 pt-3 pb-12">
          {ViewTabs}
          <LayoutBrowser configs={configs} />
        </div>
      </PageContainer>
    );
  }

  // 이벤트 선택 후 — 템플릿 리스트 (drag&drop 순서 지원)
  if (!selectedEvent) redirect('/admin/templates?view=event');
  const ev = selectedEvent as EventType;
  const eventMeta = EVENT_TYPES.find((e) => e.id === ev)!;
  const filtered = TEMPLATES.filter((t) => t.recommendEvents.includes(ev));
  const eventOrder = await getTemplateEventOrder(ev);

  return (
    <PageContainer noPadding>
      <MobileHeader title="템플릿 관리" back />
      <div className="px-4 pt-3 pb-12">
        {ViewTabs}
        <Link
          href="/admin/templates?view=event"
          className="inline-flex items-center gap-1 text-xs text-hydrangea-500 mb-3 hover:text-hydrangea-700"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> 이벤트 다시 선택
        </Link>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl">{eventMeta.emoji}</span>
          <h2 className="text-lg font-semibold text-hydrangea-700">{eventMeta.label}</h2>
          <span className="text-xs text-hydrangea-400">· {filtered.length} templates</span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-hydrangea-400">
            이 이벤트에 추천되는 템플릿이 없습니다.
          </div>
        ) : (
          <SortableTemplateList
            templates={filtered}
            eventType={ev}
            initialOrder={eventOrder}
            configs={configs}
          />
        )}
      </div>
    </PageContainer>
  );
}
