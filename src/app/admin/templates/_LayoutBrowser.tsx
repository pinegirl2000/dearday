'use client';

import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { LAYOUTS, getLayout } from '@/lib/layouts';
import { TEMPLATES, getTemplateLayouts } from '@/lib/templates';
import { saveTemplateAllowedLayouts } from '@/lib/actions/templateConfig';
import TemplateCard from '@/app/i/[slug]/_components/TemplateCard';
import TemplateInfoPanel, { TemplateColorRow } from './_TemplateInfoPanel';
import type { BaseCard, LayoutId } from '@/types/card';

interface Props {
  configs?: Record<string, string[]>;
}

const SAMPLE_BY_EVENT: Record<string, Partial<BaseCard>> = {
  wedding: {
    title: 'Daniel ♥ Olivia', greeting_oneliner: 'Together with our families',
    body: 'We invite you to share in\nthe joy of our wedding day.',
    event_date: '2026-06-14T19:00:00.000Z', event_place: 'The Grand Ballroom, Marina Hotel',
    contact_name: 'From Daniel & Olivia', contact_phone: '+65-1234-5678', extra_info: 'Reception to follow'
  },
  birthday: {
    title: "Riley's First Birthday", greeting_oneliner: 'A precious first year',
    body: "Please join us in celebrating\nRiley's first year of life.",
    event_date: '2026-07-05T11:00:00.000Z', event_place: 'The Lounge function room',
    contact_name: "Love, Riley's Family", contact_phone: '+65-2222-3333'
  },
  baptism: {
    title: "Avery's Baptism Day", greeting_oneliner: 'A blessed first step',
    body: "Please join us as we celebrate\nAvery's baptism in the Lord.",
    event_date: '2026-05-03T10:30:00.000Z', event_place: 'Grace Church, Main Sanctuary',
    contact_name: 'Love, David & Rachel', contact_phone: '+65-9999-1111'
  },
  meeting: {
    title: 'Spring Gathering', greeting_oneliner: 'See you again',
    body: "It has been too long.\nLet's gather and catch up.",
    event_date: '2026-04-12T14:00:00.000Z', event_place: 'Hangang Park, Open Lawn',
    contact_name: 'From the Hosts', contact_phone: '+65-3333-4444'
  },
  opening: {
    title: 'Round Cafe · Grand Opening', greeting_oneliner: 'A new beginning',
    body: "We're excited to open our doors\nand share this moment with you.",
    event_date: '2026-09-20T17:00:00.000Z', event_place: 'Round Cafe, 1 Orchard Lane',
    contact_name: 'The Round Cafe Team', contact_phone: '+65-7777-8888'
  },
  etc: {
    title: 'A Special Day', greeting_oneliner: 'A precious moment',
    body: "We'd love for you to share\nthis special moment with us.",
    event_date: '2026-08-10T18:00:00.000Z', event_place: 'Sample Venue, City',
    contact_name: 'From the Host', contact_phone: '+65-1000-2000'
  }
};

function effectiveLayouts(t: (typeof TEMPLATES)[number], configs?: Record<string, string[]>): LayoutId[] {
  const cfg = configs?.[t.id];
  if (cfg && cfg.length > 0) return cfg as LayoutId[];
  return getTemplateLayouts(t);
}

function buildPreview(t: (typeof TEMPLATES)[number], layoutId: LayoutId): BaseCard {
  const ev = t.recommendEvents[0] || 'etc';
  const sample = SAMPLE_BY_EVENT[ev] || SAMPLE_BY_EVENT.etc;
  return {
    id: 'preview',
    slug: 'preview',
    event_type: ev,
    layout_id: layoutId,
    bg_id: t.bg_id,
    envelope_anim: 'envelope-1',
    theme: 'hydrangea',
    font_family: 'serif',
    title: sample.title || '',
    greeting_oneliner: sample.greeting_oneliner ?? null,
    body: sample.body ?? null,
    event_date: sample.event_date ?? null,
    event_place: sample.event_place ?? null,
    map_url: 'https://maps.google.com',
    contact_name: sample.contact_name ?? null,
    contact_phone: sample.contact_phone ?? null,
    extra_info: sample.extra_info ?? null,
    rsvp_enabled: false,
    plan: 'free'
  } as BaseCard;
}

export default function LayoutBrowser({ configs }: Props) {
  const [layoutId, setLayoutId] = useState<LayoutId>(LAYOUTS[0].id);
  const [tplId, setTplId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [localConfigs, setLocalConfigs] = useState<Record<string, string[]>>(() => ({ ...(configs || {}) }));

  const templates = useMemo(
    () => TEMPLATES.filter((t) => effectiveLayouts(t, localConfigs).includes(layoutId)),
    [layoutId, localConfigs]
  );

  const selectedTpl = templates.find((t) => t.id === tplId) || templates[0] || null;

  const handleRemoveLayoutFromTpl = () => {
    if (!selectedTpl) return;
    const tplAllowed = effectiveLayouts(selectedTpl, localConfigs);
    if (tplAllowed.length <= 1) {
      toast.error('최소 1개 layout이 필요합니다');
      return;
    }
    const layoutName = getLayout(layoutId).name;
    if (!confirm(`"${selectedTpl.name}" 템플릿에서 "${layoutName}" layout을 제거할까요?`)) return;
    const next = tplAllowed.filter((id) => id !== layoutId);
    setLocalConfigs((s) => ({ ...s, [selectedTpl.id]: next }));
    setTplId(null);
    startTransition(async () => {
      const res = await saveTemplateAllowedLayouts(selectedTpl.id, next as LayoutId[]);
      if (!res.ok) {
        toast.error(res.error || '삭제 실패');
        setLocalConfigs((s) => ({ ...s, [selectedTpl.id]: tplAllowed }));
        return;
      }
      toast.success('Layout 제거됨');
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-hydrangea-700 mb-1">Layout</label>
          <select
            value={layoutId}
            onChange={(e) => {
              setLayoutId(e.target.value as LayoutId);
              setTplId(null);
            }}
            className="w-full px-2 py-2 rounded-lg border border-hydrangea-200 bg-white text-xs text-hydrangea-700 focus:outline-none focus:ring-2 focus:ring-hydrangea-300"
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
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-hydrangea-700 mb-1">Template</label>
          <div className="flex gap-1">
            <select
              value={selectedTpl?.id || ''}
              onChange={(e) => setTplId(e.target.value)}
              disabled={templates.length === 0}
              className="flex-1 min-w-0 px-2 py-2 rounded-lg border border-hydrangea-200 bg-white text-xs text-hydrangea-700 focus:outline-none focus:ring-2 focus:ring-hydrangea-300 disabled:opacity-50"
            >
              {templates.length === 0 && <option value="">— 사용 템플릿 없음 —</option>}
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleRemoveLayoutFromTpl}
              disabled={pending || !selectedTpl}
              title="이 layout을 이 template에서 제거"
              className="flex-shrink-0 px-2 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {selectedTpl && (
        <>
          <TemplateColorRow template={selectedTpl} />
          <div className="bg-hydrangea-50/40 rounded-2xl p-3">
            <TemplateCard card={buildPreview(selectedTpl, layoutId)} />
          </div>
          <TemplateInfoPanel template={selectedTpl} layoutId={layoutId} />
        </>
      )}
      {!selectedTpl && (
        <div className="text-center py-8 text-sm text-hydrangea-400 border border-dashed border-hydrangea-200 rounded-xl">
          이 layout을 사용하는 템플릿이 없습니다.
        </div>
      )}
    </div>
  );
}
