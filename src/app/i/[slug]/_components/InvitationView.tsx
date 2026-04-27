'use client';

import { useEffect, useState } from 'react';
import { Calendar, MapPin, Phone, ExternalLink, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { FoldEnvelope, SlideEnvelope, FlipEnvelope, PopEnvelope, NoneEnvelope } from '@/components/envelopes';
import { getTheme } from '@/lib/theme';
import { getEventTypeMeta } from '@/lib/eventType';
import type { BaseCard } from '@/types/card';
import RsvpForm from './RsvpForm';

const ENVELOPE_MAP = {
  flip: FlipEnvelope,
  fold: FoldEnvelope,
  slide: SlideEnvelope,
  pop: PopEnvelope,
  none: NoneEnvelope
} as const;

interface Props {
  card: BaseCard;
  feed?: React.ReactNode;
}

export default function InvitationView({ card, feed }: Props) {
  const [open, setOpen] = useState(false);
  const theme = getTheme(card.theme);
  const meta = getEventTypeMeta(card.event_type);
  const Envelope = ENVELOPE_MAP[card.envelope_anim] || FlipEnvelope;

  // sessionStorage로 1회만 봉투 표시
  useEffect(() => {
    const key = `dearday:opened:${card.slug}`;
    if (sessionStorage.getItem(key)) {
      setOpen(true);
    }
  }, [card.slug]);

  const handleOpen = () => {
    setOpen(true);
    sessionStorage.setItem(`dearday:opened:${card.slug}`, '1');
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', hour: 'numeric', minute: '2-digit' });
    } catch { return iso; }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: card.title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('링크가 복사되었어요');
    }
  };

  // 봉투 미열림 상태: 봉투만 표시 (전체화면)
  if (!open) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: `linear-gradient(135deg, ${theme.colors.bg}, ${theme.colors.accent}55)` }}
      >
        <div onClick={handleOpen} className="cursor-pointer">
          <Envelope isOpen={false} envelopeColor={theme.colors.primary} sealColor={theme.colors.accent} width={320}>
            <div style={{ color: theme.colors.deep }}>
              <p className="font-serif text-lg">{card.title}</p>
            </div>
          </Envelope>
        </div>
        <button
          onClick={handleOpen}
          className="mt-8 px-6 py-3 rounded-full text-white font-medium shadow-lg active:scale-95 transition"
          style={{ background: theme.colors.primary }}
        >
          초대장 열기
        </button>
      </main>
    );
  }

  // 펼쳐진 카드
  return (
    <main className="min-h-screen flex flex-col items-center py-8 px-4" style={{ background: theme.colors.bg, fontFamily: theme.fontFamily, color: theme.colors.ink }}>
      <article className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl" style={{ background: theme.colors.bgCard }}>
        {/* Header */}
        <header className="p-8 text-center" style={{ background: `linear-gradient(180deg, ${theme.colors.accent}33, transparent)` }}>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 border" style={{ borderColor: theme.colors.accent, color: theme.colors.primary }}>
            {meta.label}
          </span>
          <h1 className="text-3xl font-bold mb-3" style={{ color: theme.colors.deep }}>{card.title}</h1>
          {card.greeting_oneliner && <p className="text-sm" style={{ color: theme.colors.muted }}>{card.greeting_oneliner}</p>}
        </header>

        {/* Body */}
        <div className="p-6 space-y-5 text-sm">
          {card.event_date && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: theme.colors.primary }} />
              <span>{formatDate(card.event_date)}</span>
            </div>
          )}
          {card.event_place && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: theme.colors.primary }} />
              <div>
                <div>{card.event_place}</div>
                {card.map_url && (
                  <a href={card.map_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs mt-1" style={{ color: theme.colors.primary }}>
                    지도 보기 <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}
          {(card.contact_name || card.contact_phone) && (
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: theme.colors.primary }} />
              <a href={card.contact_phone ? `tel:${card.contact_phone}` : undefined} className="hover:underline">
                {card.contact_name} {card.contact_phone}
              </a>
            </div>
          )}

          {card.body && (
            <div className="p-5 rounded-2xl whitespace-pre-line text-center leading-relaxed" style={{ background: theme.colors.bg, color: theme.colors.deep }}>
              {card.body}
            </div>
          )}

          {card.extra_info && (
            <div className="text-xs p-3 rounded-lg" style={{ background: theme.colors.bg, color: theme.colors.muted }}>
              {card.extra_info}
            </div>
          )}
        </div>

        {/* RSVP */}
        {card.rsvp_enabled && (
          <div className="p-6 border-t" style={{ borderColor: theme.colors.accent + '33' }}>
            <RsvpForm card={card} theme={theme} />
          </div>
        )}

        {/* Feed */}
        {feed && (
          <div className="px-6 pb-6 pt-2 border-t" style={{ borderColor: theme.colors.accent + '33' }}>
            {feed}
          </div>
        )}

        {/* Share */}
        <div className="p-4 border-t" style={{ borderColor: theme.colors.accent + '33' }}>
          <button
            onClick={handleShare}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
            style={{ color: theme.colors.primary, background: theme.colors.bg }}
          >
            <Share2 className="w-4 h-4" /> 초대장 공유하기
          </button>
        </div>
      </article>

      <footer className="text-center text-xs mt-6" style={{ color: theme.colors.muted }}>
        made with <span className="font-semibold" style={{ color: theme.colors.primary }}>DearDay</span>
      </footer>
    </main>
  );
}
