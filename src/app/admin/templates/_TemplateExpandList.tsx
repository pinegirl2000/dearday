'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { TEMPLATES, getTemplateLayouts } from '@/lib/templates';
import { getBackground } from '@/lib/backgrounds';
import { getLayout, LAYOUTS } from '@/lib/layouts';
import { EVENT_TYPES } from '@/lib/eventType';
import { saveTemplateAllowedLayouts, resetTemplateConfig } from '@/lib/actions/templateConfig';
import { toast } from 'sonner';
import TemplateCard from '@/app/i/[slug]/_components/TemplateCard';
import type { BaseCard, LayoutId } from '@/types/card';

type Tpl = (typeof TEMPLATES)[number];

interface Props {
  templates: Tpl[];
  /** 현재 필터 중인 이벤트 — 미리보기 카드의 event_type으로 전달 */
  eventType?: string;
  /** DB에 저장된 template_id별 allowed_layouts override (object 형태) */
  configs?: Record<string, string[]>;
}

interface SampleData {
  title: string;
  greeting_oneliner: string;
  body: string;
  event_date: string;
  event_place: string;
  contact_name: string;
  contact_phone: string;
  extra_info: string;
}

const SAMPLE_BY_EVENT: Record<string, SampleData> = {
  wedding: {
    title: 'Daniel ♥ Olivia',
    greeting_oneliner: 'Together with our families',
    body: 'We invite you to share in\nthe joy of our wedding day.',
    event_date: '2026-06-14T19:00:00.000Z',
    event_place: 'The Grand Ballroom, Marina Hotel',
    contact_name: 'From Daniel & Olivia',
    contact_phone: '+65-1234-5678',
    extra_info: 'Reception to follow'
  },
  birthday: {
    title: "Riley's First Birthday",
    greeting_oneliner: 'A precious first year',
    body: "Please join us in celebrating\nRiley's first year of life.",
    event_date: '2026-07-05T11:00:00.000Z',
    event_place: 'The Lounge function room',
    contact_name: "Love, Riley's Family",
    contact_phone: '+65-2222-3333',
    extra_info: 'Lunch will be served'
  },
  opening: {
    title: 'Round Cafe · Grand Opening',
    greeting_oneliner: 'A new beginning',
    body: "We're excited to open our doors\nand share this moment with you.",
    event_date: '2026-09-20T17:00:00.000Z',
    event_place: 'Round Cafe, 1 Orchard Lane',
    contact_name: 'The Round Cafe Team',
    contact_phone: '+65-7777-8888',
    extra_info: 'Light reception to follow'
  },
  baptism: {
    title: "Avery's Baptism Day",
    greeting_oneliner: 'A blessed first step',
    body: 'Please join us as we celebrate\nAvery\'s baptism in the Lord.',
    event_date: '2026-05-03T10:30:00.000Z',
    event_place: 'Grace Church, Main Sanctuary',
    contact_name: 'Love, David & Rachel',
    contact_phone: '+65-9999-1111',
    extra_info: 'Lunch fellowship after the service'
  },
  meeting: {
    title: 'Spring Gathering',
    greeting_oneliner: 'See you again',
    body: "It has been too long.\nLet's gather and catch up.",
    event_date: '2026-04-12T14:00:00.000Z',
    event_place: 'Hangang Park, Open Lawn',
    contact_name: 'From the Hosts',
    contact_phone: '+65-3333-4444',
    extra_info: 'Picnic mats provided'
  },
  etc: {
    title: 'A Special Day',
    greeting_oneliner: 'A precious moment',
    body: "We'd love for you to share\nthis special moment with us.",
    event_date: '2026-08-10T18:00:00.000Z',
    event_place: 'Sample Venue, City',
    contact_name: 'From the Host',
    contact_phone: '+65-1000-2000',
    extra_info: 'Light reception'
  }
};

