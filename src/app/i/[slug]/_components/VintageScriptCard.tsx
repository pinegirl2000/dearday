'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { imgUrl } from '@/lib/imgUrl';
import { MapPin } from 'lucide-react';
import { applyName } from '@/lib/layouts';
import { getEventLabelScript, getEventTypeMeta } from '@/lib/eventType';
import { findTemplateByPair } from '@/lib/templates';
import type { BackgroundMeta } from '@/lib/backgrounds';
import type { BaseCard } from '@/types/card';

interface Props {
  card: BaseCard;
  recipientName?: string;
  background?: BackgroundMeta;
  rsvpSlot?: React.ReactNode;
  guideOverlay?: React.ReactNode;
  editable?: boolean;
  onFieldEdit?: (key: 'title' | 'greeting_oneliner' | 'body' | 'event_place' | 'contact_name' | 'extra_info' | 'event_label' | 'event_date', value: string) => void;
  onFieldClick?: (key: 'title' | 'greeting_oneliner' | 'body' | 'event_place' | 'contact_name' | 'extra_info' | 'event_label' | 'event_date' | 'contact_phone') => void;
  highlightedField?: string | null;
  templateColorOverride?: {
    color_main?: string | null;
    color_sub?: string | null;
    color_box_text?: string | null;
    box_bg_top?: string | null;
    box_bg_bottom?: string | null;
    color_title_accent?: string | null;
    rsvp_button_color?: string | null;
    card_max_width?: number | null;
    card_min_height?: number | null;
    content_top?: number | null;
    content_side?: number | null;
    box_max_width?: number | null;
  };
  eventCardType?: 'invitation' | 'thankcard' | 'congrats';
}

const SCRIPT = "'Playfair Display', 'Cormorant Garamond', 'Noto Serif KR', serif";
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
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 14, color, fontFamily: SERIF
    }}>
      <span style={{ flex: 1, fontSize: 16, fontWeight: 500, letterSpacing: '0.18em', textAlign: 'right' }}>{weekday}</span>
      <span style={{ width: 1, height: 50, background: color, opacity: 0.55 }} />
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.05 }}>
        <span style={{ fontSize: 32, fontWeight: 700 }}>{day}</span>
        <span style={{ fontSize: 13, letterSpacing: '0.2em' }}>{month}</span>
      </span>
      <span style={{ width: 1, height: 50, background: color, opacity: 0.55 }} />
      <span style={{ flex: 1, fontSize: 16, fontWeight: 500, letterSpacing: '0.18em', textAlign: 'left' }}>{time}</span>
    </div>
  );
}

function isUrl(s?: string | null): s is string {
  if (!s) return false;
  return /^https?:\/\//i.test(s);
}

