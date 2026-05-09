'use client';

import { Fragment, useState, useEffect, useLayoutEffect, useRef, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useSession, signIn } from 'next-auth/react';
import { Check, ChevronDown, ChevronUp, Minus, Plus, Sparkles, Calendar, RotateCcw } from 'lucide-react';
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

// 봉투 위 받는분 이름의 색상 — 각 봉투 톤에 어울리는 saturated/coordinated tone
const ENVELOPE_NAME_COLOR: Record<EnvelopeColorId, string> = {
  pearl:     '#7A5A1F',  // gold cream → deep warm gold
  lavender:  '#5A3D7A',  // lavender → deep purple
  champagne: '#7A5E2E',  // beige → warm bronze
  sage:      '#3D5C3F',  // sage → deep forest green
  blush:     '#9C5040',  // rose-gold → deep terracotta
  rose:      '#9C2F5C',  // pink → deep berry rose
  powder:    '#2E5478',  // sky blue → deep ocean blue
  midnight:  '#F5EDD2',  // dark navy → cream/gold
  cobalt:    '#FBF7EC',  // dark blue → ivory cream
  aubergine: '#E0DAE6',  // dark purple → soft pearl
  onyx:      '#F0DC78',  // black → bright gold
  ivory:     '#A8862E',  // ivory white → warm gold
  gold:      '#5A4017'   // pure gold → deep bronze
};
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
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import RsvpForm from '@/app/i/[slug]/_components/RsvpForm';
import { getTheme } from '@/lib/theme';
import { TEMPLATES, getTemplate, findTemplateByPair, getTemplatesFor, getTemplateLayouts } from '@/lib/templates';
import { buildSamplePreviewCard, SAMPLE_BY_EVENT } from '@/lib/templates/sampleData';
import { listSamplesByEventType, type SampleData } from '@/lib/actions/sampleData';
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
  /** admin이 DB에 저장한 이벤트별 제외된 템플릿 (event_id → template_id[]) */
  eventExcludes?: Record<string, string[]>;
}

