import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { PageContainer } from '@/components/layout/PageContainer';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { TEMPLATES } from '@/lib/templates';
import { EVENT_TYPES } from '@/lib/eventType';
import type { EventType } from '@/types/card';
import { ChevronLeft } from 'lucide-react';
import TemplateExpandList from './_TemplateExpandList';

export const dynamic = 'force-dynamic';

const ALL_EVENT_IDS: EventType[] = EVENT_TYPES.map((e) => e.id);

interface PageProps {
  searchParams?: { event?: string };
}

export default async function TemplatesAdminPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) redirect('/');

  const eventParam = searchParams?.event;
  const selectedEvent: EventType | null = eventParam && ALL_EVENT_IDS.includes(eventParam as EventType)
    ? (eventParam as EventType)
    : null;

  // 이벤트 선택 전 화면 — 이벤트 picker
  if (!selectedEvent) {
    const eventCounts: Record<string, number> = {};
    for (const ev of ALL_EVENT_IDS) {
      eventCounts[ev] = TEMPLATES.filter((t) => t.recommendEvents.includes(ev)).length;
    }

    return (
      <PageContainer noPadding>
        <MobileHeader title="템플릿 관리" back />
        <div className="px-4 pt-3 pb-12">
          <p className="text-xs text-hydrangea-400 mb-4">
            먼저 이벤트를 선택하세요. 한 템플릿이 여러 이벤트에 속할 수 있습니다.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {EVENT_TYPES.map((e) => (
              <Link
                key={e.id}
                href={`/admin/templates?event=${e.id}`}
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

  // 이벤트 선택 후 — 템플릿 리스트 + 클릭 펼침
  const eventMeta = EVENT_TYPES.find((e) => e.id === selectedEvent)!;
  const filtered = TEMPLATES.filter((t) => t.recommendEvents.includes(selectedEvent));

  return (
    <PageContainer noPadding>
      <MobileHeader title="템플릿 관리" back />
      <div className="px-4 pt-3 pb-12">
        <Link
          href="/admin/templates"
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
          <TemplateExpandList templates={filtered} eventType={selectedEvent} />
        )}
      </div>
    </PageContainer>
  );
}
