'use client';

import { useMemo, useState } from 'react';
import { LAYOUTS, getLayout } from '@/lib/layouts';
import { TEMPLATES, getTemplateLayouts } from '@/lib/templates';
import { getBackground } from '@/lib/backgrounds';
import TemplateCard from '@/app/i/[slug]/_components/TemplateCard';
import type { BaseCard, LayoutId } from '@/types/card';

interface Props {
  /** DB allowedLayouts override (template_id → layouts) */
  configs?: Record<string, string[]>;
}

const SAMPLE: Partial<BaseCard> = {
  title: 'Daniel ♥ Olivia',
  greeting_oneliner: 'Together with our families',
  body: 'We invite you to share in\nthe joy of our wedding day.',
  event_date: '2026-06-14T19:00:00.000Z',
  event_place: 'The Grand Ballroom, Marina Hotel',
  map_url: 'https://maps.google.com',
  contact_name: 'From Daniel & Olivia',
  contact_phone: '+65-1234-5678',
  extra_info: 'Reception to follow'
};

function effectiveLayouts(t: (typeof TEMPLATES)[number], configs?: Record<string, string[]>): LayoutId[] {
  const cfg = configs?.[t.id];
  if (cfg && cfg.length > 0) return cfg as LayoutId[];
  return getTemplateLayouts(t);
}

function buildPreview(t: (typeof TEMPLATES)[number], layoutId: LayoutId): BaseCard {
  return {
    id: 'preview',
    slug: 'preview',
    event_type: t.recommendEvents[0] || 'etc',
    layout_id: layoutId,
    bg_id: t.bg_id,
    envelope_anim: 'envelope-1',
    theme: 'hydrangea',
    font_family: 'serif',
    title: SAMPLE.title || '',
    greeting_oneliner: SAMPLE.greeting_oneliner ?? null,
    body: SAMPLE.body ?? null,
    event_date: SAMPLE.event_date ?? null,
    event_place: SAMPLE.event_place ?? null,
    map_url: SAMPLE.map_url ?? null,
    contact_name: SAMPLE.contact_name ?? null,
    contact_phone: SAMPLE.contact_phone ?? null,
    extra_info: SAMPLE.extra_info ?? null,
    rsvp_enabled: false,
    plan: 'free'
  } as BaseCard;
}

export default function LayoutBrowser({ configs }: Props) {
  const [layoutId, setLayoutId] = useState<LayoutId>(LAYOUTS[0].id);
  const [tplId, setTplId] = useState<string | null>(null);

  const templates = useMemo(
    () => TEMPLATES.filter((t) => effectiveLayouts(t, configs).includes(layoutId)),
    [layoutId, configs]
  );

  // 선택된 템플릿이 새 layout에 없으면 첫 번째로 자동 선택
  const selectedTpl = templates.find((t) => t.id === tplId) || templates[0] || null;
  const layoutMeta = getLayout(layoutId);

  return (
    <div className="space-y-4">
      {/* Layout 드롭다운 */}
      <div>
        <label className="block text-[11px] font-semibold text-hydrangea-700 mb-1">Layout</label>
        <select
          value={layoutId}
          onChange={(e) => {
            setLayoutId(e.target.value as LayoutId);
            setTplId(null);
          }}
          className="w-full px-3 py-2 rounded-lg border border-hydrangea-200 bg-white text-sm text-hydrangea-700 focus:outline-none focus:ring-2 focus:ring-hydrangea-300"
        >
          {LAYOUTS.map((l) => {
            const count = TEMPLATES.filter((t) => effectiveLayouts(t, configs).includes(l.id)).length;
            return (
              <option key={l.id} value={l.id}>
                {l.name} ({count})
              </option>
            );
          })}
        </select>
        <p className="text-[10px] text-hydrangea-400 mt-1">
          {layoutMeta.description} · {layoutMeta.renderStyle}
        </p>
      </div>

      {/* Template 버튼 */}
      <div>
        <label className="block text-[11px] font-semibold text-hydrangea-700 mb-2">
          Templates ({templates.length})
        </label>
        {templates.length === 0 ? (
          <div className="text-center py-8 text-sm text-hydrangea-400 border border-dashed border-hydrangea-200 rounded-xl">
            이 layout을 사용하는 템플릿이 없습니다.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => {
              const bg = getBackground(t.bg_id);
              const isSelected = selectedTpl?.id === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTplId(t.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full border transition active:scale-95 ${
                    isSelected
                      ? 'border-hydrangea-500 bg-hydrangea-50 text-hydrangea-700'
                      : 'border-hydrangea-100 bg-white text-hydrangea-600 hover:bg-hydrangea-50/60'
                  }`}
                >
                  <span
                    className="w-5 h-7 rounded-sm overflow-hidden border border-hydrangea-100 flex-shrink-0"
                    style={!bg.imageUrl ? { background: bg.gradient } : undefined}
                  >
                    {bg.imageUrl && <img src={bg.imageUrl} alt="" className="w-full h-full object-cover" />}
                  </span>
                  <span className="text-xs font-medium">{t.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview */}
      {selectedTpl && (
        <div className="pt-2">
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className="text-sm font-semibold text-hydrangea-700">Preview</h3>
            <code className="text-[10px] text-hydrangea-400">{selectedTpl.id}</code>
          </div>
          <div className="bg-hydrangea-50/40 rounded-2xl p-3">
            <TemplateCard card={buildPreview(selectedTpl, layoutId)} />
          </div>
        </div>
      )}
    </div>
  );
}
