'use client';

import { motion } from 'framer-motion';
import { CalendarDays, MapPin, Phone, ExternalLink } from 'lucide-react';
import { formatGreeting, applyName } from '@/lib/layouts';
import type { BackgroundMeta } from '@/lib/backgrounds';
import type { BaseCard } from '@/types/card';

/** 아래에서 떠오르며 페이드인 — invitation/index.html .fade-up 효과 포팅 */
function FadeUp({ delay = 0, children, style }: { delay?: number; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.8, delay, ease: 'easeOut' }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

interface Props {
  card: BaseCard;
  recipientName?: string;
  background?: BackgroundMeta;
  /** 카드 정보 박스 바로 아래 들어갈 슬롯 (RSVP 폼 등) */
  rsvpSlot?: React.ReactNode;
}

const COLORS = {
  primary: '#7B5EA7',
  primaryLight: '#9B7FCB',
  primaryDark: '#5A3D7A',
  accent: '#C9A0DC',
  accentLight: '#E8D5F5',
  textDark: '#3A2D4F',
  textMid: '#5E4B6B',
  textLight: '#8B7A9E',
  bgCream: '#FAF5FF'
} as const;

const SERIF = "'Noto Serif KR', serif";
const SANS = "'Noto Sans KR', sans-serif";

function formatDate(iso?: string | null) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const wday = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${date} (${wday}) at ${time}`;
  } catch { return iso; }
}

function isUrl(s?: string | null): s is string {
  if (!s) return false;
  return /^https?:\/\//i.test(s);
}

function Divider() {
  return (
    <div style={{ textAlign: 'center', padding: '10px 0' }}>
      <span style={{ color: COLORS.accent, fontSize: 18 }}>✽</span>
    </div>
  );
}

// 배경(bg_id)별 본문 색상 팔레트 — 배경 색감과 어울리도록 한 세트씩 정의
const BG_PALETTE: Record<string, { title: string; subtitle: string; accent: string }> = {
  'bg-1':     { title: '#5A3D7A', subtitle: '#8B7A9E', accent: '#C9A0DC' },  // Lavender
  'bg-2':     { title: '#6E5A3D', subtitle: '#9C8B6E', accent: '#D4C4A2' },  // Beige
  'bg-3':     { title: '#476956', subtitle: '#7AA088', accent: '#A0CCB1' },  // Mint
  'bg-4':     { title: '#8E5A4D', subtitle: '#B0857A', accent: '#E0A095' },  // Coral
  'bg-none':  { title: '#5A3D7A', subtitle: '#8B7A9E', accent: '#C9A0DC' }
};

export default function ClassicTemplateCard({ card, recipientName, background, rsvpSlot }: Props) {
  const greeting = formatGreeting(recipientName, card.recipient_template);
  const hasBgImage = !!background?.imageUrl;
  const palette = BG_PALETTE[card.bg_id] || BG_PALETTE['bg-1'];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 440,
        margin: '0 auto',
        background: hasBgImage ? '#fff' : (background?.gradient || COLORS.bgCream),
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(123,94,167,0.18)',
        fontFamily: SERIF,
        color: COLORS.textDark
      }}
    >
      {hasBgImage && (
        <img
          src={background!.imageUrl}
          alt=""
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0, pointerEvents: 'none'
          }}
        />
      )}
      <div style={{ position: 'relative', padding: '24px 20px 40px', zIndex: 1 }}>
        {/* 상단 장식 */}
        <FadeUp delay={0.05}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '8px 0 12px' }}>
            <div style={{ width: 60, height: 1, background: `linear-gradient(90deg, transparent, ${COLORS.accent}, transparent)` }} />
            <div style={{ color: COLORS.accent, fontSize: 18 }}>✽</div>
            <div style={{ width: 60, height: 1, background: `linear-gradient(90deg, transparent, ${COLORS.accent}, transparent)` }} />
          </div>
        </FadeUp>

        {/* 앞면: 부제 / 타이틀 / 인비테이션 / 본문 메시지 */}
        <FadeUp delay={0.1}>
          <div style={{ textAlign: 'center', padding: '8px 10px 12px' }}>
            {card.greeting_oneliner && (
              <p style={{ fontSize: 13, color: palette.subtitle, letterSpacing: '0.4em', marginBottom: 12, fontWeight: 300 }}>
                {applyName(card.greeting_oneliner, recipientName)}
              </p>
            )}
            <h1 style={{ fontSize: 24, fontWeight: 500, color: palette.title, letterSpacing: '0.4em', margin: '0 0 8px', lineHeight: 1.3 }}>
              {applyName(card.title, recipientName)}
            </h1>
            {card.body && <Divider />}
            {card.body && (
              <div style={{
                lineHeight: 2.0,
                color: COLORS.textDark,
                fontSize: 15,
                padding: '0 10px',
                textAlign: 'center',
                wordBreak: 'keep-all',     // 한국어 단어 단위 줄바꿈 (어절 중간에서 잘리지 않게)
                overflowWrap: 'break-word' // 너무 긴 단어만 예외적으로 분리
              }}>
                {applyName(card.body, recipientName).split(/\r?\n/).map((line, i, arr) => (
                  <span key={i}>
                    {line}
                    {i < arr.length - 1 && <br />}
                  </span>
                ))}
              </div>
            )}
          </div>
        </FadeUp>

        {/* 행사 정보: 일시 / 장소 / 주소 / 전화 */}
        <FadeUp delay={0.3}>
          <div style={{ textAlign: 'center', padding: '0 16px 16px' }}>
            {(card.event_date || card.event_place || card.map_url || card.contact_phone) && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                padding: '22px 24px',
                margin: '0 auto 14px',
                maxWidth: 320,
                background: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.7)',
                borderRadius: 18,
                boxShadow: '0 6px 22px rgba(123,94,167,0.10), inset 0 1px 0 rgba(255,255,255,0.6)',
                fontFamily: SANS,
                alignItems: 'stretch',
                textAlign: 'left'
              }}>
                {card.event_date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: COLORS.textDark, letterSpacing: '0.06em' }}>
                    <CalendarDays size={16} strokeWidth={1.4} style={{ color: COLORS.primary, flexShrink: 0 }} />
                    <span style={{ fontWeight: 500 }}>{formatDate(card.event_date)}</span>
                  </div>
                )}
                {(card.event_place || card.map_url) && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: COLORS.textDark, letterSpacing: '0.04em' }}>
                    <MapPin size={15} strokeWidth={1.4} style={{ color: COLORS.primary, flexShrink: 0, marginTop: 2 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                      {card.event_place && <span style={{ fontWeight: 500 }}>{card.event_place}</span>}
                      {card.map_url && (
                        <span style={{ fontSize: 12, color: COLORS.textMid, wordBreak: 'break-word' }}>
                          {isUrl(card.map_url) ? (
                            <a href={card.map_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: COLORS.primary, textDecoration: 'underline' }}>
                              View map <ExternalLink size={11} strokeWidth={1.5} />
                            </a>
                          ) : (
                            <span>{card.map_url}</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', fontFamily: SANS }}>

              {card.extra_info && (
                <div style={{
                  marginTop: 8, padding: '8px 20px', background: COLORS.accentLight,
                  borderRadius: 20, fontSize: 13, color: COLORS.primaryDark
                }}>
                  {applyName(card.extra_info, recipientName)}
                </div>
              )}
            </div>
          </div>
        </FadeUp>

        {rsvpSlot && (
          <FadeUp delay={0.35}>
            <div style={{ padding: '0 16px 18px' }}>
              {rsvpSlot}
            </div>
          </FadeUp>
        )}

        {card.contact_name && (
          <div style={{ textAlign: 'center', padding: '10px 20px 20px' }}>
            <p style={{ fontSize: 13, color: COLORS.textLight, letterSpacing: '0.15em' }}>
              — {applyName(card.contact_name, recipientName)} —
            </p>
            {card.contact_phone && (
              <p style={{ fontSize: 11, color: COLORS.textLight, marginTop: 4, letterSpacing: '0.05em', opacity: 0.8 }}>
                <a href={`tel:${card.contact_phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {card.contact_phone}
                </a>
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
