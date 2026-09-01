'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Minus, Plus, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { submitRsvp } from '@/lib/actions/submitRsvp';
import type { MyRsvp } from '@/lib/actions/submitRsvp';
import type { ThemeMeta } from '@/lib/theme';
import type { BaseCard } from '@/types/card';
import { findTemplateByPair } from '@/lib/templates';

interface Props {
  card: BaseCard;
  theme: ThemeMeta;
  recipientId?: string;
  recipientName?: string;
  /** 이미 응답한 적이 있으면 폼 초기값으로 채워서 수정 가능하게 함 */
  existingRsvp?: MyRsvp | null;
  /** 카드 안 오버레이 등 좁은 공간용 — 버튼/폰트/패딩 축소 */
  compact?: boolean;
  /** DB에 저장된 template별 색상 override — RSVP 버튼 배경색 등 */
  templateColorOverride?: {
    color_main?: string | null;
    color_sub?: string | null;
    color_box_text?: string | null;
    box_bg_top?: string | null;
    box_bg_bottom?: string | null;
    color_title_accent?: string | null;
    rsvp_button_color?: string | null;
  };
}

/** 봉투(envelope_anim) 메인 배경색에 어울리는 RSVP 버튼 색상 팔레트 */
const ENVELOPE_PALETTE: Record<string, { primary: string; soft: string; deep: string }> = {
  'envelope-1': { primary: '#A990CC', soft: '#E8DFF3', deep: '#7B5EA7' },  // 라벤더
  'envelope-2': { primary: '#9C8B6E', soft: '#EFE6D4', deep: '#6E5A3D' },  // 베이지/브라운
  'envelope-3': { primary: '#82B095', soft: '#DFEDDF', deep: '#476956' },  // 민트
  'envelope-4': { primary: '#C68676', soft: '#F8DCD2', deep: '#8E5A4D' },  // 코랄
  'envelope-5': { primary: '#8FB5D0', soft: '#DCEBF5', deep: '#5A7B96' },  // 연파랑
  'envelope-6': { primary: '#D4AF37', soft: '#F4E5A8', deep: '#7A5C12' },  // Black & Gold (gold accent)
  'none':       { primary: '#7B5EA7', soft: '#E8DFF3', deep: '#5A3D7A' }
};