function buildPreview(t: Tpl, layoutOverride?: LayoutId, eventType?: string): BaseCard {
  const ev = eventType && SAMPLE_BY_EVENT[eventType] ? eventType : 'wedding';
  const sample = SAMPLE_BY_EVENT[ev];
  return {
    id: 'preview',
    slug: 'preview',
    event_type: ev as any,
    layout_id: (layoutOverride || t.layout_id) as LayoutId,
    bg_id: t.bg_id,
    envelope_anim: 'envelope-1',
    theme: 'hydrangea',
    font_family: 'serif',
    title: sample.title,
    greeting_oneliner: sample.greeting_oneliner,
    body: sample.body,
    event_date: sample.event_date,
    event_place: sample.event_place,
    map_url: 'https://maps.google.com',
    contact_name: sample.contact_name,
    contact_phone: sample.contact_phone,
    extra_info: sample.extra_info,
    rsvp_enabled: false,
    plan: 'free'
  } as BaseCard;
}

export default function TemplateExpandList({ templates, eventType, configs }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  // 펼친 항목별로 — 미리보기 렌더에 쓸 단일 active layout
  const [previewLayout, setPreviewLayout] = useState<Record<string, LayoutId>>({});
  // 멀티선택 상태 — 초기값은 DB config(있으면) > 코드 default. 변경 후 Save로 영속.
  const [allowedOverride, setAllowedOverride] = useState<Record<string, LayoutId[]>>(() => {
    const init: Record<string, LayoutId[]> = {};
    if (configs) {
      for (const [tid, layouts] of Object.entries(configs)) {
        init[tid] = layouts as LayoutId[];
      }
    }
    return init;
  });
  // 어떤 템플릿이 dirty(저장 필요) 상태인지
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  const getAllowed = (t: typeof TEMPLATES[number]): LayoutId[] => {
    if (allowedOverride[t.id] && allowedOverride[t.id].length > 0) {
      return allowedOverride[t.id];
    }
    if (configs && configs[t.id] && configs[t.id].length > 0) {
      return configs[t.id] as LayoutId[];
    }
    return getTemplateLayouts(t);
  };

  const toggleAllowed = (templateId: string, layoutId: LayoutId, currentList: LayoutId[]) => {
    setAllowedOverride((s) => {
      const next = currentList.includes(layoutId)
        ? currentList.filter((x) => x !== layoutId)
        : [...currentList, layoutId];
      // 최소 1개는 유지
      if (next.length === 0) return s;
      return { ...s, [templateId]: next };
    });
    setDirtyIds((s) => new Set(s).add(templateId));
  };

  const handleSave = async (templateId: string) => {
    const allowed = allowedOverride[templateId];
    if (!allowed || allowed.length === 0) {
      toast.error('최소 1개 layout 선택 필요');
      return;
    }
    setSavingId(templateId);
    const res = await saveTemplateAllowedLayouts(templateId, allowed);
    setSavingId(null);
    if (!res.ok) {
      toast.error(res.error || '저장 실패');
      return;
    }
    setDirtyIds((s) => {
      const n = new Set(s); n.delete(templateId); return n;
    });
    toast.success('저장됨');
  };

  const handleReset = async (t: typeof TEMPLATES[number]) => {
    setSavingId(t.id);
    const res = await resetTemplateConfig(t.id);
    setSavingId(null);
    if (!res.ok) { toast.error(res.error || '실패'); return; }
    setAllowedOverride((s) => {
      const n = { ...s };
      delete n[t.id];
      return n;
    });
    setDirtyIds((s) => {
      const n = new Set(s); n.delete(t.id); return n;
    });
    toast.success('코드 default로 복귀');
  };

  return (
    <div className="space-y-2">
      {templates.map((t) => {
        const bg = getBackground(t.bg_id);
        const allowed = getAllowed(t);
        const activeLayoutId = (previewLayout[t.id] || (allowed.includes(t.layout_id) ? t.layout_id : allowed[0])) as LayoutId;
        const layout = getLayout(activeLayoutId);
        const isOpen = openId === t.id;
        const card = buildPreview(t, activeLayoutId, eventType);

        return (
          <div key={t.id} className="rounded-2xl border border-hydrangea-100 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : t.id)}
              className="w-full flex items-center gap-3 p-4 text-left active:bg-hydrangea-50/40 transition"
            >
              {/* 미니 썸네일 */}
              <div
                className="w-12 h-16 rounded-lg overflow-hidden border border-hydrangea-100 flex-shrink-0"
                style={!bg.imageUrl ? { background: bg.gradient } : undefined}
              >
                {bg.imageUrl && (
                  <img src={bg.imageUrl} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-hydrangea-700 truncate">{t.name}</span>
                  <code className="text-[10px] font-mono text-hydrangea-400 hidden sm:inline">{t.id}</code>
                </div>
                <div className="text-xs text-hydrangea-500 truncate">{t.description}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-hydrangea-50 text-hydrangea-600">
                    {bg.name}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-hydrangea-50 text-hydrangea-600">
                    {layout.name}
                  </span>
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-hydrangea-500 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-hydrangea-400 flex-shrink-0" />
              )}
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="overflow-hidden border-t border-hydrangea-100/60"
                >
                  <div className="p-4 space-y-4">
                    {/* 메타 정보 */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <InfoRow label="Background" value={`${bg.name} (${t.bg_id})`} />
                      <InfoRow label="Layout" value={`${layout.name} (${activeLayoutId})`} />
                      <InfoRow
                        label="Render style"
                        value={layout.renderStyle}
                        hint={layout.renderStyle === 'flow' ? '텍스트가 위→아래 흐름으로 배치' : '고정 좌표(x/y%)에 절대 배치'}
                        mono
                      />
                      <InfoRow
                        label="Aspect"
                        value={layout.aspectRatio}
                        hint={layout.renderStyle === 'flow' ? '(flow에서는 미적용 — 컨텐츠 길이에 따라 변동)' : '카드 가로:세로 비율'}
                        mono
                      />
                    </div>

                    {/* 페어링된 색상 */}
                    {(t.colorMain || t.colorSub) && (
                      <div>
                        <div className="text-[10px] text-hydrangea-400 mb-1">Paired colors (override layout)</div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <ColorRow label="Main" value={t.colorMain} fallback="(layout default)" />
                          <ColorRow label="Sub" value={t.colorSub} fallback="(layout default)" />
                        </div>
                      </div>
                    )}

                    {/* Allowed Layouts — 멀티선택 + DB 저장 */}
                    <div>
                      <div className="text-[10px] text-hydrangea-400 mb-1 flex items-center justify-between gap-2">
                        <span>
                          Allowed layouts (multi-select)
                          {' · '}
                          <span className="text-hydrangea-500">{allowed.length} selected</span>
                          {dirtyIds.has(t.id) && (
                            <span className="ml-1 text-orange-500 font-semibold">· unsaved</span>
                          )}
                        </span>
                        <span className="flex items-center gap-1.5">
                          {(configs?.[t.id] || dirtyIds.has(t.id)) && (
                            <button
                              type="button"
                              onClick={() => handleReset(t)}
                              disabled={savingId === t.id}
                              className="text-[9px] px-2 py-0.5 rounded bg-white border border-hydrangea-200 text-hydrangea-500 disabled:opacity-50"
                              title="DB 설정 삭제 → 코드 default로 복귀"
                            >
                              Reset
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleSave(t.id)}
                            disabled={savingId === t.id || !dirtyIds.has(t.id)}
                            className="text-[10px] px-2 py-0.5 rounded bg-hydrangea-500 text-white font-semibold disabled:opacity-40"
                          >
                            {savingId === t.id ? 'Saving…' : 'Save'}
                          </button>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {LAYOUTS.map((l) => {
                          const isAllowed = allowed.includes(l.id);
                          const isDefault = t.layout_id === l.id;
                          const isPreviewing = activeLayoutId === l.id;
                          return (
                            <div
                              key={l.id}
                              className={`relative p-2 rounded-lg border-2 transition ${
                                isAllowed
                                  ? 'border-hydrangea-400 bg-hydrangea-50/60'
                                  : 'border-hydrangea-100/40 bg-white opacity-50'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <button
                                  type="button"
                                  aria-label={isAllowed ? 'Remove layout' : 'Add layout'}
                                  onClick={() => toggleAllowed(t.id, l.id as LayoutId, allowed)}
                                  className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${
                                    isAllowed
                                      ? 'border-hydrangea-500 bg-hydrangea-500'
                                      : 'border-hydrangea-300 bg-white'
                                  }`}
                                >
                                  {isAllowed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                </button>
                                <button
                                  type="button"
                                  disabled={!isAllowed}
                                  onClick={() => setPreviewLayout((s) => ({ ...s, [t.id]: l.id as LayoutId }))}
                                  className="flex-1 text-left disabled:cursor-not-allowed"
                                >
                                  <div className="text-[11px] font-semibold text-hydrangea-700 truncate">
                                    {l.name}
                                    {isDefault && (
                                      <span className="ml-1 text-[8px] px-1 py-0.5 rounded bg-hydrangea-500/10 text-hydrangea-600 font-semibold">
                                        default
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[9px] text-hydrangea-400 mt-0.5 truncate">
                                    {l.renderStyle} · {l.aspectRatio}
                                    {isPreviewing && isAllowed && (
                                      <span className="ml-1 text-hydrangea-500 font-semibold">(previewing)</span>
                                    )}
                                  </div>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 추천 이벤트 */}
                    <div>
                      <div className="text-[10px] text-hydrangea-400 mb-1">Recommended for</div>
                      <div className="flex flex-wrap gap-1">
                        {t.recommendEvents.map((ev) => {
                          const evMeta = EVENT_TYPES.find((e) => e.id === ev);
                          return (
                            <span
                              key={ev}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-hydrangea-50 text-hydrangea-600 border border-hydrangea-100"
                            >
                              {evMeta?.emoji} {evMeta?.label || ev}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* 레이아웃 fields */}
                    <div>
                      <div className="text-[10px] text-hydrangea-400 mb-1">
                        Fields ({Object.keys(layout.fields).length})
                      </div>
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

                    {/* 실제 카드 미리보기 — 샘플 데이터 */}
                    <div>
                      <div className="text-[10px] text-hydrangea-400 mb-2 uppercase tracking-widest text-center">
                        — Sample Preview —
                      </div>
                      <div className="rounded-xl overflow-hidden bg-hydrangea-50/40 p-3">
                        <TemplateCard card={card} recipientName="John" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function ColorRow({ label, value, fallback }: { label: string; value?: string; fallback?: string }) {
  return (
    <div className="px-2 py-1.5 rounded-lg bg-hydrangea-50/60 flex items-center gap-2">
      <div className="text-[9px] text-hydrangea-400 uppercase tracking-wider w-8 flex-shrink-0">{label}</div>
      {value ? (
        <>
          <span className="inline-block w-4 h-4 rounded border border-hydrangea-200 flex-shrink-0" style={{ background: value }} />
          <span className="font-mono text-[11px] text-hydrangea-700 truncate">{value}</span>
        </>
      ) : (
        <span className="text-[10px] text-hydrangea-400 italic">{fallback}</span>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono, hint }: { label: string; value: string; mono?: boolean; hint?: string }) {
  return (
    <div className="px-2 py-1.5 rounded-lg bg-hydrangea-50/60">
      <div className="text-[9px] text-hydrangea-400 uppercase tracking-wider">{label}</div>
      <div className={`text-hydrangea-700 ${mono ? 'font-mono' : ''}`}>{value}</div>
      {hint && <div className="text-[9px] text-hydrangea-400 mt-0.5">{hint}</div>}
    </div>
  );
}
