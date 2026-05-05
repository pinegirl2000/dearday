'use client';

import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { applyName } from '@/lib/layouts';
import { getEventLabelScript } from '@/lib/eventType';
import { findTemplateByPair } from '@/lib/templates';
import type { BackgroundMeta } from '@/lib/backgrounds';
import type { BaseCard } from '@/types/card';

interface Props {
  card: BaseCard;
  recipientName?: string;
  background?: BackgroundMeta;
  rsvpSlot?: React.ReactNode;
}

const SCRIPT = "'Sacramento', 'Great Vibes', cursive";
const SERIF_BOLD = "'Playfair Display', 'Cormorant Garamond', 'Noto Serif KR', serif";
const SERIF = "'Cormorant Garamond', 'Noto Serif KR', serif";

function FadeUp({ delay = 0, children, style }: { delay?: number; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

function SplitDate({ iso, color }: { iso: string; color: string }) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const day = String(d.getDate());
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    .replace(':00', '').toUpperCase();
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      color,
      fontFamily: SERIF
    }}>
      <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: '0.18em' }}>{weekday}</span>
      <span style={{ width: 1, height: 50, background: color, opacity: 0.55 }} />
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.05 }}>
        <span style={{ fontSize: 32, fontWeight: 700 }}>{day}</span>
        <span style={{ fontSize: 13, letterSpacing: '0.2em' }}>{month}</span>
      </span>
      <span style={{ width: 1, height: 50, background: color, opacity: 0.55 }} />
      <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: '0.18em' }}>AT {time}</span>
    </div>
  );
}

function isUrl(s?: string | null): s is string {
  if (!s) return false;
  return /^https?:\/\//i.test(s);
}

export default function VintageScriptCard({ card, recipientName, background, rsvpSlot }: Props) {
  const tpl = findTemplateByPair(card.bg_id, card.layout_id);
  const main = tpl?.colorMain || '#1A2A3A';
  const sub = tpl?.colorSub || main;
  const hasBgImage = !!background?.imageUrl;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 440,
        margin: '0 auto',
        background: hasBgImage ? '#fff' : (background?.gradient || '#F4ECFA'),
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(123,94,167,0.18)',
        fontFamily: SERIF,
        color: main
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
      <div style={{ position: 'relative', padding: '32px 24px 32px', zIndex: 1, textAlign: 'center' }}>
        {/* subtitle(greeting_oneliner)은 vintage 레이아웃에서도 노출 안 함 —
            Wedding Party 스크립트가 충분한 컨텍스트 제공 */}

        {/* 1. Wedding Party 스크립트 — 이벤트별 자동 */}
        <FadeUp delay={0.1}>
          <div style={{
            fontFamily: SCRIPT,
            fontSize: 44, fontWeight: 400, color: main,
            lineHeight: 1, marginBottom: 18
          }}>
            {getEventLabelScript(card.event_type)}
          </div>
        </FadeUp>

        {/* 3. 메인 이름 */}
        <FadeUp delay={0.15}>
          <h1 style={{
            fontFamily: SERIF_BOLD,
            fontSize: 30, fontWeight: 700, color: main,
            letterSpacing: '0.06em', lineHeight: 1.2,
            margin: 0, marginBottom: 18,
            whiteSpace: 'pre-wrap',
            wordBreak: 'keep-all'
          }}>
            {applyName(card.title, recipientName)}
          </h1>
        </FadeUp>

        {/* 4. Divider */}
        {card.body && (
          <FadeUp delay={0.2}>
            <div style={{ color: main, opacity: 0.6, fontSize: 18, margin: '8px 0 14px' }}>✽</div>
          </FadeUp>
        )}

        {/* 5. 본문 */}
        {card.body && (
          <FadeUp delay={0.22}>
            <div style={{
              fontSize: 13, color: main, lineHeight: 1.8,
              letterSpacing: '0.02em', margin: '0 auto 22px',
              maxWidth: 320, padding: '0 8px',
              textAlign: 'center', wordBreak: 'keep-all', overflowWrap: 'break-word'
            }}>
              {applyName(card.body, recipientName).split(/\r?\n/).map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
            </div>
          </FadeUp>
        )}

        {/* 6. 정보 박스 (반투명 흰색) — date + place */}
        {(card.event_date || card.event_place || card.map_url) && (
          <FadeUp delay={0.3}>
            <div style={{
              maxWidth: 340, margin: '0 auto 18px',
              padding: '18px 20px',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.35) 100%)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.7)',
              borderRadius: 14,
              boxShadow: '0 8px 22px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
              display: 'flex', flexDirection: 'column', gap: 12
            }}>
              {card.event_date && <SplitDate iso={card.event_date} color={main} />}
              {(card.event_place || card.map_url) && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'baseline',
                  justifyContent: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                  fontSize: 12, color: main,
                  letterSpacing: '0.16em',
                  fontFamily: SERIF
                }}>
                  {card.event_place && <span>{card.event_place}</span>}
                  {card.map_url && isUrl(card.map_url) && (
                    <a
                      href={card.map_url}
                      target="_blank"
                      rel="noreferrer"
                      title="View map"
                      aria-label="View map"
                      style={{ color: main, display: 'inline-flex', alignItems: 'center', opacity: 0.75 }}
                    >
                      <MapPin size={13} strokeWidth={1.6} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </FadeUp>
        )}

        {/* 7. RSVP slot (if any) */}
        {rsvpSlot && (
          <FadeUp delay={0.35}>
            <div style={{ margin: '0 0 18px' }}>{rsvpSlot}</div>
          </FadeUp>
        )}

        {/* 8. 호스트 (위) → 전화번호 (아래) */}
        {(card.contact_phone || card.contact_name) && (
          <div style={{ margin: '14px 0 8px', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', fontFamily: SERIF }}>
            {card.contact_name && (
              <p style={{ fontSize: 11, color: main, letterSpacing: '0.12em', margin: 0 }}>
                — {applyName(card.contact_name, recipientName)} —
              </p>
            )}
            {card.contact_phone && (
              <a href={`tel:${card.contact_phone}`}
                style={{ color: main, textDecoration: 'none', fontSize: 12 }}
              >
                {card.contact_phone}
              </a>
            )}
          </div>
        )}

        {/* 9. extra (Reception to follow 같은 안내) */}
        {card.extra_info && (
          <FadeUp delay={0.45}>
            <p style={{
              marginTop: 14, marginBottom: 0,
              fontSize: 11, color: sub, opacity: 0.85,
              lineHeight: 1.6, letterSpacing: '0.05em',
              fontFamily: SERIF
            }}>
              {applyName(card.extra_info, recipientName)}
            </p>
          </FadeUp>
        )}
      </div>
    </div>
  );
}
