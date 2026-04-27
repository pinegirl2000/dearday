'use client';

import { motion } from 'framer-motion';
import { getLayout, formatGreeting, applyName, type TextField } from '@/lib/layouts';
import { getBackground } from '@/lib/backgrounds';
import type { BaseCard } from '@/types/card';
import ClassicTemplateCard from './ClassicTemplateCard';

interface Props {
  card: BaseCard;
  recipientName?: string;
}

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
        whiteSpace: 'pre-line'
      }}
    >
      {children}
    </motion.div>
  );
}

export default function TemplateCard({ card, recipientName }: Props) {
  const layout = getLayout(card.layout_id);
  const bg = getBackground(card.bg_id);

  // flow 레이아웃은 별도 컴포넌트로 (배경은 ClassicTemplateCard 내부에서 처리)
  if (layout.renderStyle === 'flow') {
    return <ClassicTemplateCard card={card} recipientName={recipientName} background={bg} />;
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
      {/* greeting은 카드에 표시하지 않음 — 봉투 편지지에만 표시 */}
      {card.greeting_oneliner && f.subtitle && <FieldText field={f.subtitle} delay={0.1}>{applyName(card.greeting_oneliner, recipientName)}</FieldText>}
      <FieldText field={f.title} delay={0.2}>{applyName(card.title, recipientName)}</FieldText>
      {/* 일시/장소는 InvitationView 상단 정보 패널에 표시 (중복 방지) */}
      {card.body && f.body && <FieldText field={f.body} delay={0.55}>{applyName(card.body, recipientName)}</FieldText>}
      {card.extra_info && f.extra && <FieldText field={f.extra} delay={0.65}>{applyName(card.extra_info, recipientName)}</FieldText>}
    </div>
  );
}
