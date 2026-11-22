'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { RotateCcw, Save } from 'lucide-react';
import { saveTemplateTypography } from '@/lib/actions/templateConfig';
import { FONT_KEYS, FONT_LABELS, FONT_STACKS, isFontKey } from '@/lib/font-keys';
import { resolveRoleStyle, type FontWeight, type RoleStyle, type TemplateTypography, type TextRole } from '@/lib/typography';
import { TYPOGRAPHY_LIMITS } from '@/lib/typography-schema';
import { TYPOGRAPHY_SAMPLE_TITLES, type SampleTitleKey } from '@/lib/typography-samples';

export type { SampleTitleKey } from '@/lib/typography-samples';

interface Props {
  templateId: string;
  /** 템플릿 코드 기본값 — 빈 칸의 placeholder 로 보여 주기 위함 */
  codeDefaults?: TemplateTypography;
  /** DB 에 저장된 override */
  initial?: TemplateTypography | null;
  /** 입력 즉시 부모 미리보기에 반영 (저장 전) */
  onChange: (t: TemplateTypography | null) => void;
  onSaved?: (t: TemplateTypography | null) => void;
  sampleTitle: SampleTitleKey;
  onSampleTitleChange: (k: SampleTitleKey) => void;
}

const ROLES: Array<{ role: TextRole; label: string }> = [
  { role: 'eventLabel', label: '이벤트 라벨 (YOU’RE INVITED)' },
  { role: 'subtitle', label: '제목 위 한 줄' },
  { role: 'title', label: '제목' },
  { role: 'body', label: '본문' }
];

const WEIGHTS: FontWeight[] = [300, 400, 500, 600, 700];
const SAMPLE_LABELS: Record<SampleTitleKey, string> = { short: '짧은 제목', longLatin: '긴 영문', korean: '한글' };
const SPACING_STEP = 0.01;

/** 빈 값(undefined)인 속성을 지우고, 속성이 없는 역할도 지움 — "빈 칸 = 코드 기본값" 규칙을 지키기 위함 */
function compact(t: TemplateTypography): TemplateTypography | null {
  const out: TemplateTypography = {};
  for (const { role } of ROLES) {
    const s = t[role];
    if (!s) continue;
    const kept = Object.fromEntries(Object.entries(s).filter(([, v]) => v !== undefined && v !== '')) as RoleStyle;
    if (Object.keys(kept).length > 0) out[role] = kept;
  }
  return Object.keys(out).length > 0 ? out : null;
}

