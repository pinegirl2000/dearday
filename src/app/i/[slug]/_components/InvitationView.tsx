'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ClassicEnvelope, EnvelopeBeige, EnvelopeMint, EnvelopeCoral, EnvelopeBlue, EnvelopeBlackGold, SwayEnvelope, NoneEnvelope, COLOR_PALETTES, type EnvelopeColorId } from '@/components/envelopes';
import { resolveColorId } from '@/components/envelopes/palettes';
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
  'envelope-5': EnvelopeBlue,
  'envelope-6': EnvelopeBlackGold,
  'none': NoneEnvelope
} as const;

// 새 (type, color) 모델 파싱 — wizard와 동일 로직
type EnvelopeAnimType = 'none' | 'sway' | 'flip';
function parseEnvAnim(id: string | undefined | null): { type: EnvelopeAnimType; color: EnvelopeColorId } {
  if (!id || id === 'none') return { type: 'none', color: 'lavender' };
  if (id.includes(':')) {
    const [t, c] = id.split(':');
    return { type: t as EnvelopeAnimType, color: resolveColorId(c) };
  }
  const map: Record<string, { type: EnvelopeAnimType; color: string }> = {
    'envelope-1': { type: 'sway', color: 'lavender' },
    'envelope-2': { type: 'sway', color: 'beige' },
    'envelope-3': { type: 'sway', color: 'mint' },
    'envelope-4': { type: 'sway', color: 'coral' },
    'envelope-5': { type: 'sway', color: 'lightblue' },
    'envelope-6': { type: 'flip', color: 'blackgold' }
  };
  const m = map[id];
  if (m) return { type: m.type, color: resolveColorId(m.color) };
  return { type: 'sway', color: 'lavender' };
}

interface Props {
  card: BaseCard;
  feed?: React.ReactNode;
  recipientName?: string;
  recipientId?: string;
  existingRsvp?: MyRsvp | null;
}