export default function SinglePageWizard({ skipRehydrate, initialOpen, templateConfigs, eventOrders, eventExcludes }: SinglePageWizardProps = {}) {
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
  // 번호 클릭 시 해당 필드 깜빡임 표시
  const [flashFieldNo, setFlashFieldNo] = useState<number | null>(null);
  // 카드 미리보기 컨테이너 ref + 측정된 필드 위치 (DOM 기반 자동 정렬)
  const previewWrapRef = useRef<HTMLDivElement | null>(null);
  const [measuredPos, setMeasuredPos] = useState<Map<string, { top: number; left: number; height: number }>>(new Map());
  // 카드 내 data-field-key 요소들의 위치를 측정 (top/left/height — % 단위)
  useLayoutEffect(() => {
    const wrap = previewWrapRef.current;
    if (!wrap) return;
    // 카드의 실제 그려지는 inner container 찾기 (rounded-3xl 클래스 가진 div)
    const card = wrap.querySelector('.rounded-3xl, .rounded-2xl') as HTMLElement | null;
    const target = card || wrap;
    const rect = target.getBoundingClientRect();
    if (rect.height === 0) return;
    const newMap = new Map<string, { top: number; left: number; height: number }>();
    const els = target.querySelectorAll<HTMLElement>('[data-field-key]');
    els.forEach((el) => {
      const key = el.getAttribute('data-field-key');
      if (!key) return;
      const r = el.getBoundingClientRect();
      const topPct = ((r.top + r.height / 2) - rect.top) / rect.height * 100;
      const leftPct = (r.left - rect.left) / rect.width * 100;
      newMap.set(key, { top: topPct, left: Math.max(2, leftPct - 6), height: r.height / rect.height * 100 });
    });
    // 깊은 비교 — 동일하면 setState 안 함 (무한 루프 방지)
    let changed = newMap.size !== measuredPos.size;
    if (!changed) {
      for (const [k, v] of newMap) {
        const old = measuredPos.get(k);
        if (!old || Math.abs(old.top - v.top) > 0.5 || Math.abs(old.left - v.left) > 0.5) {
          changed = true; break;
        }
      }
    }
    if (changed) setMeasuredPos(newMap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });
  // Phone 편집 모달
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  // Place + Address 편집 모달
  const [placeModalOpen, setPlaceModalOpen] = useState(false);
  // Date + Time 편집 모달
  const [dateTimeModalOpen, setDateTimeModalOpen] = useState(false);
  // Extra info 편집 모달
  const [extraInfoModalOpen, setExtraInfoModalOpen] = useState(false);
  // Text 편집 모달 (Subtitle/Title/Message/Host 등 텍스트 단일 필드)
  const [textEditField, setTextEditField] = useState<{ key: 'greeting_oneliner' | 'title' | 'body' | 'contact_name' | 'event_label'; label: string; multiline: boolean } | null>(null);
  // Sample picker (이벤트별 DB sample 다중 선택)
  const [availableSamples, setAvailableSamples] = useState<SampleData[]>([]);
  const [samplePickerOpen, setSamplePickerOpen] = useState(false);
  // 자동 채우기는 한 번만 — 같은 event_type에 대해 반복 prompt 방지
  const sampleAutoFilledFor = useRef<string | null>(null);
  // 사용자가 Next 버튼으로 실제로 진행한 최대 단계 — 시각적 완료 표시용
  // edit 모드(initialOpen 지정됨)는 모든 단계를 이미 통과한 것으로 시작 — tick 표시
  const [maxStepCompleted, setMaxStepCompleted] = useState<number>(
    initialOpen ? 3 : 0
  );
  const [pending, startTransition] = useTransition();
  // Section 3 Preview는 봉투부터 보여줌 — 사용자가 봉투를 클릭해서 카드를 펼치도록
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
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
      // 저장 후 다음 단계로 자동 이동 (Send 단계는 이미 마지막이라 그대로 유지)
      if (open < 4) {
        const next = (open + 1) as SectionId;
        setOpen(next);
        setMaxStepCompleted((m) => Math.max(m, open));
      }
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
    if ((draft.rsvp_max_per_card || 1) === 1 && draft.rsvp_collect_names) {
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
      setOpen(1);
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
    if (id === 2) {
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
  // step 4(Send)는 카드가 발행된 상태(publishedSlug)이거나 edit 모드일 때만 활성화
  const isEnabled = (id: SectionId): boolean => {
    if (id === 4) return !!publishedSlug;
    for (let i = 1 as SectionId; i < id; i = (i + 1) as SectionId) {
      if (i === 3) continue; // step 3는 publish action — done 여부로 판단 안 함
      if (!isDone(i)) return false;
    }
    return true;
  };

  const advance = (next: SectionId) => {
    // step 1 → step 2: 비로그인 사용자 로그인 유도
    // 입력값은 wizardStore(localStorage)에 보존되어 로그인 후 복원됨
    if (next === 2 && !isEditMode && sessionStatus === 'unauthenticated') {
      toast.message('Please sign in to continue');
      signIn('google', { callbackUrl: '/cards/new' });
      return;
    }
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

  // 섹션 3 진입 시 sample data 자동 채우기 — DB에서 이벤트별 samples 로드
  // - 1개면 자동 채우기, 2개 이상이면 picker 모달 띄움 (사용자 선택)
  // - event_type이 바뀌었거나, 이전 fill 기록이 다르면 새로 prompt
  // - 단, edit 모드(기존 카드 수정)는 항상 skip
  useEffect(() => {
    if (open !== 2) return;
    if (isEditMode) return;
    if (!draft.event_type) return;
    if (sampleAutoFilledFor.current === draft.event_type) return;
    sampleAutoFilledFor.current = draft.event_type;

    listSamplesByEventType(draft.event_type).then((samples) => {
      if (!samples || samples.length === 0) {
        // DB에 samples 없으면 폴백: SAMPLE_BY_EVENT 하드코딩 사용
        const sample = SAMPLE_BY_EVENT[draft.event_type as string] || SAMPLE_BY_EVENT.etc;
        setDraft({
          title: sample.title || meta.fields.titlePlaceholder,
          greeting_oneliner: sample.greeting_oneliner ?? null,
          body: sample.body || meta.fields.bodyPlaceholder,
          event_place: sample.event_place ?? null,
          contact_name: sample.contact_name ?? null,
          contact_phone: sample.contact_phone ?? null,
          extra_info: sample.extra_info ?? null,
          theme: meta.recommendTheme as any
        });
        return;
      }
      setAvailableSamples(samples);
      // 첫 sample 자동 적용 (modal popup 안 띄움 — 상단 toggle로 변경 가능)
      applySample(samples[0]);
    }).catch((e) => {
      console.error('[SampleData] load failed:', e);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, draft.event_type]);

  // sample 하나를 draft에 적용
  const applySample = (s: SampleData) => {
    setDraft({
      title: s.title || '',
      greeting_oneliner: s.greeting_oneliner,
      body: s.body || '',
      event_place: s.event_place,
      map_url: s.map_url,
      contact_name: s.contact_name,
      contact_phone: s.contact_phone,
      extra_info: s.extra_info,
      theme: meta.recommendTheme as any
    });
  };

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
        // Edit 모드: 발행된 카드이므로 step 4(초대장 보내기)로 진행
        setPublishedSlug(editingSlug);
        setOpen(4);
        setMaxStepCompleted((m) => Math.max(m, 3));
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
      // Step 4(초대장 보내기)로 진행 — 발행된 카드의 recipient 등록/이메일 발송
      setOpen(4);
      setMaxStepCompleted((m) => Math.max(m, 3));
    });
  };

  // 요약 라벨
  // 새 (type, color) 형식 우선 — palette label 사용. 'none'/legacy는 ENVELOPE_ANIMS fallback
  const envParsed = parseEnvelopeAnim(draft.envelope_anim);
  const envName = (() => {
    if (envParsed.type === 'none') return 'None';
    const palette = COLOR_PALETTES[envParsed.color];
    const animLabel = envParsed.type === 'flip' ? 'Flip' : 'Sway';
    return palette ? `${palette.label} · ${animLabel}` : (ENVELOPE_ANIMS.find((e) => e.id === draft.envelope_anim)?.name || '-');
  })();
  const tplMeta = findTemplateByPair(draft.bg_id, draft.layout_id);
  const tplName = tplMeta?.name || bgMeta.name;
  const summaries = {
    1: `${meta.label} · ${tplName}`,
    2: draft.title || '',
    3: envName,
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
    1: 'Design',
    2: 'Details',
    3: 'Preview',
    4: 'Send'
  };

  return (
    <PageContainer noPadding>
      <MobileHeader title={isEditMode ? 'Edit Invitation' : t('headerTitle')} back />

      {/* 상단 단계 표시 (sticky) — 작은 점/숫자 + 가는 connector. 현재 단계 라벨은 아래 SectionShell에 노출 */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-hydrangea-100/70 px-4 py-3">
        <div className="flex items-start justify-center gap-0">
          {([1, 2, 3, 4] as SectionId[]).map((id, idx) => {
            const active = open === id;
            const enabled = isEnabled(id);
            // 완료 표시: 사용자가 진행한 step(maxStepCompleted) 또는 isDone(현재 데이터로 충족)
            const completed = !active && (id <= maxStepCompleted || (id !== 3 && id !== 4 && isDone(id)));
            return (
              <Fragment key={id}>
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => enabled && setOpen(id)}
                    disabled={!enabled}
                    title={!enabled ? '이전 단계를 먼저 완료하세요' : SECTION_LABELS[id]}
                    className={`relative w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition active:scale-95 disabled:cursor-not-allowed ${
                      active
                        ? 'bg-hydrangea-500 text-white shadow ring-2 ring-hydrangea-200'
                        : completed
                          ? 'bg-white text-hydrangea-600 border border-hydrangea-400'
                          : enabled
                            ? 'bg-white text-hydrangea-500 border border-hydrangea-300'
                            : 'bg-white text-hydrangea-300 border border-hydrangea-100 opacity-60'
                    }`}
                  >
                    <span>{id}</span>
                    {completed && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-hydrangea-500 border border-white flex items-center justify-center shadow-sm">
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => enabled && setOpen(id)}
                    disabled={!enabled}
                    className={`mt-1 text-[10px] font-medium tracking-tight transition disabled:cursor-not-allowed ${
                      active
                        ? 'text-hydrangea-700 font-semibold'
                        : enabled
                          ? 'text-hydrangea-500'
                          : 'text-hydrangea-300'
                    }`}
                  >
                    {SECTION_LABELS[id]}
                  </button>
                </div>
                {idx < 3 && (
                  <span
                    aria-hidden="true"
                    className="flex-1 max-w-12 h-px mx-1 mt-3.5 bg-hydrangea-200"
                  />
                )}
              </Fragment>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 pb-24">
        {/* 1. 이벤트 선택 */}
        <SectionShell
          id={1}
          title="Design"
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
            const excludedSet = new Set(eventExcludes?.[activeEvent] || []);
            const baseTpls = TEMPLATES.filter((t) =>
              t.recommendEvents.includes(activeEvent) &&
              !excludedSet.has(t.id) &&
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
                            className={`relative aspect-[3/4] rounded-lg border-[3px] overflow-hidden transition ${
                              selected
                                ? 'border-hydrangea-500 ring-4 ring-hydrangea-300 shadow-lg scale-[1.03]'
                                : 'border-hydrangea-100/60'
                            }`}
                          >
                            {bg.imageUrl ? (
                              <img src={bg.imageUrl} alt={t.name} className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                              <div className="absolute inset-0" style={{ background: bg.gradient }} />
                            )}
                            {selected && (
                              <div className="absolute inset-0 bg-hydrangea-500/20 pointer-events-none" />
                            )}
                            <div className={`absolute bottom-0 left-0 right-0 text-white text-[8px] py-0.5 text-center truncate px-0.5 ${
                              selected ? 'bg-hydrangea-600 font-bold' : 'bg-black/45'
                            }`}>
                              {selected ? `✓ ${t.name}` : t.name}
                            </div>
                            {selected && (
                              <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-hydrangea-500 flex items-center justify-center shadow-md ring-2 ring-white">
                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
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

        {/* 2. 정보 입력 + RSVP */}
        <SectionShell
          id={2}
          title="Details"
          summary={summaries[2]}
          open={open === 2}
          done={isDone(2) && open !== 2}
          enabled={isEnabled(2)}
          onToggle={() => setOpen(2)}
          headerAction={isEditMode
            ? { label: 'SAVE', onClick: handlePublish, disabled: pending }
            : { label: 'NEXT', onClick: () => advance(3), disabled: !detailsCanProceed }}
        >
          {(() => {
            // 가이드 색상 — 템플릿 메인 컬러(있으면) → 폴백 골드
            const tplCurrent = findTemplateByPair(draft.bg_id, draft.layout_id);
            const GUIDE = (tplCurrent?.colorMain) || '#C29545';
            // 현재 layout 좌표 시스템에 따라 분기
            //   absolute layout: layout.fields[key].x/y 사용 (정확한 위치)
            //   flow layout (classic 등): 좌표 없으므로 고정 vertical 분포 사용
            const curLayout = getLayout(draft.layout_id);
            const lf = curLayout.fields;
            const isFlow = curLayout.renderStyle === 'flow';
            // flow layout용 approximate 위치 (top-to-bottom 순서로 자연스럽게 분포)
            // Flow 레이아웃별 배지 위치 — 텍스트 라인에 맞춤
            const flowPosClassic: Record<string, { top: string; left: string }> = {
              greeting_oneliner: { top: '20%', left: '4%' },
              title: { top: '28%', left: '4%' },
              body: { top: '46%', left: '4%' },
              event_date: { top: '60%', left: '4%' },
              event_place: { top: '68%', left: '4%' },
              contact_name: { top: '82%', left: '4%' },
              contact_phone: { top: '88%', left: '4%' },
              extra_info: { top: '92%', left: '4%' },
              rsvp_section: { top: '97%', left: '4%' }
            };
            // Compact (layout-4) — body/date/place 위치를 위로 올림
            const flowPosCompact: Record<string, { top: string; left: string }> = {
              greeting_oneliner: { top: '18%', left: '4%' },
              title: { top: '26%', left: '4%' },
              body: { top: '38%', left: '4%' },
              event_date: { top: '54%', left: '4%' },
              event_place: { top: '63%', left: '4%' },
              contact_name: { top: '78%', left: '4%' },
              contact_phone: { top: '84%', left: '4%' },
              extra_info: { top: '90%', left: '4%' },
              rsvp_section: { top: '96%', left: '4%' }
            };
            const flowPos = curLayout.id === 'layout-4' ? flowPosCompact : flowPosClassic;
            // 큰 폰트 필드(title 등)는 텍스트가 field.y 아래로 길게 그려져서 배지가 텍스트 위로 떠 보임 — yOffset으로 보정
            const mapToField: Array<{ key: keyof typeof draft | 'event_time_only' | 'rsvp_section'; label: string; field?: { x: number; y: number; align?: string; w?: number; fontSize?: number }; yOffset?: number }> = [
              { key: 'greeting_oneliner', label: 'Subtitle', field: lf.subtitle as any },
              { key: 'title', label: 'Title', field: lf.title as any, yOffset: 4 },
              { key: 'body', label: 'Message', field: lf.body as any, yOffset: 4 },
              { key: 'event_date', label: 'Date & Time', field: lf.date as any },
              { key: 'event_place', label: 'Place', field: lf.place as any },
              { key: 'contact_name', label: 'Host', field: lf.place as any },
              { key: 'contact_phone', label: 'Phone', field: lf.place as any },
              { key: 'extra_info', label: 'Extra info', field: lf.extra as any },
              // RSVP는 enabled일 때만 노출
              ...(draft.rsvp_enabled
                ? [{ key: 'rsvp_section' as any, label: 'RSVP', field: (lf.extra || lf.place) as any }]
                : [])
            ];
            const seen = new Map<string, number>();
            const fieldsOrder = mapToField
              .map((m, idx) => {
                let pos: { top: string; left: string };
                // 1순위: DOM 측정 결과 사용 (자동 정렬, 컨텐츠에 따라 따라감)
                const measured = measuredPos.get(m.key as string);
                if (measured) {
                  pos = { top: `${measured.top}%`, left: `${measured.left}%` };
                } else
                if (isFlow) {
                  pos = flowPos[m.key as string];
                  if (!pos) return null;
                } else {
                  if (!m.field) return null;
                  // RSVP는 직전 항목(extra_info → place) 바로 아래에 배치
                  if (m.key === 'rsvp_section') {
                    const extraField = lf.extra as any;
                    const placeField = lf.place as any;
                    const refField = extraField || placeField;
                    const refY = refField ? refField.y + 8 : 90;
                    pos = { top: `${Math.min(refY, 95)}%`, left: '6%' };
                  } else {
                    const k = `${m.field.x}-${m.field.y}`;
                    const stackIdx = seen.get(k) || 0;
                    seen.set(k, stackIdx + 1);
                    // 텍스트가 center-align인 경우 → 컨테이너 안쪽 좌측에 배치 (실제 텍스트 옆)
                    // left-align인 경우 → 컨테이너 좌측 바깥
                    const fieldAny = m.field as any;
                    const isCentered = fieldAny.align === 'center';
                    const isWide = (fieldAny.w || 0) >= 70; // wide center 컨테이너는 텍스트가 가운데 모임
                    const leftPct = isCentered && isWide
                      ? Math.max(2, m.field.x + (m.field.w || 80) * 0.18)
                      : Math.max(2, m.field.x - 5);
                    pos = {
                      top: `${m.field.y + stackIdx * 4 + (m.yOffset || 0)}%`,
                      left: `${leftPct}%`
                    };
                  }
                }
                return { key: m.key as string, no: idx + 1, label: m.label, pos };
              })
              .filter(Boolean) as Array<{ key: string; no: number; label: string; pos: { top: string; left: string } }>;
            const isEmpty = (key: string) => {
              if (key === 'rsvp_section') return false; // RSVP는 항상 'filled' 취급 (next-empty 후보 제외)
              const v = (draft as any)[key];
              return !v || (typeof v === 'string' && !v.trim());
            };
            const nextEmptyNo = fieldsOrder.find((f) => isEmpty(f.key))?.no;
            return (
          <div className="space-y-4 mt-2">
            {/* Sample 선택 — 상단 토글로 최대 3개 노출. 클릭 시 해당 sample data로 draft 적용 */}
            {availableSamples.length > 0 && (() => {
              const samplesToShow = availableSamples.slice(0, 3);
              return (
                <div>
                  <h4 className="text-xs font-semibold text-hydrangea-700 mb-2">📝 Sample — 시작할 예시 선택</h4>
                  <div className="grid grid-cols-3 gap-1.5">
                    {samplesToShow.map((s) => {
                      const selected = draft.title === s.title && draft.body === s.body;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => applySample(s)}
                          className={`relative px-2 py-2 rounded-xl border text-center transition active:scale-95 ${
                            selected ? 'border-hydrangea-500 bg-hydrangea-50' : 'border-hydrangea-100/60 bg-white'
                          }`}
                        >
                          <div className="text-[10px] font-semibold text-hydrangea-700 truncate">{s.label}</div>
                          {selected && (
                            <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-hydrangea-500 flex items-center justify-center">
                              <Check className="w-2 h-2 text-white" strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Layout 선택 — 현재 템플릿이 허용하는 layout 목록에서 고르기 (tpl 없으면 draft.layout_id 단일 표시) */}
            {(() => {
              const tpl = findTemplateByPair(draft.bg_id, draft.layout_id) || TEMPLATES.find((t) => t.bg_id === draft.bg_id);
              const dbOverride = tpl ? templateConfigs?.[tpl.id] : undefined;
              let allowed: LayoutId[];
              if (dbOverride && dbOverride.length > 0) allowed = dbOverride as LayoutId[];
              else if (tpl) allowed = getTemplateLayouts(tpl);
              else if (draft.layout_id) allowed = [draft.layout_id as LayoutId];
              else allowed = ['layout-classic'] as LayoutId[];
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
              const layoutsToShow = allowed.slice(0, 3);
              return (
                <div>
                  <h4 className="text-xs font-semibold text-hydrangea-700 mb-2">📐 Layout — pick one</h4>
                  {/* 항상 grid-cols-3 — 1개여도 1/3 가로 차지 */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {layoutsToShow.map((lid) => {
                      const lay = getLayout(lid);
                      const selected = draft.layout_id === lid;
                      return (
                        <motion.button
                          key={lid}
                          onClick={() => setDraft({ layout_id: lid as LayoutId })}
                          whileTap={{ scale: 0.96 }}
                          className={`relative px-2 py-2 rounded-xl border text-center transition ${
                            selected ? 'border-hydrangea-500 bg-hydrangea-50' : 'border-hydrangea-100/60 bg-white'
                          }`}
                        >
                          <div className="text-xs font-semibold text-hydrangea-700 truncate">{lay.name}</div>
                          <div className="text-[10px] text-hydrangea-400 mt-0.5 truncate">
                            {SHORT_DESC[lid] || ''}
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

            {/* 입력/수정 가이드 — 모드에 따라 문구 다르게 (Create=입력만, Edit=수정 가능) */}
            <div className="rounded-xl bg-hydrangea-50 border border-hydrangea-200 px-4 py-3">
              <div className="flex items-start gap-2">
                <span className="text-base flex-shrink-0">✨</span>
                <div className="text-[12px] text-hydrangea-700 leading-relaxed">
                  아래 템플릿 위의 <span className="font-semibold">텍스트를 수정</span>해서 나만의 초청장을 만들어보세요. <span className="font-semibold">동그라미 번호</span>를 클릭하면 해당 항목의 위치를 확인할 수 있고, <span className="font-semibold">텍스트를 클릭</span>하여 내용 {isEditMode ? '수정' : '변경'}할 수 있습니다.
                </div>
              </div>
            </div>
            {/* 선택한 템플릿 미리보기 + 번호 가이드 오버레이 (카드 내부 좌표계 사용) */}
            <div ref={previewWrapRef} className="rounded-2xl overflow-hidden border border-hydrangea-100">
              <TemplateCard
                card={previewCard}
                recipientName="John"
                rsvpSlot={draft.rsvp_enabled ? (() => {
                  const isRsvpHighlighted = fieldsOrder.find((f) => f.no === flashFieldNo)?.key === 'rsvp_section';
                  return (
                    <div
                      style={{
                        pointerEvents: 'none',
                        opacity: 0.95,
                        padding: isRsvpHighlighted ? '6px' : 0,
                        border: isRsvpHighlighted ? '2px dashed rgba(123,94,167,0.55)' : '2px dashed transparent',
                        background: isRsvpHighlighted ? 'rgba(123,94,167,0.06)' : 'transparent',
                        borderRadius: 12,
                        transition: 'all 0.15s'
                      }}
                      aria-disabled
                    >
                      <RsvpForm card={previewCard} theme={getTheme(previewCard.theme)} compact />
                    </div>
                  );
                })() : null}
                editable
                highlightedField={flashFieldNo ? (fieldsOrder.find((f) => f.no === flashFieldNo)?.key as string) : null}
                onFieldEdit={(key, value) => {
                  if (key === 'event_date') {
                    const iso = value || null;
                    setDraft({ event_date: iso, rsvp_deadline: iso, expiry_date: iso });
                    return;
                  }
                  setDraft({ [key]: value } as any);
                }}
                onFieldClick={(key) => {
                  // 텍스트 클릭 시 해당 필드의 모달 열기
                  if (key === 'event_date') {
                    setDateTimeModalOpen(true);
                    return;
                  }
                  if (key === 'contact_phone') {
                    setPhoneModalOpen(true);
                    return;
                  }
                  if (key === 'event_place') {
                    setPlaceModalOpen(true);
                    return;
                  }
                  if (key === 'extra_info') {
                    setExtraInfoModalOpen(true);
                    return;
                  }
                  if (key === 'greeting_oneliner' || key === 'title' || key === 'body' || key === 'contact_name' || key === 'event_label') {
                    const labelMap: Record<string, string> = {
                      greeting_oneliner: 'Subtitle', title: 'Title', body: 'Message',
                      contact_name: 'Host', event_label: 'Event label'
                    };
                    setTextEditField({
                      key: key as any,
                      label: labelMap[key] || key,
                      multiline: key === 'body' || key === 'title'
                    });
                  }
                }}
                guideOverlay={
                  <div className="absolute inset-0" style={{ zIndex: 50, pointerEvents: 'none' }}>
                    {/* 위치 기반 highlight 박스 제거 — 대신 Editable 컴포넌트가 highlightedField에 따라 텍스트 정확한 영역에 dashed 박스 표시 */}
                    {fieldsOrder.map((fld) => {
                      const active = nextEmptyNo === fld.no;
                      const isFlashing = flashFieldNo === fld.no;
                      return (
                        <div
                          key={fld.no}
                          className="absolute"
                          style={{ top: fld.pos.top, left: fld.pos.left, transform: 'translateY(-50%)', pointerEvents: 'auto' }}
                        >
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                // 번호 배지 클릭 = 해당 텍스트 영역 highlight (모달 X)
                                setFlashFieldNo((cur) => (cur === fld.no ? null : fld.no));
                                // RSVP만 예외 — 폼 RSVP 영역으로 스크롤
                                if (fld.key === 'rsvp_section') {
                                  const el = document.getElementById('dearday-rsvp-section');
                                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                              }}
                              style={{
                                background: (active || isFlashing) ? GUIDE : 'rgba(255,255,255,0.95)',
                                color: (active || isFlashing) ? '#FFFFFF' : GUIDE,
                                borderColor: GUIDE
                              }}
                              className={`flex items-center rounded-full border-2 shadow-md cursor-pointer transition active:scale-95 ${(active || isFlashing) ? 'animate-pulse' : ''}`}
                              title={`${fld.label}`}
                            >
                              {/* 번호 + 라벨이 하나의 pill로 결합. flashing/active 시 라벨까지 노출 */}
                              <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{fld.no}</span>
                              {(isFlashing || active) && (
                                <span className="text-[10px] font-semibold pr-2 pl-0.5 whitespace-nowrap">{fld.label}</span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                }
              />
            </div>

            <div id="dearday-rsvp-section" className="pt-3 border-t border-hydrangea-100/60 scroll-mt-24">
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
                          const cur = (draft.rsvp_max_per_card || 1) as number;
                          setDraft({ rsvp_max_per_card: Math.max(1, cur - 1) as 1 | 2 | 3 | 4 | 5 });
                        }} className="w-7 h-7 rounded-full bg-hydrangea-100 flex items-center justify-center">
                          <Minus className="w-3.5 h-3.5 text-hydrangea-700" />
                        </button>
                        <span className="font-bold text-hydrangea-700 w-5 text-center">{draft.rsvp_max_per_card || 1}</span>
                        <button type="button" onClick={() => {
                          const cur = (draft.rsvp_max_per_card || 1) as number;
                          setDraft({ rsvp_max_per_card: Math.min(5, cur + 1) as 1 | 2 | 3 | 4 | 5 });
                        }} className="w-7 h-7 rounded-full bg-hydrangea-100 flex items-center justify-center">
                          <Plus className="w-3.5 h-3.5 text-hydrangea-700" />
                        </button>
                      </div>
                    </div>
                    {(draft.rsvp_max_per_card || 1) > 1 && (
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
                        <Input label="RSVP deadline" type="datetime-local"
                          hint={maxStr ? 'Must be before the event start time. 이 날짜 후에는 카드를 받은 사용자가 RSVP를 할 수 없습니다.' : undefined}
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

            <Button onClick={() => advance(3)} disabled={!detailsCanProceed} full size="md">
              Next
            </Button>
            {!detailsCanProceed && (
              <p className="text-xs text-hydrangea-400 text-center">All fields marked with * are required</p>
            )}
          </div>
            );
          })()}
        </SectionShell>

        {/* 3. 미리보기 + 봉투 옵션 + 발행 */}
        <SectionShell
          id={3}
          title="Preview"
          summary={summaries[3]}
          open={open === 3}
          done={!!publishedSlug}
          enabled={isEnabled(3)}
          onToggle={() => setOpen(3)}
          headerAction={isEditMode
            ? { label: 'SAVE', onClick: handlePublish, disabled: pending }
            : { label: 'PUBLISH', onClick: handlePublish, disabled: pending }}
        >
          <div className="space-y-4 mt-2">
            {/* 봉투 → 클릭하면 초대장 카드 표시 (실제 동작 미리보기) */}
            {(() => {
              const parsedEnv = parseEnvelopeAnim(draft.envelope_anim);
              return (
                <div className="relative flex flex-col items-center py-6 bg-hydrangea-50/40 rounded-2xl">
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
                        {(() => {
                          const previewNameForEnv = 'Ms. Avery';
                          const tpl = (draft.recipient_template?.trim()) || '$NAME';
                          const greetingForEnv = tpl.replace(/\$NAME/g, previewNameForEnv);
                          return renderEnvelope(parsedEnv.type, parsedEnv.color, {
                          isOpen: envelopeOpening,
                          width: 280,
                          recipientGreeting: greetingForEnv,
                          cardPreview: (
                            <div style={{
                              width: '100%', height: '100%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              pointerEvents: 'none', overflow: 'hidden'
                            }}>
                              <div style={{
                                width: 420,
                                flexShrink: 0,
                                transform: 'rotate(90deg) scale(0.467, 0.543)',
                                transformOrigin: 'center'
                              }}>
                                <TemplateCard
                                  card={previewCard}
                                  recipientName="John"
                                  rsvpSlot={draft.rsvp_enabled ? (
                                    <RsvpForm card={previewCard} theme={getTheme(previewCard.theme)} compact />
                                  ) : null}
                                />
                              </div>
                            </div>
                          ),
                          children: (() => {
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
                          })()
                        });
                        })()}
                        {(() => {
                          // Sway만 외부 overlay 사용 (회전하지 않으므로). Flip은 envelope 내부에서 렌더되어 같이 회전.
                          if (parsedEnv.type !== 'sway') return null;
                          const previewName = 'Ms. Avery';
                          const tpl = (draft.recipient_template?.trim()) || '$NAME';
                          const greetingPreview = tpl.replace(/\$NAME/g, previewName);
                          const envColor = parsedEnv.color;
                          const isDark = ['midnight', 'cobalt', 'aubergine', 'onyx'].includes(envColor);
                          const inkColor = ENVELOPE_NAME_COLOR[envColor] || '#5A3D7A';
                          const envHeight = Math.round(280 * 0.75);
                          return (
                            <div style={{
                              position: 'absolute',
                              left: '50%',
                              top: `${envHeight}px`,
                              transform: 'translate(-50%, -50%)',
                              width: '85%',
                              textAlign: 'center',
                              color: inkColor,
                              fontFamily: "'Cormorant Garamond', 'Playfair Display', 'Noto Serif KR', serif",
                              fontSize: 18,
                              fontWeight: 500,
                              fontVariant: 'small-caps',
                              letterSpacing: '0.12em',
                              textShadow: isDark ? '0 1px 3px rgba(0,0,0,0.6)' : '0 1px 2px rgba(255,255,255,0.4)',
                              pointerEvents: 'none',
                              zIndex: 10
                            }}>
                              {greetingPreview}
                            </div>
                          );
                        })()}
                      </div>
                      {/* 애니메이션 선택 — 봉투 바로 아래에 한 줄 */}
                      {parsedEnv.type !== 'none' && (() => {
                        const ANIMS = [
                          { id: 'sway', label: 'Sway' },
                          { id: 'flip', label: 'Flip' }
                        ] as const;
                        return (
                          <div className="w-full mt-4 px-2 space-y-2">
                            <h4 className="text-xs font-semibold text-hydrangea-700">✉️ Envelope animation</h4>
                            <div className="grid grid-cols-2 gap-2 w-full">
                              {ANIMS.map((a) => {
                                const selected = parsedEnv.type === a.id;
                                return (
                                  <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => {
                                      const newId = buildEnvelopeAnim(a.id as EnvelopeAnimType, parsedEnv.color);
                                      setDraft({ envelope_anim: newId as EnvelopeAnimId });
                                    }}
                                    className={`w-full px-4 py-2 rounded-full text-sm font-semibold transition active:scale-95 ${
                                      selected
                                        ? 'bg-hydrangea-500 text-white border-2 border-hydrangea-500'
                                        : 'bg-white text-hydrangea-600 border-2 border-hydrangea-200 hover:border-hydrangea-300'
                                    }`}
                                  >
                                    {a.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    <div className="w-full px-2 relative">
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
                  {/* === SAMPLE / 다시보기 워터마크 — 미리보기 가운데 === */}
                  {parsedEnv.type !== 'none' && (
                    <button
                      type="button"
                      onClick={envelopeOpen ? () => {
                        setEnvelopeOpen(false);
                        setEnvelopeOpening(false);
                      } : undefined}
                      disabled={!envelopeOpen}
                      aria-label={envelopeOpen ? '다시 재생' : 'Sample preview'}
                      className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 rounded-full bg-white/30 backdrop-blur-md border border-white/40 text-hydrangea-700 flex flex-col items-center justify-center gap-0.5 shadow-lg transition opacity-60 ${
                        envelopeOpen
                          ? 'hover:bg-white/50 hover:opacity-100 active:scale-95 cursor-pointer'
                          : 'cursor-default pointer-events-none'
                      }`}
                    >
                      {envelopeOpen ? (
                        <>
                          <RotateCcw className="w-6 h-6" strokeWidth={2.5} />
                          <span className="text-[10px] font-semibold tracking-wide">다시보기</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[9px] font-bold tracking-widest uppercase">Sample</span>
                          <span className="text-[9px] font-semibold tracking-wide">preview</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })()}

            {/* === 봉투 옵션 (색상 + 애니메이션) === */}
            {(() => {
              const split = (body: string, accent: string) =>
                `linear-gradient(135deg, ${body} 0%, ${body} 50%, ${accent} 50%, ${accent} 100%)`;
              const COLORS = [
                { id: 'ivory',      label: 'Ivory White',            swatch: split('#F8F1DE', '#DCB748') },
                { id: 'gold',       label: 'Pure Gold',              swatch: split('#D9A93A', '#A8862E') },
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
              const current = parseEnvelopeAnim(draft.envelope_anim);
              const setTypeColor = (type: EnvelopeAnimType, color: EnvelopeColorId) => {
                const newId = buildEnvelopeAnim(type, color);
                setDraft({ envelope_anim: newId as EnvelopeAnimId });
                // 봉투가 바뀌면 다시 닫힌 상태로 보여줌 — 새 봉투 미리보기 확인용
                setEnvelopeOpen(false);
              };
              return (
                <div className="space-y-4 pt-2 border-t border-hydrangea-100/60">
                  <h4 className="text-xs font-semibold text-hydrangea-700">✉️ Envelope 색상</h4>
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
                </div>
              );
            })()}

            <div className="p-3 rounded-xl bg-hydrangea-50 text-xs space-y-1">
              <div className="flex items-center gap-2 font-semibold text-hydrangea-700 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Invitation summary
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

        {/* 4. 초대장 보내기 — 수신자 등록 + 이메일/링크 발송 */}
        <SectionShell
          id={4}
          title="Send Invitation"
          open={open === 4}
          done={false}
          enabled={isEnabled(4)}
          onToggle={() => setOpen(4)}
        >
          {publishedSlug ? (
            <SendStep slug={publishedSlug} ownerToken={publishedOwnerToken} />
          ) : (
            <div className="text-center py-8 text-sm text-hydrangea-400">
              먼저 3단계에서 초대장을 발행해 주세요.
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
        // 템플릿의 기본 layout(admin override 우선) + 사용자가 선택한 event_type 기준 sample data
        // (선택한 event가 없으면 템플릿의 첫 recommendEvents 사용)
        const sampleCard = buildSamplePreviewCard(tpl, draft.event_type as any, undefined, templateConfigs);
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
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewTpl(null)}
                  className="text-hydrangea-400 hover:text-hydrangea-700 text-2xl leading-none"
                  aria-label="Close"
                >×</button>
              </div>
              <div className="p-3 max-h-[70vh] overflow-y-auto bg-hydrangea-50/30">
                <TemplateCard card={sampleCard} recipientName="John" />
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
                    // admin DB override 우선 → 코드 default(getTemplateLayouts) → tpl.layout_id 순으로 fallback
                    const dbOverride = templateConfigs?.[tpl.id];
                    const allowed = (dbOverride && dbOverride.length > 0)
                      ? (dbOverride as LayoutId[])
                      : (getTemplateLayouts(tpl) as LayoutId[]);
                    const resolvedLayout = (allowed[0] || tpl.layout_id) as LayoutId;
                    setDraft({ bg_id: tpl.bg_id as BackgroundId, layout_id: resolvedLayout });
                    setPreviewTpl(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-hydrangea-500 text-white text-sm font-semibold hover:bg-hydrangea-600 transition"
                >Use this template</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Date + Time 편집 모달 — calendar(DayPicker) + time picker 통합 UX */}
      {dateTimeModalOpen && (() => {
        const today = new Date();
        const dt = draft.event_date ? new Date(draft.event_date) : null;
        const validDt = dt && !isNaN(dt.getTime()) ? dt : undefined;
        const timeStr = validDt
          ? `${String(validDt.getHours()).padStart(2,'0')}:${String(validDt.getMinutes()).padStart(2,'0')}`
          : '';
        const commit = (newDate: Date | undefined, newTime: string) => {
          if (!newDate) { setDraft({ event_date: null }); return; }
          const [h, m] = (newTime || '11:00').split(':').map(Number);
          const d = new Date(newDate);
          d.setHours(h || 0, m || 0, 0, 0);
          const iso = d.toISOString();
          setDraft({ event_date: iso, rsvp_deadline: iso, expiry_date: iso });
        };
        return (
          <div
            className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4"
            onClick={() => setDateTimeModalOpen(false)}
          >
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-4 py-3 flex items-center justify-between border-b border-hydrangea-100">
                <div className="text-sm font-semibold text-hydrangea-700">날짜 & 시간</div>
                <button type="button" onClick={() => setDateTimeModalOpen(false)}
                  className="text-hydrangea-400 hover:text-hydrangea-700 text-2xl leading-none" aria-label="Close">×</button>
              </div>
              <div className="px-2 pt-2 flex justify-center">
                <DayPicker
                  mode="single"
                  selected={validDt}
                  onSelect={(d) => commit(d, timeStr || '11:00')}
                  disabled={{ before: today }}
                  showOutsideDays
                  className="dearday-daypicker"
                  styles={{
                    caption: { color: '#5A3D7A', fontWeight: 600, padding: '4px 0 8px' },
                    head_cell: { color: '#A990CC', fontSize: 11, fontWeight: 600 },
                    day: { color: '#3A2E55' },
                    day_selected: { background: '#7B5EA7', color: '#fff', fontWeight: 700 },
                    day_today: { color: '#7B5EA7', fontWeight: 700 }
                  }}
                />
              </div>
              <div className="px-4 pb-3 pt-1">
                <label className="block text-xs font-medium text-hydrangea-700 mb-1.5">시간</label>
                <input
                  type="time"
                  step={300}
                  value={timeStr}
                  onChange={(e) => commit(validDt, e.target.value)}
                  className="w-full min-h-[48px] px-3 rounded-xl border border-hydrangea-200 bg-white text-hydrangea-700 text-base focus:outline-none focus:ring-2 focus:ring-hydrangea-300 [color-scheme:light]"
                  style={{ fontSize: '16px' }}
                />
                <p className="text-[11px] text-hydrangea-400 mt-2">RSVP 마감일과 만료일도 자동으로 동기화됩니다.</p>
              </div>
              <div className="p-3 flex border-t border-hydrangea-100">
                <button type="button" onClick={() => setDateTimeModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-hydrangea-500 text-white text-sm font-semibold hover:bg-hydrangea-600 transition"
                >완료</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Place + Address 편집 모달 — badge 6 클릭 시 열림 */}
      {placeModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4"
          onClick={() => setPlaceModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 flex items-center justify-between border-b border-hydrangea-100">
              <div className="text-sm font-semibold text-hydrangea-700">장소 입력</div>
              <button type="button" onClick={() => setPlaceModalOpen(false)}
                className="text-hydrangea-400 hover:text-hydrangea-700 text-2xl leading-none" aria-label="Close">×</button>
            </div>
            <div className="p-4 space-y-3">
              <Input
                label="Place name"
                placeholder="예: 우리집, Marina Hotel"
                value={draft.event_place || ''}
                onChange={(e) => setDraft({ event_place: e.target.value })}
              />
              <Input
                label="Address"
                placeholder="도로명 주소 또는 지도 링크"
                value={draft.map_url || ''}
                onChange={(e) => setDraft({ map_url: e.target.value })}
              />
              <p className="text-[11px] text-hydrangea-400 leading-relaxed">
                장소 이름과 주소(또는 Google Maps 링크)를 입력하세요. 주소는 카드에서 클릭 시 지도로 연결됩니다.
              </p>
            </div>
            <div className="p-3 flex border-t border-hydrangea-100">
              <button type="button" onClick={() => setPlaceModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-hydrangea-500 text-white text-sm font-semibold hover:bg-hydrangea-600 transition"
              >완료</button>
            </div>
          </div>
        </div>
      )}

      {/* 텍스트 편집 모달 — badge 1/2/3 (Subtitle/Title/Message) 클릭 시 열림 */}
      {textEditField && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4"
          onClick={() => setTextEditField(null)}
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 flex items-center justify-between border-b border-hydrangea-100">
              <div className="text-sm font-semibold text-hydrangea-700">{textEditField.label}</div>
              <button type="button" onClick={() => setTextEditField(null)}
                className="text-hydrangea-400 hover:text-hydrangea-700 text-2xl leading-none" aria-label="Close">×</button>
            </div>
            <div className="p-4 space-y-2">
              {textEditField.multiline ? (() => {
                // title은 max 80자 / 3줄, body는 max 200자 / 5줄
                const isTitle = textEditField.key === 'title';
                const maxLen = isTitle ? 80 : 200;
                const rows = isTitle ? 3 : 5;
                const ph = isTitle ? meta.fields.titlePlaceholder
                  : textEditField.key === 'body' ? meta.fields.bodyPlaceholder : '';
                return (
                  <>
                    <Textarea
                      label={textEditField.label}
                      placeholder={ph}
                      value={(draft[textEditField.key] as string) || ''}
                      onChange={(e) => setDraft({ [textEditField.key]: e.target.value.slice(0, maxLen) } as any)}
                      maxLength={maxLen}
                      rows={rows}
                    />
                    <p className="text-[11px] text-hydrangea-400 text-right tabular-nums">
                      {String(((draft[textEditField.key] as string) || '').length).padStart(3, '0')}/{maxLen}
                    </p>
                  </>
                );
              })() : (
                <Input
                  label={textEditField.label}
                  placeholder={textEditField.key === 'greeting_oneliner' ? meta.fields.subtitlePlaceholder
                    : textEditField.key === 'contact_name' ? '예: Jane Doe / 홍길동' : ''}
                  value={(draft[textEditField.key] as string) || ''}
                  onChange={(e) => setDraft({ [textEditField.key]: e.target.value } as any)}
                />
              )}
            </div>
            <div className="p-3 flex border-t border-hydrangea-100">
              <button type="button" onClick={() => setTextEditField(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-hydrangea-500 text-white text-sm font-semibold hover:bg-hydrangea-600 transition"
              >완료</button>
            </div>
          </div>
        </div>
      )}

      {/* Extra info 편집 모달 — badge 8 클릭 시 열림 */}
      {extraInfoModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4"
          onClick={() => setExtraInfoModalOpen(false)}
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 flex items-center justify-between border-b border-hydrangea-100">
              <div className="text-sm font-semibold text-hydrangea-700">추가 정보 입력</div>
              <button type="button" onClick={() => setExtraInfoModalOpen(false)}
                className="text-hydrangea-400 hover:text-hydrangea-700 text-2xl leading-none" aria-label="Close">×</button>
            </div>
            <div className="p-4 space-y-2">
              <Textarea
                label="Additional info (optional)"
                placeholder={meta.fields.memoPlaceholder}
                value={draft.extra_info || ''}
                onChange={(e) => setDraft({ extra_info: e.target.value })}
                rows={4}
              />
              <p className="text-[11px] text-hydrangea-400 leading-relaxed">
                드레스 코드, 주차 안내, 특별 요청 등 카드 하단에 표시할 추가 안내사항을 입력하세요.
              </p>
            </div>
            <div className="p-3 flex border-t border-hydrangea-100">
              <button type="button" onClick={() => setExtraInfoModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-hydrangea-500 text-white text-sm font-semibold hover:bg-hydrangea-600 transition"
              >완료</button>
            </div>
          </div>
        </div>
      )}

      {/* Phone 편집 모달 — badge 7 클릭 시 열림 */}
      {phoneModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4"
          onClick={() => setPhoneModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 flex items-center justify-between border-b border-hydrangea-100">
              <div className="text-sm font-semibold text-hydrangea-700">전화번호 입력</div>
              <button type="button" onClick={() => setPhoneModalOpen(false)}
                className="text-hydrangea-400 hover:text-hydrangea-700 text-2xl leading-none" aria-label="Close">×</button>
            </div>
            <div className="p-4">
              <PhoneInput
                value={draft.contact_phone || ''}
                onChange={(phone) => setDraft({ contact_phone: phone })}
              />
              <p className="text-[11px] text-hydrangea-400 mt-2 leading-relaxed">
                지역 번호를 선택하고 숫자를 입력하면 자동으로 <code className="bg-hydrangea-50 px-1 rounded">0000-0000</code> 형식으로 포맷됩니다.
              </p>
            </div>
            <div className="p-3 flex border-t border-hydrangea-100">
              <button type="button" onClick={() => setPhoneModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-hydrangea-500 text-white text-sm font-semibold hover:bg-hydrangea-600 transition"
              >완료</button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
