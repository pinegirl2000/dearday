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
import VintageScriptCard from './VintageScriptCard';

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

/** layout-3 같은 모던 디자인 전용 — 11.12.2025 형식 */
function formatDateCompact(iso?: string | null) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  } catch { return iso || ''; }
}

function isUrl(s?: string | null): s is string {
  if (!s) return false;
  return /^https?:\/\//i.test(s);
}

/** Modern Bold 전용 — MAY | 18 | 2025 + SATURDAY, AT 6 O'CLOCK 2줄 */
function ModernSplitDate({ field, iso, delay = 0 }: { field: TextField; iso: string; delay?: number }) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = String(d.getDate());
  const year = String(d.getFullYear());
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const hour = d.getHours();
  const minutes = d.getMinutes();
  // "AT 6 O'CLOCK" 또는 "AT 6:30 PM"
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const timeText = minutes === 0
    ? `AT ${h12} O'CLOCK${ampm === 'PM' ? ' PM' : ''}`
    : `AT ${h12}:${String(minutes).padStart(2, '0')} ${ampm}`;
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
        textAlign: 'center'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 8 }}>
        <span style={{ fontSize: (field.fontSize || 13) + 6, fontWeight: 600, letterSpacing: '0.18em' }}>{month}</span>
        <span style={{ width: 1, height: 26, background: divColor, opacity: 0.55 }} />
        <span style={{ fontSize: (field.fontSize || 13) + 12, fontWeight: 700 }}>{day}</span>
        <span style={{ width: 1, height: 26, background: divColor, opacity: 0.55 }} />
        <span style={{ fontSize: (field.fontSize || 13) + 6, fontWeight: 600, letterSpacing: '0.12em' }}>{year}</span>
      </div>
      <div style={{ fontSize: field.fontSize || 13, fontWeight: 500, letterSpacing: '0.18em' }}>
        {weekday}, {timeText}
      </div>
    </motion.div>
  );
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
    if (layout.id === 'layout-4') {
      return <VintageScriptCard card={card} recipientName={recipientName} background={bg} rsvpSlot={rsvpSlot} />;
    }
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
    // date/place는 정보박스 안에 들어가므로 메인 색상으로 또렷하게
    date: withColor(baseFields.date, tplMain),
    place: withColor(baseFields.place, tplMain),
    extra: withColor(baseFields.extra, tplSub)
  };
  const greeting = formatGreeting(recipientName, card.recipient_template);

  return (
    <div className="w-full max-w-md mx-auto">
    <div
      className="relative w-full rounded-3xl overflow-hidden shadow-2xl"
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
          {(layout.id === 'layout-4' || (layout.id === 'layout-3' || layout.id === 'layout-center') || (layout.id === 'layout-5' || layout.id === 'layout-rightbottom') || layout.id === 'layout-6' || layout.id === 'layout-topcenter')
            ? getEventLabelScript(card.event_type)
            : getEventLabelText(card.event_type)}
        </FieldText>
      )}
      {/* Side Text + Baptism: 우측 컬럼의 가로 중앙에 큰 십자가 — 템플릿 sub 색상 */}
      {(layout.id === 'layout-5' || layout.id === 'layout-rightbottom') && card.event_type === 'baptism' && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%',
            right: 0,
            top: '6%',
            textAlign: 'center',
            color: tplSub || tplMain || '#5E6B7C',
            fontSize: 56,
            lineHeight: 1,
            fontFamily: 'serif',
            opacity: 0.85
          }}
        >
          ✝
        </div>
      )}
      {card.greeting_oneliner && f.subtitle && <FieldText field={f.subtitle} delay={0.1}>{applyName(card.greeting_oneliner, recipientName)}</FieldText>}
      <FieldText field={f.title} delay={0.2}>{applyName(card.title, recipientName)}</FieldText>
      {/* Side Text + Center Text: 하단 date+place 영역 정보 박스 — 템플릿 sub 색상 톤 (없으면 흰색) */}
      {((layout.id === 'layout-5' || layout.id === 'layout-rightbottom') || layout.id === 'layout-6') && (card.event_date || card.event_place) && f.date && f.place && (() => {
        // sub 색상이 정의된 경우에만 sub 톤 적용. 없으면 순수 흰색 박스 + 중성 그림자.
        const hasSub = !!tplSub;
        const subTint = tplSub || '#FFFFFF';
        return (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            style={{
              position: 'absolute',
              // layout-5(Rightside): 우측에 좁고 세로로 긴 박스. 그 외: 카드 전체 폭.
              left: layout.id === 'layout-5' ? '38%' : '6%',
              right: layout.id === 'layout-5' ? '5%' : '6%',
              top: layout.id === 'layout-6'
                ? `calc(${f.date.y + 0.5}%)`
                : layout.id === 'layout-5'
                  ? `calc(${f.date.y - 5}%)`
                  : layout.id === 'layout-rightbottom'
                    ? `calc(${f.date.y - 3}%)`
                    : `calc(${f.date.y - 1}%)`,
              // layout-6: extra(Reception to follow 등)도 박스 안에 포함.
              // layout-5/rightbottom: 박스 안 date+place(view map 포함) 가로세로 중앙정렬.
              bottom: layout.id === 'layout-6' && f.extra
                ? `calc(${100 - (f.extra.y + 4)}%)`
                : layout.id === 'layout-5'
                  ? `calc(${100 - (f.place.y + 13)}%)`
                  : layout.id === 'layout-rightbottom'
                    ? `calc(${100 - (f.place.y + 8)}%)`
                    : `calc(${100 - (f.place.y + 3)}%)`,
              // sub 있으면: 흰색 반투명 위에 sub 솔리드 → 톤 비치는 frosted
              // sub 없으면: 그냥 흰색 그라디언트
              background: hasSub
                ? `linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.68) 100%), ${subTint}`
                : 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.82) 100%)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              border: hasSub ? `1px solid ${subTint}55` : '1px solid rgba(255,255,255,0.85)',
              borderRadius: 14,
              boxShadow: hasSub
                ? `0 6px 14px ${subTint}26, inset 0 1px 0 rgba(255,255,255,0.85)`
                : '0 8px 18px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.95)',
              zIndex: 0
            }}
          />
        );
      })()}
      {/* Side Text 전용: 박스 아래 호스트 이름 + 전화 (extra 위) */}
      {(layout.id === 'layout-5' || layout.id === 'layout-rightbottom') && (card.contact_name || card.contact_phone) && (
        <div
          style={{
            position: 'absolute',
            left: '6%', right: '6%',
            top: '88%',
            textAlign: 'center',
            color: tplMain || '#5E6B7C',
            fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif",
            display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center'
          }}
        >
          {card.contact_name && (
            <p style={{ fontSize: 12, letterSpacing: '0.1em', margin: 0 }}>
              — {applyName(card.contact_name, recipientName)} —
            </p>
          )}
          {card.contact_phone && (
            <a href={`tel:${card.contact_phone}`} style={{ color: 'inherit', textDecoration: 'none', fontSize: 11 }}>
              {card.contact_phone}
            </a>
          )}
        </div>
      )}
      {/* Vintage Script 전용: 날짜/장소 영역을 감싸는 반투명 흰색 정보 박스 */}
      {layout.id === 'layout-4' && (card.event_date || card.event_place) && f.date && f.place && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          style={{
            position: 'absolute',
            left: '8%',
            right: '8%',
            top: `calc(${Math.min(f.date.y, f.place.y) - 3}% )`,
            bottom: `calc(${100 - (f.place.y + 5)}%)`,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.30) 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.55)',
            borderRadius: 16,
            boxShadow: '0 8px 22px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)',
            zIndex: 0
          }}
        />
      )}
      {card.event_date && f.date && (
        (layout.id === 'layout-4' || (layout.id === 'layout-5' || layout.id === 'layout-rightbottom'))
          ? <SplitDate field={f.date} iso={card.event_date} delay={0.3} />
          : ((layout.id === 'layout-3' || layout.id === 'layout-center') || layout.id === 'layout-6' || layout.id === 'layout-topcenter')
            ? <ModernSplitDate field={f.date} iso={card.event_date} delay={0.3} />
            : <FieldText field={f.date} delay={0.3}>{formatDate(card.event_date)}</FieldText>
      )}
      {card.event_place && f.place && (
        <FieldText field={f.place} delay={0.4}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <span>{card.event_place}</span>
            {card.map_url && isUrl(card.map_url) && (
              (layout.id === 'layout-6' || layout.id === 'layout-center') ? (
                <a href={card.map_url} target="_blank" rel="noreferrer"
                  aria-label="Open map"
                  style={{ color: f.place.color, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', opacity: 0.85, marginLeft: 2 }}
                >
                  <MapPin size={Math.max(12, (f.place.fontSize || 12) - 1)} strokeWidth={1.6} />
                </a>
              ) : (
                <a href={card.map_url} target="_blank" rel="noreferrer"
                  style={{ color: f.place.color, textDecoration: 'underline', fontSize: '0.6em', opacity: 0.75 }}
                >view map ↗</a>
              )
            )}
          </span>
        </FieldText>
      )}
      {/* 전화/호스트는 place 아래 인라인 배치. layout-5는 별도 처리(위에서 처리)되므로 제외 */}
      {layout.id !== 'layout-5' && layout.id !== 'layout-rightbottom' && (card.contact_phone || card.contact_name) && f.place && (
        <div
          style={{
            position: 'absolute',
            left: `${f.place.x}%`,
            top: layout.id === 'layout-4'
              ? `calc(${f.place.y + 8}%)`
              : layout.id === 'layout-6'
                ? `calc(${f.place.y + 11}%)`  // 박스(extra 포함) 아래로
              : layout.id === 'layout-topcenter'
                ? `calc(${f.place.y + 11}%)`
                : (layout.id === 'layout-3' || layout.id === 'layout-center')
                  ? `calc(${f.place.y + 6}%)`
                  : `calc(${f.place.y}% + 24px)`,
            width: `${f.place.w}%`,
            textAlign: f.place.align,
            fontSize: 11,
            color: f.place.color,
            fontFamily: f.place.fontFamily,
            display: 'flex',
            flexDirection: layout.id === 'layout-center' ? 'row' : 'column',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: layout.id === 'layout-center' ? 8 : 4
          }}
        >
          {layout.id === 'layout-center' ? (
            // 한 줄 포맷: — name / phone —
            <span>
              {card.contact_name && <>— {applyName(card.contact_name, recipientName)}</>}
              {card.contact_name && card.contact_phone && <> / </>}
              {card.contact_phone && (
                <a href={`tel:${card.contact_phone}`} style={{ color: f.place.color, textDecoration: 'none' }}>
                  {card.contact_phone}
                </a>
              )}
              {(card.contact_name || card.contact_phone) && <> —</>}
            </span>
          ) : (
            <>
              {card.contact_name && <span>— {applyName(card.contact_name, recipientName)} —</span>}
              {card.contact_phone && (
                <a
                  href={`tel:${card.contact_phone}`}
                  style={{ color: f.place.color, textDecoration: 'none' }}
                >
                  {card.contact_phone}
                </a>
              )}
            </>
          )}
        </div>
      )}
      {/* Vintage Script: 본문 위 ✽ divider */}
      {layout.id === 'layout-4' && card.body && f.body && (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          style={{
            position: 'absolute',
            left: '20%', right: '20%',
            top: `calc(${f.body.y}% - 6%)`,
            textAlign: 'center',
            color: tplMain || f.body.color || '#1A2A3A',
            fontSize: 18,
            opacity: 0.6
          }}
        >
          ✽
        </motion.div>
      )}
      {card.body && f.body && <FieldText field={f.body} delay={0.65}>{applyName(card.body, recipientName)}</FieldText>}
      {card.extra_info && f.extra && (
        <FieldText
          field={(layout.id === 'layout-6' || layout.id === 'layout-topcenter') && tplMain ? { ...f.extra, color: tplMain } : f.extra}
          delay={0.75}
        >
          {applyName(card.extra_info, recipientName)}
        </FieldText>
      )}
      {/* RSVP — Compact(layout-4) / Editorial(layout-3)은 카드 안 오버레이.
          Side Text(5) / Center Text(6)는 카드 밖 분리 (충돌 방지) */}
      {rsvpSlot && (layout.id === 'layout-4' || (layout.id === 'layout-3' || layout.id === 'layout-center')) && (
        <div
          style={{
            position: 'absolute',
            left: '5%',
            right: '5%',
            // Editorial(layout-3)은 100px 위로 올려 호스트/extra와 겹치지 않게
            bottom: (layout.id === 'layout-3' || layout.id === 'layout-center') ? 'calc(3% + 100px)' : '3%',
            zIndex: 8
          }}
        >
          {rsvpSlot}
        </div>
      )}
    </div>
    {/* Side Text(5) / Center Text(6) — RSVP를 카드 밖 아래에 분리 표시 */}
    {rsvpSlot && ((layout.id === 'layout-5' || layout.id === 'layout-rightbottom') || layout.id === 'layout-6' || layout.id === 'layout-topcenter') && (
      <div className="mt-3 px-4">
        {rsvpSlot}
      </div>
    )}
    </div>
  );
}
