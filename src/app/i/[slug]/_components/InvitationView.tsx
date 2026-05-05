'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ClassicEnvelope, EnvelopeBeige, EnvelopeMint, EnvelopeCoral, NoneEnvelope } from '@/components/envelopes';
import { getTheme } from '@/lib/theme';
import { getEventTypeMeta } from '@/lib/eventType';
import { formatGreeting, getLayout, applyName } from '@/lib/layouts';
import type { BaseCard } from '@/types/card';
import RsvpForm from './RsvpForm';
import TemplateCard from './TemplateCard';
import type { MyRsvp } from '@/lib/actions/submitRsvp';

const ENVELOPE_MAP = {
  'envelope-1': ClassicEnvelope,
  'envelope-2': EnvelopeBeige,
  'envelope-3': EnvelopeMint,
  'envelope-4': EnvelopeCoral,
  'none': NoneEnvelope
} as const;

interface Props {
  card: BaseCard;
  feed?: React.ReactNode;
  recipientName?: string;
  recipientId?: string;
  existingRsvp?: MyRsvp | null;
}

export default function InvitationView({ card, feed, recipientName, recipientId, existingRsvp }: Props) {
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(false);
  const theme = getTheme(card.theme);
  const meta = getEventTypeMeta(card.event_type);
  const Envelope = ENVELOPE_MAP[card.envelope_anim] || ClassicEnvelope;

  // 봉투에 어울리는 버튼 색상 (envelope의 메인 톤과 매칭)
  const BUTTON_COLOR: Record<string, string> = {
    'envelope-1': '#A990CC',
    'envelope-2': '#9C8B6E',
    'envelope-3': '#82B095',
    'envelope-4': '#C68676',
    'none':       '#7B5EA7'
  };
  const ENVELOPE_DEEP: Record<string, string> = {
    'envelope-1': '#5A3D7A',
    'envelope-2': '#6E5A3D',
    'envelope-3': '#476956',
    'envelope-4': '#8E5A4D',
    'none':       '#5A3D7A'
  };
  const buttonBg = BUTTON_COLOR[card.envelope_anim] || '#A990CC';
  const envelopeDeep = ENVELOPE_DEEP[card.envelope_anim] || '#5A3D7A';

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
      const date = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const wday = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      return `${date} (${wday}) at ${time}`;
    } catch { return iso; }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: card.title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    }
  };

  // 봉투 색상에 어울리는 배경 그라데이션
  const ENVELOPE_BG: Record<string, string> = {
    'envelope-1': 'linear-gradient(135deg, #F4ECFA 0%, #E8DFF3 60%, #D5C5E8 100%)',  // Lavender
    'envelope-2': 'linear-gradient(135deg, #FBF5E8 0%, #F0E5CD 60%, #E8DCC4 100%)',  // Beige
    'envelope-3': 'linear-gradient(135deg, #F1FAF4 0%, #DBEEDF 60%, #C8E5D2 100%)',  // Mint
    'envelope-4': 'linear-gradient(135deg, #FFF1EB 0%, #F8D3C9 60%, #F2C0B3 100%)',  // Coral
    'none':       'linear-gradient(135deg, #F4ECFA 0%, #E8DFF3 60%, #D5C5E8 100%)'
  };
  const envelopeBg = ENVELOPE_BG[card.envelope_anim] || ENVELOPE_BG['envelope-1'];

  // 봉투 미열림 상태: 봉투만 표시 (전체화면)
  if (!open) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: envelopeBg }}
      >
        <div onClick={handleOpen} className={`relative ${opening ? '' : 'cursor-pointer'}`}>
          <Envelope isOpen={opening} width={320}>
            <div style={{ textAlign: 'center', padding: '0 8px' }}>
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
          {card.envelope_anim !== 'none' && formatGreeting(recipientName, card.recipient_template) && (() => {
            const envHeight = Math.round(320 * 0.7);
            return (
              <div style={{
                position: 'absolute',
                left: '50%',
                top: `${Math.round(envHeight * 0.78)}px`,
                transform: 'translateX(-50%)',
                width: '85%',
                textAlign: 'center',
                color: envelopeDeep,
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: '0.04em',
                textShadow: '0 1px 2px rgba(255,255,255,0.4)',
                pointerEvents: 'none',
                zIndex: 10
              }}>
                {formatGreeting(recipientName, card.recipient_template)}
              </div>
            );
          })()}
        </div>
        <button
          onClick={handleOpen}
          disabled={opening}
          className="mt-8 px-5 py-2.5 rounded-full text-white text-sm font-medium shadow-lg active:scale-95 transition disabled:opacity-60"
          style={{ background: buttonBg }}
        >
          {opening ? 'Opening...' : 'Open invitation'}
        </button>
      </main>
    );
  }

  // 펼쳐진 카드
  return (
    <main className="min-h-screen flex flex-col items-center pt-2 pb-8 px-4" style={{ background: theme.colors.bg, fontFamily: theme.fontFamily, color: theme.colors.ink }}>
      {/* 템플릿 카드 (반투명 정보박스 아래에 RSVP 포함) */}
      <div className="relative w-full max-w-md mb-6">
        <TemplateCard
          card={card}
          recipientName={recipientName}
          rsvpSlot={card.rsvp_enabled ? (
            <RsvpForm card={card} theme={theme} recipientId={recipientId} recipientName={recipientName} existingRsvp={existingRsvp} compact />
          ) : null}
        />
      </div>

      <footer className="text-center text-xs mt-2" style={{ color: theme.colors.muted }}>
        made with <a href="https://dearday.sg" className="font-semibold text-hydrangea-700">dearday.sg</a>
      </footer>
    </main>
  );
}
