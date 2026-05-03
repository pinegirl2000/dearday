'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Minus, Plus, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { submitRsvp } from '@/lib/actions/submitRsvp';
import type { ThemeMeta } from '@/lib/theme';
import type { BaseCard } from '@/types/card';

interface Props {
  card: BaseCard;
  theme: ThemeMeta;
  recipientId?: string;
  recipientName?: string;
  /** 카드 안 오버레이 등 좁은 공간용 — 버튼/폰트/패딩 축소 */
  compact?: boolean;
}

/** 봉투(envelope_anim) 메인 배경색에 어울리는 RSVP 버튼 색상 팔레트 */
const ENVELOPE_PALETTE: Record<string, { primary: string; soft: string; deep: string }> = {
  'envelope-1': { primary: '#A990CC', soft: '#E8DFF3', deep: '#7B5EA7' },  // 라벤더
  'envelope-2': { primary: '#9C8B6E', soft: '#EFE6D4', deep: '#6E5A3D' },  // 베이지/브라운
  'envelope-3': { primary: '#82B095', soft: '#DFEDDF', deep: '#476956' },  // 민트
  'envelope-4': { primary: '#C68676', soft: '#F8DCD2', deep: '#8E5A4D' },  // 코랄
  'none':       { primary: '#7B5EA7', soft: '#E8DFF3', deep: '#5A3D7A' }
};

export default function RsvpForm({ card, theme, recipientId, recipientName, compact = false }: Props) {
  const [attend, setAttend] = useState<boolean | null>(null);
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const [names, setNames] = useState<string[]>([recipientName || '']);
  const [oneliner, setOneliner] = useState('');
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const max = card.rsvp_max_per_card || 4;
  const count = adultCount + childCount;
  const palette = ENVELOPE_PALETTE[card.envelope_anim] || ENVELOPE_PALETTE['envelope-1'];
  const ACCENT = palette.primary;
  const ACCENT_SOFT = palette.soft;
  const ACCENT_DEEP = palette.deep;

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

  const handleSubmit = () => {
    if (attend === null) {
      toast.error('Please select Attend or Decline');
      return;
    }
    startTransition(async () => {
      const res = await submitRsvp({
        card_id: card.id,
        slug: card.slug,
        recipient_id: recipientId,
        attend,
        adult_count: attend ? adultCount : 0,
        child_count: attend ? childCount : 0,
        attendee_names: attend && card.rsvp_collect_names
          ? names.filter((n) => n.trim())
          : (recipientName ? [recipientName] : []),
        oneliner: oneliner
      });
      if (!res.ok) {
        toast.error(res.error || '응답 실패');
        return;
      }
      setDone(true);
      toast.success('응답해 주셔서 감사합니다!');
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
        <p className="font-semibold text-base" style={{ color: ACCENT_DEEP }}>Thank you for replying!</p>
        {attend && oneliner && (
          <p className="text-sm mt-2" style={{ color: ACCENT_DEEP, opacity: 0.7 }}>Your one-line greeting has been added to the feed</p>
        )}
      </motion.div>
    );
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-4'}>
      <div className="text-center">
        <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-lg'}`} style={{ color: theme.colors.deep }}>Will you join us?</h3>
        {card.rsvp_deadline && !compact && (
          <p className="text-xs mt-1" style={{ color: theme.colors.muted }}>
            {new Date(card.rsvp_deadline).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}까지
          </p>
        )}
      </div>

      {compact ? (
        <div className="grid grid-cols-3 gap-1.5 items-stretch">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setAttend(true)}
            className="min-h-[34px] text-xs rounded-lg border-2 font-medium transition flex items-center justify-center gap-1"
            style={{
              background: attend === true ? ACCENT : ACCENT_SOFT,
              color: attend === true ? '#fff' : ACCENT_DEEP,
              borderColor: ACCENT
            }}
          >
            <Check className="w-3 h-3" /> Attend
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setAttend(false)}
            className="min-h-[34px] text-xs rounded-lg border-2 font-medium transition flex items-center justify-center gap-1"
            style={{
              background: attend === false ? ACCENT_DEEP : ACCENT_SOFT,
              color: attend === false ? '#fff' : ACCENT_DEEP,
              borderColor: ACCENT_DEEP
            }}
          >
            <X className="w-3 h-3" /> Decline
          </motion.button>
          {attend === true && max > 1 ? (
            <div className="min-h-[34px] rounded-lg border-2 flex items-center justify-between px-1.5"
              style={{ borderColor: ACCENT, background: ACCENT_SOFT }}>
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
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={pending || attend === null}
              className="min-h-[34px] text-xs rounded-lg font-semibold text-white shadow disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              style={{ background: ACCENT }}
            >
              {pending ? '...' : (<><Heart className="w-3 h-3" /> Reply</>)}
            </motion.button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setAttend(true)}
            className="min-h-[52px] rounded-xl border-2 font-medium transition flex items-center justify-center gap-2"
            style={{
              background: attend === true ? ACCENT : ACCENT_SOFT,
              color: attend === true ? '#fff' : ACCENT_DEEP,
              borderColor: ACCENT
            }}
          >
            <Check className="w-4 h-4" /> Attend
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setAttend(false)}
            className="min-h-[52px] rounded-xl border-2 font-medium transition flex items-center justify-center gap-2"
            style={{
              background: attend === false ? ACCENT_DEEP : ACCENT_SOFT,
              color: attend === false ? '#fff' : ACCENT_DEEP,
              borderColor: ACCENT_DEEP
            }}
          >
            <X className="w-4 h-4" /> Decline
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
                <span className="font-medium text-sm" style={{ color: theme.colors.deep }}>Attendees</span>
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
                      style={{ border: `1.5px solid ${theme.colors.accent}` }}
                    />
                  </label>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* compact 모드에서 attend===true && max>1 인 경우, 위 3열에 카운트가 들어가서 Reply가 필요함 */}
      {compact && attend === true && max > 1 && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={pending}
          className="w-full min-h-[34px] text-xs rounded-lg font-semibold text-white shadow disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          style={{ background: ACCENT }}
        >
          {pending ? 'Sending...' : (<><Heart className="w-3 h-3" /> Reply</>)}
        </motion.button>
      )}

      {attend !== null && (card.rsvp_allow_oneliner ?? true) && (
        <textarea
          placeholder="Leave a one-line reply to host (optional)"
          value={oneliner}
          onChange={(e) => setOneliner(e.target.value.slice(0, 200))}
          rows={compact ? 1 : 2}
          className={`w-full px-3 rounded-xl border bg-white resize-none focus:outline-none focus:ring-2 ${compact ? 'py-1.5 text-xs' : 'py-3 text-sm'}`}
          style={{ borderColor: theme.colors.accent + '66', color: theme.colors.ink }}
        />
      )}

      {!compact && <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSubmit}
        disabled={pending || attend === null}
        className="w-full min-h-[52px] rounded-xl font-semibold text-white shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ background: ACCENT }}
      >
        {pending ? 'Sending...' : (
          <>
            <Heart className="w-4 h-4" /> Reply
          </>
        )}
      </motion.button>}
    </div>
  );
}
