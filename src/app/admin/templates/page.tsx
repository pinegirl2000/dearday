import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { PageContainer } from '@/components/layout/PageContainer';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { TEMPLATES } from '@/lib/templates';
import { getBackground } from '@/lib/backgrounds';
import { getLayout } from '@/lib/layouts';
import TemplateCard from '@/app/i/[slug]/_components/TemplateCard';
import type { BaseCard } from '@/types/card';

export const dynamic = 'force-dynamic';

function buildPreview(t: typeof TEMPLATES[number]): BaseCard {
  return {
    id: 'preview',
    slug: 'preview',
    event_type: 'etc',
    layout_id: t.layout_id,
    bg_id: t.bg_id,
    envelope_anim: 'envelope-1',
    theme: 'hydrangea',
    font_family: 'serif',
    title: 'Sample Title',
    greeting_oneliner: 'A precious moment',
    body: '소중한 순간을\n함께 나누어 주세요.',
    event_date: '2026-06-14T11:00:00.000Z',
    event_place: 'Sample Venue',
    rsvp_enabled: false,
    plan: 'free'
  } as BaseCard;
}

export default async function TemplatesAdminPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) redirect('/');

  return (
    <PageContainer noPadding>
      <MobileHeader title="템플릿 관리" back />
      <div className="px-4 pt-3 pb-12">
        <p className="text-xs text-hydrangea-400 mb-3">
          배경 + 레이아웃 페어링 큐레이션. 추가/수정은 <code className="font-mono">src/lib/templates.ts</code>에서 관리합니다.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TEMPLATES.map((t) => {
            const bg = getBackground(t.bg_id);
            const layout = getLayout(t.layout_id);
            const card = buildPreview(t);
            return (
              <div key={t.id} className="rounded-2xl border border-hydrangea-100 bg-white p-4">
                <div className="flex items-baseline justify-between mb-1">
                  <div className="text-sm font-semibold text-hydrangea-700">{t.name}</div>
                  <code className="text-[10px] font-mono text-hydrangea-400">{t.id}</code>
                </div>
                <p className="text-xs text-hydrangea-500 mb-2">{t.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-hydrangea-100 text-hydrangea-700 font-medium">
                    bg: {bg.name} <span className="opacity-60">({t.bg_id})</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-hydrangea-100 text-hydrangea-700 font-medium">
                    layout: {layout.name} <span className="opacity-60">({t.layout_id})</span>
                  </span>
                  {t.recommendEvents.map((ev) => (
                    <span key={ev} className="text-[10px] px-2 py-0.5 rounded-full bg-hydrangea-50 text-hydrangea-500">
                      {ev}
                    </span>
                  ))}
                </div>

                {/* 레이아웃 상세 정보 */}
                <div className="mb-3 p-3 rounded-xl bg-hydrangea-50/50 text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-hydrangea-700">Layout details</span>
                    <span className="px-1.5 py-0.5 rounded bg-white text-[10px] font-mono text-hydrangea-500">
                      {layout.renderStyle}
                    </span>
                  </div>
                  <div className="text-hydrangea-500 italic">{layout.description}</div>
                  <div className="grid grid-cols-2 gap-1 text-hydrangea-600">
                    <div>
                      <span className="text-hydrangea-400">aspect ratio:</span> {layout.aspectRatio}
                    </div>
                    <div>
                      <span className="text-hydrangea-400">accent:</span>
                      <span className="inline-block w-2.5 h-2.5 rounded-full ml-1 align-middle" style={{ background: layout.accent }} />
                      <span className="ml-1 font-mono text-[10px]">{layout.accent}</span>
                    </div>
                  </div>
                  <div className="pt-1 border-t border-hydrangea-200/50">
                    <div className="text-hydrangea-400 mb-1">fields ({Object.keys(layout.fields).length})</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(layout.fields).map(([key, field]) => {
                        if (!field) return null;
                        return (
                          <span
                            key={key}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-hydrangea-100 text-hydrangea-600"
                            title={`x:${field.x}% y:${field.y}% w:${field.w}% size:${field.fontSize} weight:${field.fontWeight ?? '-'} align:${field.align}`}
                          >
                            {key} <span className="opacity-50 font-mono">{field.fontSize}px</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden bg-hydrangea-50/40 p-2">
                  <TemplateCard card={card} recipientName="John" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
