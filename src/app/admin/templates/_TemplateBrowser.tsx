'use client';

import { useMemo, useState } from 'react';
import { TEMPLATES, getTemplateLayouts } from '@/lib/templates';
import { LAYOUTS, getLayout } from '@/lib/layouts';
import TemplateCard from '@/app/i/[slug]/_components/TemplateCard';
import TemplateInfoPanel, { TemplateColorRow } from './_TemplateInfoPanel';
import type { BaseCard, LayoutId } from '@/types/card';

interface Props {
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

export default function TemplateBrowser({ configs }: Props) {
  const [tplId, setTplId] = useState<string>(TEMPLATES[0].id);
  const [layoutId, setLayoutId] = useState<LayoutId | null>(null);

  const selectedTpl = TEMPLATES.find((t) => t.id === tplId) || TEMPLATES[0];
  const allowedLayouts = useMemo(
    () => effectiveLayouts(selectedTpl, configs),
    [selectedTpl, configs]
  );
  const activeLayoutId = (layoutId && allowedLayouts.includes(layoutId)) ? layoutId : allowedLayouts[0];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-hydrangea-700 mb-1">Template</label>
          <select
            value={tplId}
            onChange={(e) => {
              setTplId(e.target.value);
              setLayoutId(null);
            }}
            className="w-full px-2 py-2 rounded-lg border border-hydrangea-200 bg-white text-xs text-hydrangea-700 focus:outline-none focus:ring-2 focus:ring-hydrangea-300"
          >
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-hydrangea-700 mb-1">Layout</label>
          <select
            value={activeLayoutId || ''}
            onChange={(e) => setLayoutId(e.target.value as LayoutId)}
            disabled={allowedLayouts.length === 0}
            className="w-full px-2 py-2 rounded-lg border border-hydrangea-200 bg-white text-xs text-hydrangea-700 focus:outline-none focus:ring-2 focus:ring-hydrangea-300 disabled:opacity-50"
          >
            {allowedLayouts.map((id) => {
              const lay = getLayout(id);
              return (
                <option key={id} value={id}>{lay.name}</option>
              );
            })}
            {allowedLayouts.length === 0 && <option value="">— allowed layout 없음 —</option>}
          </select>
        </div>
      </div>

      {activeLayoutId && (
        <>
          <TemplateColorRow template={selectedTpl} />
          <div className="bg-hydrangea-50/40 rounded-2xl p-3">
            <TemplateCard card={buildPreview(selectedTpl, activeLayoutId)} />
          </div>
          <TemplateInfoPanel template={selectedTpl} layoutId={activeLayoutId} />
        </>
      )}
    </div>
  );
}
