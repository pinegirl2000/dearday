'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { TEMPLATES, getTemplateLayouts } from '@/lib/templates';
import { getBackground } from '@/lib/backgrounds';
import { EVENT_TYPES } from '@/lib/eventType';
import { saveTemplateEventOrder } from '@/lib/actions/templateOrder';
import TemplateCard from '@/app/i/[slug]/_components/TemplateCard';
import TemplateInfoPanel, { TemplateColorRow } from './_TemplateInfoPanel';
import type { BaseCard, EventType, LayoutId } from '@/types/card';

type Tpl = (typeof TEMPLATES)[number];

interface Props {
  configs?: Record<string, string[]>;
  eventOrders?: Record<string, string[]>;
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

function effectiveLayouts(t: Tpl, configs?: Record<string, string[]>): LayoutId[] {
  const cfg = configs?.[t.id];
  if (cfg && cfg.length > 0) return cfg as LayoutId[];
  return getTemplateLayouts(t);
}

function applyOrder(tpls: Tpl[], order: string[]): Tpl[] {
  if (!order || order.length === 0) return tpls;
  const byId = new Map(tpls.map((t) => [t.id, t]));
  const ordered: Tpl[] = [];
  for (const id of order) {
    const t = byId.get(id);
    if (t) { ordered.push(t); byId.delete(id); }
  }
  for (const t of tpls) if (byId.has(t.id)) ordered.push(t);
  return ordered;
}

function buildPreview(t: Tpl, layoutId: LayoutId, ev: EventType): BaseCard {
  const sample = SAMPLE_BY_EVENT[ev] || SAMPLE_BY_EVENT.etc;
  return {
    id: 'preview', slug: 'preview', event_type: ev, layout_id: layoutId, bg_id: t.bg_id,
    envelope_anim: 'envelope-1', theme: 'hydrangea', font_family: 'serif',
    title: sample.title || '', greeting_oneliner: sample.greeting_oneliner ?? null,
    body: sample.body ?? null, event_date: sample.event_date ?? null,
    event_place: sample.event_place ?? null, map_url: 'https://maps.google.com',
    contact_name: sample.contact_name ?? null, contact_phone: sample.contact_phone ?? null,
    extra_info: sample.extra_info ?? null, rsvp_enabled: false, plan: 'free'
  } as BaseCard;
}

function SortableButton({ tpl }: { tpl: Tpl }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tpl.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const bg = getBackground(tpl.bg_id);
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white cursor-grab touch-none ${
        isDragging ? 'border-hydrangea-400 shadow-lg' : 'border-hydrangea-100'
      }`}>
      <GripVertical className="w-3.5 h-3.5 text-hydrangea-400 flex-shrink-0" />
      <span className="w-5 h-7 rounded-sm overflow-hidden border border-hydrangea-100 flex-shrink-0"
        style={!bg.imageUrl ? { background: bg.gradient } : undefined}>
        {bg.imageUrl && <img src={bg.imageUrl} alt="" className="w-full h-full object-cover" />}
      </span>
      <span className="text-xs font-medium text-hydrangea-700">{tpl.name}</span>
    </div>
  );
}

export default function EventBrowser({ configs, eventOrders }: Props) {
  const [eventId, setEventId] = useState<EventType>('wedding');
  const [tplId, setTplId] = useState<string | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [pending, startTransition] = useTransition();
  const [localOrders, setLocalOrders] = useState<Record<string, string[]>>(() => ({ ...(eventOrders || {}) }));

  useEffect(() => { setLocalOrders({ ...(eventOrders || {}) }); }, [eventOrders]);

  const baseTemplates = useMemo(
    () => TEMPLATES.filter((t) => t.recommendEvents.includes(eventId)),
    [eventId]
  );
  const templates = useMemo(
    () => applyOrder(baseTemplates, localOrders[eventId] || []),
    [baseTemplates, localOrders, eventId]
  );
  const selectedTpl = templates.find((t) => t.id === tplId) || templates[0] || null;
  const previewLayoutId = selectedTpl
    ? (effectiveLayouts(selectedTpl, configs)[0] || selectedTpl.layout_id)
    : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = templates.findIndex((t) => t.id === active.id);
    const newIdx = templates.findIndex((t) => t.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(templates, oldIdx, newIdx);
    setLocalOrders((s) => ({ ...s, [eventId]: next.map((t) => t.id) }));
    startTransition(async () => {
      const res = await saveTemplateEventOrder(eventId, next.map((t) => t.id));
      if (!res.ok) toast.error(res.error || '순서 저장 실패');
      else toast.success('순서 저장됨', { duration: 1200 });
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-hydrangea-700 mb-1">Event</label>
          <select
            value={eventId}
            onChange={(e) => {
              setEventId(e.target.value as EventType);
              setTplId(null);
              setReorderMode(false);
            }}
            className="w-full px-2 py-2 rounded-lg border border-hydrangea-200 bg-white text-xs text-hydrangea-700 focus:outline-none focus:ring-2 focus:ring-hydrangea-300"
          >
            {EVENT_TYPES.map((e) => {
              const count = TEMPLATES.filter((t) => t.recommendEvents.includes(e.id)).length;
              return (
                <option key={e.id} value={e.id}>{e.emoji} {e.label} ({count})</option>
              );
            })}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-hydrangea-700 mb-1">Template</label>
          <select
            value={selectedTpl?.id || ''}
            onChange={(e) => setTplId(e.target.value)}
            disabled={templates.length === 0}
            className="w-full px-2 py-2 rounded-lg border border-hydrangea-200 bg-white text-xs text-hydrangea-700 focus:outline-none focus:ring-2 focus:ring-hydrangea-300 disabled:opacity-50"
          >
            {templates.length === 0 && <option value="">— 템플릿 없음 —</option>}
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {templates.length > 1 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setReorderMode((v) => !v)}
            className={`text-[11px] px-3 py-1 rounded-full font-semibold active:scale-95 transition ${
              reorderMode ? 'bg-hydrangea-500 text-white' : 'bg-hydrangea-100 text-hydrangea-700'
            }`}
          >
            {reorderMode ? '완료' : '순서 변경'}{pending && reorderMode && ' · 저장 중'}
          </button>
        </div>
      )}

      {reorderMode ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={templates.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {templates.map((t) => <SortableButton key={t.id} tpl={t} />)}
            </div>
          </SortableContext>
        </DndContext>
      ) : selectedTpl && previewLayoutId ? (
        <>
          <TemplateColorRow template={selectedTpl} />
          <div className="bg-hydrangea-50/40 rounded-2xl p-3">
            <TemplateCard card={buildPreview(selectedTpl, previewLayoutId, eventId)} />
          </div>
          <TemplateInfoPanel template={selectedTpl} layoutId={previewLayoutId} />
        </>
      ) : (
        <div className="text-center py-8 text-sm text-hydrangea-400 border border-dashed border-hydrangea-200 rounded-xl">
          이 이벤트에 추천되는 템플릿이 없습니다.
        </div>
      )}
    </div>
  );
}
