import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { PageContainer } from '@/components/layout/PageContainer';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { TEMPLATES } from '@/lib/templates';
import { getAllTemplateConfigs } from '@/lib/actions/templateConfig';
import { EVENT_TYPES } from '@/lib/eventType';
import type { EventType } from '@/types/card';
import { ChevronLeft } from 'lucide-react';
import TemplateExpandList from './_TemplateExpandList';

export const dynamic = 'force-dynamic';

const ALL_EVENT_IDS: EventType[] = EVENT_TYPES.map((e) => e.id);

type ViewTab = 'template' | 'event';

interface PageProps {
  searchParams?: { event?: string; view?: string };
}

export default async function TemplatesAdminPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) redirect('/');

  const view: ViewTab = searchParams?.view === 'event' ? 'event' : 'template';
  const eventParam = searchParams?.event;
  const selectedEvent: EventType | null = eventParam && ALL_EVENT_IDS.includes(eventParam as EventType)
    ? (eventParam as EventType)
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
    </div>
  );

  // ===== Template별 보기 — 모든 템플릿 평면 리스트 =====
  if (view === 'template') {
    return (
      <PageContainer noPadding>
        <MobileHeader title="템플릿 관리" back />
        <div className="px-4 pt-3 pb-12">
          {ViewTabs}
          <p className="text-xs text-hydrangea-400 mb-3">
            전체 {TEMPLATES.length}개 템플릿. 펼쳐서 layout 설정/저장 가능.
          </p>
          <TemplateExpandList
            templates={TEMPLATES.slice()}
            configs={configs}
          />
        </div>
      </PageContainer>
    );
  }

  // ===== Event별 보기 =====
  if (!selectedEvent) {
    const eventCounts: Record<string, number> = {};
    for (const ev of ALL_EVENT_IDS) {
      eventCounts[ev] = TEMPLATES.filter((t) => t.recommendEvents.includes(ev)).length;
    }

    return (
      <PageContainer noPadding>
        <MobileHeader title="템플릿 관리" back />
        <div className="px-4 pt-3 pb-12">
          {ViewTabs}
          <p className="text-xs text-hydrangea-400 mb-4">
            먼저 이벤트를 선택하세요. 한 템플릿이 여러 이벤트에 속할 수 있습니다.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {EVENT_TYPES.map((e) => (
              <Link
                key={e.id}
                href={`/admin/templates?view=event&event=${e.id}`}
                className="aspect-square rounded-2xl bg-white border border-hydrangea-100 flex flex-col items-center justify-center gap-2 active:scale-95 transition shadow-sm hover:bg-hydrangea-50/40"
              >
                <span className="text-4xl">{e.emoji}</span>
                <span className="text-sm font-semibold text-hydrangea-700">{e.label}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-hydrangea-100 text-hydrangea-700">
                  {eventCounts[e.id]} templates
                </span>
              </Link>
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  // 이벤트 선택 후 — 템플릿 리스트
  const eventMeta = EVENT_TYPES.find((e) => e.id === selectedEvent)!;
  const filtered = TEMPLATES.filter((t) => t.recommendEvents.includes(selectedEvent));

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
          <TemplateExpandList
            templates={filtered}
            eventType={selectedEvent}
            configs={configs}
          />
        )}
      </div>
    </PageContainer>
  );
}
