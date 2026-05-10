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
import { ImageUploader } from '@/components/domain/ImageUploader';
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
  ivory:     '#A8862E'   // ivory white → warm gold
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

type SectionId = 1 | 2 | 3;

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
  initialOpen?: 1 | 2 | 3;
  /** admin이 DB에 저장한 템플릿별 allowedLayouts override */
  templateConfigs?: Record<string, string[]>;
  /** admin이 DB에 저장한 이벤트별 템플릿 노출 순서 (event_id → template_id[]) */
  eventOrders?: Record<string, string[]>;
  /** admin이 DB에 저장한 이벤트별 제외된 템플릿 (event_id → template_id[]) */
  eventExcludes?: Record<string, string[]>;
  /** admin이 DB에 추가 포함시킨 (event_id → template_id[]) — 코드의 recommendEvents 외 */
  eventIncludes?: Record<string, string[]>;
  /** DB가 source of truth인 모든 이벤트 (default + 커스텀) — 없으면 코드 EVENT_TYPES fallback */
  allEvents?: Array<{ id: string; label: string; emoji: string; card_type?: 'invitation' | 'thankcard' | 'congrats' }>;
  /** admin이 DB에 저장한 템플릿별 색상 override (template_id → 5 colors) */
  templateColors?: Record<string, {
    color_main?: string | null;
    color_sub?: string | null;
    color_box_text?: string | null;
    box_bg_top?: string | null;
    box_bg_bottom?: string | null;
  }>;
}

