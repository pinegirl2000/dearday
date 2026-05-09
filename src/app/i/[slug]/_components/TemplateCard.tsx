'use client';

import { motion } from 'framer-motion';
import { Phone, MapPin } from 'lucide-react';
// NOTE: framer-motion의 whileInView는 장식용 fade-in에만 사용. 본문/연락처처럼
// "반드시 보여야 하는" 정보는 whileInView로 감싸지 말 것 — IntersectionObserver
// 첫 측정 누락 시 opacity:0에 갇혀 영구히 안 보이는 사고가 났음.
import { getLayout, formatGreeting, applyName, type TextField } from '@/lib/layouts';
import { getBackground } from '@/lib/backgrounds';
import { getEventLabelText, getEventLabelScript, getEventTypeMeta } from '@/lib/eventType';
import { findTemplateByPair } from '@/lib/templates';
import type { BaseCard } from '@/types/card';
import ClassicTemplateCard from './ClassicTemplateCard';
import VintageScriptCard from './VintageScriptCard';

interface Props {
  card: BaseCard;
  recipientName?: string;
  rsvpSlot?: React.ReactNode;
  /** wizard에서 카드 좌표계와 동일하게 번호 가이드 오버레이를 그릴 때 사용 */
  guideOverlay?: React.ReactNode;
  /** wizard 편집 모드 */
  editable?: boolean;
  onFieldEdit?: (key: 'title' | 'greeting_oneliner' | 'body' | 'event_place' | 'contact_name' | 'extra_info' | 'event_label' | 'event_date', value: string) => void;
  /** 편집 모드에서 텍스트 클릭 시 호출 (모달 열기 트리거) */
  onFieldClick?: (key: 'title' | 'greeting_oneliner' | 'body' | 'event_place' | 'contact_name' | 'extra_info' | 'event_label' | 'event_date' | 'contact_phone') => void;
  /** 현재 강조(flashing) 중인 필드 — 이 필드만 점선 표시, 나머지는 plain */
  highlightedField?: string | null;
  /** DB에 저장된 template별 색상 override (정의되어 있으면 코드 default보다 우선) */
  templateColorOverride?: {
    color_main?: string | null;
    color_sub?: string | null;
    color_box_text?: string | null;
    box_bg_top?: string | null;
    box_bg_bottom?: string | null;
  };
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

export default function TemplateCard({ card, recipientName, rsvpSlot, guideOverlay, editable, onFieldEdit, onFieldClick, highlightedField, templateColorOverride }: Props) {
  // 편집 모드: 텍스트 클릭 시 모달 트리거. highlightedField만 점선 박스로 텍스트 영역 표시.
  const Editable = ({ fieldKey, children }: { fieldKey: 'title' | 'greeting_oneliner' | 'body' | 'event_place' | 'contact_name' | 'extra_info' | 'event_label'; children: React.ReactNode; multiline?: boolean }) => {
    if (!editable) return <>{children}</>;
    const isHighlighted = highlightedField === fieldKey;
    return (
      <span
        role="button"
        tabIndex={0}
        data-field-key={fieldKey}
        onClick={(e) => { e.stopPropagation(); onFieldClick?.(fieldKey); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFieldClick?.(fieldKey); } }}
        style={{
          cursor: 'pointer',
          display: 'inline-block',
          padding: isHighlighted ? '2px 6px' : 0,
          margin: isHighlighted ? '-2px -6px' : 0,
          borderRadius: isHighlighted ? 6 : 0,
          border: isHighlighted ? '2px dashed rgba(123,94,167,0.55)' : 'none',
          background: isHighlighted ? 'rgba(123,94,167,0.06)' : 'transparent',
          transition: 'all 0.15s'
        }}
        title="클릭해서 수정"
      >{children}</span>
    );
  };
  const layout = getLayout(card.layout_id);
  const bg = getBackground(card.bg_id);
  const tpl = findTemplateByPair(card.bg_id, card.layout_id);

  if (layout.renderStyle === 'flow') {
    if (layout.id === 'layout-4') {
      return <VintageScriptCard
        card={card} recipientName={recipientName} background={bg} rsvpSlot={rsvpSlot}
        guideOverlay={guideOverlay} editable={editable} onFieldEdit={onFieldEdit} onFieldClick={onFieldClick} highlightedField={highlightedField}
      />;
    }
    return <ClassicTemplateCard card={card} recipientName={recipientName} background={bg} rsvpSlot={rsvpSlot} guideOverlay={guideOverlay} editable={editable} onFieldEdit={onFieldEdit} onFieldClick={onFieldClick} highlightedField={highlightedField} />;
  }

