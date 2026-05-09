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
}

const FIELDS = [
  { key: 'color_main' as const,    label: '메인 폰트 (제목/강조)',                  hint: '큰 제목, 강조 텍스트에 적용' },
  { key: 'color_sub' as const,     label: '서브 폰트 (부제/본문/박스 밖)',           hint: '부제, 본문, 박스 밖 날짜·장소' },
  { key: 'color_box_text' as const, label: '박스 안 폰트 (반전색)',                  hint: '반투명 박스 위에서 잘 보이는 색' },
  { key: 'box_bg_top' as const,    label: '포인트 색상',                            hint: '강조용 포인트 색 (정보박스 배경에도 사용)' }
];

export default function TemplateColorEditor({ templateId, codeDefaults, initial }: Props) {
  const [vals, setVals] = useState<Record<string, string>>({
    color_main: initial?.color_main || '',
    color_sub: initial?.color_sub || '',
    color_box_text: initial?.color_box_text || '',
    box_bg_top: initial?.box_bg_top || ''
  });
  const [pending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveTemplateColors(templateId, vals);
      if (!res.ok) { toast.error(res.error || '저장 실패'); return; }
      toast.success('색상 저장됨 — 다음 페이지 로드 시 반영');
    });
  };

  const handleReset = () => {
    if (!confirm('이 템플릿의 색상 override를 모두 지우고 코드 default로 복귀할까요?')) return;
    setVals({ color_main: '', color_sub: '', color_box_text: '', box_bg_top: '' });
    startTransition(async () => {
      const res = await saveTemplateColors(templateId, {
        color_main: null, color_sub: null, color_box_text: null,
        box_bg_top: null, box_bg_bottom: null
      });
      if (!res.ok) { toast.error(res.error || '리셋 실패'); return; }
      toast.success('Reset 완료');
    });
  };

  const isHexLike = (v: string) => /^#?[0-9a-fA-F]{3,8}$/.test(v.trim());
  const placeholderFor = (key: string): string => {
    if (key === 'color_main') return codeDefaults.colorMain || '#7B5EA7';
    if (key === 'color_sub') return codeDefaults.colorSub || '#FFFFFF';
    if (key === 'color_box_text') return codeDefaults.boxTextColor || '#1A1A1A';
    if (key === 'box_bg_top') return 'rgba(255,255,255,0.82)';
    if (key === 'box_bg_bottom') return 'rgba(255,255,255,0.68)';
    return '';
  };

  return (
    <div className="rounded-xl border border-hydrangea-200 bg-white p-3 space-y-3 mt-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-hydrangea-700">🎨 색상 override (DB)</h4>
        <span className="text-[10px] text-hydrangea-400">빈 값 = 코드 default 사용</span>
      </div>

      <div className="space-y-2">
        {FIELDS.map((f) => {
          const v = vals[f.key];
          const validHex = v && isHexLike(v);
          return (
            <div key={f.key} className="flex items-start gap-2">
              {/* color picker (hex만 — rgba는 text input 사용) */}
              <input
                type="color"
                value={validHex ? (v.startsWith('#') ? v : `#${v}`) : '#ffffff'}
                onChange={(e) => setVals((s) => ({ ...s, [f.key]: e.target.value }))}
                className="w-10 h-10 rounded cursor-pointer border border-hydrangea-200 flex-shrink-0"
                title="hex 색상 picker"
              />
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-semibold text-hydrangea-600">
                  {f.label}
                </label>
                <input
                  type="text"
                  value={v}
                  onChange={(e) => setVals((s) => ({ ...s, [f.key]: e.target.value }))}
                  placeholder={placeholderFor(f.key)}
                  className="w-full mt-0.5 px-2 py-1 rounded-md border border-hydrangea-200 bg-white text-xs font-mono text-hydrangea-700 focus:outline-none focus:ring-2 focus:ring-hydrangea-300"
                />
                <div className="text-[9px] text-hydrangea-400 mt-0.5">{f.hint}</div>
              </div>
            </div>
          );
        })}
      </div>

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
