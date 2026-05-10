'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Save, RotateCcw } from 'lucide-react';
import { saveTemplateColors, type TemplateColors } from '@/lib/actions/templateConfig';

interface Props {
  templateId: string;
  /** 코드 default colors (override 미정의 시 fallback에 쓰일 값) */
  codeDefaults: {
    colorMain?: string;
    colorSub?: string;
    boxBg?: string;
    boxTextColor?: string;
  };
  /** DB에 이미 저장된 override (있으면 초기 값) */
  initial?: Partial<TemplateColors> | null;
  /** 저장 성공 시 부모에 변경된 색상 전달 → preview에 즉시 반영 */
  onSaved?: (colors: TemplateColors) => void;
}

// 글자색 그룹 — 2x2 그리드
const TEXT_FIELDS = [
  { key: 'color_main' as const,         label: '메인',     hint: '큰 제목·강조 텍스트' },
  { key: 'color_sub' as const,          label: '서브',     hint: '부제·본문·박스 밖' },
  { key: 'color_title_accent' as const, label: '포인트',   hint: '제목 위 ✽ 장식·라인' },
  { key: 'color_box_text' as const,     label: '박스 안',  hint: '반투명 박스 위 글씨' }
];
// 배경색 그룹 — 3x1 한 줄
const BG_FIELDS = [
  { key: 'box_bg_top' as const,        label: '박스 배경 1',     hint: '둘 다 입력 → 그라디언트 상단, 한쪽만 → 단색, 둘 다 비우면 투명' },
  { key: 'box_bg_bottom' as const,     label: '박스 배경 2',     hint: '그라디언트 하단' },
  { key: 'rsvp_button_color' as const, label: 'RSVP 버튼',       hint: 'Attend/Decline 배경·테두리' }
];
const FIELDS = [...TEXT_FIELDS, ...BG_FIELDS];

