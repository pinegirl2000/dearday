'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { CalendarClock, Pencil, Check, X, Trash2 } from 'lucide-react';
import { updateRsvpDeadline } from '@/lib/actions/recipients';

interface Props {
  slug: string;
  ownerToken: string | null;
  /** ISO 문자열 또는 null */
  initial: string | null | undefined;
  /** 저장 후 부모 상태 갱신용 */
  onSaved?: (deadline: string | null) => void;
}

/** "4 OCT 2026 10:30AM" — 초대장 카드의 Reply by 표기와 동일한 포맷 */
function fmtDeadline(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
  if (!hasTime) return date;
  const h24 = d.getHours();
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${date} ${h12}:${String(d.getMinutes()).padStart(2, '0')}${ampm}`;
}

/** ISO → <input type="datetime-local"> 값 (로컬 시간, YYYY-MM-DDTHH:mm) */
function toLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * 회신 마감일 인라인 편집 — 내 카드 목록의 응답 통계 탭에서 바로 수정.
 * 카드가 잠긴 뒤에도 마감일만은 바꿀 수 있어야 해서 본문 편집과 분리.
 */
export default function RsvpDeadlineEditor({ slug, ownerToken, initial, onSaved }: Props) {
  const [value, setValue] = useState<string | null>(initial ?? null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(toLocalInput(initial));
  const [pending, startTransition] = useTransition();

  const save = (next: string | null) => {
    startTransition(async () => {
      const res = await updateRsvpDeadline(slug, ownerToken, next);
      if (!res.ok) { toast.error(res.error); return; }
      setValue(res.deadline);
      setDraft(toLocalInput(res.deadline));
      setEditing(false);
      onSaved?.(res.deadline);
      toast.success(res.deadline ? '회신 마감일을 저장했습니다' : '회신 마감일을 없앴습니다');
    });
  };

  const passed = !!value && new Date(value).getTime() < Date.now();

  if (!editing) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-hydrangea-100 bg-white px-2.5 py-1.5">
        <CalendarClock className="w-3.5 h-3.5 text-hydrangea-500 shrink-0" />
        <span className="text-[11px] text-hydrangea-500">회신 마감</span>
        <span className={`text-[11px] font-semibold ${passed ? 'text-rose-600' : 'text-hydrangea-700'}`}>
          {value ? fmtDeadline(value) : '없음'}
          {passed && <span className="ml-1 text-[10px] font-medium text-rose-500">(지남)</span>}
        </span>
        <button
          type="button"
          onClick={() => { setDraft(toLocalInput(value)); setEditing(true); }}
          className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-hydrangea-600 border border-hydrangea-200 hover:bg-hydrangea-50 active:scale-95 transition"
        >
          <Pencil className="w-3 h-3" /> 수정
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap rounded-lg border border-hydrangea-300 bg-white px-2.5 py-1.5">
      <CalendarClock className="w-3.5 h-3.5 text-hydrangea-500 shrink-0" />
      <span className="text-[11px] text-hydrangea-500">회신 마감</span>
      <input
        type="datetime-local"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="flex-1 min-w-[170px] px-2 py-1 rounded border border-hydrangea-200 text-[11px] text-hydrangea-700 focus:outline-none focus:ring-2 focus:ring-hydrangea-300"
      />
      <button
        type="button"
        disabled={pending || !draft}
        onClick={() => save(draft ? new Date(draft).toISOString() : null)}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-hydrangea-600 text-white text-[10px] font-semibold hover:bg-hydrangea-700 active:scale-95 transition disabled:opacity-50"
      >
        <Check className="w-3 h-3" /> 저장
      </button>
      {value && (
        <button
          type="button"
          disabled={pending}
          onClick={() => { if (confirm('회신 마감일을 없앨까요? (마감 없이 계속 응답 가능)')) save(null); }}
          title="마감 없음"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-rose-200 text-rose-600 text-[10px] font-semibold hover:bg-rose-50 active:scale-95 transition disabled:opacity-50"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => setEditing(false)}
        className="inline-flex items-center px-2 py-1 rounded-md text-[10px] text-hydrangea-500 hover:bg-hydrangea-50"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
