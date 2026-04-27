'use client';

import { motion } from 'framer-motion';
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
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
      hour: 'numeric', minute: '2-digit'
    });
  } catch { return iso; }
}

function Divider() {
  return (
    <div style={{ textAlign: 'center', padding: '10px 0' }}>
      <span style={{ color: COLORS.accent, fontSize: 12 }}>✦</span>
    </div>
  );
}

export default function ClassicTemplateCard({ card, recipientName, background }: Props) {
  const greeting = formatGreeting(recipientName, card.recipient_template);
  const hasBgImage = !!background?.imageUrl;

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
      <div style={{ position: 'relative', padding: '40px 20px 50px', zIndex: 1 }}>
        {/* 상단 장식 */}
        <FadeUp delay={0.05}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '20px 0' }}>
            <div style={{ width: 60, height: 1, background: `linear-gradient(90deg, transparent, ${COLORS.accent}, transparent)` }} />
            <div style={{ color: COLORS.accent, fontSize: 18 }}>✽</div>
            <div style={{ width: 60, height: 1, background: `linear-gradient(90deg, transparent, ${COLORS.accent}, transparent)` }} />
          </div>
        </FadeUp>

        {/* 앞면: 부제 / 타이틀 / 인비테이션 */}
        <FadeUp delay={0.1}>
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            {card.greeting_oneliner && (
              <p style={{ fontSize: 13, color: COLORS.textLight, letterSpacing: '0.4em', marginBottom: 12, fontWeight: 300 }}>
                {applyName(card.greeting_oneliner, recipientName)}
              </p>
            )}
            <h1 style={{ fontSize: 30, fontWeight: 700, color: COLORS.primary, letterSpacing: '0.4em', margin: '0 0 16px', lineHeight: 1.3 }}>
              {applyName(card.title, recipientName)}
            </h1>
            <p style={{ fontSize: 15, color: COLORS.textMid, letterSpacing: '0.25em', fontWeight: 300 }}>
              당신을 초대합니다!
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.2}><Divider /></FadeUp>

        {/* 행사 정보 */}
        <FadeUp delay={0.3}>
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
              {/* 일시/장소는 InvitationView 상단 정보 패널에 표시 (중복 방지) */}
              {card.extra_info && (
                <div style={{
                  marginTop: 4, padding: '8px 20px', background: COLORS.accentLight,
                  borderRadius: 20, fontFamily: SANS, fontSize: 13, color: COLORS.primaryDark
                }}>
                  {applyName(card.extra_info, recipientName)}
                </div>
              )}
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={0.4}><Divider /></FadeUp>

        {/* 개인 메시지 */}
        <FadeUp delay={0.5}>
          <div style={{ textAlign: 'center', padding: '30px 20px' }}>
            {card.body && (
              <div style={{ lineHeight: 2.2, color: COLORS.textDark, fontSize: 15, whiteSpace: 'pre-line' }}>
                {applyName(card.body, recipientName)}
              </div>
            )}
            {card.contact_name && (
              <p style={{ marginTop: 30, fontSize: 13, color: COLORS.textLight, letterSpacing: '0.15em' }}>
                {applyName(card.contact_name, recipientName)} 드림
              </p>
            )}
          </div>
        </FadeUp>

        {/* 하단 장식 */}
        <FadeUp delay={0.6}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
            <span style={{ color: COLORS.accent, fontSize: 18 }}>✽</span>
          </div>
        </FadeUp>
      </div>
    </div>
  );
}