export default function VintageScriptCard({
  card, recipientName, background, rsvpSlot,
  guideOverlay, editable, onFieldEdit, onFieldClick, highlightedField, templateColorOverride, eventCardType
}: Props) {
  const t = useTranslations('Wizard');
  const hideEventLabel = eventCardType === 'thankcard' || eventCardType === 'congrats';
  const tpl = findTemplateByPair(card.bg_id, card.layout_id);
  const main = templateColorOverride?.color_main || tpl?.colorMain || '#1A2A3A';
  const sub = templateColorOverride?.color_sub || tpl?.colorSub || main;
  // 반투명박스 — DB box_bg_top/bottom 우선, 없으면 흰색 그라디언트
  const dbBoxTop = templateColorOverride?.box_bg_top;
  const dbBoxBottom = templateColorOverride?.box_bg_bottom;
  const dbBoxText = templateColorOverride?.color_box_text;
  // 둘 다 입력 → gradient / 한쪽만 → 단색 / 비어있음 → 투명
  const boxBg = (dbBoxTop && dbBoxBottom)
    ? `linear-gradient(180deg, ${dbBoxTop} 0%, ${dbBoxBottom} 100%)`
    : (dbBoxTop || dbBoxBottom || 'transparent');
  const boxTextColor = dbBoxText || main;
  const hasBgImage = !!background?.imageUrl;
  const evMeta = getEventTypeMeta(card.event_type);
  const ph = evMeta.fields;

  // 편집 모드: 텍스트 클릭 시 모달 트리거. highlightedField만 점선 박스.
  const Editable = ({ fieldKey, children }: { fieldKey: 'title' | 'greeting_oneliner' | 'body' | 'event_place' | 'contact_name' | 'extra_info' | 'event_label'; children: React.ReactNode }) => {
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
          cursor: 'pointer', display: 'inline-block',
          padding: isHighlighted ? '2px 6px' : 0,
          margin: isHighlighted ? '-2px -6px' : 0,
          borderRadius: isHighlighted ? 6 : 0,
          border: isHighlighted ? '2px dashed rgba(123,94,167,0.55)' : 'none',
          background: isHighlighted ? 'rgba(123,94,167,0.06)' : 'transparent',
          transition: 'all 0.15s'
        }}
        title={t('clickToEdit')}
      >{children}</span>
    );
  };

  const isDateHi = highlightedField === 'event_date';
  const isPhoneHi = highlightedField === 'contact_phone';

  return (
    <div
      style={{
        position: 'relative', width: '100%',
        // admin 배치 override — 미지정 시 코드 default
        maxWidth: templateColorOverride?.card_max_width || 440,
        minHeight: templateColorOverride?.card_min_height || undefined,
        margin: '0 auto',
        background: hasBgImage ? '#fff' : (background?.gradient || '#F4ECFA'),
        borderRadius: 24, overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(123,94,167,0.18)',
        fontFamily: SERIF, color: main
      }}
    >
      {hasBgImage && (
        <img
          src={imgUrl(background!.imageUrl)} alt=""
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            // fit: 'fill' 배경(프레임 디자인)은 카드 크기에 맞춰 늘려 좌우 장식 잘림 방지
            objectFit: background!.fit === 'fill' ? 'fill' : 'cover',
            zIndex: 0, pointerEvents: 'none'
          }}
        />
      )}
      <div style={{
        position: 'relative',
        padding: '32px 24px 60px',
        // admin 배치 override — shorthand 뒤에 와야 적용됨
        ...(templateColorOverride?.content_top != null && { paddingTop: templateColorOverride.content_top }),
        ...(templateColorOverride?.content_side != null && {
          paddingLeft: templateColorOverride.content_side,
          paddingRight: templateColorOverride.content_side
        }),
        zIndex: 1, textAlign: 'center'
      }}>
        {/* 1. 상단 라벨 — event_label 텍스트. thank/congrats는 숨김.
            baptism이면서 라벨이 비어 있으면 상단에 아무것도 렌더하지 않음 (기존 ✝ 아이콘 제거) */}
        {!hideEventLabel && <FadeUp delay={0.1}>
          {card.event_type === 'baptism' && !card.event_label ? null : (
            <div style={{
              fontFamily: SCRIPT, fontSize: 14, fontWeight: 700, color: main,
              letterSpacing: '0.6em', lineHeight: 1.1, marginTop: 28, marginBottom: 18
            }}>
              <Editable fieldKey="event_label">
                {card.event_label || getEventLabelScript(card.event_type)}
              </Editable>
            </div>
          )}
        </FadeUp>}

        {/* 2. Subtitle (greeting_oneliner) — main 색상 + 가독성 확보 (opacity 제거) */}
        {(card.greeting_oneliner || editable) && (
          <FadeUp delay={0.12}>
            <div style={{
              fontFamily: SERIF, fontSize: 14, color: main, fontWeight: 500,
              letterSpacing: '0.18em', lineHeight: 1.5, marginBottom: 14
            }}>
              <Editable fieldKey="greeting_oneliner">
                {applyName(card.greeting_oneliner || '', recipientName)}
              </Editable>
            </div>
          </FadeUp>
        )}

        {/* 3. 메인 이름 (title) */}
        <FadeUp delay={0.15}>
          <h1 style={{
            fontFamily: SERIF_BOLD, fontSize: 30, fontWeight: 700, color: main,
            letterSpacing: '0.06em', lineHeight: 1.2, margin: 0, marginBottom: 18,
            whiteSpace: 'pre-wrap', wordBreak: 'keep-all'
          }}>
            <Editable fieldKey="title">
              {applyName(card.title, recipientName).split('♥').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span style={{ fontSize: '0.55em', verticalAlign: '0.15em', margin: '0 0.05em' }}>♥</span>
                  )}
                </span>
              ))}
            </Editable>
          </h1>
        </FadeUp>

        {/* 4. Divider */}
        {(card.body || editable) && (
          <FadeUp delay={0.2}>
            <div style={{ color: main, opacity: 0.6, fontSize: 18, margin: '8px 0 14px' }}>✽</div>
          </FadeUp>
        )}

        {/* 5. 본문 (body) — 줄바꿈 보존 */}
        {(card.body || editable) && (
          <FadeUp delay={0.22}>
            <div style={{
              fontSize: 13, color: main, lineHeight: 1.8,
              letterSpacing: '0.02em', margin: '0 auto 22px',
              maxWidth: 320, padding: '0 8px',
              textAlign: 'center', wordBreak: 'keep-all', overflowWrap: 'break-word',
              whiteSpace: 'pre-wrap'
            }}>
              <Editable fieldKey="body">
                {applyName(card.body || '', recipientName)}
              </Editable>
            </div>
          </FadeUp>
        )}

        {/* 6. 정보 박스 (반투명 흰색) — date + place */}
        {!hideEventLabel && (card.event_date || card.event_place || card.map_url || editable) && (
          <FadeUp delay={0.3}>
            <div style={{
              maxWidth: templateColorOverride?.box_max_width || 280, margin: '0 auto 18px', padding: '16px 18px',
              background: boxBg,
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              border: `1px solid ${main}`,
              borderRadius: 14,
              boxShadow: '0 8px 22px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
              display: 'flex', flexDirection: 'column', gap: 12, position: 'relative'
            }}>
              {/* Date 영역 — 편집 모드에서 클릭 시 modal 트리거 */}
              {(card.event_date || editable) && (
                <div
                  data-field-key={editable ? 'event_date' : undefined}
                  onClick={editable ? (e) => { e.stopPropagation(); onFieldClick?.('event_date'); } : undefined}
                  role={editable ? 'button' : undefined}
                  tabIndex={editable ? 0 : undefined}
                  style={{
                    position: 'relative',
                    cursor: editable ? 'pointer' : 'default',
                    padding: isDateHi ? '4px 8px' : 0,
                    margin: isDateHi ? '-4px -8px' : 0,
                    borderRadius: isDateHi ? 6 : 0,
                    border: isDateHi ? '2px dashed rgba(123,94,167,0.55)' : 'none',
                    background: isDateHi ? 'rgba(123,94,167,0.06)' : 'transparent',
                    transition: 'all 0.15s'
                  }}>
                  {card.event_date
                    ? <SplitDate iso={card.event_date} color={boxTextColor} />
                    : (editable && <div style={{ fontSize: 13, color: boxTextColor, opacity: 0.6, padding: '12px 0' }}>{t('clickToEnterDate')}</div>)
                  }
                </div>
              )}

              {/* Place + map */}
              {(card.event_place || card.map_url || editable) && (
                <div style={{
                  display: 'inline-flex', alignItems: 'baseline', justifyContent: 'center',
                  gap: 8, flexWrap: 'wrap', fontSize: 12, color: boxTextColor,
                  letterSpacing: '0.16em', fontFamily: SERIF
                }}>
                  {(card.event_place || editable) && (
                    <span><Editable fieldKey="event_place">{card.event_place || ''}</Editable></span>
                  )}
                  {card.map_url && isUrl(card.map_url) && (
                    <a href={card.map_url} target="_blank" rel="noreferrer"
                      title="View map" aria-label="View map"
                      style={{ color: main, display: 'inline-flex', alignItems: 'center', opacity: 0.75 }}>
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
        {(card.contact_phone || card.contact_name || editable) && (
          <div style={{ margin: '14px 0 8px', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', fontFamily: SERIF }}>
            {(card.contact_name || editable) && (
              <p style={{ fontSize: 11, color: main, letterSpacing: '0.12em', margin: 0 }}>
                <Editable fieldKey="contact_name">{applyName(card.contact_name || (editable ? '호스트 이름' : ''), recipientName)}</Editable>
              </p>
            )}
            {(card.contact_phone || editable) && (
              <p style={{
                margin: 0, fontSize: 12, display: 'inline-block',
                padding: isPhoneHi ? '2px 6px' : 0,
                borderRadius: isPhoneHi ? 6 : 0,
                border: isPhoneHi ? '2px dashed rgba(123,94,167,0.55)' : 'none',
                background: isPhoneHi ? 'rgba(123,94,167,0.06)' : 'transparent',
                transition: 'all 0.15s'
              }}>
                {card.contact_phone
                  ? (editable
                      ? <span style={{ color: main }}>{card.contact_phone}</span>
                      : <a href={`tel:${card.contact_phone}`} style={{ color: main, textDecoration: 'none' }}>{card.contact_phone}</a>)
                  : <span style={{ color: main, opacity: 0.6 }}>{t('phoneClickToEnter')}</span>
                }
              </p>
            )}
          </div>
        )}

        {/* 9. extra (Reception to follow 같은 안내) */}
        {(card.extra_info || editable) && (
          <FadeUp delay={0.45}>
            <p style={{
              marginTop: 14, marginBottom: 0,
              fontSize: 12, color: main, fontWeight: 500,
              lineHeight: 1.6, letterSpacing: '0.05em',
              fontFamily: SERIF, whiteSpace: 'pre-wrap'
            }}>
              <Editable fieldKey="extra_info">
                {applyName(card.extra_info || '', recipientName)}
              </Editable>
            </p>
          </FadeUp>
        )}
      </div>
      {/* wizard 가이드 오버레이 — 카드 외각에 absolute */}
      {guideOverlay}
    </div>
  );
}
