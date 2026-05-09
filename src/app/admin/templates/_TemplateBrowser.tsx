'use client';

import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { TEMPLATES, getTemplateLayouts } from '@/lib/templates';
import { LAYOUTS, getLayout } from '@/lib/layouts';
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

export default function TemplateBrowser({ configs }: Props) {
  const [tplId, setTplId] = useState<string>(TEMPLATES[0].id);
  const [layoutId, setLayoutId] = useState<LayoutId | null>(null);
  const [pending, startTransition] = useTransition();
  // 로컬 override — DB 저장 후 즉시 UI 반영 (server props 갱신 전)
  const [localConfigs, setLocalConfigs] = useState<Record<string, string[]>>(() => ({ ...(configs || {}) }));

  const selectedTpl = TEMPLATES.find((t) => t.id === tplId) || TEMPLATES[0];
  const allowedLayouts = useMemo(
    () => effectiveLayouts(selectedTpl, localConfigs),
    [selectedTpl, localConfigs]
  );
  const activeLayoutId = (layoutId && allowedLayouts.includes(layoutId)) ? layoutId : allowedLayouts[0];

  const handleDeleteLayout = () => {
    if (!selectedTpl || !activeLayoutId) return;
    if (allowedLayouts.length <= 1) {
      toast.error('최소 1개 layout이 필요합니다');
      return;
    }
    const layoutName = getLayout(activeLayoutId).name;
    if (!confirm(`"${layoutName}" layout을 "${selectedTpl.name}" 템플릿에서 제거할까요?`)) return;
    const next = allowedLayouts.filter((id) => id !== activeLayoutId);
    setLocalConfigs((s) => ({ ...s, [selectedTpl.id]: next }));
    setLayoutId(null);
    startTransition(async () => {
      const res = await saveTemplateAllowedLayouts(selectedTpl.id, next as LayoutId[]);
      if (!res.ok) {
        toast.error(res.error || '삭제 실패');
        // rollback
        setLocalConfigs((s) => ({ ...s, [selectedTpl.id]: allowedLayouts }));
        return;
      }
      toast.success('Layout 제거됨');
    });
  };

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
          <div className="flex gap-1">
            <select
              value={activeLayoutId || ''}
              onChange={(e) => setLayoutId(e.target.value as LayoutId)}
              disabled={allowedLayouts.length === 0}
              className="flex-1 min-w-0 px-2 py-2 rounded-lg border border-hydrangea-200 bg-white text-xs text-hydrangea-700 focus:outline-none focus:ring-2 focus:ring-hydrangea-300 disabled:opacity-50"
            >
              {allowedLayouts.map((id) => {
                const lay = getLayout(id);
                return (
                  <option key={id} value={id}>{lay.name}</option>
                );
              })}
              {allowedLayouts.length === 0 && <option value="">— allowed layout 없음 —</option>}
            </select>
            <button
              type="button"
              onClick={handleDeleteLayout}
              disabled={pending || !activeLayoutId || allowedLayouts.length <= 1}
              title={allowedLayouts.length <= 1 ? '최소 1개 layout 필요' : '이 layout을 template에서 제거'}
              className="flex-shrink-0 px-2 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
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