export default function SinglePageWizard({ skipRehydrate, initialOpen, templateConfigs, eventOrders, eventExcludes, eventIncludes, templateColors, allEvents }: SinglePageWizardProps = {}) {
  // DB가 source of truth — 없으면(SSR 초기, 미로드 등) 코드 EVENT_TYPES fallback
  const ALL_EVENT_TYPES = (allEvents && allEvents.length > 0)
    ? allEvents
    : EVENT_TYPES.map((e) => ({ id: e.id as string, label: e.label, emoji: e.emoji, card_type: 'invitation' as const }));
  const router = useRouter();
  const params = useSearchParams();
  const { status: sessionStatus } = useSession();
  const t = useTranslations('Wizard');
  const tEvent = useTranslations('EventTypes');
  const tCommon = useTranslations('Common');
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
    initialOpen ? 2 : 0
  );
  const [pending, startTransition] = useTransition();
  // thank_* 상단 원형 사진 업로드 — 카드 미리보기 클릭 시 file picker 트리거
  const thankPhotoInputRef = useRef<HTMLInputElement>(null);
  const handleThankPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const { compressImage } = await import('@/lib/image');
      const compressed = await compressImage(f, 'thankPhoto');
      const form = new FormData();
      form.append('file', compressed);
      form.append('kind', 'thankPhoto');
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || t('uploadError'));
      setDraft({ custom_bg_url: json.url });
      toast.success(t('uploadSuccess'));
    } catch (err: any) {
      toast.error(err.message || t('uploadingError'));
    }
  };
  const triggerThankPhotoUpload = () => thankPhotoInputRef.current?.click();
  // Section 3 Preview는 봉투부터 보여줌 — 사용자가 봉투를 클릭해서 카드를 펼치도록
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [envelopeOpening, setEnvelopeOpening] = useState(false);
  // 발행된 카드 정보 (Step 5 활성화용). edit 모드면 editingSlug + localStorage 토큰 사용
  const [publishedSlug, setPublishedSlug] = useState<string | null>(editingSlug || null);
  const [publishedOwnerToken, setPublishedOwnerToken] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);
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
      // 저장 후 다음 단계로 자동 이동 (Publish 단계가 마지막)
      if (open < 3) {
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
      // layout이 date/place 필드를 정의하지 않는 경우(thank-classic 등)는 검증 skip
      const layoutFields = getLayout(draft.layout_id).fields;
      const dateOk = !layoutFields.date || !!draft.event_date;
      const placeOk = !layoutFields.place || !!(draft.event_place && draft.event_place.trim());
      return !!(
        draft.title && draft.title.trim() &&
        dateOk &&
        placeOk &&
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

    // 현재 이벤트 카드 타입 — thank/congrats는 날짜·장소 없는 메시지 카드
    const evMetaForSample = (allEvents || []).find((e) => e.id === draft.event_type);
    const isMessageCard = evMetaForSample?.card_type === 'thankcard' || evMetaForSample?.card_type === 'congrats';

    listSamplesByEventType(draft.event_type).then((samples) => {
      if (!samples || samples.length === 0) {
        // DB에 samples 없으면 폴백: SAMPLE_BY_EVENT 하드코딩 사용
        const sample = SAMPLE_BY_EVENT[draft.event_type as string] || SAMPLE_BY_EVENT.etc;
        setDraft({
          title: sample.title || meta.fields.titlePlaceholder,
          greeting_oneliner: sample.greeting_oneliner ?? null,
          body: sample.body || meta.fields.bodyPlaceholder,
          event_date: isMessageCard ? null : (sample.event_date ?? null),
          event_place: isMessageCard ? null : (sample.event_place ?? null),
          map_url: isMessageCard ? null : null,
          contact_name: sample.contact_name ?? null,
          contact_phone: isMessageCard ? null : (sample.contact_phone ?? null),
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

  // sample 하나를 draft에 적용 (thank/congrats 카드는 날짜·장소·전화 비움)
  const applySample = (s: SampleData) => {
    const evMetaForApply = (allEvents || []).find((e) => e.id === draft.event_type);
    const isMessageCard = evMetaForApply?.card_type === 'thankcard' || evMetaForApply?.card_type === 'congrats';
    setDraft({
      title: s.title || '',
      greeting_oneliner: s.greeting_oneliner,
      body: s.body || '',
      event_date: isMessageCard ? null : (draft.event_date ?? null),
      event_place: isMessageCard ? null : s.event_place,
      map_url: isMessageCard ? null : s.map_url,
      contact_name: s.contact_name,
      contact_phone: isMessageCard ? null : s.contact_phone,
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

  // 현재 선택한 이벤트의 card_type (invitation/thankcard/congrats) — preview에 전달해 eventLabel 숨김
  const currentEventCardType: 'invitation' | 'thankcard' | 'congrats' = (() => {
    const meta = (allEvents || []).find((e) => e.id === draft.event_type);
    const ct = meta?.card_type;
    return ct === 'thankcard' || ct === 'congrats' ? ct : 'invitation';
  })();
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
      const targetSlug = (isEditMode && editingSlug) || publishedSlug;
      if (targetSlug) {
        const res = await updateCard(targetSlug, draft);
        if (!res.ok) { toast.error(res.error || 'Update failed'); return; }
        if (!publishedSlug) setPublishedSlug(targetSlug);
        // 성공 모달 1초 노출 후 My Invitations로 이동
        setPublishSuccess(true);
        setTimeout(() => router.push('/cards'), 1000);
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
      // 성공 모달 1초 노출 후 My Invitations로 이동
      setPublishSuccess(true);
      setTimeout(() => router.push('/cards'), 1000);
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
    3: envName
  };

  const detailsCanProceed = (() => {
    const recipientOk = draft.recipient_template === null
      || (typeof draft.recipient_template === 'string' && draft.recipient_template.trim().length > 0);
    const layoutFields = getLayout(draft.layout_id).fields;
    const dateOk = !layoutFields.date || !!draft.event_date;
    const placeOk = !layoutFields.place || !!(draft.event_place && draft.event_place.trim());
    return !!(
      draft.title && draft.title.trim() &&
      dateOk &&
      placeOk &&
      recipientOk &&
      draft.body && draft.body.trim()
    );
  })();

  const SECTION_LABELS: Record<SectionId, string> = {
    1: 'Design',
    2: 'Details',
    3: 'Publish'
  };

  return (
    <PageContainer noPadding>
      <MobileHeader title={isEditMode ? 'Edit Invitation' : t('headerTitle')} back />

      {/* thank_* 상단 사진 업로드용 hidden input — 카드 미리보기의 원형 placeholder 클릭으로 트리거 */}
      <input
        ref={thankPhotoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleThankPhotoSelect}
        className="hidden"
      />

      {/* 상단 단계 표시 (sticky) — 작은 점/숫자 + 가는 connector. 현재 단계 라벨은 아래 SectionShell에 노출 */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-hydrangea-100/70 px-4 py-3">
        <div className="flex items-start justify-center gap-0">
          {([1, 2, 3] as SectionId[]).map((id, idx) => {
            const active = open === id;
            const enabled = isEnabled(id);
            // 완료 표시: 사용자가 진행한 step(maxStepCompleted) 또는 isDone(현재 데이터로 충족)
            const completed = !active && (id <= maxStepCompleted || (id !== 3 && isDone(id)));
            return (
              <Fragment key={id}>
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => enabled && setOpen(id)}
                    disabled={!enabled}
                    title={!enabled ? t('stepLockedHint') : SECTION_LABELS[id]}
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
                {idx < 2 && (
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
            // 최종 노출 = (recommendEvents UNION include) MINUS exclude. draft 템플릿은 layout 등록된 것만
            const excludedSet = new Set(eventExcludes?.[activeEvent] || []);
            const includedSet = new Set(eventIncludes?.[activeEvent] || []);
            const baseTpls = TEMPLATES.filter((t) => {
              const codeOrIncluded = t.recommendEvents.includes(activeEvent) || includedSet.has(t.id);
              if (!codeOrIncluded) return false;
              if (excludedSet.has(t.id)) return false;
              if (t.draft && !(templateConfigs && templateConfigs[t.id] && templateConfigs[t.id].length > 0)) return false;
              return true;
            });
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
                {/* 이벤트 선택 — invitation / thankcard 두 그룹으로 분리 */}
                <h4 className="text-xs font-semibold text-hydrangea-700 mb-2 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" strokeWidth={2} /> Event</h4>
                {(() => {
                  const renderEventBtn = (e: typeof ALL_EVENT_TYPES[number]) => {
                    const selected = activeEvent === e.id;
                    const isCodeDefault = EVENT_TYPES.some((ce) => ce.id === e.id);
                    const displayLabel = isCodeDefault ? tEvent(e.id) : e.label;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => {
                          setEventType(e.id as EventType);
                          setDraft({ bg_id: undefined, layout_id: undefined } as any);
                        }}
                        className={`relative flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-lg transition min-w-0 ${
                          selected
                            ? 'bg-white text-hydrangea-700 border-2 border-hydrangea-500 font-semibold'
                            : 'bg-white text-hydrangea-700 border border-hydrangea-100 active:bg-hydrangea-50'
                        }`}
                      >
                        <span className="text-base leading-none">{e.emoji}</span>
                        <span className="text-[9px] font-medium tracking-tight truncate max-w-full">{displayLabel}</span>
                        {selected && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-hydrangea-500 border border-white flex items-center justify-center shadow-sm">
                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
                          </span>
                        )}
                      </button>
                    );
                  };
                  const invitationEvents = ALL_EVENT_TYPES.filter((e) => (e.card_type || 'invitation') === 'invitation');
                  const thankEvents = ALL_EVENT_TYPES.filter((e) => e.card_type === 'thankcard');
                  const congratsEvents = ALL_EVENT_TYPES.filter((e) => e.card_type === 'congrats');
                  return (
                    <div className="space-y-3">
                      <div>
                        <div className="text-[10px] font-semibold text-hydrangea-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <span>📅</span><span>Invitation</span>
                          <span className="text-[9px] text-hydrangea-400 font-normal normal-case tracking-normal">{t('withDate')}</span>
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                          {invitationEvents.map(renderEventBtn)}
                        </div>
                      </div>
                      {thankEvents.length > 0 && (
                        <div>
                          <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <span>💌</span><span>Thank Card</span>
                            <span className="text-[9px] text-hydrangea-400 font-normal normal-case tracking-normal">{t('thanks')}</span>
                          </div>
                          <div className="grid grid-cols-6 gap-1">
                            {thankEvents.map(renderEventBtn)}
                          </div>
                        </div>
                      )}
                      {congratsEvents.length > 0 && (
                        <div>
                          <div className="text-[10px] font-semibold text-pink-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <span>🎉</span><span>Congrats</span>
                            <span className="text-[9px] text-hydrangea-400 font-normal normal-case tracking-normal">{t('congratsLabel')}</span>
                          </div>
                          <div className="grid grid-cols-6 gap-1">
                            {congratsEvents.map(renderEventBtn)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 활성 이벤트의 템플릿 그리드 */}
                <div>
                  <h4 className="text-xs font-semibold text-hydrangea-700 mb-2">
                    🎨 Templates for {(ALL_EVENT_TYPES.find((e) => e.id === activeEvent)?.label) || 'Invitation'}
                  </h4>
                  {tpls.length === 0 ? (
                    <div className="text-center py-8 text-sm text-hydrangea-400">
                      {t('noTemplates')}
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-1.5">
                      {tpls.map((t) => {
                        const bg = getBackground(t.bg_id);
                        // 카드의 layout_id가 template의 default와 다를 수 있음 (allowed_layouts 중 다른 것 선택)
                        // → bg_id 일치만으로 동일 template 판정 (각 template의 bg_id는 고유)
                        const selected = draft.bg_id === t.bg_id;
                        return (
                          <motion.button
                            key={t.id}
                            onClick={() => setPreviewTpl(t)}
                            whileTap={{ scale: 0.96 }}
                            className={`relative rounded-lg border-[3px] overflow-hidden transition flex flex-col ${
                              selected
                                ? 'border-hydrangea-500 ring-4 ring-hydrangea-300 shadow-lg scale-[1.03]'
                                : 'border-hydrangea-100/60'
                            }`}
                          >
                            {/* 템플릿 이미지 — 3:4 비율 */}
                            <div className="relative w-full aspect-[3/4]">
                              {bg.imageUrl ? (
                                <img src={bg.imageUrl} alt={t.name} className="absolute inset-0 w-full h-full object-cover" />
                              ) : (
                                <div className="absolute inset-0" style={{ background: bg.gradient }} />
                              )}
                              {selected && (
                                <div className="absolute inset-0 bg-hydrangea-500/20 pointer-events-none" />
                              )}
                              {selected && (
                                <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-hydrangea-500 flex items-center justify-center shadow-md ring-2 ring-white">
                                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                </div>
                              )}
                            </div>
                            {/* 이미지 아래 — 4색 스와치 + 이름 */}
                            {(() => {
                              const ov = templateColors?.[t.id];
                              const swatches = [
                                ov?.color_main || t.colorMain,
                                ov?.color_sub || t.colorSub,
                                ov?.color_box_text || t.infoBox?.textColor,
                                ov?.box_bg_top
                              ];
                              return (
                                <div className="flex w-full" style={{ height: 8 }}>
                                  {swatches.map((c, i) => (
                                    <div
                                      key={i}
                                      className="flex-1"
                                      style={{ background: c || '#E5E7EB' }}
                                    />
                                  ))}
                                </div>
                              );
                            })()}
                            <div className={`text-[9px] py-0.5 text-center truncate px-0.5 ${
                              selected ? 'bg-hydrangea-600 text-white font-bold' : 'bg-hydrangea-50 text-hydrangea-700'
                            }`}>
                              {selected ? `✓ ${t.name}` : t.name}
                            </div>
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
            // thank_classic 등 날짜/장소 없는 레이아웃 또는 thank/congrats 카드는 Date·Place 배지 숨김
            const hasDate = !!lf.date && currentEventCardType === 'invitation';
            const hasPlace = !!lf.place && currentEventCardType === 'invitation';
            const mapToField: Array<{ key: keyof typeof draft | 'event_time_only' | 'rsvp_section'; label: string; field?: { x: number; y: number; align?: string; w?: number; fontSize?: number }; yOffset?: number }> = [
              { key: 'greeting_oneliner', label: 'Subtitle', field: lf.subtitle as any },
              { key: 'title', label: 'Title', field: lf.title as any, yOffset: 4 },
              { key: 'body', label: 'Message', field: lf.body as any, yOffset: 4 },
              ...(hasDate ? [{ key: 'event_date' as const, label: 'Date & Time', field: lf.date as any }] : []),
              ...(hasPlace ? [{ key: 'event_place' as const, label: 'Place', field: lf.place as any }] : []),
              { key: 'contact_name', label: currentEventCardType === 'invitation' ? 'Host' : 'From', field: (lf.place || lf.extra) as any },
              ...(currentEventCardType === 'invitation'
                ? [
                    { key: 'contact_phone' as const, label: 'Phone', field: (lf.place || lf.extra) as any },
                    { key: 'extra_info' as const, label: 'Extra info', field: lf.extra as any }
                  ]
                : []),
              // RSVP는 invitation + enabled일 때만 노출
              ...(draft.rsvp_enabled && currentEventCardType === 'invitation'
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
                  <h4 className="text-xs font-semibold text-hydrangea-700 mb-2">{t('sampleHeader')}</h4>
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
              // 이벤트 카드 타입 기반 layout 필터링:
              // - thankcard / congrats 이벤트 → 'thank_'로 시작하는 layout만 (둘 다 날짜/장소 없음)
              // - invitation 이벤트 → 'thank_' 외 layout만
              const evMeta = (allEvents || []).find((e) => e.id === draft.event_type);
              const eventCardType = (evMeta as any)?.card_type;
              const isMessageCard = eventCardType === 'thankcard' || eventCardType === 'congrats';
              if (isMessageCard) {
                allowed = allowed.filter((id) => id.startsWith('thank_'));
                if (allowed.length === 0) allowed = ['thank_classic'] as LayoutId[];
              } else {
                allowed = allowed.filter((id) => !id.startsWith('thank_'));
                if (allowed.length === 0) allowed = ['layout-classic'] as LayoutId[];
              }
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
                  {t.rich(isEditMode ? 'guideHintEdit' : 'guideHintCreate', {
                    bold: (chunks) => <span className="font-semibold">{chunks}</span>
                  })}
                </div>
              </div>
            </div>
            {/* 선택한 템플릿 미리보기 + 번호 가이드 오버레이 (카드 내부 좌표계 사용) */}
            <div ref={previewWrapRef} className="rounded-2xl overflow-hidden border border-hydrangea-100">
              <TemplateCard
                card={previewCard}
                recipientName="John"
                eventCardType={currentEventCardType}
                onPhotoClick={triggerThankPhotoUpload}
                rsvpSlot={(draft.rsvp_enabled && currentEventCardType === 'invitation') ? (() => {
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
                      contact_name: currentEventCardType === 'invitation' ? 'Host' : 'From', event_label: 'Event label'
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
                                // RSVP는 폼 영역으로 스크롤
                                if (fld.key === 'rsvp_section') {
                                  setFlashFieldNo((cur) => (cur === fld.no ? null : fld.no));
                                  const el = document.getElementById('dearday-rsvp-section');
                                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  return;
                                }
                                // 두 번 탭 패턴: 1번 → 라벨 펼침(highlight), 2번(같은 배지) → 입력 모달
                                const alreadyFlashing = flashFieldNo === fld.no;
                                if (!alreadyFlashing) {
                                  setFlashFieldNo(fld.no);
                                  return;
                                }
                                const k = fld.key;
                                if (k === 'event_date') { setDateTimeModalOpen(true); return; }
                                if (k === 'contact_phone') { setPhoneModalOpen(true); return; }
                                if (k === 'event_place') { setPlaceModalOpen(true); return; }
                                if (k === 'extra_info') { setExtraInfoModalOpen(true); return; }
                                if (k === 'greeting_oneliner' || k === 'title' || k === 'body' || k === 'contact_name') {
                                  const labelMap: Record<string, string> = {
                                    greeting_oneliner: 'Subtitle', title: 'Title', body: 'Message', contact_name: currentEventCardType === 'invitation' ? 'Host' : 'From'
                                  };
                                  setTextEditField({
                                    key: k as any,
                                    label: labelMap[k] || k,
                                    multiline: k === 'body' || k === 'title'
                                  });
                                  return;
                                }
                                // 그 외(event_label 등) — 두번째 탭이지만 모달 없는 경우 highlight 해제
                                setFlashFieldNo(null);
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

            {draft.layout_id?.startsWith('thank_') && (
              <div className="pt-3 border-t border-hydrangea-100/60">
                <h4 className="text-xs font-semibold text-hydrangea-700 mb-2">{t('topPhotoTitle')}</h4>
                <ImageUploader
                  kind="thankPhoto"
                  value={draft.custom_bg_url || undefined}
                  onChange={(url) => setDraft({ custom_bg_url: url })}
                  hint={t('topPhotoHint')}
                />
              </div>
            )}

            {currentEventCardType === 'invitation' && <div id="dearday-rsvp-section" className="pt-3 border-t border-hydrangea-100/60 scroll-mt-24">
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
                    {/* 응답 수정 허용 — 마감일 안에 attend↔decline 전환 가능 여부 */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-hydrangea-100/60">
                      <div>
                        <div className="text-sm text-hydrangea-700">{t('rsvpAllowChange')}</div>
                        <div className="text-[11px] text-hydrangea-400 mt-0.5 leading-snug">
                          {t('rsvpAllowChangeDesc')}
                        </div>
                      </div>
                      <button type="button" onClick={() => setDraft({ rsvp_allow_change: !(draft.rsvp_allow_change ?? true) })}
                        className={`relative w-11 h-6 rounded-full transition flex-shrink-0 ${(draft.rsvp_allow_change ?? true) ? 'bg-hydrangea-500' : 'bg-hydrangea-100'}`}>
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${(draft.rsvp_allow_change ?? true) ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
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
                          hint={maxStr ? t('rsvpDeadlineHint') : undefined}
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
            </div>}

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
          title="Publish"
          summary={summaries[3]}
          open={open === 3}
          done={!!publishedSlug}
          enabled={isEnabled(3)}
          onToggle={() => setOpen(3)}
          headerAction={(isEditMode || publishedSlug)
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
                          width: 252,
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
                                  eventCardType={currentEventCardType}
                                  rsvpSlot={(draft.rsvp_enabled && currentEventCardType === 'invitation') ? (
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
                          const envHeight = Math.round(252 * 0.75);
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
                      {/* 색상 팔레트 — 봉투 아래, animation 위. 6×2 grid, 절반 사이즈, 중앙 정렬 */}
                      {parsedEnv.type !== 'none' && (() => {
                        const split = (body: string, accent: string) =>
                          `linear-gradient(135deg, ${body} 0%, ${body} 50%, ${accent} 50%, ${accent} 100%)`;
                        const COLORS_TOP = [
                          { id: 'ivory',      label: 'Ivory White',     swatch: split('#F8F1DE', '#DCB748') },
                          { id: 'pearl',      label: 'Gold Cream',      swatch: split('#DCB748', '#F5F0E2') },
                          { id: 'lavender',   label: 'Lavender Silver', swatch: split('#C8B0E2', '#CABFCF') },
                          { id: 'champagne',  label: 'Beige Ivory',     swatch: split('#DACFB6', '#F5F0E2') },
                          { id: 'sage',       label: 'Sage Pearl',      swatch: split('#B0C5AC', '#E8E4D8') },
                          { id: 'blush',      label: 'Blush Rose Gold', swatch: split('#F2C0B3', '#C9907A') },
                          { id: 'rose',       label: 'Rose Petal',      swatch: split('#F4C5D2', '#F5EBD8') },
                          { id: 'powder',     label: 'Powder Silver',   swatch: split('#BFD7EA', '#C4CDD4') },
                          { id: 'midnight',   label: 'Midnight Gold',   swatch: split('#2D3D50', '#DCB748') },
                          { id: 'cobalt',     label: 'Cobalt Cream',    swatch: split('#2E4A8C', '#F5F0E2') },
                          { id: 'aubergine',  label: 'Aubergine Pearl', swatch: split('#3F2A4A', '#C0B6CC') },
                          { id: 'onyx',       label: 'Onyx Gold',       swatch: split('#2A2A2A', '#DCB748') }
                        ] as const;
                        return (
                          <div className="w-full mt-4 flex flex-col items-center">
                            <div className="grid grid-cols-6 gap-1.5" style={{ width: '50%', minWidth: 180, maxWidth: 240 }}>
                              {COLORS_TOP.map((c) => {
                                const selected = parsedEnv.color === c.id;
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      const newId = buildEnvelopeAnim(parsedEnv.type, c.id as EnvelopeColorId);
                                      setDraft({ envelope_anim: newId as EnvelopeAnimId });
                                      setEnvelopeOpen(false);
                                    }}
                                    title={c.label}
                                    className={`relative aspect-square rounded-md border transition active:scale-95 ${
                                      selected
                                        ? 'border-hydrangea-500 ring-2 ring-hydrangea-200'
                                        : 'border-hydrangea-100'
                                    }`}
                                    style={{ background: c.swatch }}
                                  >
                                    {selected && (
                                      <Check className="absolute top-0 right-0 w-2.5 h-2.5 text-white drop-shadow" strokeWidth={3} />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="text-[10px] text-hydrangea-400 mt-1 text-center">
                              {COLORS_TOP.find((c) => c.id === parsedEnv.color)?.label}
                            </div>
                          </div>
                        );
                      })()}
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
                            {/* 애니메이션 설명 — Sway/Flip 버튼 바로 아래 */}
                            <p className="text-[11px] text-hydrangea-500 text-center px-2 leading-snug">
                              {parsedEnv.type === 'flip' ? t('envFlipDesc') : t('envSwayDesc')}
                            </p>
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
                          eventCardType={currentEventCardType}
                          rsvpSlot={(draft.rsvp_enabled && currentEventCardType === 'invitation') ? (
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
                      aria-label={envelopeOpen ? t('replayAria') : 'Sample preview'}
                      className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 rounded-full bg-white/30 backdrop-blur-md border border-white/40 text-hydrangea-700 flex flex-col items-center justify-center gap-0.5 shadow-lg transition opacity-60 ${
                        envelopeOpen
                          ? 'hover:bg-white/50 hover:opacity-100 active:scale-95 cursor-pointer'
                          : 'cursor-default pointer-events-none'
                      }`}
                    >
                      {envelopeOpen ? (
                        <>
                          <RotateCcw className="w-6 h-6" strokeWidth={2.5} />
                          <span className="text-[10px] font-semibold tracking-wide">{t('replay')}</span>
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

            {/* (봉투 색상은 미리보기 위쪽 6×2 grid로 이동) */}

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
                ? ((isEditMode || publishedSlug) ? 'Saving...' : 'Publishing...')
                : (isEditMode || publishedSlug)
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
                <TemplateCard card={sampleCard} recipientName="John" eventCardType={currentEventCardType} />
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
                <div className="text-sm font-semibold text-hydrangea-700">{t('dateTimeTitle')}</div>
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
                <label className="block text-xs font-medium text-hydrangea-700 mb-1.5">{t('timeLabel')}</label>
                <input
                  type="time"
                  step={300}
                  value={timeStr}
                  onChange={(e) => commit(validDt, e.target.value)}
                  className="w-full min-h-[48px] px-3 rounded-xl border border-hydrangea-200 bg-white text-hydrangea-700 text-base focus:outline-none focus:ring-2 focus:ring-hydrangea-300 [color-scheme:light]"
                  style={{ fontSize: '16px' }}
                />
                <p className="text-[11px] text-hydrangea-400 mt-2">{t('dateTimeHint')}</p>
              </div>
              <div className="p-3 flex border-t border-hydrangea-100">
                <button type="button" onClick={() => setDateTimeModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-hydrangea-500 text-white text-sm font-semibold hover:bg-hydrangea-600 transition"
                >{tCommon('done')}</button>
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
              <div className="text-sm font-semibold text-hydrangea-700">{t('placeTitle')}</div>
              <button type="button" onClick={() => setPlaceModalOpen(false)}
                className="text-hydrangea-400 hover:text-hydrangea-700 text-2xl leading-none" aria-label="Close">×</button>
            </div>
            <div className="p-4 space-y-3">
              <Input
                label="Place name"
                placeholder={t('placeNamePlaceholder')}
                value={draft.event_place || ''}
                onChange={(e) => setDraft({ event_place: e.target.value })}
              />
              <Input
                label="Address"
                placeholder={t('addressPlaceholder')}
                value={draft.map_url || ''}
                onChange={(e) => setDraft({ map_url: e.target.value })}
              />
              <p className="text-[11px] text-hydrangea-400 leading-relaxed">
                {t('placeHint')}
              </p>
            </div>
            <div className="p-3 flex border-t border-hydrangea-100">
              <button type="button" onClick={() => setPlaceModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-hydrangea-500 text-white text-sm font-semibold hover:bg-hydrangea-600 transition"
              >{tCommon('done')}</button>
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
                    : textEditField.key === 'contact_name' ? t('contactNameExample') : ''}
                  value={(draft[textEditField.key] as string) || ''}
                  onChange={(e) => setDraft({ [textEditField.key]: e.target.value } as any)}
                />
              )}
            </div>
            <div className="p-3 flex border-t border-hydrangea-100">
              <button type="button" onClick={() => setTextEditField(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-hydrangea-500 text-white text-sm font-semibold hover:bg-hydrangea-600 transition"
              >{tCommon('done')}</button>
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
              <div className="text-sm font-semibold text-hydrangea-700">{t('extraInfoTitle')}</div>
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
                {t('extraInfoHint')}
              </p>
            </div>
            <div className="p-3 flex border-t border-hydrangea-100">
              <button type="button" onClick={() => setExtraInfoModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-hydrangea-500 text-white text-sm font-semibold hover:bg-hydrangea-600 transition"
              >{tCommon('done')}</button>
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
              <div className="text-sm font-semibold text-hydrangea-700">{t('phoneTitle')}</div>
              <button type="button" onClick={() => setPhoneModalOpen(false)}
                className="text-hydrangea-400 hover:text-hydrangea-700 text-2xl leading-none" aria-label="Close">×</button>
            </div>
            <div className="p-4">
              <PhoneInput
                value={draft.contact_phone || ''}
                onChange={(phone) => setDraft({ contact_phone: phone })}
              />
              <p className="text-[11px] text-hydrangea-400 mt-2 leading-relaxed">
                {t.rich('phoneHint', {
                  code: (chunks) => <code className="bg-hydrangea-50 px-1 rounded">{chunks}</code>
                })}
              </p>
            </div>
            <div className="p-3 flex border-t border-hydrangea-100">
              <button type="button" onClick={() => setPhoneModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-hydrangea-500 text-white text-sm font-semibold hover:bg-hydrangea-600 transition"
              >{tCommon('done')}</button>
            </div>
          </div>
        </div>
      )}

      {/* 발행 성공 모달 — 1초 후 My Invitations로 이동 */}
      {publishSuccess && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="bg-white rounded-2xl shadow-2xl px-8 py-7 text-center max-w-sm"
          >
            {/* 보라 그라디언트 링 + 흰 체크 — 세련된 success 마크 */}
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.05 }}
              className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #A990CC 0%, #7B5EA7 60%, #5A3D7A 100%)'
              }}
            >
              <motion.div
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.25 }}
              >
                <Check className="w-7 h-7 text-white" strokeWidth={3} />
              </motion.div>
            </motion.div>
            <div className="text-base font-bold text-hydrangea-700 mb-1 tracking-tight">
              {isEditMode || (publishedSlug && editingSlug !== publishedSlug) ? t('savedTitle') : t('publishedTitle')}
            </div>
            <div className="text-[11px] text-hydrangea-400">{t('redirectMyCards')}</div>
          </motion.div>
        </div>
      )}
    </PageContainer>
  );
}
