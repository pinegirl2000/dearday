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

export default function RsvpForm({ card, theme, recipientId, recipientName, compact = false }: Props) {
  const [attend, setAttend] = useState<boolean | null>(null);
  const [count, setCount] = useState(1);
  const [names, setNames] = useState<string[]>(['']);
  const [oneliner, setOneliner] = useState('');
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const max = card.rsvp_max_per_card || 4;

  const adjustCount = (delta: number) => {
    const next = Math.max(1, Math.min(max, count + delta));
    setCount(next);
    if (card.rsvp_collect_names) {
      setNames((prev) => {
        const arr = [...prev];
        while (arr.length < next) arr.push('');
        return arr.slice(0, next);
      });
    }
  };

  const handleSubmit = () => {
    if (attend === null) {
      toast.error('참석 여부를 선택해주세요');
      return;
    }
    startTransition(async () => {
      const res = await submitRsvp({
        card_id: card.id,
        slug: card.slug,
        recipient_id: recipientId,
        attend,
        count: attend ? count : 0,
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
        <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: theme.colors.primary }}>
          <Check className="w-6 h-6 text-white" strokeWidth={3} />
        </div>
        <p className="font-semibold text-base" style={{ color: theme.colors.deep }}>응답해 주셔서 감사합니다!</p>
        {attend && oneliner && (
          <p className="text-sm mt-2" style={{ color: theme.colors.muted }}>한줄 답신이 피드에 남았어요</p>
        )}
      </motion.div>
    );
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-4'}>
      <div className="text-center">
        <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-lg'}`} style={{ color: theme.colors.deep }}>참석 여부</h3>
        {card.rsvp_deadline && !compact && (
          <p className="text-xs mt-1" style={{ color: theme.colors.muted }}>
            {new Date(card.rsvp_deadline).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}까지
          </p>
        )}
      </div>

      {compact ? (
        /* compact: 참석/불참/응답 한 줄 */
        <div className="grid grid-cols-3 gap-1.5">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setAttend(true)}
            className="min-h-[34px] text-xs rounded-lg border-2 font-medium transition flex items-center justify-center gap-1"
            style={{
              background: attend === true ? theme.colors.primary : 'transparent',
              color: attend === true ? '#fff' : theme.colors.primary,
              borderColor: theme.colors.primary
            }}
          >
            <Check className="w-3 h-3" /> 참석
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setAttend(false)}
            className="min-h-[34px] text-xs rounded-lg border-2 font-medium transition flex items-center justify-center gap-1"
            style={{
              background: attend === false ? theme.colors.muted : 'transparent',
              color: attend === false ? '#fff' : theme.colors.muted,
              borderColor: theme.colors.muted
            }}
          >
            <X className="w-3 h-3" /> 불참
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={pending || attend === null}
            className="min-h-[34px] text-xs rounded-lg font-semibold text-white shadow disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            style={{ background: theme.colors.primary }}
          >
            {pending ? '...' : (<><Heart className="w-3 h-3" /> 응답</>)}
          </motion.button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setAttend(true)}
            className="min-h-[52px] rounded-xl border-2 font-medium transition flex items-center justify-center gap-2"
            style={{
              background: attend === true ? theme.colors.primary : 'transparent',
              color: attend === true ? '#fff' : theme.colors.primary,
              borderColor: theme.colors.primary
            }}
          >
            <Check className="w-4 h-4" /> 참석
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setAttend(false)}
            className="min-h-[52px] rounded-xl border-2 font-medium transition flex items-center justify-center gap-2"
            style={{
              background: attend === false ? theme.colors.muted : 'transparent',
              color: attend === false ? '#fff' : theme.colors.muted,
              borderColor: theme.colors.muted
            }}
          >
            <X className="w-4 h-4" /> 불참
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {attend === true && max > 1 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <div className={`flex items-center justify-between rounded-xl ${compact ? 'p-2' : 'p-4'}`} style={{ background: theme.colors.bg }}>
              <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: theme.colors.deep }}>참석 인원</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => adjustCount(-1)}
                  disabled={count <= 1}
                  className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} rounded-full flex items-center justify-center active:scale-90 transition disabled:opacity-30`}
                  style={{ background: theme.colors.bgCard, color: theme.colors.primary }}
                >
                  <Minus className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
                </button>
                <span className={`font-bold text-center ${compact ? 'w-5 text-sm' : 'w-8 text-lg'}`} style={{ color: theme.colors.deep }}>{count}</span>
                <button
                  onClick={() => adjustCount(1)}
                  disabled={count >= max}
                  className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} rounded-full flex items-center justify-center active:scale-90 transition disabled:opacity-30`}
                  style={{ background: theme.colors.bgCard, color: theme.colors.primary }}
                >
                  <Plus className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
                </button>
              </div>
            </div>

            {card.rsvp_collect_names && (
              <div className="space-y-2">
                {Array.from({ length: count }).map((_, i) => (
                  <input
                    key={i}
                    placeholder={`참석자 ${i + 1} 이름`}
                    value={names[i] || ''}
                    onChange={(e) => {
                      const arr = [...names];
                      arr[i] = e.target.value;
                      setNames(arr);
                    }}
                    className={`w-full px-3 rounded-xl border bg-white focus:outline-none focus:ring-2 ${compact ? 'min-h-[32px] text-xs' : 'min-h-[44px] text-sm'}`}
                    style={{ borderColor: theme.colors.accent + '66' }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {attend !== null && (
        <textarea
          placeholder="한줄 답신을 남겨주세요 (선택)"
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
        style={{ background: theme.colors.primary }}
      >
        {pending ? '전송 중...' : (
          <>
            <Heart className="w-4 h-4" /> 응답하기
          </>
        )}
      </motion.button>}
    </div>
  );
}
