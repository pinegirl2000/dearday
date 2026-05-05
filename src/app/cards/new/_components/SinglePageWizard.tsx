'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useSession, signIn } from 'next-auth/react';
import { Check, ChevronDown, ChevronUp, Minus, Plus, Sparkles } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { Input, Textarea, Button, PhoneInput } from '@/components/ui';
import { useWizardStore } from '@/stores/wizardStore';
import { EVENT_TYPES, getEventTypeMeta } from '@/lib/eventType';
import { getBackground } from '@/lib/backgrounds';
import { ENVELOPE_ANIMS, ClassicEnvelope, EnvelopeBeige, EnvelopeMint, EnvelopeCoral, NoneEnvelope } from '@/components/envelopes';

const ENVELOPE_MAP = {
  'envelope-1': ClassicEnvelope,
  'envelope-2': EnvelopeBeige,
  'envelope-3': EnvelopeMint,
  'envelope-4': EnvelopeCoral,
  'none': NoneEnvelope
} as const;
import { publishCard, updateCard } from '@/lib/actions/publishCard';
import TemplateCard from '@/app/i/[slug]/_components/TemplateCard';
import RsvpForm from '@/app/i/[slug]/_components/RsvpForm';
import { getTheme } from '@/lib/theme';
import { TEMPLATES, getTemplate, findTemplateByPair, getTemplatesFor, getTemplateLayouts } from '@/lib/templates';
import { LAYOUTS, getLayout } from '@/lib/layouts';
import type { BackgroundId, BaseCard, EnvelopeAnimId, EventType, LayoutId } from '@/types/card';

