'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Save, RotateCcw } from 'lucide-react';
import { saveTemplateMetrics, type TemplateMetrics } from '@/lib/actions/templateConfig';

interface Props {
  templateId: string;
  /** DB에 이미 저장된 override (있으면 초기 값) */
  initial?: Partial<TemplateMetrics> | null;
  /** 저장 성공 시 부모에 전달 → preview 즉시 반영 */
  onSaved?: (metrics: TemplateMetrics) => void;
}

const FIELDS = [
  { key: 'content_top' as const,    label: '시작 위치',   hint: '텍스트가 시작될 상단 위치(px). 배경 프레임 안쪽에서 시작하도록 조정', ph: '24' },
  { key: 'content_side' as const,   label: '좌우 여백',   hint: '본문 좌우 여백(px). 글자가 프레임 밖으로 나가지 않도록',           ph: '20' },
  { key: 'card_max_width' as const, label: '카드 가로',   hint: '카드 최대 폭(px). 240~900',                                      ph: '440' },
  { key: 'card_min_height' as const,label: '카드 세로',   hint: '카드 최소 높이(px). 배경 하단이 비는 것 방지. 0~2400',            ph: 'auto' }
];

export default function TemplateMetricsEditor({ templateId, initial, onSaved }: Props) {
  const toStr = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v));
  const [vals, setVals] = useState<Record<string, string>>({
    content_top: toStr(initial?.content_top),
    content_side: toStr(initial?.content_side),
    card_max_width: toStr(initial?.card_max_width),
    card_min_height: toStr(initial?.card_min_height)
  });
  const [pending, startTransition] = useTransition();

  const toNum = (v: string): number | null => {
    const s = (v || '').trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? Math.round(n) : null;
  };

  const submit = (next: Record<string, string>) => {
    const payload: Partial<TemplateMetrics> = {
      content_top: toNum(next.content_top),
      content_side: toNum(next.content_side),
      card_max_width: toNum(next.card_max_width),
      card_min_height: toNum(next.card_min_height)
    };
    startTransition(async () => {
      const res = await saveTemplateMetrics(templateId, payload);
      if (!res.ok) { toast.error(res.error || '저장 실패'); return; }
      toast.success('배치 저장됨');
      onSaved?.({
        content_top: payload.content_top ?? null,
        content_side: payload.content_side ?? null,
        card_max_width: payload.card_max_width ?? null,
        card_min_height: payload.card_min_height ?? null
      });
    });
  };

  const handleReset = () => {
    const cleared = { content_top: '', content_side: '', card_max_width: '', card_min_height: '' };
    setVals(cleared);
    submit(cleared);
  };

  return (
    <div className="rounded-xl border border-hydrangea-200 bg-white p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-hydrangea-700">📐 배치 override (DB)</h3>
        <span className="text-[10px] text-hydrangea-400">빈 값 = 코드 default 사용</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {FIELDS.map((f) => (
          <div key={f.key} className="rounded-lg border border-hydrangea-100 p-2" title={f.hint}>
            <label className="block text-[10px] font-semibold text-hydrangea-700 mb-1">{f.label}</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                inputMode="numeric"
                value={vals[f.key]}
                onChange={(e) => setVals((s) => ({ ...s, [f.key]: e.target.value }))}
                placeholder={f.ph}
                className="w-full min-w-0 px-2 py-1 rounded border border-hydrangea-200 text-xs text-hydrangea-700 focus:outline-none focus:ring-2 focus:ring-hydrangea-300"
              />
              <span className="text-[10px] text-hydrangea-400 shrink-0">px</span>
            </div>
            <p className="mt-1 text-[9px] leading-tight text-hydrangea-400">{f.hint}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => submit(vals)}
          disabled={pending}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-hydrangea-600 text-white text-xs font-semibold hover:bg-hydrangea-700 active:scale-95 transition disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" /> 저장
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={pending}
          title="코드 default로 복귀"
          className="px-3 py-2 rounded-lg border border-hydrangea-200 text-hydrangea-600 hover:bg-hydrangea-50 active:scale-95 transition disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
