'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Calendar, MapPin, Phone, ExternalLink, Sparkles } from 'lucide-react';
import { useWizardStore } from '@/stores/wizardStore';
import { Button } from '@/components/ui';
import { getTheme } from '@/lib/theme';
import { getEventTypeMeta } from '@/lib/eventType';
import { publishCard } from '@/lib/actions/publishCard';

export default function StepPreview() {
  const router = useRouter();
  const { draft, reset } = useWizardStore();
  const [pending, startTransition] = useTransition();
  const theme = getTheme(draft.theme || 'hydrangea');
  const meta = getEventTypeMeta(draft.event_type || 'etc');

  const handlePublish = () => {
    startTransition(async () => {
      const res = await publishCard(draft);
      if (!res.ok) {
        toast.error(res.error || '발행 실패');
        return;
      }
      // owner token 저장
      if (res.slug && res.ownerToken) {
        localStorage.setItem(`dearday:owner:${res.slug}`, res.ownerToken);
      }
      toast.success('초대장이 발행되었어요!');
      reset();
      router.push(`/i/${res.slug}`);
    });
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', hour: 'numeric', minute: '2-digit' });
    } catch { return iso; }
  };

  return (
    <div>
      <h2 className="text-2xl font-serif text-hydrangea-700 mb-1">미리보기</h2>
      <p className="text-sm text-hydrangea-400 mb-6">발행 전 한 번 더 확인하세요</p>

      {/* Preview card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden shadow-lg"
        style={{ background: theme.colors.bgCard, fontFamily: theme.fontFamily, color: theme.colors.ink }}
      >
        <div className="p-8 text-center" style={{ background: `linear-gradient(180deg, ${theme.colors.accent}33, transparent)` }}>
          <div className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 border" style={{ borderColor: theme.colors.accent, color: theme.colors.primary }}>
            {meta.label}
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: theme.colors.deep }}>{draft.title}</h1>
          {draft.greeting_oneliner && (
            <p className="text-sm" style={{ color: theme.colors.muted }}>{draft.greeting_oneliner}</p>
          )}
        </div>

        <div className="p-6 space-y-4 text-sm">
          {draft.event_date && (
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: theme.colors.primary }} />
              <span>{formatDate(draft.event_date)}</span>
            </div>
          )}
          {draft.event_place && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: theme.colors.primary }} />
              <div className="flex-1">
                <div>{draft.event_place}</div>
                {draft.map_url && (
                  <a href={draft.map_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs mt-1" style={{ color: theme.colors.primary }}>
                    지도 보기 <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}
          {(draft.contact_name || draft.contact_phone) && (
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: theme.colors.primary }} />
              <span>{draft.contact_name} {draft.contact_phone}</span>
            </div>
          )}

          {draft.body && (
            <div className="p-4 rounded-xl whitespace-pre-line text-center leading-relaxed" style={{ background: theme.colors.bg, color: theme.colors.deep }}>
              {draft.body}
            </div>
          )}

          {draft.extra_info && (
            <div className="text-xs p-3 rounded-lg" style={{ background: theme.colors.bg, color: theme.colors.muted }}>
              {draft.extra_info}
            </div>
          )}
        </div>
      </motion.div>

      {/* Settings summary */}
      <div className="mt-6 p-4 rounded-xl bg-hydrangea-50 text-xs space-y-1.5">
        <div className="flex items-center gap-2 font-semibold text-hydrangea-700 mb-2">
          <Sparkles className="w-3.5 h-3.5" /> 설정 요약
        </div>
        <div className="flex justify-between"><span className="text-hydrangea-400">테마</span><span className="text-hydrangea-700 font-medium">{theme.name}</span></div>
        <div className="flex justify-between"><span className="text-hydrangea-400">봉투 효과</span><span className="text-hydrangea-700 font-medium">{draft.envelope_anim}</span></div>
        <div className="flex justify-between"><span className="text-hydrangea-400">RSVP</span><span className="text-hydrangea-700 font-medium">{draft.rsvp_enabled ? `사용 (최대 ${draft.rsvp_max_per_card}명)` : '미사용'}</span></div>
      </div>

      <div className="mt-8 sticky bottom-0 bg-white pt-4 pb-4 -mx-5 px-5 border-t border-hydrangea-100/50">
        <Button onClick={handlePublish} disabled={pending} full size="lg">
          {pending ? '발행 중...' : '🎉 발행하기'}
        </Button>
      </div>
    </div>
  );
}
