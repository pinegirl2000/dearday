'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TEMPLATES } from '@/lib/templates';
import { getBackground } from '@/lib/backgrounds';
import { getLayout, LAYOUTS } from '@/lib/layouts';
import { EVENT_TYPES } from '@/lib/eventType';
import TemplateCard from '@/app/i/[slug]/_components/TemplateCard';
import type { BaseCard, LayoutId } from '@/types/card';

type Tpl = (typeof TEMPLATES)[number];

interface Props {
  templates: Tpl[];
}

function buildPreview(t: Tpl, layoutOverride?: LayoutId): BaseCard {
  return {
    id: 'preview',
    slug: 'preview',
    event_type: 'etc',
    layout_id: (layoutOverride || t.layout_id) as LayoutId,
    bg_id: t.bg_id,
    envelope_anim: 'envelope-1',
    theme: 'hydrangea',
    font_family: 'serif',
    title: '민준 ♥ 서연',
    greeting_oneliner: 'Together with our families',
    body: '두 사람의 약속을\n함께 축복해주세요.',
    event_date: '2026-06-14T11:00:00.000Z',
    event_place: '서울 그랜드 호텔 그랜드볼룸',
    map_url: 'https://maps.google.com',
    contact_name: '신부측 어머니 김영자',
    contact_phone: '+82 10-1234-5678',
    extra_info: 'Reception to follow',
    rsvp_enabled: false,
    plan: 'free'
  } as BaseCard;
}

export default function TemplateExpandList({ templates }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  // 펼친 항목별로 사용자가 임시로 선택한 레이아웃 (preview only)
  const [layoutOverride, setLayoutOverride] = useState<Record<string, LayoutId>>({});

  return (
    <div className="space-y-2">
      {templates.map((t) => {
        const bg = getBackground(t.bg_id);
        const activeLayoutId = (layoutOverride[t.id] || t.layout_id) as LayoutId;
        const layout = getLayout(activeLayoutId);
        const isOpen = openId === t.id;
        const card = buildPreview(t, activeLayoutId);

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

                    {/* 레이아웃 선택 (미리보기 임시 변경) */}
                    <div>
                      <div className="text-[10px] text-hydrangea-400 mb-1">
                        Try different layout
                        {activeLayoutId !== t.layout_id && (
                          <span className="ml-1.5 text-hydrangea-500">
                            (default: {t.layout_id})
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {LAYOUTS.map((l) => {
                          const selected = activeLayoutId === l.id;
                          const isDefault = t.layout_id === l.id;
                          return (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() =>
                                setLayoutOverride((s) => ({ ...s, [t.id]: l.id as LayoutId }))
                              }
                              className={`relative text-left p-2 rounded-lg border-2 transition ${
                                selected
                                  ? 'border-hydrangea-500 bg-hydrangea-50'
                                  : 'border-hydrangea-100/60 bg-white hover:bg-hydrangea-50/40'
                              }`}
                            >
                              <div className="text-[11px] font-semibold text-hydrangea-700 truncate">
                                {l.name}
                              </div>
                              <div className="text-[9px] text-hydrangea-400 mt-0.5 truncate">
                                {l.renderStyle} · {l.aspectRatio}
                              </div>
                              {isDefault && (
                                <span className="absolute top-1 right-1 text-[8px] px-1 py-0.5 rounded bg-hydrangea-500/10 text-hydrangea-600 font-semibold">
                                  default
                                </span>
                              )}
                            </button>
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

function InfoRow({ label, value, mono, hint }: { label: string; value: string; mono?: boolean; hint?: string }) {
  return (
    <div className="px-2 py-1.5 rounded-lg bg-hydrangea-50/60">
      <div className="text-[9px] text-hydrangea-400 uppercase tracking-wider">{label}</div>
      <div className={`text-hydrangea-700 ${mono ? 'font-mono' : ''}`}>{value}</div>
      {hint && <div className="text-[9px] text-hydrangea-400 mt-0.5">{hint}</div>}
    </div>
  );
}
