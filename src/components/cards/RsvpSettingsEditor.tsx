'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Calendar, Users, Pencil, Check, X } from 'lucide-react';
import { updateRsvpSettings } from '@/lib/actions/recipients';

interface Props {
  slug: string;
  ownerToken: string | null;
  initial: {
    rsvp_deadline?: string | null;
    rsvp_max_per_card?: number | null;
    rsvp_collect_names?: boolean | null;
  };
}

/** ISO → <input type="datetime-local"> 값 (로컬 시간) */
function toLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * 수신자 등록 화면의 RSVP 설정 박스 — 보기 모드는 기존 배지 그대로,
 * "수정"을 누르면 마감일 / 최대 인원 / 이름 입력을 그 자리에서 바꿔 저장.
 * 카드가 잠긴 뒤에도 운영상 필요한 값이라 본문 편집과 분리된 액션 사용.
 */
export default function RsvpSettingsEditor({ slug, ownerToken, initial }: Props) {
  const t = useTranslations('Send');
  const [cfg, setCfg] = useState({
    deadline: initial.rsvp_deadline ?? null,
    max: initial.rsvp_max_per_card || 1,
    names: !!initial.rsvp_collect_names
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ deadline: toLocalInput(cfg.deadline), max: cfg.max, names: cfg.names });
  const [pending, startTransition] = useTransition();

  const openEdit = () => {
    setDraft({ deadline: toLocalInput(cfg.deadline), max: cfg.max, names: cfg.names });
    setEditing(true);
  };

  const save = () => {
    startTransition(async () => {
      const res = await updateRsvpSettings(slug, ownerToken, {
        deadline: draft.deadline ? new Date(draft.deadline).toISOString() : null,
        maxPerCard: draft.max,
        collectNames: draft.max > 1 ? draft.names : false
      });
      if (!res.ok) { toast.error(res.error); return; }
      setCfg({
        deadline: res.settings.rsvp_deadline,
        max: res.settings.rsvp_max_per_card,
        names: res.settings.rsvp_collect_names
      });
      setEditing(false);
      toast.success('RSVP 설정을 저장했습니다');
    });
  };

  // ---- 보기 모드 (기존 표시와 동일) ----
  const deadline = cfg.deadline ? new Date(cfg.deadline) : null;
  const validDeadline = deadline && !isNaN(deadline.getTime()) ? deadline : null;
  const daysLeft = validDeadline ? Math.ceil((validDeadline.getTime() - Date.now()) / 86400000) : null;
  const expired = daysLeft !== null && daysLeft < 0;
  const allowGroup = cfg.max > 1;

  if (!editing) {
    return (
      <div className="rounded-xl border border-hydrangea-200 bg-hydrangea-50/50 p-3 space-y-2 text-[11px] relative">
        <button
          type="button"
          onClick={openEdit}
          className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-hydrangea-600 border border-hydrangea-200 bg-white hover:bg-hydrangea-50 active:scale-95 transition"
        >
          <Pencil className="w-3 h-3" /> 수정
        </button>
        <div className="flex items-center gap-1.5 pr-14">
          <Calendar className="w-3.5 h-3.5 text-hydrangea-500 flex-shrink-0" />
          <span className="text-hydrangea-700 font-medium">{t('rsvpDeadline')}</span>
          {validDeadline ? (
            <>
              <span className="text-hydrangea-500">
                {validDeadline.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}
                {(validDeadline.getHours() !== 0 || validDeadline.getMinutes() !== 0) && (
                  <> {validDeadline.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })}</>
                )}
              </span>
              <span className={`ml-auto px-1.5 py-0.5 rounded-full font-bold ${
                expired ? 'bg-rose-500 text-white' : daysLeft! <= 3 ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
              }`}>
                {expired ? t('expired') : daysLeft === 0 ? t('today') : t('daysLeft', { n: daysLeft! })}
              </span>
            </>
          ) : (
            <span className="text-hydrangea-400">없음</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Users className="w-3.5 h-3.5 text-hydrangea-500 flex-shrink-0" />
          <span className="text-hydrangea-700 font-medium">{t('options')}</span>
          <span className={`px-1.5 py-0.5 rounded-full font-semibold ${allowGroup ? 'bg-hydrangea-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
            {allowGroup ? t('guestMax', { n: cfg.max }) : t('guestNone')}
          </span>
          {allowGroup && (
            <span className={`px-1.5 py-0.5 rounded-full font-semibold ${cfg.names ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {cfg.names ? t('namesRequired') : t('namesNone')}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ---- 편집 모드 ----
  return (
    <div className="rounded-xl border border-hydrangea-300 bg-white p-3 space-y-2.5 text-[11px]">
      <div className="flex items-center gap-1.5 flex-wrap">
        <Calendar className="w-3.5 h-3.5 text-hydrangea-500 flex-shrink-0" />
        <span className="text-hydrangea-700 font-medium w-16">{t('rsvpDeadline')}</span>
        <input
          type="datetime-local"
          value={draft.deadline}
          onChange={(e) => setDraft((d) => ({ ...d, deadline: e.target.value }))}
          className="flex-1 min-w-[170px] px-2 py-1 rounded border border-hydrangea-200 text-[11px] text-hydrangea-700 focus:outline-none focus:ring-2 focus:ring-hydrangea-300"
        />
        {draft.deadline && (
          <button type="button" onClick={() => setDraft((d) => ({ ...d, deadline: '' }))} className="text-[10px] text-rose-500 hover:underline">
            마감 없음
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <Users className="w-3.5 h-3.5 text-hydrangea-500 flex-shrink-0" />
        <span className="text-hydrangea-700 font-medium w-16">최대 인원</span>
        <select
          value={draft.max}
          onChange={(e) => setDraft((d) => ({ ...d, max: Number(e.target.value) }))}
          className="px-2 py-1 rounded border border-hydrangea-200 text-[11px] text-hydrangea-700 bg-white focus:outline-none focus:ring-2 focus:ring-hydrangea-300"
        >
          <option value={1}>1명 (동반자 불가)</option>
          {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}명</option>)}
        </select>
        <label className={`inline-flex items-center gap-1.5 ml-1 ${draft.max > 1 ? 'text-hydrangea-700' : 'text-gray-400'}`}>
          <input
            type="checkbox"
            checked={draft.max > 1 && draft.names}
            disabled={draft.max <= 1}
            onChange={(e) => setDraft((d) => ({ ...d, names: e.target.checked }))}
            className="accent-hydrangea-600"
          />
          동반자 이름 입력 필수
        </label>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-hydrangea-600 text-white text-[11px] font-semibold hover:bg-hydrangea-700 active:scale-95 transition disabled:opacity-50"
        >
          <Check className="w-3 h-3" /> 저장
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setEditing(false)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-hydrangea-200 text-hydrangea-600 text-[11px] hover:bg-hydrangea-50"
        >
          <X className="w-3 h-3" /> 취소
        </button>
      </div>
    </div>
  );
}