export default function TemplateColorEditor({ templateId, codeDefaults, initial, onSaved }: Props) {
  const [vals, setVals] = useState<Record<string, string>>({
    color_main: initial?.color_main || '',
    color_sub: initial?.color_sub || '',
    color_box_text: initial?.color_box_text || '',
    box_bg_top: initial?.box_bg_top || '',
    box_bg_bottom: initial?.box_bg_bottom || '',
    color_title_accent: initial?.color_title_accent || '',
    rsvp_button_color: initial?.rsvp_button_color || ''
  });
  const [pending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveTemplateColors(templateId, vals);
      if (!res.ok) { toast.error(res.error || '저장 실패'); return; }
      toast.success('색상 저장됨');
      // 부모에 변경 알림 → 미리보기 즉시 반영
      if (onSaved) {
        const norm = (v?: string) => (v && v.trim() ? v.trim() : null);
        onSaved({
          color_main: norm(vals.color_main),
          color_sub: norm(vals.color_sub),
          color_box_text: norm(vals.color_box_text),
          box_bg_top: norm(vals.box_bg_top),
          box_bg_bottom: norm(vals.box_bg_bottom),
          color_title_accent: norm(vals.color_title_accent),
          rsvp_button_color: norm(vals.rsvp_button_color)
        });
      }
    });
  };

  const handleReset = () => {
    if (!confirm('이 템플릿의 색상 override를 모두 지우고 코드 default로 복귀할까요?')) return;
    setVals({ color_main: '', color_sub: '', color_box_text: '', box_bg_top: '', box_bg_bottom: '', color_title_accent: '', rsvp_button_color: '' });
    startTransition(async () => {
      const res = await saveTemplateColors(templateId, {
        color_main: null, color_sub: null, color_box_text: null,
        box_bg_top: null, box_bg_bottom: null, color_title_accent: null, rsvp_button_color: null
      });
      if (!res.ok) { toast.error(res.error || '리셋 실패'); return; }
      toast.success('Reset 완료');
      if (onSaved) {
        onSaved({
          color_main: null, color_sub: null, color_box_text: null,
          box_bg_top: null, box_bg_bottom: null, color_title_accent: null, rsvp_button_color: null
        });
      }
    });
  };

  const isHexLike = (v: string) => /^#?[0-9a-fA-F]{3,8}$/.test(v.trim());
  // 반투명을 유지해야 하는 필드 — color picker(hex) 결과를 rgba로 변환해서 알파 보존
  const ALPHA_FIELDS = new Set(['box_bg_top', 'box_bg_bottom', 'rsvp_button_color']);
  const DEFAULT_ALPHA: Record<string, number> = { box_bg_top: 0.45, box_bg_bottom: 0.45, rsvp_button_color: 0.65 };
  // 현재 값에서 알파(0~1) 추출 — rgba면 그 값, hex면 #RRGGBBAA의 AA, 아니면 기본
  const extractAlpha = (v: string, fallback: number): number => {
    const t = v.trim();
    const rgba = t.match(/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*([\d.]+)\s*)?\)$/i);
    if (rgba) return rgba[1] !== undefined ? Math.max(0, Math.min(1, parseFloat(rgba[1]))) : 1;
    const hex8 = t.match(/^#?([0-9a-fA-F]{8})$/);
    if (hex8) return parseInt(hex8[1].slice(6, 8), 16) / 255;
    return fallback;
  };
  const hexToRgba = (hex: string, alpha: number): string => {
    const h = hex.replace('#', '');
    const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
    const r = parseInt(v.slice(0, 2), 16);
    const g = parseInt(v.slice(2, 4), 16);
    const b = parseInt(v.slice(4, 6), 16);
    const a = Math.round(alpha * 100) / 100;
    return `rgba(${r},${g},${b},${a})`;
  };
  // color picker 표시용 — 현재 값이 rgba/hex 무엇이든 RGB 부분만 hex로 환산
  const toPickerHex = (v: string): string => {
    if (!v) return '#ffffff';
    const t = v.trim();
    const rgba = t.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (rgba) {
      const r = (+rgba[1]).toString(16).padStart(2, '0');
      const g = (+rgba[2]).toString(16).padStart(2, '0');
      const b = (+rgba[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    if (isHexLike(t)) return t.startsWith('#') ? t.slice(0, 7) : `#${t.slice(0, 6)}`;
    return '#ffffff';
  };
  const handlePickerChange = (key: string, hex: string) => {
    if (ALPHA_FIELDS.has(key)) {
      const cur = vals[key];
      const alpha = extractAlpha(cur, DEFAULT_ALPHA[key] ?? 0.5);
      setVals((s) => ({ ...s, [key]: hexToRgba(hex, alpha) }));
    } else {
      setVals((s) => ({ ...s, [key]: hex }));
    }
  };
  const placeholderFor = (key: string): string => {
    if (key === 'color_main') return codeDefaults.colorMain || '#7B5EA7';
    if (key === 'color_sub') return codeDefaults.colorSub || '#FFFFFF';
    if (key === 'color_box_text') return codeDefaults.boxTextColor || '#1A1A1A';
    if (key === 'box_bg_top') return 'rgba(255,255,255,0.55)';
    if (key === 'box_bg_bottom') return 'rgba(255,255,255,0.40)';
    // RSVP 버튼 배경/테두리 default — colorSub(부제 톤) 권장, 없으면 라벤더 톤
    if (key === 'rsvp_button_color') return codeDefaults.colorSub || 'rgba(123,94,167,0.15)';
    return '';
  };

  return (
    <div className="rounded-xl border border-hydrangea-200 bg-white p-3 space-y-3 mt-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-hydrangea-700">🎨 색상 override (DB)</h4>
        <span className="text-[10px] text-hydrangea-400">빈 값 = 코드 default 사용</span>
      </div>

      {(() => {
        const renderCell = (f: { key: string; label: string; hint: string }) => {
          const v = vals[f.key];
          const ph = placeholderFor(f.key);
          return (
            <div key={f.key} className="rounded-lg border border-hydrangea-100 bg-hydrangea-50/40 px-2 py-1.5 flex items-center gap-2" title={f.hint}>
              <label className="text-[10px] font-semibold text-hydrangea-600 w-12 flex-shrink-0 truncate">
                {f.label}
              </label>
              <input
                type="color"
                value={toPickerHex(v)}
                onChange={(e) => handlePickerChange(f.key, e.target.value)}
                className="w-7 h-7 rounded cursor-pointer border border-hydrangea-200 flex-shrink-0"
                title={ALPHA_FIELDS.has(f.key) ? '색상 변경 (반투명 유지)' : 'hex 색상 picker'}
              />
              <input
                type="text"
                value={v}
                onChange={(e) => setVals((s) => ({ ...s, [f.key]: e.target.value }))}
                placeholder={ph}
                className="flex-1 min-w-0 px-1.5 py-1 rounded-md border border-hydrangea-200 bg-white text-[11px] font-mono text-hydrangea-700 focus:outline-none focus:ring-2 focus:ring-hydrangea-300"
              />
              {!v && ph && (
                <button
                  type="button"
                  onClick={() => setVals((s) => ({ ...s, [f.key]: ph }))}
                  title="default 적용"
                  className="text-[9px] text-hydrangea-500 hover:text-hydrangea-700 flex-shrink-0"
                >
                  +
                </button>
              )}
            </div>
          );
        };
        return (
          <>
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-hydrangea-700 uppercase tracking-wide">글자색</div>
              <div className="grid grid-cols-2 gap-2">
                {TEXT_FIELDS.map(renderCell)}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-hydrangea-700 uppercase tracking-wide">배경색</div>
              <div className="grid grid-cols-3 gap-2">
                {BG_FIELDS.map(renderCell)}
              </div>
            </div>
          </>
        );
      })()}

      <div className="flex gap-2 pt-2 border-t border-hydrangea-100">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-hydrangea-500 text-white text-xs font-semibold hover:bg-hydrangea-600 active:scale-95 transition disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" /> {pending ? '저장 중...' : '저장'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={pending}
          className="px-3 py-2 rounded-lg border border-hydrangea-200 text-hydrangea-600 text-xs font-semibold hover:bg-hydrangea-50 active:scale-95 transition disabled:opacity-50"
          title="DB override 삭제 → 코드 default 복귀"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
