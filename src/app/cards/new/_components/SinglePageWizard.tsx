'use client';

import { Fragment, useState, useEffect, useRef, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useSession, signIn } from 'next-auth/react';
import { Check, ChevronDown, ChevronUp, Minus, Plus, Sparkles, Calendar } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { Input, Textarea, Button, PhoneInput } from '@/components/ui';
import { useWizardStore } from '@/stores/wizardStore';
import { EVENT_TYPES, getEventTypeMeta } from '@/lib/eventType';
import { getBackground } from '@/lib/backgrounds';
import { ENVELOPE_ANIMS, ClassicEnvelope, EnvelopeBeige, EnvelopeMint, EnvelopeCoral, EnvelopeBlue, EnvelopeBlackGold, SwayEnvelope, NoneEnvelope, COLOR_PALETTES, type EnvelopeColorId } from '@/components/envelopes';
import { resolveColorId } from '@/components/envelopes/palettes';

const ENVELOPE_MAP = {
  'envelope-1': ClassicEnvelope,
  'envelope-2': EnvelopeBeige,
  'envelope-3': EnvelopeMint,
  'envelope-4': EnvelopeCoral,
  'envelope-5': EnvelopeBlue,
  'envelope-6': EnvelopeBlackGold,
  'none': NoneEnvelope
} as const;

// 새 (type, color) 모델 → 봉투 렌더 함수 (모든 sway는 SwayEnvelope, flip은 EnvelopeBlackGold)
type EnvelopeAnimType = 'none' | 'sway' | 'flip';
function renderEnvelope(type: EnvelopeAnimType, color: EnvelopeColorId, props: { width?: number; isOpen?: boolean; children?: React.ReactNode; recipientGreeting?: string; cardPreview?: React.ReactNode; onComplete?: () => void }) {
  if (type === 'none') return <NoneEnvelope {...props} isOpen={!!props.isOpen} />;
  const palette = COLOR_PALETTES[color];
  if (type === 'flip') return <EnvelopeBlackGold {...props} isOpen={!!props.isOpen} palette={palette} />;
  return <SwayEnvelope {...props} isOpen={!!props.isOpen} palette={palette} />;
}

// 기존 envelope_anim id ↔ (type, color)
function parseEnvelopeAnim(id: string | undefined | null): { type: EnvelopeAnimType; color: EnvelopeColorId } {
  if (!id || id === 'none') return { type: 'none', color: 'lavender' };
  // 새 형식: "type:color"
  if (id.includes(':')) {
    const [t, c] = id.split(':');
    return { type: t as EnvelopeAnimType, color: resolveColorId(c) };
  }
  // 기존 envelope-N → 매핑 (구버전 색상 id는 resolveColorId로 신규 매핑)
  const map: Record<string, { type: EnvelopeAnimType; color: string }> = {
    'envelope-1': { type: 'sway', color: 'lavender' },
    'envelope-2': { type: 'sway', color: 'beige' },
    'envelope-3': { type: 'sway', color: 'mint' },
    'envelope-4': { type: 'sway', color: 'coral' },
    'envelope-5': { type: 'sway', color: 'lightblue' },
    'envelope-6': { type: 'flip', color: 'blackgold' }
  };
  const m = map[id];
  if (m) return { type: m.type, color: resolveColorId(m.color) };
  return { type: 'sway', color: 'lavender' };
}
function buildEnvelopeAnim(type: EnvelopeAnimType, color: EnvelopeColorId): string {
  if (type === 'none') return 'none';
  // 기존 6 조합은 backward compat ID 유지
  if (type === 'sway') {
    const m: Record<string, string> = { lavender: 'envelope-1', beige: 'envelope-2', mint: 'envelope-3', coral: 'envelope-4', lightblue: 'envelope-5' };
    if (m[color]) return m[color];
  }
  if (type === 'flip' && (color as string) === 'blackgold') return 'envelope-6';
  // 새 조합 — type:color 형식
  return `${type}:${color}`;
}
import { publishCard, updateCard } from '@/lib/actions/publishCard';
import TemplateCard from '@/app/i/[slug]/_components/TemplateCard';
import SendStep from './SendStep';
import RsvpForm from '@/app/i/[slug]/_components/RsvpForm';
import { getTheme } from '@/lib/theme';
import { TEMPLATES, getTemplate, findTemplateByPair, getTemplatesFor, getTemplateLayouts } from '@/lib/templates';
import { LAYOUTS, getLayout } from '@/lib/layouts';
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
  /** 헤더 우측 액션 버튼 (Create: NEXT, Edit: SAVE) */
  headerAction?: { label: string; onClick: () => void; disabled?: boolean } | null;
}