type SectionId = 1 | 2 | 3 | 4;

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
  // 닫힌 섹션은 렌더하지 않음 — 상단 탭바가 네비게이션 담당
  if (!open) return null;
  return (
    <section className="rounded-2xl border border-hydrangea-100 bg-white overflow-hidden">
      <div className="w-full flex items-center gap-3 p-4 text-left">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
          done ? 'bg-hydrangea-500 text-white' : 'bg-hydrangea-100 text-hydrangea-700'
        }`}>
          {done ? <Check className="w-4 h-4" strokeWidth={3} /> : id}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-hydrangea-700">{title}</div>
          {summary && (
            <div className="text-xs text-hydrangea-400 mt-0.5 truncate">{summary}</div>
          )}
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="p-4 pt-0">{children}</div>
      </motion.div>
    </section>
  );
}

interface SinglePageWizardProps {
  /** edit 모드에서 외부가 wizardStore에 직접 hydrate하므로 persist rehydrate 생략 */
  skipRehydrate?: boolean;
  /** edit 모드 진입 시 펼칠 섹션 (기본 1) */
  initialOpen?: 1 | 2 | 3 | 4;
  /** admin이 DB에 저장한 템플릿별 allowedLayouts override */
  templateConfigs?: Record<string, string[]>;
}

export default function SinglePageWizard({ skipRehydrate, initialOpen, templateConfigs }: SinglePageWizardProps = {}) {
  const router = useRouter();
  const params = useSearchParams();
  const { status: sessionStatus } = useSession();
  const t = useTranslations('Wizard');
  const tEvent = useTranslations('EventTypes');
  const { draft, setDraft, setEventType, reset, editingSlug } = useWizardStore();
  const isEditMode = !!editingSlug;
  const [open, setOpen] = useState<SectionId>((initialOpen as SectionId) || 1);
  const [pending, startTransition] = useTransition();
  // Section 4 미리보기는 봉투 단계 건너뛰고 항상 카드 펼친 상태로 시작
  const [envelopeOpen, setEnvelopeOpen] = useState(true);
  const [envelopeOpening, setEnvelopeOpening] = useState(false);

  const [hydrated, setHydrated] = useState(!!skipRehydrate);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [savingSticky, setSavingSticky] = useState(false);

  // Edit 모드: 첫 로드 후 현재 draft 스냅샷 저장 (변경 감지 기준)
  useEffect(() => {
    if (isEditMode && savedSnapshot === null && draft.title) {
      setSavedSnapshot(JSON.stringify(draft));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, draft.title, draft.event_type]);

  const isDirty = isEditMode && savedSnapshot !== null && JSON.stringify(draft) !== savedSnapshot;

  const handleStickySave = () => {
    if (!editingSlug) return;
    setSavingSticky(true);
    updateCard(editingSlug, draft).then((res) => {
      setSavingSticky(false);
      if (!res.ok) { toast.error(res.error || 'Save failed'); return; }
      toast.success('Saved!');
      setSavedSnapshot(JSON.stringify(draft));
    }).catch(() => {
      setSavingSticky(false);
      toast.error('Save failed');
    });
  };
  // Yes/No 토글 시 이전 입력값 유지를 위한 캐시
  const lastRecipientTemplate = useRef<string>('');
  useEffect(() => {
    if (typeof draft.recipient_template === 'string' && draft.recipient_template.length > 0) {
      lastRecipientTemplate.current = draft.recipient_template;
    }
  }, [draft.recipient_template]);

  useEffect(() => {
    if (!skipRehydrate) {
      // 신규 발행 진입 — 직전 편집 세션의 editingSlug가 잔존하지 않도록 정리
      useWizardStore.setState({ editingSlug: undefined });
      const p = useWizardStore.persist.rehydrate();
      Promise.resolve(p).then(() => {
        useWizardStore.setState({ editingSlug: undefined });
        setHydrated(true);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // max per group이 1이면 collect_names 자동 해제
  useEffect(() => {
    if ((draft.rsvp_max_per_card || 4) === 1 && draft.rsvp_collect_names) {
      setDraft({ rsvp_collect_names: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.rsvp_max_per_card]);

  // 봉투를 None으로 바꾸면 recipient_template은 null로 정리 (검증/표시 일관성)
  useEffect(() => {
    if (draft.envelope_anim === 'none' && draft.recipient_template !== null) {
      setDraft({ recipient_template: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.envelope_anim]);

  // 신규 모드에서 일시 미입력 시 기본값: 가장 가까운 토요일 11:00, RSVP/만료일 동일
  useEffect(() => {
    if (!hydrated || editingSlug) return;
    if (useWizardStore.getState().draft.event_date) return;
    const now = new Date();
    // 가장 가까운 토요일 + 7일 (한 주 뒤 토요일), 오전 10시
    const daysToSat = (6 - now.getDay() + 7) % 7;
    const sat = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToSat + 7, 10, 0, 0);
    const iso = sat.toISOString();
    setDraft({ event_date: iso, rsvp_deadline: iso, expiry_date: iso });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // ?type= 자동 진입
  useEffect(() => {
    const tp = params.get('type');
    if (tp && !draft.event_type) {
      setEventType(tp as EventType);
      setOpen(2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // 신규 모드에서 event_type이 비어있으면 Gathering(meeting)을 기본값으로
  useEffect(() => {
    if (!hydrated || editingSlug) return;
    if (!useWizardStore.getState().draft.event_type) {
      setEventType('meeting');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const meta = getEventTypeMeta((draft.event_type as EventType) || 'etc');

  // 섹션 완료 여부
  const isDone = (id: SectionId): boolean => {
    if (id === 1) return !!draft.event_type && !!draft.bg_id && !!draft.layout_id;
    if (id === 2) return !!draft.envelope_anim;
    if (id === 3) {
      const recipientOk = draft.recipient_template === null
        || (typeof draft.recipient_template === 'string' && draft.recipient_template.trim().length > 0);
      return !!(
        draft.title && draft.title.trim() &&
        draft.event_date &&
        draft.event_place && draft.event_place.trim() &&
        recipientOk &&
        draft.body && draft.body.trim()
      );
    }
    return false;
  };

  // 섹션 활성화: 이전 섹션이 모두 완료되어야 클릭 가능
  const isEnabled = (id: SectionId): boolean => {
    for (let i = 1 as SectionId; i < id; i = (i + 1) as SectionId) {
      if (!isDone(i)) return false;
    }
    return true;
  };

  const advance = (next: SectionId) => {
    setOpen(next);
    // Edit 모드 — 단계 이동 시 자동 저장 (백그라운드, 실패는 toast로 알림)
    if (editingSlug) {
      updateCard(editingSlug, draft).then((res) => {
        if (!res.ok) toast.error(res.error || 'Auto-save failed');
      }).catch(() => toast.error('Auto-save failed'));
    }
  };

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
    // 비로그인 상태면 Google 로그인으로 이동 — 입력값은 wizardStore(localStorage)에 보존되어
    // 로그인 후 /cards/new로 돌아오면 그대로 복원된다.
    if (!isEditMode && sessionStatus === 'unauthenticated') {
      toast.message('Please sign in to publish your invitation');
      signIn('google', { callbackUrl: '/cards/new' });
      return;
    }
    startTransition(async () => {
      if (isEditMode && editingSlug) {
        const res = await updateCard(editingSlug, draft);
        if (!res.ok) { toast.error(res.error || 'Update failed'); return; }
        toast.success('Saved!');
        reset();
        router.push(`/cards/${editingSlug}/manage`);
        return;
      }
      const res = await publishCard(draft);
      if (!res.ok) {
        toast.error(res.error || 'Publish failed');
        return;
      }
      if (res.slug && res.ownerToken) {
        localStorage.setItem(`dearday:owner:${res.slug}`, res.ownerToken);
      }
      toast.success('Invitation published!');
      reset();
      router.push(`/cards/${res.slug}/manage`);
    });
  };

  // 요약 라벨
  const envName = ENVELOPE_ANIMS.find((e) => e.id === draft.envelope_anim)?.name || '-';
  const tplMeta = findTemplateByPair(draft.bg_id, draft.layout_id);
  const tplName = tplMeta?.name || bgMeta.name;
  const summaries = {
    1: `${meta.label} · ${tplName}`,
    2: envName,
    3: draft.title || '',
    4: ''
  };

  const detailsCanProceed = (() => {
    const recipientOk = draft.recipient_template === null
      || (typeof draft.recipient_template === 'string' && draft.recipient_template.trim().length > 0);
    return !!(
      draft.title && draft.title.trim() &&
      draft.event_date &&
      draft.event_place && draft.event_place.trim() &&
      recipientOk &&
      draft.body && draft.body.trim()
    );
  })();

  const SECTION_LABELS: Record<SectionId, string> = {
    1: 'Event & Template',
    2: 'Envelope',
    3: 'Details',
    4: 'Layout, Preview & Publish'
  };

  return (
    <PageContainer noPadding>
      <MobileHeader title={isEditMode ? 'Edit Invitation' : t('headerTitle')} back />

      {/* 상단 단계 탭바 (sticky) — 1,2,3,4 모두 항상 가로로 표시, 순차 진입 강제 */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-hydrangea-100 px-3 py-2">
        <div className="flex items-center gap-2">
          {([1, 2, 3, 4] as SectionId[]).map((id, idx) => {
            const active = open === id;
            const enabled = isEnabled(id);
            const done = isDone(id);
            return (
              <div key={id} className="flex-1 flex items-center min-w-0">
                <button
                  type="button"
                  onClick={() => enabled && setOpen(id)}
                  disabled={!enabled}
                  title={!enabled ? '이전 단계를 먼저 완료하세요' : SECTION_LABELS[id]}
                  className={`relative w-full flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-lg transition ${
                    active
                      ? 'bg-hydrangea-500 text-white shadow'
                      : done
                        ? 'bg-hydrangea-100 text-hydrangea-700'
                        : enabled
                          ? 'bg-white text-hydrangea-500 border border-hydrangea-200'
                          : 'bg-white text-hydrangea-300 border border-hydrangea-100 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-sm font-bold leading-none">{id}</span>
                    {done && (
                      <Check
                        className={`w-3 h-3 ${active ? 'text-white' : 'text-hydrangea-600'}`}
                        strokeWidth={3}
                      />
                    )}
                  </div>
                  <span className={`text-[9px] leading-none truncate max-w-full ${active ? 'font-medium' : 'font-normal'}`}>
                    {SECTION_LABELS[id]}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 pb-24">
        {/* 1. 이벤트 선택 */}
        <SectionShell
          id={1}
          title="Event & Template"
          summary={summaries[1]}
          open={open === 1}
          done={isDone(1) && open !== 1}
          enabled
          onToggle={() => setOpen(1)}
        >
          {(() => {
            const activeEvent = (draft.event_type as EventType) || 'meeting';
            const tpls = getTemplatesFor(activeEvent);
            return (
              <div className="space-y-3 mt-2">
                {/* 이벤트 탭 — 6개 그리드 (한 화면에 모두 표시, 스크롤 없음) */}
                <div className="grid grid-cols-6 gap-1">
                  {EVENT_TYPES.map((e) => {
                    const selected = activeEvent === e.id;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => {
                          setEventType(e.id);
                          setDraft({ bg_id: undefined, layout_id: undefined } as any);
                        }}
                        className={`flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-lg transition min-w-0 ${
                          selected
                            ? 'bg-hydrangea-500 text-white shadow'
                            : 'bg-white text-hydrangea-700 border border-hydrangea-100 active:bg-hydrangea-50'
                        }`}
                      >
                        <span className="text-base leading-none">{e.emoji}</span>
                        <span className="text-[9px] font-medium tracking-tight truncate max-w-full">{tEvent(e.id)}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 활성 이벤트의 템플릿 그리드 */}
                <div>
                  <h4 className="text-xs font-semibold text-hydrangea-700 mb-2">🎨 Template</h4>
                  {tpls.length === 0 ? (
                    <div className="text-center py-8 text-sm text-hydrangea-400">
                      이 이벤트에 등록된 템플릿이 없습니다.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {tpls.map((t) => {
                        const bg = getBackground(t.bg_id);
                        const selected = draft.bg_id === t.bg_id && draft.layout_id === t.layout_id;
                        return (
                          <motion.button
                            key={t.id}
                            onClick={() => setDraft({ bg_id: t.bg_id as BackgroundId, layout_id: t.layout_id as LayoutId })}
                            whileTap={{ scale: 0.96 }}
                            className={`relative aspect-[3/4] rounded-xl border-2 overflow-hidden transition ${
                              selected ? 'border-hydrangea-500 ring-2 ring-hydrangea-300' : 'border-hydrangea-100/60'
                            }`}
                          >
                            {bg.imageUrl ? (
                              <img src={bg.imageUrl} alt={t.name} className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                              <div className="absolute inset-0" style={{ background: bg.gradient }} />
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/45 text-white text-[10px] py-0.5 text-center truncate px-1">
                              {t.name}
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
                  )}
                </div>

                <Button onClick={() => advance(2)} disabled={!isDone(1)} full size="md">
                  Next
                </Button>
              </div>
            );
          })()}
        </SectionShell>

        {/* 2. 봉투 */}
        <SectionShell
          id={2}
          title="Envelope"
          summary={summaries[2]}
          open={open === 2}
          done={isDone(2) && open !== 2}
          enabled={isEnabled(2)}
          onToggle={() => setOpen(2)}
        >
          <div className="space-y-5 mt-2">
            <div>
              <div className="grid grid-cols-2 gap-2">
                {ENVELOPE_ANIMS.map((e) => {
                  const selected = draft.envelope_anim === e.id;
                  const recommended = e.id === meta.recommendEnvelope;
                  const Env = ENVELOPE_MAP[e.id as keyof typeof ENVELOPE_MAP];
                  return (
                    <motion.button
                      key={e.id}
                      onClick={() => setDraft({ envelope_anim: e.id as EnvelopeAnimId })}
                      whileTap={{ scale: 0.98 }}
                      className={`relative flex flex-col items-center p-3 rounded-xl border-2 text-center transition ${
                        selected ? 'border-hydrangea-500 bg-hydrangea-50' : 'border-hydrangea-100/60 bg-white'
                      }`}
                    >
                      <div className="pointer-events-none mb-2 flex items-center justify-center overflow-hidden" style={{ height: 110, width: 120 }}>
                        {e.id === 'none' ? (
                          <div className="w-[100px] h-[72px] rounded-md border-2 border-dashed border-hydrangea-200 bg-white flex items-center justify-center text-[10px] text-hydrangea-400">
                            No envelope
                          </div>
                        ) : (
                          <Env isOpen={false} width={100}>{null}</Env>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-hydrangea-700">{e.name}</span>
                        {recommended && (
                          <span className="px-1.5 py-0.5 rounded-full bg-hydrangea-100 text-[9px] font-semibold text-hydrangea-700">Rec</span>
                        )}
                      </div>
                      {selected && (
                        <Check className="absolute top-2 right-2 w-4 h-4 text-hydrangea-500" strokeWidth={2.5} />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <Button onClick={() => advance(3)} disabled={!isDone(2)} full size="md">
              Next
            </Button>
          </div>
        </SectionShell>

        {/* 3. 정보 입력 + RSVP */}
        <SectionShell
          id={3}
          title="Details"
          summary={summaries[3]}
          open={open === 3}
          done={isDone(3) && open !== 3}
          enabled={isEnabled(3)}
          onToggle={() => setOpen(3)}
        >
          <div className="space-y-4 mt-2">
            {draft.envelope_anim && draft.envelope_anim !== 'none' && (() => {
              const showName = draft.recipient_template !== null && draft.recipient_template !== undefined;
              return (
                <div>
                  <label className="block text-sm font-medium text-hydrangea-700 mb-1.5">
                    Show recipient name on the envelope?
                  </label>
                  <div className="flex gap-2 mb-2">
                    <button type="button"
                      onClick={() => setDraft({ recipient_template: draft.recipient_template ?? lastRecipientTemplate.current ?? '$NAME' })}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition ${
                        showName ? 'border-hydrangea-500 bg-hydrangea-50 text-hydrangea-700' : 'border-hydrangea-100 bg-white text-hydrangea-400'
                      }`}>
                      Yes
                    </button>
                    <button type="button"
                      onClick={() => setDraft({ recipient_template: null })}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition ${
                        !showName ? 'border-hydrangea-500 bg-hydrangea-50 text-hydrangea-700' : 'border-hydrangea-100 bg-white text-hydrangea-400'
                      }`}>
                      No
                    </button>
                  </div>
                  {showName && (
                    <Input
                      placeholder="e.g. Dear $NAME / $NAME님께"
                      hint="Use $NAME to insert the recipient's name."
                      value={draft.recipient_template ?? ''}
                      onChange={(e) => setDraft({ recipient_template: e.target.value })}
                    />
                  )}
                </div>
              );
            })()}
            <Input
              label="Subtitle"
              placeholder={meta.fields.subtitlePlaceholder}
              hint="Optional"
              value={draft.greeting_oneliner || ''}
              onChange={(e) => setDraft({ greeting_oneliner: e.target.value })}
            />
            <Input
              label={meta.fields.titleLabel}
              requiredMark
              placeholder={meta.fields.titlePlaceholder}
              value={draft.title || ''}
              onChange={(e) => setDraft({ title: e.target.value })}
            />
            <div>
              <Textarea label="Message" requiredMark
                labelHint="Centered · Press Enter to break lines · Words won't split"
                placeholder={meta.fields.bodyPlaceholder}
                value={draft.body || ''}
                onChange={(e) => setDraft({ body: e.target.value.slice(0, 200) })}
                maxLength={200}
                rows={5}
              />
              <p className="text-[11px] text-hydrangea-400 mt-1 text-right tabular-nums">
                {String((draft.body || '').length).padStart(3, '0')}/200
              </p>
            </div>
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
                const iso = new Date(y, mo - 1, d, h || 0, m || 0).toISOString();
                // event_date 변경 시 RSVP 마감/만료일도 같이 동기화
                setDraft({ event_date: iso, rsvp_deadline: iso, expiry_date: iso });
              };
              return (
                <div>
                  <label className="block text-sm font-medium text-hydrangea-700 mb-1.5">
                    Date & Time<span className="text-red-500 ml-1">*</span>
                  </label>
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
            <Input label="Place" requiredMark placeholder={meta.fields.placePlaceholder} value={draft.event_place || ''}
              onChange={(e) => setDraft({ event_place: e.target.value })} />
            <Input label="Address" placeholder="Street address or map link" value={draft.map_url || ''}
              onChange={(e) => setDraft({ map_url: e.target.value })} />
            <Input label="Host" placeholder="e.g. Jane Doe" value={draft.contact_name || ''}
              onChange={(e) => setDraft({ contact_name: e.target.value })} />
            <PhoneInput label="Phone" value={draft.contact_phone || ''}
              onChange={(phone) => setDraft({ contact_phone: phone })} />
            <Textarea label="Additional info (optional)" placeholder={meta.fields.memoPlaceholder} value={draft.extra_info || ''}
              onChange={(e) => setDraft({ extra_info: e.target.value })} rows={3} />

            <div className="pt-3 border-t border-hydrangea-100/60">
              <h4 className="text-xs font-semibold text-hydrangea-700 mb-2">RSVP options</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-hydrangea-100/60">
                  <div className="text-sm text-hydrangea-700">Enable RSVP</div>
                  <button type="button" onClick={() => setDraft({ rsvp_enabled: !draft.rsvp_enabled })}
                    className={`relative w-11 h-6 rounded-full transition ${draft.rsvp_enabled ? 'bg-hydrangea-500' : 'bg-hydrangea-100'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${draft.rsvp_enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {draft.rsvp_enabled && (
                  <>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-hydrangea-100/60">
                      <div>
                        <div className="text-sm text-hydrangea-700">Max group size</div>
                        <div className="text-[11px] text-hydrangea-400 mt-0.5">
                          Total people in my group including myself
                        </div>
                      </div>
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
                    {(draft.rsvp_max_per_card || 4) > 1 && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-hydrangea-100/60">
                        <div className="text-sm text-hydrangea-700">Collect attendee names</div>
                        <button type="button" onClick={() => setDraft({ rsvp_collect_names: !draft.rsvp_collect_names })}
                          className={`relative w-11 h-6 rounded-full transition ${draft.rsvp_collect_names ? 'bg-hydrangea-500' : 'bg-hydrangea-100'}`}>
                          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${draft.rsvp_collect_names ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    )}
                    {/* Allow one-line reply 옵션은 화면에서 숨김 (default off) */}
                    {(() => {
                      const toLocalInput = (iso?: string | null) => {
                        if (!iso) return '';
                        const d = new Date(iso);
                        if (isNaN(d.getTime())) return '';
                        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                      };
                      const now = new Date();
                      const minStr = toLocalInput(now.toISOString());
                      const maxStr = draft.event_date ? toLocalInput(draft.event_date) : undefined;
                      return (
                        <Input label="RSVP deadline (optional)" type="datetime-local"
                          hint={maxStr ? 'Must be before the event start time' : undefined}
                          min={minStr}
                          max={maxStr}
                          value={toLocalInput(draft.rsvp_deadline)}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (!v) { setDraft({ rsvp_deadline: null }); return; }
                            const [datePart, timePart] = v.split('T');
                            const [y, mo, d] = datePart.split('-').map(Number);
                            const [h, m] = (timePart || '00:00').split(':').map(Number);
                            if (!y || y < 1900 || y > 2999 || !mo || !d) return;
                            const picked = new Date(y, mo - 1, d, h || 0, m || 0);
                            // 클라이언트 측 가드 — min(현재) 이후 + max(이벤트 시각) 이전
                            if (picked.getTime() < Date.now() - 60000) return; // 1분 여유
                            if (draft.event_date && picked.getTime() > new Date(draft.event_date).getTime()) return;
                            setDraft({ rsvp_deadline: picked.toISOString() });
                          }} />
                      );
                    })()}
                  </>
                )}
              </div>
            </div>

            <Button onClick={() => advance(4)} disabled={!detailsCanProceed} full size="md">
              Next
            </Button>
            {!detailsCanProceed && (
              <p className="text-xs text-hydrangea-400 text-center">All fields marked with * are required</p>
            )}
          </div>
        </SectionShell>

        {/* 4. 레이아웃 / 미리보기 / 발행 */}
        <SectionShell
          id={4}
          title="Layout, Preview & Publish"
          open={open === 4}
          done={false}
          enabled={isEnabled(4)}
          onToggle={() => setOpen(4)}
        >
          <div className="space-y-4 mt-2">
            {/* 선택한 템플릿이 여러 layout 허용 시 → 사용자가 고르고 미리볼 수 있게 */}
            {(() => {
              const tpl = findTemplateByPair(draft.bg_id, draft.layout_id) || TEMPLATES.find((t) => t.bg_id === draft.bg_id);
              if (!tpl) return null;
              // DB override가 있으면 우선, 없으면 코드 default
              const dbOverride = templateConfigs?.[tpl.id];
              const allowed = (dbOverride && dbOverride.length > 0
                ? dbOverride as LayoutId[]
                : getTemplateLayouts(tpl));
              if (allowed.length <= 1) return null;
              return (
                <div>
                  <h4 className="text-xs font-semibold text-hydrangea-700 mb-2">📐 Layout — pick one to preview</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {allowed.map((lid) => {
                      const lay = getLayout(lid);
                      const selected = draft.layout_id === lid;
                      return (
                        <motion.button
                          key={lid}
                          onClick={() => setDraft({ layout_id: lid as LayoutId })}
                          whileTap={{ scale: 0.96 }}
                          className={`relative p-3 rounded-xl border-2 text-left transition ${
                            selected ? 'border-hydrangea-500 bg-hydrangea-50' : 'border-hydrangea-100/60 bg-white'
                          }`}
                        >
                          <div className="text-xs font-semibold text-hydrangea-700">{lay.name}</div>
                          <div className="text-[10px] text-hydrangea-400 mt-0.5 leading-tight">{lay.description}</div>
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
              );
            })()}

            {/* 봉투 → 클릭하면 초대장 카드 표시 (실제 동작 미리보기) */}
            {(() => {
              const Env = ENVELOPE_MAP[(draft.envelope_anim as keyof typeof ENVELOPE_MAP) || 'envelope-1'];
              return (
                <div className="flex flex-col items-center py-6 bg-hydrangea-50/40 rounded-2xl">
                  {!envelopeOpen ? (
                    <>
                      <p className="text-xs text-hydrangea-400 mb-4">
                        {envelopeOpening ? 'Opening...' : 'Click the envelope to open'}
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
                        className={`relative ${envelopeOpening ? '' : 'cursor-pointer active:scale-95 transition'}`}
                      >
                        <Env isOpen={envelopeOpening} width={280}>
                          {(() => {
                            const lay = getLayout(draft.layout_id);
                            const tf = lay.fields.title;
                            const df = lay.fields.date;
                            const dt = draft.event_date ? new Date(draft.event_date) : null;
                            const dateStr = dt && !isNaN(dt.getTime())
                              ? dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                              : '';
                            const previewName = 'John';
                            return (
                              <div style={{ textAlign: 'center', padding: '0 8px' }}>
                                <div style={{
                                  fontFamily: tf.fontFamily || "'Noto Serif KR', serif",
                                  fontWeight: tf.fontWeight,
                                  color: tf.color,
                                  fontSize: Math.min(tf.fontSize, 24),
                                  letterSpacing: tf.letterSpacing,
                                  lineHeight: tf.lineHeight || 1.2,
                                  marginBottom: 6
                                }}>
                                  {(draft.title || 'Title').replace(/\$NAME/g, previewName)}
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
                        {(() => {
                          if (draft.envelope_anim === 'none') return null;
                          const previewName = 'John';
                          const tpl = draft.recipient_template?.trim();
                          const greetingPreview = tpl ? tpl.replace(/\$NAME/g, previewName) : '';
                          if (!greetingPreview) return null;
                          const ENVELOPE_DEEP: Record<string, string> = {
                            'envelope-1': '#5A3D7A',
                            'envelope-2': '#6E5A3D',
                            'envelope-3': '#476956',
                            'envelope-4': '#8E5A4D'
                          };
                          const deep = ENVELOPE_DEEP[draft.envelope_anim || 'envelope-1'] || '#5A3D7A';
                          const envHeight = Math.round(280 * 0.7);
                          return (
                            <div style={{
                              position: 'absolute',
                              left: '50%',
                              top: `${Math.round(envHeight * 0.78)}px`,
                              transform: 'translateX(-50%)',
                              width: '85%',
                              textAlign: 'center',
                              color: deep,
                              fontSize: 13,
                              fontWeight: 500,
                              letterSpacing: '0.04em',
                              textShadow: '0 1px 2px rgba(255,255,255,0.4)',
                              pointerEvents: 'none',
                              zIndex: 10
                            }}>
                              {greetingPreview}
                            </div>
                          );
                        })()}
                      </div>
                    </>
                  ) : (
                    <div className="w-full px-2">
                      <button
                        type="button"
                        onClick={() => { setEnvelopeOpen(false); setEnvelopeOpening(false); }}
                        className="text-xs text-hydrangea-500 mb-3 underline"
                      >
                        ← Back to envelope
                      </button>
                      <motion.div
                        key={`${draft.bg_id}-${draft.layout_id}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <TemplateCard
                          card={previewCard}
                          recipientName="John"
                          rsvpSlot={draft.rsvp_enabled ? (
                            <RsvpForm card={previewCard} theme={getTheme(previewCard.theme)} compact />
                          ) : null}
                        />
                      </motion.div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="p-3 rounded-xl bg-hydrangea-50 text-xs space-y-1">
              <div className="flex items-center gap-2 font-semibold text-hydrangea-700 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Settings summary
              </div>
              <div className="flex justify-between"><span className="text-hydrangea-400">Event</span><span className="text-hydrangea-700">{meta.label}</span></div>
              <div className="flex justify-between"><span className="text-hydrangea-400">Template</span><span className="text-hydrangea-700">{tplName}</span></div>
              <div className="flex justify-between"><span className="text-hydrangea-400">Envelope</span><span className="text-hydrangea-700">{envName}</span></div>
              <div className="flex justify-between"><span className="text-hydrangea-400">RSVP</span><span className="text-hydrangea-700">{draft.rsvp_enabled ? `Enabled (max ${draft.rsvp_max_per_card})` : 'Disabled'}</span></div>
            </div>

            <Button onClick={handlePublish} disabled={pending} full size="lg">
              {pending
                ? (isEditMode ? 'Saving...' : 'Publishing...')
                : isEditMode
                  ? '✏️ Save changes'
                  : sessionStatus === 'unauthenticated'
                    ? '🔒 Sign in to publish'
                    : '🎉 Publish'}
            </Button>
            {!isEditMode && sessionStatus === 'unauthenticated' && (
              <p className="text-xs text-hydrangea-400 text-center">
                Your inputs are saved — you'll come back here after signing in.
              </p>
            )}
          </div>
        </SectionShell>
      </div>

      {/* Edit 모드: 변경사항 있을 때 sticky save bar */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 bg-white/95 backdrop-blur border-t border-hydrangea-200 shadow-lg">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <span className="text-xs text-hydrangea-500 flex-1">You have unsaved changes</span>
            <button
              type="button"
              onClick={handleStickySave}
              disabled={savingSticky}
              className="px-4 py-2 rounded-full bg-hydrangea-500 text-white text-sm font-medium shadow active:scale-95 transition disabled:opacity-50"
            >
              {savingSticky ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
