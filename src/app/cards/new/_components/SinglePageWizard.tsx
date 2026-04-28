'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Check, ChevronDown, ChevronUp, Minus, Plus, Sparkles } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { Input, Textarea, Button, PhoneInput } from '@/components/ui';
import { useWizardStore } from '@/stores/wizardStore';
import { EVENT_TYPES, getEventTypeMeta } from '@/lib/eventType';
import { BACKGROUNDS, getBackground, getBackgroundsFor } from '@/lib/backgrounds';
import { LAYOUTS, getLayout } from '@/lib/layouts';
import { ENVELOPE_ANIMS, ClassicEnvelope, EnvelopeBeige, NoneEnvelope } from '@/components/envelopes';

const ENVELOPE_MAP = {
  'envelope-1': ClassicEnvelope,
  'envelope-2': EnvelopeBeige,
  'none': NoneEnvelope
} as const;
import { publishCard, updateCard } from '@/lib/actions/publishCard';
import TemplateCard from '@/app/i/[slug]/_components/TemplateCard';
import type { BackgroundId, BaseCard, EnvelopeAnimId, EventType, LayoutId } from '@/types/card';

type SectionId = 1 | 2 | 3 | 4 | 5;

interface SectionShellProps {
  id: SectionId;
  title: string;
  summary?: string;
  open: boolean;
  done: boolean;
  enabled: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function SectionShell({ id, title, summary, open, done, enabled, onToggle, children }: SectionShellProps) {
  return (
    <section className="rounded-2xl border border-hydrangea-100 bg-white overflow-hidden">
      <button
        type="button"
        onClick={enabled ? onToggle : undefined}
        disabled={!enabled}
        className={`w-full flex items-center gap-3 p-4 text-left transition ${
          enabled ? 'active:bg-hydrangea-50' : 'cursor-default opacity-60'
        }`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
          done ? 'bg-hydrangea-500 text-white' : open ? 'bg-hydrangea-100 text-hydrangea-700' : 'bg-hydrangea-50 text-hydrangea-400'
        }`}>
          {done ? <Check className="w-4 h-4" strokeWidth={3} /> : id}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-hydrangea-700">{title}</div>
          {summary && !open && (
            <div className="text-xs text-hydrangea-400 mt-0.5 truncate">{summary}</div>
          )}
        </div>
        {enabled && (open ? (
          <ChevronUp className="w-4 h-4 text-hydrangea-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-hydrangea-400 flex-shrink-0" />
        ))}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

interface SinglePageWizardProps {
  /** edit 모드에서 외부가 wizardStore에 직접 hydrate하므로 persist rehydrate 생략 */
  skipRehydrate?: boolean;
  /** edit 모드 진입 시 펼칠 섹션 (기본 1) */
  initialOpen?: 1 | 2 | 3 | 4;
}

export default function SinglePageWizard({ skipRehydrate, initialOpen }: SinglePageWizardProps = {}) {
  const router = useRouter();
  const params = useSearchParams();
  const t = useTranslations('Wizard');
  const tEvent = useTranslations('EventTypes');
  const { draft, setDraft, setEventType, reset, editingSlug } = useWizardStore();
  const isEditMode = !!editingSlug;
  const [open, setOpen] = useState<SectionId>((initialOpen as SectionId) || 1);
  const [pending, startTransition] = useTransition();
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [envelopeOpening, setEnvelopeOpening] = useState(false);

  useEffect(() => {
    if (!skipRehydrate) {
      // 신규 발행 진입 — 직전 편집 세션의 editingSlug가 잔존하지 않도록 정리
      useWizardStore.setState({ editingSlug: undefined });
      const p = useWizardStore.persist.rehydrate();
      Promise.resolve(p).then(() => {
        useWizardStore.setState({ editingSlug: undefined });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ?type= 자동 진입
  useEffect(() => {
    const tp = params.get('type');
    if (tp && !draft.event_type) {
      setEventType(tp as EventType);
      setOpen(2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const meta = getEventTypeMeta((draft.event_type as EventType) || 'etc');

  // 섹션 완료 여부
  const isDone = (id: SectionId): boolean => {
    if (id === 1) return !!draft.event_type;
    if (id === 2) return !!draft.bg_id && !!draft.envelope_anim;
    if (id === 3) return !!(draft.title && draft.title.trim() && draft.event_date);
    if (id === 4) return !!draft.layout_id;
    return false;
  };

  // 섹션 활성화: 이전 섹션이 모두 완료되어야 클릭 가능
  const isEnabled = (id: SectionId): boolean => {
    for (let i = 1 as SectionId; i < id; i = (i + 1) as SectionId) {
      if (!isDone(i)) return false;
    }
    return true;
  };

  const advance = (next: SectionId) => setOpen(next);

  // 섹션 3 진입 시 placeholder 자동 채우기
  useEffect(() => {
    if (open === 3 && !draft.body && !draft.title && draft.event_type) {
      setDraft({
        body: meta.fields.bodyPlaceholder,
        theme: meta.recommendTheme as any
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 이벤트 타입에 사용 가능한 배경만 필터 + 추천 순 정렬
  const sortedBackgrounds = useMemo(() => {
    const event = (draft.event_type as EventType) || 'etc';
    const available = getBackgroundsFor(event);
    const order = meta.recommendBackgrounds;
    return [...available].sort((a, b) => {
      const ai = order.indexOf(a.id);
      const bi = order.indexOf(b.id);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [meta, draft.event_type]);

  // 미리보기용 카드 객체
  const previewCard = {
    ...draft,
    id: 'preview',
    slug: 'preview',
    bg_id: draft.bg_id || 'bg-none',
    layout_id: draft.layout_id || 'layout-classic',
    title: draft.title || '',
    event_type: draft.event_type || 'etc'
  } as BaseCard;

  const bgMeta = getBackground(draft.bg_id);
  const layoutMeta = getLayout(draft.layout_id);

  const handlePublish = () => {
    startTransition(async () => {
      if (isEditMode && editingSlug) {
        const res = await updateCard(editingSlug, draft);
        if (!res.ok) { toast.error(res.error || '수정 실패'); return; }
        toast.success('수정되었어요!');
        reset();
        router.push(`/cards/${editingSlug}/manage`);
        return;
      }
      const res = await publishCard(draft);
      if (!res.ok) {
        toast.error(res.error || '발행 실패');
        return;
      }
      if (res.slug && res.ownerToken) {
        localStorage.setItem(`dearday:owner:${res.slug}`, res.ownerToken);
      }
      toast.success('초대장이 발행되었어요!');
      reset();
      router.push(`/cards/${res.slug}/manage`);
    });
  };

  // 요약 라벨
  const envName = ENVELOPE_ANIMS.find((e) => e.id === draft.envelope_anim)?.name || '-';
  const summaries = {
    1: meta.label,
    2: `${envName} · ${bgMeta.name}`,
    3: draft.title || '',
    4: layoutMeta.name,
    5: ''
  };

  const detailsCanProceed = !!(draft.title && draft.title.trim() && draft.event_date);

  return (
    <PageContainer noPadding>
      <MobileHeader title={isEditMode ? '초대장 수정' : t('headerTitle')} back />

      <div className="px-4 py-4 space-y-3 pb-24">
        {/* 1. 이벤트 선택 */}
        <SectionShell
          id={1}
          title="이벤트 선택"
          summary={summaries[1]}
          open={open === 1}
          done={isDone(1) && open !== 1}
          enabled
          onToggle={() => setOpen(1)}
        >
          <div className="grid grid-cols-3 gap-2 mt-2">
            {EVENT_TYPES.map((e) => {
              const selected = draft.event_type === e.id;
              return (
                <motion.button
                  key={e.id}
                  onClick={() => {
                    setEventType(e.id);
                    setTimeout(() => advance(2), 200);
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-colors ${
                    selected ? 'border-hydrangea-500 bg-hydrangea-50' : 'border-hydrangea-100/60 bg-white'
                  }`}
                >
                  <span className="text-2xl">{e.emoji}</span>
                  <span className="text-xs font-semibold text-hydrangea-700">{tEvent(e.id)}</span>
                </motion.button>
              );
            })}
          </div>
        </SectionShell>

        {/* 2. 템플릿 (배경 + 봉투) */}
        <SectionShell
          id={2}
          title="템플릿 선택"
          summary={summaries[2]}
          open={open === 2}
          done={isDone(2) && open !== 2}
          enabled={isEnabled(2)}
          onToggle={() => setOpen(2)}
        >
          <div className="space-y-5 mt-2">
            <div>
              <h4 className="text-xs font-semibold text-hydrangea-700 mb-2">💌 봉투</h4>
              <div className="space-y-2">
                {ENVELOPE_ANIMS.map((e) => {
                  const selected = draft.envelope_anim === e.id;
                  const recommended = e.id === meta.recommendEnvelope;
                  return (
                    <motion.button
                      key={e.id}
                      onClick={() => setDraft({ envelope_anim: e.id as EnvelopeAnimId })}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-left transition ${
                        selected ? 'border-hydrangea-500 bg-hydrangea-50' : 'border-hydrangea-100/60 bg-white'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-hydrangea-700">{e.name}</span>
                          {recommended && (
                            <span className="px-1.5 py-0.5 rounded-full bg-hydrangea-100 text-[9px] font-semibold text-hydrangea-700">추천</span>
                          )}
                        </div>
                        <div className="text-[11px] text-hydrangea-400 mt-0.5">{e.desc}</div>
                      </div>
                      {selected && <Check className="w-4 h-4 text-hydrangea-500" strokeWidth={2.5} />}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-hydrangea-700 mb-2">🖼️ 배경</h4>
              <div className="grid grid-cols-3 gap-2">
                {sortedBackgrounds.map((bg, idx) => {
                  const selected = draft.bg_id === bg.id;
                  return (
                    <motion.button
                      key={bg.id}
                      onClick={() => setDraft({ bg_id: bg.id as BackgroundId })}
                      whileTap={{ scale: 0.96 }}
                      className={`relative aspect-[3/4] rounded-xl border-2 overflow-hidden transition ${
                        selected ? 'border-hydrangea-500 ring-2 ring-hydrangea-300' : 'border-hydrangea-100/60'
                      }`}
                    >
                      {bg.imageUrl ? (
                        <img src={bg.imageUrl} alt={bg.name} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0" style={{ background: bg.gradient }} />
                      )}
                      {idx === 0 && (
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full bg-white/90 text-[9px] font-semibold text-hydrangea-700">
                          추천
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[10px] py-0.5 text-center truncate px-1">
                        {bg.name}
                      </div>
                      {selected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-hydrangea-500 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <Button onClick={() => advance(3)} disabled={!isDone(2)} full size="md">
              다음
            </Button>
          </div>
        </SectionShell>

        {/* 3. 정보 입력 + RSVP */}
        <SectionShell
          id={3}
          title="내용 입력"
          summary={summaries[3]}
          open={open === 3}
          done={isDone(3) && open !== 3}
          enabled={isEnabled(3)}
          onToggle={() => setOpen(3)}
        >
          <div className="space-y-4 mt-2">
            <Input
              label="받는 분"
              placeholder="$NAME님"
              hint="$NAME 이라고 넣으시면 받는 분 이름이 들어갑니다 (예: $NAME집사님 → 홍길동집사님)"
              value={draft.recipient_template ?? ''}
              onChange={(e) => setDraft({ recipient_template: e.target.value })}
            />
            <Input
              label="부제목"
              placeholder="예: 두 사람이 하나가 되는 날"
              hint="비워둬도 됩니다"
              value={draft.greeting_oneliner || ''}
              onChange={(e) => setDraft({ greeting_oneliner: e.target.value })}
            />
            <Input
              label={meta.fields.titleLabel}
              placeholder={meta.fields.titlePlaceholder}
              value={draft.title || ''}
              onChange={(e) => setDraft({ title: e.target.value })}
            />
            {(() => {
              const today = new Date();
              const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
              const dt = draft.event_date ? new Date(draft.event_date) : null;
              const dateStr = dt && !isNaN(dt.getTime())
                ? `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}` : '';
              const timeStr = dt && !isNaN(dt.getTime())
                ? `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}` : '';
              const update = (date: string, time: string) => {
                if (!date) { setDraft({ event_date: null }); return; }
                const [y, mo, d] = date.split('-').map(Number);
                // 부분 입력(연도 미완성 등) 무시 — 4자리 연도 + 합리적 범위만 commit
                if (!y || y < 1900 || y > 2999 || !mo || !d) return;
                const [h, m] = (time || '00:00').split(':').map(Number);
                setDraft({ event_date: new Date(y, mo - 1, d, h || 0, m || 0).toISOString() });
              };
              return (
                <div>
                  <label className="block text-sm font-medium text-hydrangea-700 mb-1.5">일시</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={dateStr} min={todayStr} onChange={(e) => update(e.target.value, timeStr)}
                      className="w-full min-h-[56px] px-4 rounded-xl border border-hydrangea-100 bg-white text-hydrangea-700 text-base focus:outline-none focus:ring-2 focus:ring-hydrangea-300 [color-scheme:light]"
                      style={{ fontSize: '16px' }} />
                    <input type="time" step={300} value={timeStr} onChange={(e) => update(dateStr, e.target.value)}
                      className="w-full min-h-[56px] px-4 rounded-xl border border-hydrangea-100 bg-white text-hydrangea-700 text-base focus:outline-none focus:ring-2 focus:ring-hydrangea-300 [color-scheme:light]"
                      style={{ fontSize: '16px' }} />
                  </div>
                </div>
              );
            })()}
            <Input label="장소" placeholder="예: 라비두스 웨딩홀 5F" value={draft.event_place || ''}
              onChange={(e) => setDraft({ event_place: e.target.value })} />
            <Input label="지도 링크 (선택)" placeholder="네이버/구글 지도 URL" value={draft.map_url || ''}
              onChange={(e) => setDraft({ map_url: e.target.value })} />
            <Input label="연락처 이름" placeholder="대표" value={draft.contact_name || ''}
              onChange={(e) => setDraft({ contact_name: e.target.value })} />
            <PhoneInput label="전화" value={draft.contact_phone || ''}
              onChange={(phone) => setDraft({ contact_phone: phone })} />
            <Textarea label="본문 메시지" placeholder={meta.fields.bodyPlaceholder} value={draft.body || ''}
              onChange={(e) => setDraft({ body: e.target.value })} rows={5} />
            <Textarea label="기타 안내 (선택)" placeholder="주차 안내, 주의사항 등" value={draft.extra_info || ''}
              onChange={(e) => setDraft({ extra_info: e.target.value })} rows={3} />

            <div className="pt-3 border-t border-hydrangea-100/60">
              <h4 className="text-xs font-semibold text-hydrangea-700 mb-2">응답(RSVP) 옵션</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-hydrangea-100/60">
                  <div className="text-sm text-hydrangea-700">RSVP 받기</div>
                  <button type="button" onClick={() => setDraft({ rsvp_enabled: !draft.rsvp_enabled })}
                    className={`relative w-11 h-6 rounded-full transition ${draft.rsvp_enabled ? 'bg-hydrangea-500' : 'bg-hydrangea-100'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${draft.rsvp_enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {draft.rsvp_enabled && (
                  <>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-hydrangea-100/60">
                      <div className="text-sm text-hydrangea-700">한 그룹 최대 인원</div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => {
                          const cur = (draft.rsvp_max_per_card || 4) as number;
                          setDraft({ rsvp_max_per_card: Math.max(1, cur - 1) as 1 | 2 | 3 | 4 | 5 });
                        }} className="w-7 h-7 rounded-full bg-hydrangea-100 flex items-center justify-center">
                          <Minus className="w-3.5 h-3.5 text-hydrangea-700" />
                        </button>
                        <span className="font-bold text-hydrangea-700 w-5 text-center">{draft.rsvp_max_per_card || 4}</span>
                        <button type="button" onClick={() => {
                          const cur = (draft.rsvp_max_per_card || 4) as number;
                          setDraft({ rsvp_max_per_card: Math.min(5, cur + 1) as 1 | 2 | 3 | 4 | 5 });
                        }} className="w-7 h-7 rounded-full bg-hydrangea-100 flex items-center justify-center">
                          <Plus className="w-3.5 h-3.5 text-hydrangea-700" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-hydrangea-100/60">
                      <div className="text-sm text-hydrangea-700">참석자 이름 받기</div>
                      <button type="button" onClick={() => setDraft({ rsvp_collect_names: !draft.rsvp_collect_names })}
                        className={`relative w-11 h-6 rounded-full transition ${draft.rsvp_collect_names ? 'bg-hydrangea-500' : 'bg-hydrangea-100'}`}>
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${draft.rsvp_collect_names ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                    <Input label="RSVP 마감일 (선택)" type="date"
                      min={(() => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`; })()}
                      value={draft.rsvp_deadline ? draft.rsvp_deadline.slice(0, 10) : ''}
                      onChange={(e) => {
                        if (!e.target.value) { setDraft({ rsvp_deadline: null }); return; }
                        const [y, mo, d] = e.target.value.split('-').map(Number);
                        if (!y || y < 1900 || y > 2999 || !mo || !d) return;
                        setDraft({ rsvp_deadline: new Date(e.target.value).toISOString() });
                      }} />
                  </>
                )}
                <Input label="카드 만료일 (선택)" type="date"
                  hint="만료된 후엔 안내 메시지가 표시됩니다"
                  min={(() => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`; })()}
                  value={draft.expiry_date ? draft.expiry_date.slice(0, 10) : ''}
                  onChange={(e) => {
                    if (!e.target.value) { setDraft({ expiry_date: null }); return; }
                    const [y, mo, d] = e.target.value.split('-').map(Number);
                    if (!y || y < 1900 || y > 2999 || !mo || !d) return;
                    setDraft({ expiry_date: new Date(e.target.value).toISOString() });
                  }} />
              </div>
            </div>

            <Button onClick={() => advance(4)} disabled={!detailsCanProceed} full size="md">
              다음
            </Button>
            {!detailsCanProceed && (
              <p className="text-xs text-hydrangea-400 text-center">제목과 일시는 필수입니다</p>
            )}
          </div>
        </SectionShell>

        {/* 4. 레이아웃 */}
        <SectionShell
          id={4}
          title="레이아웃 선택"
          summary={summaries[4]}
          open={open === 4}
          done={isDone(4) && open !== 4}
          enabled={isEnabled(4)}
          onToggle={() => setOpen(4)}
        >
          <div className="grid grid-cols-3 gap-2 mt-2">
            {LAYOUTS.map((l) => {
              const selected = draft.layout_id === l.id;
              return (
                <motion.button
                  key={l.id}
                  onClick={() => {
                    setDraft({ layout_id: l.id as LayoutId });
                    setTimeout(() => advance(5), 200);
                  }}
                  whileTap={{ scale: 0.96 }}
                  className={`relative p-3 rounded-xl border-2 text-left transition ${
                    selected ? 'border-hydrangea-500 bg-hydrangea-50' : 'border-hydrangea-100/60 bg-white'
                  }`}
                >
                  <div className="text-xs font-semibold text-hydrangea-700">{l.name}</div>
                  <div className="text-[10px] text-hydrangea-400 mt-1 leading-tight">{l.description}</div>
                  {selected && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-hydrangea-500 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </SectionShell>

        {/* 5. 미리보기 & 발행 */}
        <SectionShell
          id={5}
          title="미리보기 & 발행"
          open={open === 5}
          done={false}
          enabled={isEnabled(5)}
          onToggle={() => setOpen(5)}
        >
          <div className="space-y-4 mt-2">
            {/* 봉투 → 클릭하면 초대장 카드 표시 (실제 동작 미리보기) */}
            {(() => {
              const Env = ENVELOPE_MAP[(draft.envelope_anim as keyof typeof ENVELOPE_MAP) || 'envelope-1'];
              return (
                <div className="flex flex-col items-center py-6 bg-hydrangea-50/40 rounded-2xl">
                  {!envelopeOpen ? (
                    <>
                      <p className="text-xs text-hydrangea-400 mb-4">
                        {envelopeOpening ? '열리는 중...' : '봉투를 클릭해서 열어보세요'}
                      </p>
                      <div
                        onClick={() => {
                          if (envelopeOpening) return;
                          setEnvelopeOpening(true);
                          setTimeout(() => {
                            setEnvelopeOpen(true);
                            setEnvelopeOpening(false);
                          }, 1500);
                        }}
                        className={envelopeOpening ? '' : 'cursor-pointer active:scale-95 transition'}
                      >
                        <Env isOpen={envelopeOpening} width={280}>
                          {(() => {
                            const lay = getLayout(draft.layout_id);
                            const tf = lay.fields.title;
                            const df = lay.fields.date;
                            const dt = draft.event_date ? new Date(draft.event_date) : null;
                            const dateStr = dt && !isNaN(dt.getTime())
                              ? dt.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
                              : '';
                            const previewName = '홍길동';
                            const tpl = draft.recipient_template?.trim();
                            const greetingPreview = tpl ? tpl.replace(/\$NAME/g, previewName) : '';
                            return (
                              <div style={{ textAlign: 'center', padding: '0 8px' }}>
                                {greetingPreview && (
                                  <div style={{
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: tf.color,
                                    letterSpacing: '0.06em',
                                    marginBottom: 8
                                  }}>
                                    {greetingPreview}
                                  </div>
                                )}
                                <div style={{
                                  fontFamily: tf.fontFamily || "'Noto Serif KR', serif",
                                  fontWeight: tf.fontWeight,
                                  color: tf.color,
                                  fontSize: Math.min(tf.fontSize, 24),
                                  letterSpacing: tf.letterSpacing,
                                  lineHeight: tf.lineHeight || 1.2,
                                  marginBottom: 6
                                }}>
                                  {(draft.title || '제목').replace(/\$NAME/g, previewName)}
                                </div>
                                {dateStr && (
                                  <div style={{
                                    fontFamily: df?.fontFamily || "'Noto Sans KR', sans-serif",
                                    color: df?.color || '#666',
                                    fontSize: 11,
                                    letterSpacing: df?.letterSpacing
                                  }}>
                                    {dateStr}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </Env>
                      </div>
                    </>
                  ) : (
                    <div className="w-full px-2">
                      <button
                        type="button"
                        onClick={() => { setEnvelopeOpen(false); setEnvelopeOpening(false); }}
                        className="text-xs text-hydrangea-500 mb-3 underline"
                      >
                        ← 봉투 다시 보기
                      </button>
                      <motion.div
                        key={`${draft.bg_id}-${draft.layout_id}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <TemplateCard card={previewCard} recipientName="홍길동" />
                      </motion.div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* RSVP 미리보기 (실제 응답은 발행 후 가능) */}
            {draft.rsvp_enabled && (
              <div className="rounded-2xl border border-hydrangea-100 bg-white p-5">
                <div className="text-center mb-4">
                  <div className="text-xs text-hydrangea-400 mb-1">RSVP 미리보기 · 발행 후 응답 가능</div>
                  <h3 className="text-base font-semibold text-hydrangea-700">참석 여부</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button type="button" disabled className="flex-1 py-2.5 rounded-full border-2 border-hydrangea-300 text-sm text-hydrangea-700 font-medium opacity-70">참석합니다</button>
                    <button type="button" disabled className="flex-1 py-2.5 rounded-full border-2 border-hydrangea-100 text-sm text-hydrangea-500 opacity-70">불참합니다</button>
                  </div>
                  <div className="flex items-center justify-center gap-3 py-2">
                    <span className="text-xs text-hydrangea-400">참석 인원</span>
                    <button type="button" disabled className="w-8 h-8 rounded-full border-2 border-hydrangea-200 flex items-center justify-center text-hydrangea-500 opacity-70">−</button>
                    <span className="font-bold text-hydrangea-700 w-6 text-center">1</span>
                    <button type="button" disabled className="w-8 h-8 rounded-full border-2 border-hydrangea-200 flex items-center justify-center text-hydrangea-500 opacity-70">＋</button>
                    <span className="text-xs text-hydrangea-400">/ 최대 {draft.rsvp_max_per_card || 4}명</span>
                  </div>
                  {draft.rsvp_collect_names && (
                    <input type="text" disabled placeholder="참석자 이름" className="w-full px-3 py-2 text-sm rounded-lg border border-hydrangea-100 bg-hydrangea-50/40 placeholder-hydrangea-300" />
                  )}
                  <textarea disabled placeholder="한 줄 답신 (선택)" rows={2} className="w-full px-3 py-2 text-sm rounded-lg border border-hydrangea-100 bg-hydrangea-50/40 placeholder-hydrangea-300 resize-none" />
                  <button type="button" disabled className="w-full py-3 rounded-xl bg-hydrangea-300 text-white font-medium opacity-70">
                    응답 보내기
                  </button>
                  {draft.rsvp_deadline && (
                    <p className="text-xs text-center text-hydrangea-400">
                      마감 {new Date(draft.rsvp_deadline).toLocaleDateString('ko-KR')}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-hydrangea-50 text-xs space-y-1">
              <div className="flex items-center gap-2 font-semibold text-hydrangea-700 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> 설정 요약
              </div>
              <div className="flex justify-between"><span className="text-hydrangea-400">이벤트</span><span className="text-hydrangea-700">{meta.label}</span></div>
              <div className="flex justify-between"><span className="text-hydrangea-400">배경</span><span className="text-hydrangea-700">{bgMeta.name}</span></div>
              <div className="flex justify-between"><span className="text-hydrangea-400">레이아웃</span><span className="text-hydrangea-700">{layoutMeta.name}</span></div>
              <div className="flex justify-between"><span className="text-hydrangea-400">봉투</span><span className="text-hydrangea-700">{envName}</span></div>
              <div className="flex justify-between"><span className="text-hydrangea-400">RSVP</span><span className="text-hydrangea-700">{draft.rsvp_enabled ? `사용 (최대 ${draft.rsvp_max_per_card}명)` : '미사용'}</span></div>
            </div>

            <Button onClick={handlePublish} disabled={pending} full size="lg">
              {pending
                ? (isEditMode ? '저장 중...' : '발행 중...')
                : (isEditMode ? '✏️ 수정 저장' : '🎉 발행하기')}
            </Button>
          </div>
        </SectionShell>
      </div>
    </PageContainer>
  );
}