function SectionShell({ id, title, summary, open, done, enabled, onToggle, children, headerAction }: SectionShellProps) {
  // 닫힌 섹션은 렌더하지 않음 — 상단 탭바가 네비게이션 담당
  if (!open) return null;
  return (
    <section className="rounded-2xl border border-hydrangea-100 bg-white overflow-hidden">
      {/* 활성 섹션 헤더 — 상단 탭바와 동일한 보라색으로 일관성 강조 */}
      <div className="w-full flex items-center gap-3 p-4 text-left bg-hydrangea-500 text-white">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-white/25">
          {done ? <Check className="w-4 h-4" strokeWidth={3} /> : id}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{title}</div>
          {summary && (
            <div className="text-xs text-white/75 mt-0.5 truncate">{summary}</div>
          )}
        </div>
        {headerAction && (
          <button
            type="button"
            onClick={headerAction.onClick}
            disabled={headerAction.disabled}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {headerAction.label}
          </button>
        )}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="p-4">{children}</div>
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
  /** admin이 DB에 저장한 이벤트별 템플릿 노출 순서 (event_id → template_id[]) */
  eventOrders?: Record<string, string[]>;
}

export default function SinglePageWizard({ skipRehydrate, initialOpen, templateConfigs, eventOrders }: SinglePageWizardProps = {}) {
  const router = useRouter();
  const params = useSearchParams();
  const { status: sessionStatus } = useSession();
  const t = useTranslations('Wizard');
  const tEvent = useTranslations('EventTypes');
  const { draft, setDraft, setEventType, reset, editingSlug } = useWizardStore();
  const isEditMode = !!editingSlug;
  const [open, setOpen] = useState<SectionId>((initialOpen as SectionId) || 1);
  // 템플릿 클릭 시 큰 미리보기 모달
  const [previewTpl, setPreviewTpl] = useState<typeof TEMPLATES[number] | null>(null);
  // 사용자가 Next 버튼으로 실제로 진행한 최대 단계 — 시각적 완료 표시용
  // edit 모드(initialOpen=4)는 처음부터 4단계까지 다 통과한 것으로 시작
  const [maxStepCompleted, setMaxStepCompleted] = useState<number>(
    initialOpen ? (initialOpen - 1) : 0
  );
  const [pending, startTransition] = useTransition();
  // Section 4 미리보기는 봉투 단계 건너뛰고 항상 카드 펼친 상태로 시작
  const [envelopeOpen, setEnvelopeOpen] = useState(true);
  const [envelopeOpening, setEnvelopeOpening] = useState(false);
  // 발행된 카드 정보 (Step 5 활성화용). edit 모드면 editingSlug + localStorage 토큰 사용
  const [publishedSlug, setPublishedSlug] = useState<string | null>(editingSlug || null);
  const [publishedOwnerToken, setPublishedOwnerToken] = useState<string | null>(null);
  useEffect(() => {
    if (publishedSlug && !publishedOwnerToken && typeof window !== 'undefined') {
      const t = localStorage.getItem(`dearday:owner:${publishedSlug}`);
      if (t) setPublishedOwnerToken(t);
    }
  }, [publishedSlug, publishedOwnerToken]);

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

  // 봉투 타입에 따라 recipient_template 자동 동기화:
  //   - none: null (표시 안 함)
  //   - sway/flip: '$NAME' 기본값 (옵션 제거됨, 항상 default 적용)
  useEffect(() => {
    if (draft.envelope_anim === 'none') {
      if (draft.recipient_template !== null) setDraft({ recipient_template: null });
    } else if (draft.envelope_anim) {
      const tpl = typeof draft.recipient_template === 'string' ? draft.recipient_template.trim() : '';
      // 옵션 제거됨 — 항상 '$NAME'로 강제 동기화
      if (tpl !== '$NAME') setDraft({ recipient_template: '$NAME' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.envelope_anim, draft.recipient_template]);

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
  // step 5는 카드가 발행된 상태(publishedSlug)이거나 edit 모드일 때만 활성화
  const isEnabled = (id: SectionId): boolean => {
    if (id === 5) return !!publishedSlug;
    for (let i = 1 as SectionId; i < id; i = (i + 1) as SectionId) {
      if (i === 4) continue; // step 4는 publish action — done 여부로 판단 안 함
      if (!isDone(i)) return false;
    }
    return true;
  };

  const advance = (next: SectionId) => {
    setOpen(next);
    // 사용자가 Next로 진행 → 직전 단계를 완료 표시
    setMaxStepCompleted((m) => Math.max(m, next - 1));
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
        // Edit 모드: 발행된 카드이므로 step 5(초대장 보내기)로 진행
        setPublishedSlug(editingSlug);
        setOpen(5);
        setMaxStepCompleted((m) => Math.max(m, 4));
        return;
      }
      const res = await publishCard(draft);
      if (!res.ok) {
        toast.error(res.error || 'Publish failed');
        return;
      }
      if (res.slug && res.ownerToken) {
        localStorage.setItem(`dearday:owner:${res.slug}`, res.ownerToken);
        setPublishedSlug(res.slug);
        setPublishedOwnerToken(res.ownerToken);
      }
      toast.success('Invitation published!');
      // Step 5(초대장 보내기)로 진행 — 발행된 카드의 recipient 등록/이메일 발송
      setOpen(5);
      setMaxStepCompleted((m) => Math.max(m, 4));
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
    4: 'Layout, Publish',
    5: 'Send Invitation'
  };

  return (
    <PageContainer noPadding>
      <MobileHeader title={isEditMode ? 'Edit Invitation' : t('headerTitle')} back />

      {/* 상단 단계 표시 (sticky) — 작은 점/숫자 + 가는 connector. 현재 단계 라벨은 아래 SectionShell에 노출 */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-hydrangea-100/70 px-4 py-3">
        <div className="flex items-center justify-center gap-0">
          {([1, 2, 3, 4, 5] as SectionId[]).map((id, idx) => {
            const active = open === id;
            const enabled = isEnabled(id);
            const completed = id <= maxStepCompleted;
            return (
              <Fragment key={id}>
                <button
                  type="button"
                  onClick={() => enabled && setOpen(id)}
                  disabled={!enabled}
                  title={!enabled ? '이전 단계를 먼저 완료하세요' : SECTION_LABELS[id]}
                  className={`relative w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition active:scale-95 disabled:cursor-not-allowed ${
                    active
                      ? 'bg-hydrangea-500 text-white shadow ring-2 ring-hydrangea-200'
                      : completed
                        ? 'bg-hydrangea-500 text-white'
                        : enabled
                          ? 'bg-white text-hydrangea-500 border border-hydrangea-300'
                          : 'bg-white text-hydrangea-300 border border-hydrangea-100 opacity-60'
                  }`}
                >
                  {completed && !active ? (
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  ) : (
                    <span>{id}</span>
                  )}
                </button>
                {idx < 4 && (
                  <span
                    aria-hidden="true"
                    className={`flex-1 max-w-12 h-px mx-1 ${
                      completed ? 'bg-hydrangea-500' : 'bg-hydrangea-200'
                    }`}
                  />
                )}
              </Fragment>
            );
          })}
        </div>
        <div className="text-center mt-1.5 text-[11px] font-medium text-hydrangea-700">
          {SECTION_LABELS[open]}
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
          headerAction={isEditMode
            ? { label: 'SAVE', onClick: handlePublish, disabled: pending }
            : { label: 'NEXT', onClick: () => advance(2), disabled: !isDone(1) }}
        >
          {(() => {
            const activeEvent = (draft.event_type as EventType) || 'meeting';
            // draft 템플릿이라도 admin이 DB에 layout을 등록했으면 노출
            const baseTpls = TEMPLATES.filter((t) =>
              t.recommendEvents.includes(activeEvent) &&
              (!t.draft || (templateConfigs && templateConfigs[t.id] && templateConfigs[t.id].length > 0))
            );
            // admin DB에 저장된 순서 적용 — 저장된 ID 우선, 미저장은 default 순서로 뒤에
            const order = eventOrders?.[activeEvent];
            const tpls = order && order.length > 0
              ? [
                  ...order
                    .map((id) => baseTpls.find((t) => t.id === id))
                    .filter((x): x is NonNullable<typeof x> => !!x),
                  ...baseTpls.filter((t) => !order.includes(t.id))
                ]
              : baseTpls;
            return (
              <div className="space-y-3 mt-2">
                {/* 이벤트 선택 */}
                <h4 className="text-xs font-semibold text-hydrangea-700 mb-2 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" strokeWidth={2} /> Event</h4>
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
                            ? 'bg-white text-hydrangea-700 border-2 border-hydrangea-500 font-semibold'
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
                  <h4 className="text-xs font-semibold text-hydrangea-700 mb-2">
                    🎨 Templates for {(EVENT_TYPES.find((e) => e.id === activeEvent)?.label) || 'Invitation'}
                  </h4>
                  {tpls.length === 0 ? (
                    <div className="text-center py-8 text-sm text-hydrangea-400">
                      이 이벤트에 등록된 템플릿이 없습니다.
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-1.5">
                      {tpls.map((t) => {
                        const bg = getBackground(t.bg_id);
                        const selected = draft.bg_id === t.bg_id && draft.layout_id === t.layout_id;
                        return (
                          <motion.button
                            key={t.id}
                            onClick={() => setPreviewTpl(t)}
                            whileTap={{ scale: 0.96 }}
                            className={`relative aspect-[3/4] rounded-lg border-2 overflow-hidden transition ${
                              selected ? 'border-hydrangea-500 ring-2 ring-hydrangea-300' : 'border-hydrangea-100/60'
                            }`}
                          >
                            {bg.imageUrl ? (
                              <img src={bg.imageUrl} alt={t.name} className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                              <div className="absolute inset-0" style={{ background: bg.gradient }} />
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/45 text-white text-[8px] py-0.5 text-center truncate px-0.5">
                              {t.name}
                            </div>
                            {selected && (
                              <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-hydrangea-500 flex items-center justify-center">
                                <Check className="w-2 h-2 text-white" strokeWidth={3} />
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
          headerAction={isEditMode
            ? { label: 'SAVE', onClick: handlePublish, disabled: pending }
            : { label: 'NEXT', onClick: () => advance(3), disabled: !isDone(2) }}
        >
          <div className="space-y-5 mt-2">
            {/* 봉투가 있으면 수신자 이름은 항상 '$NAME' 기본값으로 자동 설정 */}
            {/* === 새 UI: 애니메이션 타입 + 색상 + Preview === */}
            {(() => {
              // 색상 팔레트 정의 (UI 칩 스와치 색)
              // 각 팔레트의 메인 색상 2종(외피 body + 안감 gold base)을 대각선 분할로 노출
              const split = (body: string, accent: string) =>
                `linear-gradient(135deg, ${body} 0%, ${body} 50%, ${accent} 50%, ${accent} 100%)`;
              const COLORS = [
                { id: 'pearl',      label: 'Gold Cream',             swatch: split('#DCB748', '#F5F0E2') },
                { id: 'lavender',   label: 'Lavender Silver',        swatch: split('#C8B0E2', '#CABFCF') },
                { id: 'champagne',  label: 'Beige Ivory',            swatch: split('#DACFB6', '#F5F0E2') },
                { id: 'sage',       label: 'Sage Pearl',             swatch: split('#B0C5AC', '#E8E4D8') },
                { id: 'blush',      label: 'Blush Rose Gold',        swatch: split('#F2C0B3', '#C9907A') },
                { id: 'rose',       label: 'Rose Petal',             swatch: split('#F4C5D2', '#F5EBD8') },
                { id: 'powder',     label: 'Powder Silver',          swatch: split('#BFD7EA', '#C4CDD4') },
                { id: 'midnight',   label: 'Midnight Gold',          swatch: split('#2D3D50', '#DCB748') },
                { id: 'cobalt',     label: 'Cobalt Cream',           swatch: split('#2E4A8C', '#F5F0E2') },
                { id: 'aubergine',  label: 'Aubergine Pearl',        swatch: split('#3F2A4A', '#C0B6CC') },
                { id: 'onyx',       label: 'Onyx Gold',              swatch: split('#2A2A2A', '#DCB748') }
              ] as const;
              const ANIMS = [
                { id: 'sway', label: 'Sway', desc: 'Gentle wobble + flap open' },
                { id: 'flip', label: 'Flip', desc: 'Envelope rotates as the card emerges' }
              ] as const;

              const current = parseEnvelopeAnim(draft.envelope_anim);
              const setTypeColor = (type: EnvelopeAnimType, color: EnvelopeColorId) => {
                const newId = buildEnvelopeAnim(type, color);
                setDraft({ envelope_anim: newId as EnvelopeAnimId });
              };

              return (
                <div className="space-y-4">
                  {/* 색상 팔레트 (none이면 비활성) */}
                  {current.type !== 'none' && (
                    <div>
                      <label className="block text-xs font-semibold text-hydrangea-700 mb-2">색상</label>
                      <div className="grid grid-cols-6 gap-2">
                        {COLORS.map((c) => {
                          const selected = current.color === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setTypeColor(current.type, c.id as EnvelopeColorId)}
                              title={c.label}
                              className={`relative aspect-square rounded-lg border-2 transition active:scale-95 hover:border-hydrangea-300 ${
                                selected
                                  ? 'border-hydrangea-500 ring-2 ring-hydrangea-200'
                                  : 'border-hydrangea-100'
                              }`}
                              style={{ background: c.swatch }}
                            >
                              {selected && (
                                <Check className="absolute top-0.5 right-0.5 w-3 h-3 text-white drop-shadow" strokeWidth={3} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="text-[10px] text-hydrangea-400 mt-1.5 text-center">
                        {COLORS.find((c) => c.id === current.color)?.label}
                      </div>
                    </div>
                  )}

                  {/* 애니메이션 타입 */}
                  <div>
                    <label className="block text-xs font-semibold text-hydrangea-700 mb-2">애니메이션</label>
                    <div className="grid grid-cols-2 gap-2">
                      {ANIMS.map((a) => {
                        const selected = current.type === a.id;
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => setTypeColor(a.id as EnvelopeAnimType, current.color)}
                            className={`relative px-2 py-2 rounded-xl border-2 text-center transition active:scale-95 ${
                              selected ? 'border-hydrangea-500 bg-hydrangea-50' : 'border-hydrangea-100 bg-white hover:bg-hydrangea-50/40'
                            }`}
                          >
                            <div className="text-xs font-semibold text-hydrangea-700">{a.label}</div>
                            <div className="text-[9px] text-hydrangea-400 mt-0.5">{a.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preview — 적용된 (type, color) 봉투 */}
                  <div>
                    <label className="block text-xs font-semibold text-hydrangea-700 mb-2">미리보기</label>
                    <div className="bg-hydrangea-50/40 rounded-2xl p-4 flex flex-col items-center justify-center" style={{ minHeight: 200 }}>
                      {current.type !== 'none' && (
                        <p className="text-[11px] text-hydrangea-500 text-center mb-3 px-2 leading-snug">
                          {current.type === 'flip'
                            ? '봉투가 회전하며 뒷면이 보이고, 뚜껑이 열리며 안의 초청장이 펼쳐집니다.'
                            : '봉투가 살랑거리다가 클릭하면 봉투가 열리고 꽃잎이 흩날리며 펼쳐집니다.'}
                        </p>
                      )}
                      {current.type === 'none' ? (
                        <div className="w-[180px] h-[126px] rounded-md border-2 border-dashed border-hydrangea-200 bg-white flex items-center justify-center text-xs text-hydrangea-400">
                          None
                        </div>
                      ) : (
                        <div className="relative" style={{ width: 260 }}>
                          {renderEnvelope(current.type, current.color, { isOpen: false, width: 260, children: null })}
                          {(() => {
                            const previewName = 'Ms. Avery';
                            const tpl = (draft.recipient_template?.trim()) || '$NAME';
                            const greetingPreview = tpl.replace(/\$NAME/g, previewName);
                            const envHeight = Math.round(260 * 0.75);
                            const isFlip = current.type === 'flip';
                            return (
                              <div style={{
                                position: 'absolute',
                                left: '50%',
                                top: `${Math.round(envHeight * (isFlip ? 0.75 : 1.0))}px`,
                                transform: 'translate(-50%, -50%)',
                                width: '85%',
                                textAlign: 'center',
                                color: '#5A3D7A',
                                fontFamily: "'Cormorant Garamond', 'Playfair Display', 'Noto Serif KR', serif",
                                fontSize: 16,
                                fontWeight: 500,
                                fontVariant: 'small-caps',
                                letterSpacing: '0.12em',
                                textShadow: '0 1px 2px rgba(255,255,255,0.4)',
                                pointerEvents: 'none',
                                zIndex: 10
                              }}>
                                {greetingPreview}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

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
          headerAction={isEditMode
            ? { label: 'SAVE', onClick: handlePublish, disabled: pending }
            : { label: 'NEXT', onClick: () => advance(4), disabled: !detailsCanProceed }}
        >
          <div className="space-y-4 mt-2">
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

        {/* 4. 레이아웃 / 발행 */}
        <SectionShell
          id={4}
          title="Layout, Publish"
          open={open === 4}
          done={!!publishedSlug}
          enabled={isEnabled(4)}
          onToggle={() => setOpen(4)}
          headerAction={isEditMode
            ? { label: 'SAVE', onClick: handlePublish, disabled: pending }
            : { label: 'PUBLISH', onClick: handlePublish, disabled: pending }}
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
              // 짧은 라벨용 매핑 (description은 너무 김)
              const SHORT_DESC: Record<string, string> = {
                'layout-classic': 'Top-down flow',
                'layout-7': 'Top-down + center',
                'layout-3': 'Topcenter2',
                'layout-center': 'Center',
                'layout-4': 'Compact boxed',
                'layout-5': 'Rightside text',
                'layout-rightbottom': 'Rightbottom text',
                'layout-6': 'Centerdown',
                'layout-topcenter': 'Topcenter1'
              };
              return (
                <div>
                  <h4 className="text-xs font-semibold text-hydrangea-700 mb-2">📐 Layout — pick one to preview</h4>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {allowed.map((lid) => {
                      const lay = getLayout(lid);
                      const selected = draft.layout_id === lid;
                      return (
                        <motion.button
                          key={lid}
                          onClick={() => setDraft({ layout_id: lid as LayoutId })}
                          whileTap={{ scale: 0.96 }}
                          className={`relative flex-1 min-w-0 px-2 py-2 rounded-xl border text-center transition ${
                            selected ? 'border-hydrangea-500 bg-hydrangea-50' : 'border-hydrangea-100/60 bg-white'
                          }`}
                        >
                          <div className="text-xs font-semibold text-hydrangea-700 truncate">{lay.name}</div>
                          <div className="text-[10px] text-hydrangea-400 mt-0.5 truncate">
                            {SHORT_DESC[lid] || lay.renderStyle}
                          </div>
                          {selected && (
                            <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-hydrangea-500 flex items-center justify-center">
                              <Check className="w-2 h-2 text-white" strokeWidth={3} />
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
                      {(() => {
                        const t = parseEnvelopeAnim(draft.envelope_anim).type;
                        if (t === 'none') return null;
                        return (
                          <p className="text-[11px] text-hydrangea-500 text-center px-4 mb-2 leading-snug">
                            {t === 'flip'
                              ? '봉투가 회전하며 뒷면이 보이고, 뚜껑이 열리며 안의 초청장이 펼쳐집니다.'
                              : '봉투가 살랑거리다가 클릭하면 봉투가 열리고 꽃잎이 흩날리며 펼쳐집니다.'}
                          </p>
                        );
                      })()}
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
                          const previewName = 'Ms. Avery';
                          const tpl = (draft.recipient_template?.trim()) || '$NAME';
                          const greetingPreview = tpl.replace(/\$NAME/g, previewName);
                          const ENVELOPE_DEEP: Record<string, string> = {
                            'envelope-1': '#5A3D7A',
                            'envelope-2': '#6E5A3D',
                            'envelope-3': '#476956',
                            'envelope-4': '#8E5A4D'
                          };
                          const deep = ENVELOPE_DEEP[draft.envelope_anim || 'envelope-1'] || '#5A3D7A';
                          const envHeight = Math.round(280 * 0.75);
                          const isFlip = parseEnvelopeAnim(draft.envelope_anim).type === 'flip';
                          return (
                            <div style={{
                              position: 'absolute',
                              left: '50%',
                              top: `${Math.round(envHeight * (isFlip ? 0.75 : 1.0))}px`,
                              transform: 'translate(-50%, -50%)',
                              width: '85%',
                              textAlign: 'center',
                              color: deep,
                              fontFamily: "'Cormorant Garamond', 'Playfair Display', 'Noto Serif KR', serif",
                              fontSize: 16,
                              fontWeight: 500,
                              fontVariant: 'small-caps',
                              letterSpacing: '0.12em',
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

        {/* 5. 초대장 보내기 — 수신자 등록 + 이메일/링크 발송 */}
        <SectionShell
          id={5}
          title="Send Invitation"
          open={open === 5}
          done={false}
          enabled={isEnabled(5)}
          onToggle={() => setOpen(5)}
        >
          {publishedSlug ? (
            <SendStep slug={publishedSlug} ownerToken={publishedOwnerToken} />
          ) : (
            <div className="text-center py-8 text-sm text-hydrangea-400">
              먼저 4단계에서 초대장을 발행해 주세요.
            </div>
          )}
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

      {/* 템플릿 큰 미리보기 모달 */}
      {previewTpl && (() => {
        const tpl = previewTpl;
        const bg = getBackground(tpl.bg_id);
        const sampleCard = {
          ...previewCard,
          bg_id: tpl.bg_id as BackgroundId,
          layout_id: tpl.layout_id as LayoutId
        };
        return (
          <div
            className="fixed inset-0 z-50 bg-black/60 flex flex-col items-center justify-center p-4 overflow-y-auto"
            onClick={() => setPreviewTpl(null)}
          >
            <div
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 flex items-center justify-between border-b border-hydrangea-100">
                <div>
                  <div className="text-sm font-semibold text-hydrangea-700">{tpl.name}</div>
                  {bg.imageUrl && <div className="text-[10px] text-hydrangea-400 mt-0.5 truncate">{tpl.bg_id}</div>}
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewTpl(null)}
                  className="text-hydrangea-400 hover:text-hydrangea-700 text-2xl leading-none"
                  aria-label="Close"
                >×</button>
              </div>
              <div className="p-3 max-h-[70vh] overflow-y-auto bg-hydrangea-50/30">
                <TemplateCard card={sampleCard as any} recipientName="John" />
              </div>
              <div className="p-3 flex gap-2 border-t border-hydrangea-100">
                <button
                  type="button"
                  onClick={() => setPreviewTpl(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-hydrangea-200 text-hydrangea-700 text-sm font-medium hover:bg-hydrangea-50 transition"
                >Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    setDraft({ bg_id: tpl.bg_id as BackgroundId, layout_id: tpl.layout_id as LayoutId });
                    setPreviewTpl(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-hydrangea-500 text-white text-sm font-semibold hover:bg-hydrangea-600 transition"
                >Use this template</button>
              </div>
            </div>
          </div>
        );
      })()}
    </PageContainer>
  );
}