  // 페어링된 템플릿 색상으로 layout 필드 색상 override
  // DB override(templateColorOverride) 우선 → 없으면 코드 default(tpl.colorMain 등)
  const tplMain = templateColorOverride?.color_main || tpl?.colorMain;
  const tplSub = templateColorOverride?.color_sub || tpl?.colorSub;
  // infoBox: DB에 box_bg_top(포인트색) 또는 color_box_text가 있으면 합성, 없으면 코드 infoBox
  // box_bg_top은 단일 색 — rgba로 반투명 또는 solid 색상으로 사용
  const dbAccent = templateColorOverride?.box_bg_top;
  const dbBoxText = templateColorOverride?.color_box_text;
  const tplInfoBox = (dbAccent || dbBoxText)
    ? {
        bg: dbAccent || tpl?.infoBox?.bg || '',
        textColor: dbBoxText || tpl?.infoBox?.textColor,
        borderColor: tpl?.infoBox?.borderColor
      }
    : tpl?.infoBox;
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
    // date/place는 정보박스 안에 들어감. infoBox.textColor가 지정되면 우선 (dark 박스용)
    date: withColor(baseFields.date, tplInfoBox?.textColor || tplMain),
    place: withColor(baseFields.place, tplInfoBox?.textColor || tplMain),
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
          <Editable fieldKey="event_label">
            {card.event_label
              ? card.event_label
              : ((layout.id === 'layout-4' || (layout.id === 'layout-3' || layout.id === 'layout-center') || (layout.id === 'layout-5' || layout.id === 'layout-rightbottom') || layout.id === 'layout-6' || layout.id === 'layout-topcenter')
                  ? getEventLabelScript(card.event_type)
                  : getEventLabelText(card.event_type))}
          </Editable>
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
      {(card.greeting_oneliner || editable) && f.subtitle && <FieldText field={f.subtitle} delay={0.1}><Editable fieldKey="greeting_oneliner">{applyName(card.greeting_oneliner || '', recipientName)}</Editable></FieldText>}
      <FieldText field={f.title} delay={0.2}><Editable fieldKey="title">{applyName(card.title, recipientName)}</Editable></FieldText>
      {/* Side Text + Center Text: 하단 date+place 영역 정보 박스 — 템플릿 sub 색상 톤 (없으면 흰색) */}
      {((layout.id === 'layout-5' || layout.id === 'layout-rightbottom') || layout.id === 'layout-6') && (card.event_date || card.event_place) && f.date && f.place && (() => {
        // 우선순위: 1) tpl.infoBox (template별 명시) 2) tplSub 기반 default 3) 흰색 default
        const hasInfoBox = !!tplInfoBox;
        const hasSub = !!tplSub;
        const subTint = tplSub || '#FFFFFF';
        const bg = hasInfoBox
          ? tplInfoBox!.bg
          : (hasSub
              ? `linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.68) 100%), ${subTint}`
              : 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.82) 100%)');
        const border = hasInfoBox && tplInfoBox!.borderColor
          ? `1px solid ${tplInfoBox!.borderColor}`
          : (hasSub ? `1px solid ${subTint}55` : '1px solid rgba(255,255,255,0.85)');
        const shadow = hasInfoBox
          ? '0 8px 18px rgba(0,0,0,0.18)'
          : (hasSub
              ? `0 6px 14px ${subTint}26, inset 0 1px 0 rgba(255,255,255,0.85)`
              : '0 8px 18px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.95)');
        return (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            style={{
              position: 'absolute',
              left: layout.id === 'layout-5' ? '38%' : '6%',
              right: layout.id === 'layout-5' ? '5%' : '6%',
              top: layout.id === 'layout-6'
                ? `calc(${f.date.y + 0.5}%)`
                : layout.id === 'layout-5'
                  ? `calc(${f.date.y - 5}%)`
                  : layout.id === 'layout-rightbottom'
                    ? `calc(${f.date.y - 3}%)`
                    : `calc(${f.date.y - 1}%)`,
              bottom: layout.id === 'layout-6' && f.extra
                ? `calc(${100 - (f.extra.y + 4)}%)`
                : layout.id === 'layout-5'
                  ? `calc(${100 - (f.place.y + 13)}%)`
                  : layout.id === 'layout-rightbottom'
                    ? `calc(${100 - (f.place.y + 8)}%)`
                    : `calc(${100 - (f.place.y + 3)}%)`,
              background: bg,
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              border,
              borderRadius: 14,
              boxShadow: shadow,
              zIndex: 0
            }}
          />
        );
      })()}
      {/* Side Text 전용: 박스 아래 호스트 이름 + 전화 (extra 위) */}
      {(layout.id === 'layout-5' || layout.id === 'layout-rightbottom') && (card.contact_name || card.contact_phone || editable) && (
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
          {(card.contact_name || editable) && (
            <p style={{ fontSize: 12, letterSpacing: '0.1em', margin: 0 }}>
              <Editable fieldKey="contact_name">{applyName(card.contact_name || '', recipientName)}</Editable>
            </p>
          )}
          {(card.contact_phone || editable) && (() => {
            const isPhoneHi = highlightedField === 'contact_phone';
            return (
              <p style={{
                margin: 0, fontSize: 11, display: 'inline-block',
                padding: isPhoneHi ? '2px 6px' : 0,
                borderRadius: isPhoneHi ? 6 : 0,
                border: isPhoneHi ? '2px dashed rgba(123,94,167,0.55)' : 'none',
                background: isPhoneHi ? 'rgba(123,94,167,0.06)' : 'transparent',
                transition: 'all 0.15s'
              }}>
                {card.contact_phone
                  ? (editable
                      ? <span>{card.contact_phone}</span>
                      : <a href={`tel:${card.contact_phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{card.contact_phone}</a>)
                  : <span style={{ opacity: 0.5 }}>전화번호</span>
                }
              </p>
            );
          })()}
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
      {/* Date 영역 클릭 가능 wrapper — 클릭 시 modal 열림 + highlight 표시 */}
      {editable && f.date && (
        <button
          type="button"
          data-field-key="event_date"
          onClick={(e) => { e.stopPropagation(); onFieldClick?.('event_date'); }}
          style={{
            position: 'absolute',
            left: `${f.date.x - 1}%`,
            top: `${f.date.y - 2}%`,
            width: `${f.date.w + 2}%`,
            height: 56,
            border: highlightedField === 'event_date' ? '2px dashed rgba(123,94,167,0.55)' : '1px dashed transparent',
            background: highlightedField === 'event_date' ? 'rgba(123,94,167,0.06)' : 'transparent',
            borderRadius: 6,
            zIndex: 30,
            cursor: 'pointer',
            padding: 0,
            transition: 'all 0.15s'
          }}
          title="클릭해서 날짜/시간 수정"
          aria-label="Edit date and time"
        />
      )}
      {/* native date input은 modal로 이전 — 별도 hidden input 불필요 */}
      {(card.event_place || editable) && f.place && (
        <FieldText field={f.place} delay={0.4}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <span><Editable fieldKey="event_place">{card.event_place || ''}</Editable></span>
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
      {layout.id !== 'layout-5' && layout.id !== 'layout-rightbottom' && (card.contact_phone || card.contact_name || editable) && f.place && (
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
                : layout.id === 'layout-3'
                  ? `calc(${f.place.y + 6}%)`
                : layout.id === 'layout-center'
                  ? `calc(${f.place.y - 14}%)`
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
            <span>
              {(card.contact_name || editable) && <Editable fieldKey="contact_name">{applyName(card.contact_name || '', recipientName)}</Editable>}
              {card.contact_name && card.contact_phone && <> / </>}
              {(card.contact_phone || editable) && (() => {
                const isPhoneHi = highlightedField === 'contact_phone';
                return (
                  <span style={{
                    display: 'inline-block',
                    padding: isPhoneHi ? '1px 5px' : 0,
                    borderRadius: isPhoneHi ? 5 : 0,
                    border: isPhoneHi ? '2px dashed rgba(123,94,167,0.55)' : 'none',
                    background: isPhoneHi ? 'rgba(123,94,167,0.06)' : 'transparent'
                  }}>
                    {card.contact_phone
                      ? (editable
                          ? <span style={{ color: f.place.color }}>{card.contact_phone}</span>
                          : <a href={`tel:${card.contact_phone}`} style={{ color: f.place.color, textDecoration: 'none' }}>{card.contact_phone}</a>)
                      : <span style={{ opacity: 0.5 }}>전화번호</span>}
                  </span>
                );
              })()}
            </span>
          ) : (
            <>
              {(card.contact_name || editable) && <span><Editable fieldKey="contact_name">{applyName(card.contact_name || '', recipientName)}</Editable></span>}
              {(card.contact_phone || editable) && (() => {
                const isPhoneHi = highlightedField === 'contact_phone';
                return (
                  <span style={{
                    display: 'inline-block',
                    padding: isPhoneHi ? '1px 5px' : 0,
                    borderRadius: isPhoneHi ? 5 : 0,
                    border: isPhoneHi ? '2px dashed rgba(123,94,167,0.55)' : 'none',
                    background: isPhoneHi ? 'rgba(123,94,167,0.06)' : 'transparent'
                  }}>
                    {card.contact_phone
                      ? (editable
                          ? <span style={{ color: f.place.color }}>{card.contact_phone}</span>
                          : <a href={`tel:${card.contact_phone}`} style={{ color: f.place.color, textDecoration: 'none' }}>{card.contact_phone}</a>)
                      : <span style={{ opacity: 0.5 }}>전화번호</span>}
                  </span>
                );
              })()}
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
      {(card.body || editable) && f.body && <FieldText field={f.body} delay={0.65}><Editable fieldKey="body" multiline>{applyName(card.body || '', recipientName)}</Editable></FieldText>}
      {(card.extra_info || editable) && f.extra && (
        <FieldText
          field={(layout.id === 'layout-6' || layout.id === 'layout-topcenter') && tplMain ? { ...f.extra, color: tplMain } : f.extra}
          delay={0.75}
        >
          <Editable fieldKey="extra_info" multiline>{applyName(card.extra_info || '', recipientName)}</Editable>
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
            // Editorial(layout-3)/center는 contact·extra 아래로 충분히 내림
            bottom: (layout.id === 'layout-3' || layout.id === 'layout-center') ? 'calc(3% + 55px)' : '3%',
            zIndex: 8
          }}
        >
          {rsvpSlot}
        </div>
      )}
      {/* wizard 가이드 오버레이 — 카드 내부 좌표계와 동일하게 번호/포인터 표시 */}
      {guideOverlay}
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
