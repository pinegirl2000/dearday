'use client';

import { motion } from 'framer-motion';
import { Phone, MapPin } from 'lucide-react';
// NOTE: framer-motion의 whileInView는 장식용 fade-in에만 사용. 본문/연락처처럼
// "반드시 보여야 하는" 정보는 whileInView로 감싸지 말 것 — IntersectionObserver
// 첫 측정 누락 시 opacity:0에 갇혀 영구히 안 보이는 사고가 났음.
import { getLayout, formatGreeting, applyName, type TextField } from '@/lib/layouts';
import { getBackground } from '@/lib/backgrounds';
import { getEventLabelText, getEventLabelScript } from '@/lib/eventType';
import { findTemplateByPair } from '@/lib/templates';
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

/** Vintage Script 전용 — SUNDAY | 15 NOV | AT 5 PM 3분할 + 세로 디바이더 */
function SplitDate({ field, iso, delay = 0 }: { field: TextField; iso: string; delay?: number }) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const day = String(d.getDate());
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    .toLowerCase().replace(/\s/g, ' ');
  const time12 = `AT ${time.replace(':00', '').toUpperCase()}`;
  const divColor = field.color || '#1A2A3A';
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
        color: field.color,
        fontFamily: field.fontFamily,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14
      }}
    >
      <span style={{ fontSize: field.fontSize, letterSpacing: field.letterSpacing, fontWeight: field.fontWeight }}>
        {weekday}
      </span>
      <span style={{ width: 1, height: 36, background: divColor, opacity: 0.55 }} />
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1 }}>
        <span style={{ fontSize: (field.fontSize || 13) + 8, fontWeight: 600 }}>{day}</span>
        <span style={{ fontSize: (field.fontSize || 13) - 2, letterSpacing: '0.18em' }}>{month}</span>
      </span>
      <span style={{ width: 1, height: 36, background: divColor, opacity: 0.55 }} />
      <span style={{ fontSize: field.fontSize, letterSpacing: field.letterSpacing, fontWeight: field.fontWeight }}>
        {time12}
      </span>
    </motion.div>
  );
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
  const tpl = findTemplateByPair(card.bg_id, card.layout_id);

  if (layout.renderStyle === 'flow') {
    return <ClassicTemplateCard card={card} recipientName={recipientName} background={bg} rsvpSlot={rsvpSlot} />;
  }

  // 페어링된 템플릿 색상으로 layout 필드 색상 override
  const tplMain = tpl?.colorMain;
  const tplSub = tpl?.colorSub;
  const withColor = (field: TextField | undefined, color?: string): TextField | undefined => {
    if (!field || !color) return field;
    return { ...field, color };
  };
  const baseFields = layout.fields;
  const f = {
    ...baseFields,
    eventLabel: withColor(baseFields.eventLabel, tplMain),
    title: withColor(baseFields.title, tplMain) || baseFields.title,
    // greeting_oneliner(subtitle)도 메인 색상 사용
    subtitle: withColor(baseFields.subtitle, tplMain),
    body: withColor(baseFields.body, tplMain),
    date: withColor(baseFields.date, tplSub),
    place: withColor(baseFields.place, tplSub),
    extra: withColor(baseFields.extra, tplSub)
  };
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
      {f.eventLabel && (
        <FieldText field={f.eventLabel} delay={0.05}>
          {layout.id === 'layout-4' ? getEventLabelScript(card.event_type) : getEventLabelText(card.event_type)}
        </FieldText>
      )}
      {card.greeting_oneliner && f.subtitle && <FieldText field={f.subtitle} delay={0.1}>{applyName(card.greeting_oneliner, recipientName)}</FieldText>}
      <FieldText field={f.title} delay={0.2}>{applyName(card.title, recipientName)}</FieldText>
      {card.event_date && f.date && (
        layout.id === 'layout-4'
          ? <SplitDate field={f.date} iso={card.event_date} delay={0.3} />
          : <FieldText field={f.date} delay={0.3}>{formatDate(card.event_date)}</FieldText>
      )}
      {card.event_place && f.place && (
        <FieldText field={f.place} delay={0.4}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <span>{card.event_place}</span>
            {card.map_url && (
              isUrl(card.map_url) ? (
                <a href={card.map_url} target="_blank" rel="noreferrer"
                  style={{ color: f.place.color, textDecoration: 'underline', fontSize: '0.6em', opacity: 0.75 }}
                >view map ↗</a>
              ) : null
            )}
          </span>
        </FieldText>
      )}
      {/* 전화/호스트는 place 아래 인라인 배치 (map_url은 place와 함께 한 줄에 합쳐짐) */}
      {(card.contact_phone || card.contact_name) && f.place && (
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
          {card.contact_phone && (
            <a
              href={`tel:${card.contact_phone}`}
              style={{ color: f.place.color, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Phone size={11} strokeWidth={1.6} style={{ color: f.place.color }} />
              {card.contact_phone}
            </a>
          )}
          {card.contact_name && <span>— {applyName(card.contact_name, recipientName)} —</span>}
        </div>
      )}
      {card.body && f.body && <FieldText field={f.body} delay={0.65}>{applyName(card.body, recipientName)}</FieldText>}
      {card.extra_info && f.extra && <FieldText field={f.extra} delay={0.75}>{applyName(card.extra_info, recipientName)}</FieldText>}
    </div>
  );
}
