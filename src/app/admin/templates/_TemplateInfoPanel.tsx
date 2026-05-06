'use client';

import { TEMPLATES } from '@/lib/templates';
import { getLayout } from '@/lib/layouts';
import type { LayoutId } from '@/types/card';

type Tpl = (typeof TEMPLATES)[number];

interface Props {
  template: Tpl;
  layoutId: LayoutId;
}

export default function TemplateInfoPanel({ template, layoutId }: Props) {
  const layout = getLayout(layoutId);
  const fieldKeys = Object.keys(layout.fields).filter((k) => (layout.fields as any)[k]);
  const fieldCount = fieldKeys.length;
  return (
    <div className="space-y-3 mt-3">
      {/* Render style / Aspect */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <Cell label="Render style" value={layout.renderStyle} />
        <Cell label="Aspect" value={layout.aspectRatio} />
      </div>

      {/* Fields */}
      <div>
        <div className="text-[10px] uppercase tracking-wide text-hydrangea-400 mb-1">
          Fields ({fieldCount})
        </div>
        <div className="flex flex-wrap gap-1">
          {fieldKeys.map((k) => (
            <span
              key={k}
              className="text-[10px] px-1.5 py-0.5 rounded bg-hydrangea-50 text-hydrangea-600 font-mono"
            >
              {k}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value, swatch }: { label: string; value: string; swatch?: string }) {
  return (
    <div className="bg-white border border-hydrangea-100 rounded-lg p-2">
      <div className="text-[9px] uppercase tracking-wide text-hydrangea-400">{label}</div>
      <div className="text-xs text-hydrangea-700 truncate flex items-center gap-1.5">
        {swatch && (
          <span
            className="inline-block w-3 h-3 rounded-sm border border-hydrangea-200 flex-shrink-0"
            style={{ background: swatch }}
          />
        )}
        {value}
      </div>
    </div>
  );
}

/**
 * 템플릿 main/sub 색상 풀 fill 카드 한 줄 — 드롭다운 바로 아래에 노출용.
 */
export function TemplateColorRow({ template }: { template: Tpl }) {
  return (
    <div className="grid grid-cols-2 gap-2 text-[11px]">
      <ColorCell label="Main" color={template.colorMain} />
      <ColorCell label="Sub" color={template.colorSub} />
    </div>
  );
}

/**
 * 색상 셀 — 배경 전체를 해당 색상으로 fill.
 * 색상 명도에 따라 텍스트 흑/백 자동 선택.
 */
function ColorCell({ label, color }: { label: string; color?: string }) {
  if (!color) {
    return (
      <div className="bg-white border border-dashed border-hydrangea-200 rounded-lg p-3 text-center">
        <div className="text-[9px] uppercase tracking-wide text-hydrangea-400">{label}</div>
        <div className="text-[10px] text-hydrangea-400 mt-1">(layout default)</div>
      </div>
    );
  }
  const textColor = isDarkColor(color) ? '#FFFFFF' : '#1A1A1A';
  return (
    <div
      className="rounded-lg p-3 shadow-sm border border-black/5"
      style={{ background: color, color: textColor }}
    >
      <div className="text-[9px] uppercase tracking-wide opacity-75">{label}</div>
      <div className="text-xs font-mono mt-0.5">{color.toUpperCase()}</div>
    </div>
  );
}

function isDarkColor(hex: string): boolean {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!m) return false;
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // YIQ luminance
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq < 140;
}