const toNum = (v: string): number | undefined => {
  if (!v.trim()) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * 관리자 '글꼴' 편집기 — 템플릿별 역할(라벨·부제·제목·본문) 글꼴·크기·자간·굵기·행간 override.
 * 빈 칸은 템플릿 코드 기본값을 따르며, 저장 시 발행된 카드에도 바로 반영된다.
 */
export default function TemplateTypographyEditor({
  templateId, codeDefaults, initial, onChange, onSaved, sampleTitle, onSampleTitleChange
}: Props) {
  const [typo, setTypo] = useState<TemplateTypography>(() => initial || {});
  const [pending, startTransition] = useTransition();

  const update = (role: TextRole, patch: Partial<RoleStyle>) => {
    const next = compact({ ...typo, [role]: { ...typo[role], ...patch } }) || {};
    setTypo(next);
    onChange(compact(next));
  };

  const resetRole = (role: TextRole) => {
    const next = { ...typo };
    delete next[role];
    setTypo(next);
    onChange(compact(next));
  };

  const save = () => {
    const payload = compact(typo);
    startTransition(async () => {
      const res = await saveTemplateTypography(templateId, payload);
      if (!res.ok) { toast.error(res.error || '저장 실패'); return; }
      toast.success('글꼴 저장됨');
      onSaved?.(payload);
    });
  };

  return (
    <div className="rounded-xl border border-hydrangea-200 bg-white p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-hydrangea-700">글꼴 override (DB)</h3>
        <span className="text-[11px] text-hydrangea-400">빈 칸 = 템플릿 기본값</span>
      </div>

      {/* 미리보기 테스트 문구 — 긴 제목·한글 제목에서 넘침이 없는지 바로 확인 */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="미리보기 제목">
        {(Object.keys(TYPOGRAPHY_SAMPLE_TITLES) as SampleTitleKey[]).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={sampleTitle === k}
            onClick={() => onSampleTitleChange(k)}
            className={`px-3 min-h-[32px] rounded-full text-[11px] font-medium border transition ${
              sampleTitle === k ? 'bg-hydrangea-600 text-white border-hydrangea-600' : 'bg-white text-hydrangea-600 border-hydrangea-200 hover:bg-hydrangea-50'
            }`}
          >
            {SAMPLE_LABELS[k]}
          </button>
        ))}
      </div>

      {ROLES.map(({ role, label }) => {
        const cur = typo[role] || {};
        // placeholder 용 — DB 값 없이 템플릿 기본값만 적용했을 때의 결과
        const def = resolveRoleStyle(role, { template: codeDefaults });
        const defFont = codeDefaults?.[role]?.font;
        return (
          <fieldset key={role} className="rounded-lg border border-hydrangea-100 p-2 space-y-2">
            <legend className="px-1 text-[11px] font-semibold text-hydrangea-700">{label}</legend>
            <div className="flex items-center gap-2">
              <select
                value={cur.font ?? ''}
                onChange={(e) => update(role, { font: isFontKey(e.target.value) ? e.target.value : undefined })}
                aria-label={`${label} 글꼴`}
                className="flex-1 min-w-0 px-2 py-1.5 rounded border border-hydrangea-200 text-xs text-hydrangea-700"
                style={{ fontFamily: cur.font ? FONT_STACKS[cur.font] : def.fontFamily }}
              >
                <option value="">기본값{defFont ? ` — ${FONT_LABELS[defFont]}` : ''}</option>
                {FONT_KEYS.map((k) => (
                  <option key={k} value={k} style={{ fontFamily: FONT_STACKS[k] }}>{FONT_LABELS[k]}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => resetRole(role)}
                title="이 항목을 템플릿 기본값으로"
                aria-label={`${label} 기본값으로`}
                className="p-1.5 rounded border border-hydrangea-200 text-hydrangea-500 hover:bg-hydrangea-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-[11px] text-hydrangea-600">
                크기(px)
                <input
                  type="number"
                  min={TYPOGRAPHY_LIMITS.size.min}
                  max={TYPOGRAPHY_LIMITS.size.max}
                  value={cur.size ?? ''}
                  placeholder={String(def.size)}
                  onChange={(e) => update(role, { size: toNum(e.target.value) })}
                  className="mt-0.5 w-full px-2 py-1 rounded border border-hydrangea-200 text-xs"
                />
              </label>
              <label className="text-[11px] text-hydrangea-600">
                굵기
                <select
                  value={cur.weight ?? ''}
                  onChange={(e) => update(role, { weight: e.target.value ? (Number(e.target.value) as FontWeight) : undefined })}
                  className="mt-0.5 w-full px-1 py-1 rounded border border-hydrangea-200 text-xs"
                >
                  <option value="">{def.weight}</option>
                  {WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </label>
              <label className="text-[11px] text-hydrangea-600">
                행간
                <input
                  type="number"
                  step={0.05}
                  min={TYPOGRAPHY_LIMITS.lineHeight.min}
                  max={TYPOGRAPHY_LIMITS.lineHeight.max}
                  value={cur.lineHeight ?? ''}
                  placeholder={String(def.lineHeight)}
                  onChange={(e) => update(role, { lineHeight: toNum(e.target.value) })}
                  className="mt-0.5 w-full px-2 py-1 rounded border border-hydrangea-200 text-xs"
                />
              </label>
            </div>
            <label className="block text-[11px] text-hydrangea-600">
              자간 {(cur.spacing ?? def.spacing).toFixed(2)}em{cur.spacing === undefined ? ' (기본값)' : ''}
              <input
                type="range"
                min={TYPOGRAPHY_LIMITS.spacing.min}
                max={TYPOGRAPHY_LIMITS.spacing.max}
                step={SPACING_STEP}
                value={cur.spacing ?? def.spacing}
                onChange={(e) => update(role, { spacing: Number(e.target.value) })}
                className="w-full accent-hydrangea-600"
              />
            </label>
          </fieldset>
        );
      })}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-hydrangea-600 text-white text-xs font-semibold hover:bg-hydrangea-700 active:scale-95 transition disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" /> 저장
        </button>
        {/* 발행된 카드도 템플릿 설정을 실시간으로 읽으므로 저장 전에 알림 */}
        <p className="text-[11px] text-amber-700">발행된 카드에도 바로 적용됩니다</p>
      </div>
    </div>
  );
}