export default function RsvpForm({ card, theme, recipientId, recipientName, existingRsvp, compact = false, templateColorOverride }: Props) {
  const t = useTranslations('Invitation');
  const hasExisting = !!existingRsvp;
  // RSVP 마감일 지났는지 — 폼 잠금 (이미 응답한 사용자는 응답 표시 유지)
  const deadlinePassed = !!card.rsvp_deadline && new Date(card.rsvp_deadline).getTime() < Date.now();
  // 응답 수정 잠금 — card.rsvp_allow_change=false + 이미 응답한 사용자는 변경 불가
  // 잠금 조건: 이미 응답 + 변경 불허 / OR 마감일 지남 (deadlinePassed는 아래에서 계산)
  const _deadlinePassedEarly = !!card.rsvp_deadline && new Date(card.rsvp_deadline).getTime() < Date.now();
  const locked = (hasExisting && card.rsvp_allow_change === false) || (hasExisting && _deadlinePassedEarly);
  const [attend, setAttend] = useState<boolean | null>(existingRsvp ? existingRsvp.attend : null);
  const [adultCount, setAdultCount] = useState(existingRsvp?.adult_count ?? 1);
  const [childCount, setChildCount] = useState(existingRsvp?.child_count ?? 0);
  const [names, setNames] = useState<string[]>(
    existingRsvp?.attendee_names && existingRsvp.attendee_names.length > 0
      ? existingRsvp.attendee_names
      : [recipientName || '']
  );
  const [oneliner, setOneliner] = useState(existingRsvp?.oneliner ?? '');
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const max = card.rsvp_max_per_card || 4;
  const count = adultCount + childCount;
  // 카드 제목에 한글이 있으면 한국어 카드로 보고 RSVP 문구도 한글로.
  // 그 외 언어 제목이면 영문 표기 (Attend / Decline / Pax / Reply)
  const isKo = /[가-힣]/.test(card.title || '');
  const L = isKo
    ? { heading: '참석여부를 알려주세요', attend: '참석', decline: '불참', pax: '참석인원', submit: '제출', update: '수정', sending: '전송 중...' }
    : { heading: 'Will you join us?', attend: 'Attend', decline: 'Decline', pax: 'Pax', submit: 'Reply', update: 'Update', sending: 'Sending...' };
  // 템플릿 페어링 색상 우선 — main(텍스트) / sub(버튼 배경). 없으면 envelope 팔레트 fallback.
  const tpl = findTemplateByPair(card.bg_id, card.layout_id);
  const envPalette = ENVELOPE_PALETTE[card.envelope_anim] || ENVELOPE_PALETTE['envelope-1'];
  // DB override 우선 → 코드 default. rsvp_button_color = RSVP 버튼 배경/테두리 전용
  const ACCENT = templateColorOverride?.color_main || tpl?.colorMain || envPalette.primary;        // 텍스트/이름/Reply 버튼 배경
  const ACCENT_SOFT = templateColorOverride?.rsvp_button_color || templateColorOverride?.color_sub || tpl?.colorSub || envPalette.soft;       // Attend/Decline 버튼 배경
  const ACCENT_DEEP = templateColorOverride?.color_main || tpl?.colorMain || envPalette.deep;       // 텍스트 진한 색상

  const adjustAdult = (delta: number) => {
    const next = Math.max(0, Math.min(max - childCount, adultCount + delta));
    if (next + childCount < 1) return;
    setAdultCount(next);
    if (card.rsvp_collect_names) {
      const total = next + childCount;
      setNames((prev) => {
        const arr = [...prev];
        while (arr.length < total) arr.push('');
        return arr.slice(0, total);
      });
    }
  };

  // 호환성을 위한 통합 카운터 — Adult를 우선 조정
  const adjustCount = (delta: number) => adjustAdult(delta);

  const adjustChild = (delta: number) => {
    const next = Math.max(0, Math.min(max - adultCount, childCount + delta));
    setChildCount(next);
    if (card.rsvp_collect_names) {
      const total = adultCount + next;
      setNames((prev) => {
        const arr = [...prev];
        while (arr.length < total) arr.push('');
        return arr.slice(0, total);
      });
    }
  };

  // 미리보기 모드(card.id가 UUID가 아닌 'preview' 등)에서는 실제 제출 차단
  const isPreview = !card.id || card.id === 'preview' || card.slug === 'preview';

  const handleSubmit = (overrideAttend?: boolean) => {
    if (locked) {
      toast.error(t('rsvpDenied'));
      return;
    }
    const attendVal = overrideAttend !== undefined ? overrideAttend : attend;
    if (attendVal === null) {
      toast.error('Please select Attend or Decline');
      return;
    }
    if (isPreview) {
      // 미리보기 — DB 제출 X, 성공 화면도 띄우지 않음
      toast.message('Preview mode — RSVP will work after publishing');
      return;
    }
    if (attendVal && card.rsvp_collect_names && count > 1) {
      const filled = names.slice(0, count).filter((n) => n && n.trim().length > 0);
      if (filled.length < count) {
        toast.error(`Please enter all ${count} attendee names`);
        return;
      }
    }
    startTransition(async () => {
      const res = await submitRsvp({
        card_id: card.id,
        slug: card.slug,
        recipient_id: recipientId,
        attend: attendVal,
        adult_count: attendVal ? adultCount : 0,
        child_count: attendVal ? childCount : 0,
        attendee_names: attendVal && card.rsvp_collect_names
          ? names.filter((n) => n.trim())
          : (recipientName ? [recipientName] : []),
        oneliner: oneliner
      });
      if (!res.ok) {
        toast.error(res.error || '응답 실패');
        return;
      }
      setDone(true);
      toast.success('Thank you for your reply!');
    });
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-4 text-center"
      >
        <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: ACCENT }}>
          <Check className="w-6 h-6 text-white" strokeWidth={3} />
        </div>
        <p className="font-semibold text-base" style={{ color: ACCENT_DEEP }}>{hasExisting ? 'Your reply has been updated!' : 'Thank you for replying!'}</p>
        {attend && oneliner && (
          <p className="text-sm mt-2" style={{ color: ACCENT_DEEP, opacity: 0.7 }}>Your one-line greeting has been added to the feed</p>
        )}
      </motion.div>
    );
  }

  // 마감 지났고 본인 응답 없으면 — 마감 안내만 표시
  if (deadlinePassed && !hasExisting) {
    return (
      <div className={`text-center ${compact ? 'py-3' : 'py-4'}`}>
        <div style={{ color: ACCENT, opacity: 0.6, fontSize: 11, marginBottom: 4 }}>✽</div>
        <p className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`} style={{ color: ACCENT_DEEP }}>
          {t('rsvpClosed')}
        </p>
      </div>
    );
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-4'}>
      <div className="text-center">
        <div style={{ color: ACCENT, opacity: 0.6, fontSize: 11, marginBottom: 4, lineHeight: 1 }}>✽</div>
        <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-lg'}`} style={{ color: ACCENT }}>{L.heading}</h3>
        {hasExisting && locked && (
          <p className={`mt-1 font-semibold ${compact ? 'text-[11px]' : 'text-sm'}`} style={{ color: ACCENT_DEEP }}>
            {t.rich('alreadyReplied', {
              status: existingRsvp!.attend ? t('alreadyAttend') : t('alreadyDecline'),
              attend: (chunks) => <span style={{ color: existingRsvp!.attend ? '#059669' : '#e11d48' }}>{chunks}</span>
            })}
            <span className={compact ? 'block text-[9px] opacity-70 mt-0.5 font-normal' : 'block text-xs opacity-70 mt-0.5 font-normal'}>
              {t('noChange')}
            </span>
          </p>
        )}
        {hasExisting && !locked && (
          <p className={`mt-1 ${compact ? 'text-[10px]' : 'text-xs'}`} style={{ color: ACCENT_DEEP, opacity: 0.75 }}>
            ✓ You already replied — edit and resubmit to update
          </p>
        )}
        {!hasExisting && card.rsvp_deadline && (() => {
          const d = new Date(card.rsvp_deadline);
          // 00:00:00 이면 시간 없이 입력된 것으로 간주 → 날짜만 표시
          const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
          // "4 OCT 2026" — 월은 대문자 축약
          const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
          // "10:30AM" — 12시간제 + AM/PM 붙여쓰기
          const h24 = d.getHours();
          const ampm = h24 >= 12 ? 'PM' : 'AM';
          const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
          const timeStr = hasTime ? `${h12}:${String(d.getMinutes()).padStart(2, '0')}${ampm}` : '';
          return (
            <p className={`mt-1 ${compact ? 'text-[10px]' : 'text-xs'}`} style={{ color: theme.colors.muted, opacity: 0.85 }}>
              Reply by {dateStr}{hasTime ? ` ${timeStr}` : ''}
            </p>
          );
        })()}
      </div>

      {compact ? (
        <div className={`grid ${attend === true && max > 1 ? 'grid-cols-[1fr_1fr_1.4fr]' : 'grid-cols-2'} gap-1.5 items-stretch mx-auto`}
          style={{ maxWidth: 280 }}>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => { setAttend(true); if (max <= 1) handleSubmit(true); }}
            disabled={pending || locked}
            className="min-h-[34px] text-xs rounded-lg border font-medium transition flex items-center justify-center gap-1 disabled:opacity-50"
            style={{
              background: ACCENT,
              color: '#fff',
              borderColor: attend === true ? '#fff' : ACCENT_SOFT,
              borderWidth: attend === true ? 2 : 1,
              opacity: attend === null ? 1 : (attend === true ? 1 : 0.45),
              boxShadow: attend === true ? `0 0 0 3px ${ACCENT_SOFT}` : 'none',
              fontWeight: attend === true ? 700 : 500
            }}
          >
            <Check className="w-3 h-3" /> {L.attend}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => { setAttend(false); if (max <= 1) handleSubmit(false); }}
            disabled={pending || locked}
            className="min-h-[34px] text-xs rounded-lg border font-medium transition flex items-center justify-center gap-1 disabled:opacity-50"
            style={{
              background: ACCENT_DEEP,
              color: '#fff',
              borderColor: attend === false ? '#fff' : ACCENT_SOFT,
              borderWidth: attend === false ? 2 : 1,
              opacity: attend === null ? 1 : (attend === false ? 1 : 0.45),
              boxShadow: attend === false ? `0 0 0 3px ${ACCENT_SOFT}` : 'none',
              fontWeight: attend === false ? 700 : 500
            }}
          >
            <X className="w-3 h-3" /> {L.decline}
          </motion.button>
          {attend === true && max > 1 && (
            <div className="min-h-[34px] rounded-lg border flex items-center justify-between gap-1 px-1.5"
              style={{ borderColor: ACCENT, background: ACCENT_SOFT }}>
              <span className="text-[10px] font-medium shrink-0" style={{ color: ACCENT_DEEP }}>{L.pax}</span>
              <button
                type="button"
                onClick={() => adjustCount(-1)}
                disabled={count <= 1}
                className="w-6 h-6 rounded-full flex items-center justify-center active:scale-90 transition disabled:opacity-30"
                style={{ background: 'rgba(255,255,255,0.7)', color: ACCENT_DEEP }}
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-bold text-xs" style={{ color: ACCENT_DEEP }}>{count}</span>
              <button
                type="button"
                onClick={() => adjustCount(1)}
                disabled={count >= max}
                className="w-6 h-6 rounded-full flex items-center justify-center active:scale-90 transition disabled:opacity-30"
                style={{ background: 'rgba(255,255,255,0.7)', color: ACCENT_DEEP }}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 mx-auto" style={{ maxWidth: 320 }}>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => { setAttend(true); if (max <= 1) handleSubmit(true); }}
            disabled={pending || locked}
            className="min-h-[52px] rounded-xl border font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
            style={{
              background: ACCENT,
              color: '#fff',
              borderColor: attend === true ? '#fff' : ACCENT_SOFT,
              borderWidth: attend === true ? 2 : 1,
              opacity: attend === null ? 1 : (attend === true ? 1 : 0.45),
              boxShadow: attend === true ? `0 0 0 3px ${ACCENT_SOFT}` : 'none',
              fontWeight: attend === true ? 700 : 500
            }}
          >
            <Check className="w-4 h-4" /> {L.attend}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => { setAttend(false); if (max <= 1) handleSubmit(false); }}
            disabled={pending || locked}
            className="min-h-[52px] rounded-xl border font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
            style={{
              background: ACCENT_DEEP,
              color: '#fff',
              borderColor: attend === false ? '#fff' : ACCENT_SOFT,
              borderWidth: attend === false ? 2 : 1,
              opacity: attend === null ? 1 : (attend === false ? 1 : 0.45),
              boxShadow: attend === false ? `0 0 0 3px ${ACCENT_SOFT}` : 'none',
              fontWeight: attend === false ? 700 : 500
            }}
          >
            <X className="w-4 h-4" /> {L.decline}
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {attend === true && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {/* 비-compact일 때만 별도 카운트 컨트롤 (compact는 위 3열에 포함됨) */}
            {!compact && max > 1 && (
              <div className="flex items-center justify-between rounded-xl p-4" style={{ background: theme.colors.bg }}>
                <span className="font-medium text-sm" style={{ color: theme.colors.deep }}>{L.pax}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustCount(-1)}
                    disabled={count <= 1}
                    className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition disabled:opacity-30"
                    style={{ background: theme.colors.bgCard, color: theme.colors.primary }}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-center w-8 text-lg" style={{ color: theme.colors.deep }}>{count}</span>
                  <button
                    onClick={() => adjustCount(1)}
                    disabled={count >= max}
                    className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition disabled:opacity-30"
                    style={{ background: theme.colors.bgCard, color: theme.colors.primary }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {card.rsvp_collect_names && count > 1 && (
              <div className="grid grid-cols-2 gap-1.5">
                {Array.from({ length: count }).map((_, i) => (
                  <label key={i} className="flex flex-col gap-0.5 min-w-0">
                    <span
                      className={`${compact ? 'text-[10px]' : 'text-[11px]'} font-medium`}
                      style={{ color: theme.colors.deep, opacity: 0.8 }}
                    >
                      attendee#{i + 1}
                    </span>
                    <input
                      placeholder=""
                      value={names[i] || ''}
                      onChange={(e) => {
                        const arr = [...names];
                        arr[i] = e.target.value;
                        setNames(arr);
                      }}
                      className={`w-full px-2 rounded-md bg-white focus:outline-none focus:ring-1 ${compact ? 'h-7 text-[11px]' : 'h-8 text-xs'}`}
                      style={{ border: `1px solid ${ACCENT}66`, color: ACCENT_DEEP }}
                    />
                  </label>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* one-line reply 입력 영구 제거 — DB 필드(rsvp_allow_oneliner)는 보존되나 UI 노출 X */}

      {/* Reply 버튼: max>1 케이스에서만 노출 (max=1은 Attend/Decline 클릭이 곧 제출). locked면 숨김 */}
      {attend !== null && max > 1 && !locked && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => handleSubmit()}
          disabled={pending}
          className={`w-full font-semibold text-white shadow disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 ${compact ? 'min-h-[34px] text-xs rounded-lg' : 'min-h-[52px] text-base rounded-xl'}`}
          // Attend/Decline 버튼 행과 같은 폭 — 카드 전체 폭으로 늘어나 프레임을 넘지 않도록
          // 위 버튼 행보다 좁게 — 카드 폭을 가로지르지 않도록
          style={{ background: ACCENT, maxWidth: compact ? 150 : 200, marginLeft: 'auto', marginRight: 'auto' }}
        >
          {pending ? L.sending : (<><Heart className={compact ? 'w-3 h-3' : 'w-4 h-4'} /> {hasExisting ? L.update : L.submit}</>)}
        </motion.button>
      )}
    </div>
  );
}