export default function InvitationView({ card, feed, recipientName, recipientId, existingRsvp }: Props) {
  // 봉투 'none'이면 봉투 단계 건너뛰고 바로 카드 표시
  const [open, setOpen] = useState(card.envelope_anim === 'none');
  const [opening, setOpening] = useState(false);
  // envelope-6 전용: 봉투에서 카드로 같은 화면 내 부드럽게 morph (flip + scale)
  const [transitioning, setTransitioning] = useState(false);
  const theme = getTheme(card.theme);
  const meta = getEventTypeMeta(card.event_type);
  const envParsed = parseEnvAnim(card.envelope_anim);
  // 모든 sway 봉투는 generic SwayEnvelope(palette) 사용 — 기존 envelope-1~5도 동일
  const Envelope: any = envParsed.type === 'none' ? NoneEnvelope
    : envParsed.type === 'flip' ? EnvelopeBlackGold
    : SwayEnvelope;
  const envelopePalette = envParsed.type !== 'none' ? COLOR_PALETTES[envParsed.color] : undefined;

  // 봉투에 어울리는 버튼 색상 (envelope의 메인 톤과 매칭)
  const BUTTON_COLOR: Record<string, string> = {
    'envelope-1': '#A990CC',
    'envelope-2': '#9C8B6E',
    'envelope-3': '#82B095',
    'envelope-4': '#C68676',
    'envelope-5': '#8FB5D0',
    'envelope-6': '#D4AF37',
    'none':       '#7B5EA7'
  };
  const ENVELOPE_DEEP: Record<string, string> = {
    'envelope-1': '#5A3D7A',
    'envelope-2': '#6E5A3D',
    'envelope-3': '#476956',
    'envelope-4': '#8E5A4D',
    'envelope-5': '#5A7B96',
    'envelope-6': '#D4AF37',
    'none':       '#5A3D7A'
  };
  // 새 (type, color) 조합용 fallback — palette.accent 사용
  const buttonBg = BUTTON_COLOR[card.envelope_anim] || envelopePalette?.accent || '#A990CC';
  const envelopeDeep = ENVELOPE_DEEP[card.envelope_anim] || envelopePalette?.ink || envelopePalette?.bodyDark || '#5A3D7A';

  // 편지지 내용 — 선택한 레이아웃의 폰트/색상 적용
  const layout = getLayout(card.layout_id);
  const titleField = layout.fields.title;
  const dateField = layout.fields.date;

  const handleOpen = () => {
    if (opening || open || transitioning) return;
    setOpening(true);
    // none 타입은 onComplete 콜백이 없어 직접 setOpen
    if (envParsed.type === 'none') {
      setTimeout(() => setOpen(true), 500);
    }
  };

  // onComplete: transitioning만 켜고 open=true로 전환하지 않음 (페이지 재마운트 방지).
  // transitioning overlay에 풀 콘텐츠(TemplateCard + RSVP + footer) 렌더 → 깜빡임/리플로우 없음.
  const handleEnvelopeComplete = () => {
    if (envParsed.type === 'none') {
      setOpen(true);
    } else {
      setTransitioning(true);
    }
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
    'envelope-5': 'linear-gradient(135deg, #FFFFFF 0%, #F2F8FC 60%, #E0EDF6 100%)',  // Light Blue (밝게)
    'envelope-6': `
      /* 얇은 골드 vein — 선명하지만 가늘게 */
      linear-gradient(118deg, transparent 24.7%, rgba(196,163,106,0.30) 25%, transparent 25.3%),
      linear-gradient(132deg, transparent 56.7%, rgba(170,135,75,0.22) 57%, transparent 57.3%),
      linear-gradient(48deg, transparent 72.8%, rgba(196,163,106,0.18) 73%, transparent 73.2%),
      /* 얇은 회색 vein */
      linear-gradient(140deg, transparent 38.7%, rgba(90,95,110,0.22) 39%, transparent 39.3%),
      linear-gradient(64deg, transparent 84.8%, rgba(110,115,130,0.16) 85%, transparent 85.2%),
      linear-gradient(155deg, transparent 15.7%, rgba(140,140,150,0.14) 16%, transparent 16.3%),
      /* 부드러운 구름 패치 */
      radial-gradient(ellipse 65% 45% at 22% 28%, rgba(180,182,195,0.20) 0%, transparent 70%),
      radial-gradient(ellipse 55% 40% at 78% 72%, rgba(170,172,185,0.16) 0%, transparent 70%),
      radial-gradient(ellipse 50% 38% at 62% 22%, rgba(196,163,106,0.14) 0%, transparent 70%),
      /* 베이스 — 따뜻한 화이트 톤 */
      linear-gradient(135deg, #FAF8F4 0%, #F0EEE9 35%, #F5F3EE 60%, #EBE9E4 82%, #F8F6F2 100%)
    `,  // 얇은 vein의 차분한 대리석
    'none':       'linear-gradient(135deg, #F4ECFA 0%, #E8DFF3 60%, #D5C5E8 100%)'
  };
  // 새 (type, color) 조합 fallback — flip/sway 모두 envelope-6의 marble 텍스처 사용
  const fallbackBg = envParsed.type !== 'none'
    ? ENVELOPE_BG['envelope-6']
    : ENVELOPE_BG['envelope-1'];
  const envelopeBg = envParsed.type !== 'none' ? ENVELOPE_BG['envelope-6'] : (ENVELOPE_BG[card.envelope_anim] || fallbackBg);

  // 봉투 미열림 상태: 봉투만 표시 (전체화면)
  if (!open) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
        style={{ background: envelopeBg, paddingTop: '22vh' }}
      >
        {/* envelope-6 transition: 봉투를 빠르게 cross-fade out — overlay와 동시에 morph되도록 */}
        <motion.div
          className={`relative ${opening ? '' : 'cursor-pointer'}`}
          onClick={handleOpen}
          initial={false}
          animate={{ opacity: transitioning ? 0 : 1 }}
          transition={{ duration: 0.4, delay: 0, ease: 'easeOut' }}
        >
          <div className="relative">
          <Envelope
            isOpen={opening}
            width={380}
            palette={envelopePalette}
            recipientGreeting={formatGreeting(recipientName, card.recipient_template) || undefined}
            onComplete={handleEnvelopeComplete}
            cardPreview={envParsed.type !== 'none' ? (
              // 슬롯 = envelope width 100% × body height의 90% (= 380 × 196 for 380×266 envelope).
              // 회전 후 visual을 380×196에 정확히 맞추기 위해 비균등 scale:
              //   scaleX = 196/420 ≈ 0.467 (회전 후 height 매칭)
              //   scaleY = 380/700 ≈ 0.543 (회전 후 width 매칭)
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none', overflow: 'hidden'
              }}>
                <div style={{
                  width: 420,
                  flexShrink: 0,
                  transform: 'rotate(90deg) scale(0.467, 0.543)',
                  transformOrigin: 'center'
                }}>
                  <TemplateCard card={card} recipientName={recipientName} />
                </div>
              </div>
            ) : undefined}
          >
            <div style={{ textAlign: 'center', padding: '0 8px' }}>
              <div
                style={{
                  fontFamily: titleField.fontFamily || "'Noto Serif KR', serif",
                  fontWeight: titleField.fontWeight,
                  // 봉투 색상 계열로 통일
                  color: envelopeDeep,
                  fontSize: Math.min(titleField.fontSize, 16),
                  letterSpacing: titleField.letterSpacing,
                  lineHeight: titleField.lineHeight || 1.2,
                  marginBottom: 6
                }}
              >
                {applyName(card.title, recipientName)}
              </div>
              {card.event_date && (
                <div
                  style={{
                    fontFamily: dateField?.fontFamily || "'Noto Sans KR', sans-serif",
                    // 봉투 색상 계열, 살짝 옅게
                    color: envelopeDeep,
                    opacity: 0.75,
                    fontSize: 9,
                    letterSpacing: dateField?.letterSpacing,
                    marginTop: 4
                  }}
                >
                  {formatDate(card.event_date)}
                </div>
              )}
            </div>
          </Envelope>
          {!(opening && envParsed.type === 'flip') && card.envelope_anim !== 'none' && envParsed.type !== 'none' && recipientName && recipientName.trim() && (() => {
            const envHeight = Math.round(380 * 0.75);
            const isFlip = envParsed.type === 'flip';
            return (
              <div style={{
                position: 'absolute',
                left: '50%',
                top: `${Math.round(envHeight * (isFlip ? 0.75 : 1.0))}px`,
                transform: 'translate(-50%, -50%)',
                width: '85%',
                textAlign: 'center',
                color: envelopeDeep,
                fontFamily: "'Cormorant Garamond', 'Playfair Display', 'Noto Serif KR', serif",
                fontSize: 22,
                fontWeight: 500,
                fontVariant: 'small-caps',
                letterSpacing: '0.12em',
                textShadow: '0 1px 2px rgba(255,255,255,0.4)',
                pointerEvents: 'none',
                zIndex: 10
              }}>
                {recipientName}
              </div>
            );
          })()}
          </div>
        </motion.div>

        {/* envelope-6 transition: 카드가 flip + scale up되며 같은 화면에서 큰 카드로 morph */}
        {transitioning && envParsed.type !== 'none' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center px-4 overflow-y-auto"
            style={{ perspective: 1600, paddingTop: '5px', paddingBottom: '20px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0, ease: 'easeOut' }}
          >
            <motion.div
              className="w-full max-w-md my-auto"
              style={{ transformOrigin: 'center' }}
              initial={{ rotate: 90, scale: 0.489 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <TemplateCard
                card={card}
                recipientName={recipientName}
                rsvpSlot={card.rsvp_enabled ? (
                  <RsvpForm card={card} theme={theme} recipientId={recipientId} recipientName={recipientName} existingRsvp={existingRsvp} compact />
                ) : null}
              />
            </motion.div>
            <div className="text-center text-xs mt-4" style={{ color: theme.colors.muted }}>
              Powered by <a href="https://dearday.sg" className="font-semibold text-hydrangea-700">dearday.sg</a>
            </div>
          </motion.div>
        )}

        {/* 버튼은 항상 DOM에 유지 — 사라지면 flex 레이아웃이 재배치되어 봉투 위치가 살짝 시프트됨 */}
        <button
          onClick={handleOpen}
          disabled={opening}
          className="mt-8 px-5 py-2.5 rounded-full text-white text-sm font-medium shadow-lg active:scale-95 transition disabled:opacity-60"
          style={{
            background: buttonBg,
            opacity: transitioning ? 0 : 1,
            pointerEvents: transitioning ? 'none' : 'auto',
            transition: 'opacity 0.4s ease-out'
          }}
        >
          {opening ? 'Opening...' : 'Open invitation'}
        </button>
      </main>
    );
  }

  // 펼쳐진 카드 — envelope-6은 봉투 배경(대리석)을 그대로 유지 + center 정렬
  // (transition overlay가 center 정렬이어서 open=true로 전환 시 위치 점프 없게)
  const isE6 = envParsed.type === 'flip';
  const openMainBg = isE6 ? envelopeBg : theme.colors.bg;
  const openMainCls = isE6
    ? 'min-h-screen flex flex-col items-center justify-center px-4'
    : 'min-h-screen flex flex-col items-center pt-2 pb-8 px-4';
  return (
    <main className={openMainCls} style={{ background: openMainBg, fontFamily: theme.fontFamily, color: theme.colors.ink }}>
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
        Powered by <a href="https://dearday.sg" className="font-semibold text-hydrangea-700">dearday.sg</a>
      </footer>
    </main>
  );
}
