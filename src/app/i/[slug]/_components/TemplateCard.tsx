'use client';

import { motion } from 'framer-motion';
// NOTE: framer-motion의 whileInView는 장식용 fade-in에만 사용. 본문/연락처처럼
// "반드시 보여야 하는" 정보는 whileInView로 감싸지 말 것 — IntersectionObserver
// 첫 측정 누락 시 opacity:0에 갇혀 영구히 안 보이는 사고가 났음.
import { getLayout, formatGreeting, applyName, type TextField } from '@/lib/layouts';
import { getBackground } from '@/lib/backgrounds';
import type { BaseCard } from '@/types/card';
import ClassicTemplateCard from './ClassicTemplateCard';

interface Props {
  card: BaseCard;
  recipientName?: string;
  rsvpSlot?: React.ReactNode;
}

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

function FieldText({ field, children, delay = 0 }: { field: TextField; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.8, delay, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        left: `${field.x}%`,
        top: `${field.y}%`,
        width: `${field.w}%`,
        textAlign: field.align,
        fontSize: field.fontSize,
        fontWeight: field.fontWeight,
        fontFamily: field.fontFamily,
        color: field.color,
        letterSpacing: field.letterSpacing,
        lineHeight: field.lineHeight,
        whiteSpace: 'pre-wrap'
      }}
    >
      {children}
    </motion.div>
  );
}

export default function TemplateCard({ card, recipientName, rsvpSlot }: Props) {
  const layout = getLayout(card.layout_id);
  const bg = getBackground(card.bg_id);

  if (layout.renderStyle === 'flow') {
    return <ClassicTemplateCard card={card} recipientName={recipientName} background={bg} rsvpSlot={rsvpSlot} />;
  }

  const f = layout.fields;
  const greeting = formatGreeting(recipientName, card.recipient_template);

  return (
    <div
      className="relative w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl"
      style={{
        aspectRatio: layout.aspectRatio.replace('/', ' / '),
        background: bg.imageUrl ? undefined : bg.gradient
      }}
    >
      {bg.imageUrl && (
        <img
          src={bg.imageUrl}
          alt={bg.name}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      )}
      {card.greeting_oneliner && f.subtitle && <FieldText field={f.subtitle} delay={0.1}>{applyName(card.greeting_oneliner, recipientName)}</FieldText>}
      <FieldText field={f.title} delay={0.2}>{applyName(card.title, recipientName)}</FieldText>
      {card.event_date && f.date && <FieldText field={f.date} delay={0.3}>{formatDate(card.event_date)}</FieldText>}
      {card.event_place && f.place && <FieldText field={f.place} delay={0.4}>{card.event_place}</FieldText>}
      {/* 주소(map_url)와 전화는 layout 필드에 없으므로 place 아래 또는 body 위에 인라인 배치 */}
      {(card.map_url || card.contact_phone || card.contact_name) && f.place && (
        <div
          style={{
            position: 'absolute',
            left: `${f.place.x}%`,
            top: `calc(${f.place.y}% + 24px)`,
            width: `${f.place.w}%`,
            textAlign: f.place.align,
            fontSize: 11,
            color: f.place.color,
            fontFamily: f.place.fontFamily,
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
        >
          {card.map_url && (
            isUrl(card.map_url) ? (
              <a href={card.map_url} target="_blank" rel="noreferrer" style={{ color: f.place.color, textDecoration: 'underline' }}>View map ↗</a>
            ) : (
              <span>{card.map_url}</span>
            )
          )}
          {card.contact_phone && (
            <a href={`tel:${card.contact_phone}`} style={{ color: f.place.color, textDecoration: 'none' }}>📞 {card.contact_phone}</a>
          )}
          {card.contact_name && <span>— {applyName(card.contact_name, recipientName)} —</span>}
        </div>
      )}
      {card.body && f.body && <FieldText field={f.body} delay={0.65}>{applyName(card.body, recipientName)}</FieldText>}
      {card.extra_info && f.extra && <FieldText field={f.extra} delay={0.75}>{applyName(card.extra_info, recipientName)}</FieldText>}
    </div>
  );
}
