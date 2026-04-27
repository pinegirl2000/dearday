'use client';

import { useState } from 'react';
import { Calendar, MapPin, Phone, ExternalLink, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { ClassicEnvelope, EnvelopeBeige, NoneEnvelope } from '@/components/envelopes';
import { getTheme } from '@/lib/theme';
import { getEventTypeMeta } from '@/lib/eventType';
import { formatGreeting, getLayout, applyName } from '@/lib/layouts';
import type { BaseCard } from '@/types/card';
import RsvpForm from './RsvpForm';
import TemplateCard from './TemplateCard';

const ENVELOPE_MAP = {
  'envelope-1': ClassicEnvelope,
  'envelope-2': EnvelopeBeige,
  'none': NoneEnvelope
} as const;

interface Props {
  card: BaseCard;
  feed?: React.ReactNode;
  recipientName?: string;
  recipientId?: string;
}

export default function InvitationView({ card, feed, recipientName, recipientId }: Props) {
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(false);
  const theme = getTheme(card.theme);
  const meta = getEventTypeMeta(card.event_type);
  const Envelope = ENVELOPE_MAP[card.envelope_anim] || ClassicEnvelope;

  // 봉투에 어울리는 버튼 색상 (envelope의 메인 톤과 매칭)
  const BUTTON_COLOR: Record<string, string> = {
    'envelope-1': '#A990CC',  // 라벤더
    'envelope-2': '#9C8B6E',  // 베이지/브라운
    'none':       '#7B5EA7'
  };
  const buttonBg = BUTTON_COLOR[card.envelope_anim] || '#A990CC';

  // 편지지 내용 — 선택한 레이아웃의 폰트/색상 적용
  const layout = getLayout(card.layout_id);
  const titleField = layout.fields.title;
  const dateField = layout.fields.date;

  const handleOpen = () => {
    if (opening || open) return;
    setOpening(true);
    // 1.5초 동안 봉투 열림 + 꽃잎 파티클 → 그 후 카드 화면으로 전환
    setTimeout(() => setOpen(true), 1500);
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
        {formatGreeting(recipientName, card.recipient_template) && (
          <p className="mb-4 text-base font-medium" style={{ color: theme.colors.deep }}>
            {formatGreeting(recipientName, card.recipient_template)}
          </p>
        )}
        <div onClick={handleOpen} className={opening ? '' : 'cursor-pointer'}>
          <Envelope isOpen={opening} width={320}>
            <div style={{ textAlign: 'center', padding: '0 8px' }}>
              {formatGreeting(recipientName, card.recipient_template) && (
                <div style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: titleField.color,
                  letterSpacing: '0.06em',
                  marginBottom: 10
                }}>
                  {formatGreeting(recipientName, card.recipient_template)}
                </div>
              )}
              <div
                style={{
                  fontFamily: titleField.fontFamily || "'Noto Serif KR', serif",
                  fontWeight: titleField.fontWeight,
                  color: titleField.color,
                  fontSize: Math.min(titleField.fontSize, 26),
                  letterSpacing: titleField.letterSpacing,
                  lineHeight: titleField.lineHeight || 1.2,
                  marginBottom: 8
                }}
              >
                {applyName(card.title, recipientName)}
              </div>
              {card.event_date && (
                <div
                  style={{
                    fontFamily: dateField?.fontFamily || "'Noto Sans KR', sans-serif",
                    color: dateField?.color || '#666',
                    fontSize: 12,
                    letterSpacing: dateField?.letterSpacing,
                    marginTop: 6
                  }}
                >
                  {formatDate(card.event_date)}
                </div>
              )}
            </div>
          </Envelope>
        </div>
        <button
          onClick={handleOpen}
          disabled={opening}
          className="mt-8 px-6 py-3 rounded-full text-white font-medium shadow-lg active:scale-95 transition disabled:opacity-60"
          style={{ background: buttonBg }}
        >
          {opening ? '열리는 중...' : '초대장 열기'}
        </button>
      </main>
    );
  }

  // 펼쳐진 카드
  return (
    <main className="min-h-screen flex flex-col items-center py-8 px-4" style={{ background: theme.colors.bg, fontFamily: theme.fontFamily, color: theme.colors.ink }}>
      {/* 템플릿 배경 카드 + 상단 정보 오버레이 */}
      <div className="relative w-full max-w-md mb-6">
        <TemplateCard card={card} recipientName={recipientName} />

        {/* 제목 아래에 떠있는 정보 패널 */}
        <div
          className="absolute left-1/2 -translate-x-1/2 px-4 py-2 text-center space-y-1 text-xs z-10"
          style={{
            top: '40%',
            color: theme.colors.deep,
            maxWidth: '88%'
          }}
        >
          {card.event_date && (
            <div className="flex items-center justify-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" style={{ color: theme.colors.primary }} />
              <span>{formatDate(card.event_date)}</span>
            </div>
          )}
          {card.event_place && (
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <MapPin className="w-3.5 h-3.5" style={{ color: theme.colors.primary }} />
              <span>{card.event_place}</span>
              {card.map_url && (
                <a href={card.map_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-[10px] underline" style={{ color: theme.colors.primary }}>
                  지도 보기 <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          )}
          {card.rsvp_enabled && (
            <p className="text-[10px] pt-0.5" style={{ color: theme.colors.muted }}>
              아래 참석여부를 기입해 주세요 ↓
            </p>
          )}
        </div>

        {/* RSVP — 카드 안쪽 하단 압축 풀 폼 */}
        {card.rsvp_enabled && (
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-3 px-3 py-2 rounded-xl backdrop-blur-sm z-10"
            style={{
              background: 'rgba(255,255,255,0.78)',
              width: '88%',
              boxShadow: '0 4px 14px rgba(0,0,0,0.08)'
            }}
          >
            <RsvpForm card={card} theme={theme} recipientId={recipientId} recipientName={recipientName} compact />
          </div>
        )}
      </div>

      {/* 연락처 + Feed + Share */}
      <article className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl" style={{ background: theme.colors.bgCard }}>
        {(card.contact_name || card.contact_phone) && (
          <div className="p-5 text-sm border-t" style={{ borderColor: theme.colors.accent + '33' }}>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: theme.colors.primary }} />
              <a href={card.contact_phone ? `tel:${card.contact_phone}` : undefined} className="hover:underline">
                {card.contact_name} {card.contact_phone}
              </a>
            </div>
          </div>
        )}

        {feed && (
          <div className="px-6 pb-6 pt-2 border-t" style={{ borderColor: theme.colors.accent + '33' }}>
            {feed}
          </div>
        )}

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
