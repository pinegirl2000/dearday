'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { imgUrl } from '@/lib/imgUrl';
import { CalendarDays, MapPin, Phone, ExternalLink } from 'lucide-react';
import { formatGreeting, applyName, getLayout } from '@/lib/layouts';
import { getEventLabelText, getEventTypeMeta } from '@/lib/eventType';
import { findTemplateByPair } from '@/lib/templates';
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
  /** wizard 가이드 오버레이 — 카드 외각 컨테이너에 absolute로 그려짐 */
  guideOverlay?: React.ReactNode;
  /** wizard 편집 모드 */
  editable?: boolean;
  onFieldEdit?: (key: 'title' | 'greeting_oneliner' | 'body' | 'event_place' | 'contact_name' | 'extra_info' | 'event_label' | 'event_date', value: string) => void;
  onFieldClick?: (key: 'title' | 'greeting_oneliner' | 'body' | 'event_place' | 'contact_name' | 'extra_info' | 'event_label' | 'event_date' | 'contact_phone') => void;
  highlightedField?: string | null;
  templateColorOverride?: {
    color_main?: string | null;
    color_title_accent?: string | null;
    color_box_text?: string | null;
    box_bg_top?: string | null;
    box_bg_bottom?: string | null;
    rsvp_button_color?: string | null;
  };
  eventCardType?: 'invitation' | 'thankcard' | 'congrats';
  /** thank_* 레이아웃 상단 원형 사진 클릭 핸들러 (편집 모드 only) — 부모가 file picker 트리거 */
  onPhotoClick?: () => void;
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

function Divider({ color, icon = '✽' }: { color?: string; icon?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '3px 0' }}>
      <span style={{ color: color || COLORS.accent, fontSize: 12 }}>{icon}</span>
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

export default function ClassicTemplateCard({ card, recipientName, background, rsvpSlot, guideOverlay, editable, onFieldEdit, onFieldClick, highlightedField, templateColorOverride, eventCardType, onPhotoClick }: Props) {
  const t = useTranslations('Wizard');
  const hideEventLabel = eventCardType === 'thankcard' || eventCardType === 'congrats';
  const evMeta = getEventTypeMeta(card.event_type);
  const ph = evMeta.fields;
  // 편집 모드: 클릭하면 모달 트리거. 현재 highlightedField만 점선 박스로 정확한 텍스트 영역 표시.
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
        title={t('clickToEdit')}
      >{children}</span>
    );
  };
  const greeting = formatGreeting(recipientName, card.recipient_template);
  const hasBgImage = !!background?.imageUrl;
  const basePalette = BG_PALETTE[card.bg_id] || BG_PALETTE['bg-1'];
  // 템플릿 페어링이 있으면 colorMain/colorSub로 override
  // title 색상 우선순위: DB color_title_accent > DB color_main > 코드 colorMain > 기본 palette
  const tpl = findTemplateByPair(card.bg_id, card.layout_id);
  const dbMain = templateColorOverride?.color_main;
  const dbTitleAccent = templateColorOverride?.color_title_accent;
  const titleColor = dbTitleAccent || dbMain || tpl?.colorMain || basePalette.title;
  const palette = {
    title: titleColor,
    // greeting_oneliner(subtitle)도 메인 색상과 동일 톤 — 타이틀과 시각적으로 한 묶음
    subtitle: dbMain || tpl?.colorMain || basePalette.subtitle,
    accent: basePalette.accent
  };
  // 반투명박스: DB box_bg_top/box_bg_bottom 우선 → tpl.infoBox.bg → 흰색 그라디언트 default
  const dbBoxTop = templateColorOverride?.box_bg_top;
  const dbBoxBottom = templateColorOverride?.box_bg_bottom;
  const dbBoxText = templateColorOverride?.color_box_text;
  // 둘 다 비어 있으면 투명 / 한쪽만 → 단색 / 둘 다 → 그라디언트
  const boxBg = (dbBoxTop && dbBoxBottom)
    ? `linear-gradient(180deg, ${dbBoxTop} 0%, ${dbBoxBottom} 100%)`
    : (dbBoxTop || dbBoxBottom || 'transparent');
  // 테두리 색 — 메인 폰트 색상(DB override 또는 코드 default)을 사용
  const boxBorderColor = dbMain || tpl?.colorMain || (tpl as any)?.infoBox?.borderColor || 'rgba(255,255,255,0.65)';
  const boxBorder = `1px solid ${boxBorderColor}`;
  // 박스 안 글씨 색: DB color_box_text > tpl.infoBox.textColor > tpl.colorMain > 코드 default
  const boxTextColor = dbBoxText || (tpl as any)?.infoBox?.textColor || dbMain || tpl?.colorMain || COLORS.textDark;
  // Baptism이면 장식을 ✽ → ✝ 십자가로 교체
  const decoIcon = card.event_type === 'baptism' ? '✝' : '✽';

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
        color: dbMain || tpl?.colorMain || COLORS.textDark
      }}
    >
      {hasBgImage && (
        <img
          src={imgUrl(background!.imageUrl)}
          alt=""
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover',
            // text 길이로 카드 높이가 변해도 bg 상단 기준으로 일관되게 — thank_classic은 위 고정
            objectPosition: card.layout_id === 'thank_classic' ? 'top center' : 'center',
            zIndex: 0, pointerEvents: 'none'
          }}
        />
      )}
      <div style={{
        position: 'relative',
        padding:
          card.layout_id === 'layout-7' ? '110px 20px 60px' :
          card.layout_id === 'thank_classic' ? '378px 20px 60px' :
          card.layout_id === 'thank_polaroid' ? '300px 20px 60px' :
          card.layout_id === 'thank_minimal' ? '120px 20px 60px' :
          '24px 20px 60px',
        zIndex: 1
      }}>
        {/* thank_classic / thank_polaroid 전용: 상단 사진. thank_minimal은 사진 없음 */}
        {(card.layout_id === 'thank_classic' || card.layout_id === 'thank_polaroid') && (card.custom_bg_url || editable) && (
          <div style={{
            position: 'absolute',
            top: card.layout_id === 'thank_polaroid' ? 80 : 156,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 2,
            pointerEvents: editable ? 'auto' : 'none'
          }}>
              {/* polaroid 변형: washi tape 장식 (사진 위쪽 가운데) */}
              {card.layout_id === 'thank_polaroid' && (
                <div style={{
                  position: 'absolute',
                  top: -14,
                  left: '50%',
                  transform: 'translateX(-30%) rotate(-6deg)',
                  width: 80,
                  height: 22,
                  background: 'linear-gradient(180deg, #F8E8C8 0%, #EBD5A8 100%)',
                  opacity: 0.75,
                  zIndex: 3,
                  borderRadius: 1,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
                }} />
              )}
              <div
                onClick={editable ? (e) => { e.stopPropagation(); onPhotoClick?.(); } : undefined}
                style={{
                  position: 'relative',
                  marginLeft: 5,
                  width: card.layout_id === 'thank_polaroid' ? '62%' : '49%',
                  maxWidth: card.layout_id === 'thank_polaroid' ? 240 : 195,
                  aspectRatio: '1 / 1',
                  borderRadius: card.layout_id === 'thank_polaroid' ? 4 : 0,
                  overflow: 'hidden',
                  border: card.layout_id === 'thank_polaroid' ? '14px solid #ffffff' : 'none',
                  borderBottomWidth: card.layout_id === 'thank_polaroid' ? 40 : undefined,
                  boxShadow: card.layout_id === 'thank_polaroid'
                    ? `0 8px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.1)`
                    : `0 2px 6px ${palette.title}33, 0 12px 28px ${palette.title}26`,
                  background: '#ffffff',
                  transform: card.layout_id === 'thank_polaroid' ? 'rotate(-3deg)' : 'none',
                  cursor: editable ? 'pointer' : 'default',
                  pointerEvents: 'auto'
                }}
              >
                {card.custom_bg_url ? (
                  <img
                    src={imgUrl(card.custom_bg_url)}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: palette.title, opacity: 0.7, textAlign: 'center', padding: 12, lineHeight: 1.4
                  }}>
                    사진 추가<br />(클릭)
                  </div>
                )}
              </div>
          </div>
        )}
        {/* 상단 장식 — 템플릿 메인 색상으로 ✽ + gradient 라인 (Topdown Text, Thank-Classic 제외) */}
        {card.layout_id !== 'layout-7' && card.layout_id !== 'thank_classic' && (
          <FadeUp delay={0.05}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '8px 0 12px' }}>
              <div style={{ width: 60, height: 1, background: `linear-gradient(90deg, transparent, ${palette.title}, transparent)`, opacity: 0.6 }} />
              <div style={{ color: palette.title, fontSize: 18 }}>{decoIcon}</div>
              <div style={{ width: 60, height: 1, background: `linear-gradient(90deg, transparent, ${palette.title}, transparent)`, opacity: 0.6 }} />
            </div>
          </FadeUp>
        )}

        {/* 앞면: eventLabel(상단 디바이더 바로 아래) + subtitle(작게) + 타이틀 */}
        <FadeUp delay={0.1}>
          <div style={{ textAlign: 'center', padding: card.layout_id === 'layout-7' ? '0 10px 4px' : '0 10px 12px' }}>
            {/* eventLabel — 상단 디바이더 바로 아래 (baptism은 십자가 디자인이 BG에 있어 텍스트 라벨 숨김) */}
            {(() => {
              const lay = getLayout(card.layout_id);
              if (!lay.fields.eventLabel) return null;
              if (hideEventLabel) return null;
              // baptism + 사용자 override 없음 → eventLabel 텍스트 미표시
              if (card.event_type === 'baptism' && !card.event_label) return null;
              const labelField = lay.fields.eventLabel;
              return (
                <div style={{
                  fontSize: labelField.fontSize,
                  // 우선순위: DB title_accent → DB main → 템플릿 코드 main → layout default
                  color: dbTitleAccent || dbMain || tpl?.colorMain || labelField.color,
                  fontWeight: labelField.fontWeight,
                  letterSpacing: labelField.letterSpacing,
                  fontFamily: labelField.fontFamily,
                  textAlign: labelField.align,
                  marginTop: -4,
                  marginBottom: 12
                }}>
                  {card.event_label || getEventLabelText(card.event_type)}
                </div>
              );
            })()}
            {/* subtitle (greeting_oneliner) — eventLabel 아래, title 바로 위 (작은 글씨) */}
            {(card.greeting_oneliner || editable) && (
              <div style={{
                fontSize: card.layout_id === 'thank_classic' ? 12 : 13,
                color: palette.subtitle,
                fontWeight: 400,
                letterSpacing: '0.2em',
                fontFamily: SERIF,
                marginTop: card.layout_id === 'thank_classic' ? 10 : 0,
                marginBottom: 8,
                lineHeight: 1.5
              }}>
                <Editable fieldKey="greeting_oneliner">{applyName(card.greeting_oneliner || '', recipientName)}</Editable>
              </div>
            )}
            <h1 style={card.layout_id === 'thank_classic'
              ? { fontSize: 44, fontWeight: 400, color: palette.title, letterSpacing: '0.01em', margin: '8px 0 10px', lineHeight: 1.15, whiteSpace: 'pre-wrap', fontFamily: "'Sacramento', 'Great Vibes', 'Noto Serif KR', cursive" }
              : { fontSize: 24, fontWeight: 500, color: palette.title, letterSpacing: '0.4em', margin: '0 0 8px', lineHeight: 1.3, whiteSpace: 'pre-wrap' }}>
              <Editable fieldKey="title">{applyName(card.title, recipientName)}</Editable>
            </h1>
            {(card.body || editable) && card.layout_id !== 'layout-7' && (
              <div style={{ marginTop: card.layout_id === 'thank_classic' ? -20 : 0 }}>
                <Divider color={palette.title} icon={decoIcon} />
                <div style={{
                  lineHeight: 2.0,
                  color: dbMain || tpl?.colorMain || COLORS.textDark,
                  fontSize: 15,
                  padding: '0 10px',
                  textAlign: 'center',
                  wordBreak: 'keep-all',
                  overflowWrap: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}>
                  <Editable fieldKey="body" multiline>
                    {applyName(card.body || '', recipientName)}
                  </Editable>
                </div>
              </div>
            )}
          </div>
        </FadeUp>

        {/* 행사 정보: 일시 / 장소 / 주소 / 전화 */}
        <FadeUp delay={0.3}>
          <div style={{ textAlign: 'center', padding: '0 16px 16px' }}>
            {/* thank/congrats 카드 또는 layout에 date/place 필드가 없으면 정보 박스 숨김 */}
            {!hideEventLabel &&
            (() => { const lay = getLayout(card.layout_id); return !!lay.fields.date || !!lay.fields.place; })() &&
            (card.event_date || card.event_place || card.map_url || card.contact_phone || card.extra_info || editable) && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: '12px 18px',
                // Topdown Text는 box를 title 바로 아래에 (body가 box 다음으로 이동)
                margin: card.layout_id === 'layout-7' ? '24px auto 14px' : '20px auto 14px',
                maxWidth: 320,
                background: boxBg,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: boxBorder,
                borderRadius: 18,
                boxShadow: tpl?.colorMain
                  ? `0 14px 32px ${tpl.colorMain}38, 0 4px 10px ${tpl.colorMain}1F, inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 ${tpl.colorMain}10`
                  : '0 14px 32px rgba(0,0,0,0.18), 0 4px 10px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.95)',
                fontFamily: SANS,
                alignItems: 'center',
                textAlign: 'center'
              }}>
                {/* Date — SATURDAY | 16 MAY | 10 AM 우아한 split 포맷 (편집 모드: 클릭 시 modal) */}
                {(card.event_date || editable) && (() => {
                  const isDateHi = highlightedField === 'event_date';
                  const main = boxTextColor;
                  const accent = boxTextColor;
                  const d = card.event_date ? new Date(card.event_date) : null;
                  const valid = d && !isNaN(d.getTime()) ? d : null;
                  return (
                    <div
                      data-field-key={editable ? 'event_date' : undefined}
                      onClick={editable ? (e) => { e.stopPropagation(); onFieldClick?.('event_date'); } : undefined}
                      role={editable ? 'button' : undefined}
                      tabIndex={editable ? 0 : undefined}
                      style={{
                        position: 'relative', width: '100%',
                        cursor: editable ? 'pointer' : 'default',
                        padding: isDateHi ? '4px 8px' : 0,
                        margin: isDateHi ? '-4px -8px 0' : 0,
                        borderRadius: isDateHi ? 6 : 0,
                        border: isDateHi ? '2px dashed rgba(123,94,167,0.55)' : 'none',
                        background: isDateHi ? 'rgba(123,94,167,0.06)' : 'transparent',
                        transition: 'all 0.15s'
                      }}>
                      {valid ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, color: main, fontFamily: SERIF }}>
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 500, letterSpacing: '0.18em', textAlign: 'right' }}>
                            {valid.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}
                          </span>
                          <span style={{ width: 1, height: 44, background: accent, opacity: 0.45 }} />
                          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.05 }}>
                            <span style={{ fontSize: 26, fontWeight: 700 }}>{valid.getDate()}</span>
                            <span style={{ fontSize: 11, letterSpacing: '0.2em' }}>
                              {valid.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                            </span>
                          </span>
                          <span style={{ width: 1, height: 44, background: accent, opacity: 0.45 }} />
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 500, letterSpacing: '0.18em', textAlign: 'left' }}>
                            {valid.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(':00', '').toUpperCase()}
                          </span>
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, color: main, opacity: 0.55, padding: '12px 0' }}>{t('clickToEnterDate')}</div>
                      )}
                      {/* native input 제거 — 부모 div onClick → onFieldClick('event_date') → modal 열림 */}
                    </div>
                  );
                })()}
                {/* Place — center 정렬 + 아래 작은 map pin */}
                {(card.event_place || card.map_url || editable) && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 13, color: boxTextColor, letterSpacing: '0.04em', marginTop: 6 }}>
                    {(card.event_place || editable) && (
                      <span style={{ fontWeight: 500, textAlign: 'center' }}>
                        <Editable fieldKey="event_place">{card.event_place || ''}</Editable>
                      </span>
                    )}
                    {card.map_url && isUrl(card.map_url) && (
                      <a href={card.map_url} target="_blank" rel="noreferrer"
                        aria-label="View map" title="View map"
                        style={{ display: 'inline-flex', alignItems: 'center', color: boxTextColor, opacity: 0.75 }}
                      >
                        <MapPin size={14} strokeWidth={1.4} />
                      </a>
                    )}
                    {card.map_url && !isUrl(card.map_url) && (
                      <span style={{ fontSize: 11, color: boxTextColor, wordBreak: 'break-word' }}>{card.map_url}</span>
                    )}
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', fontFamily: SANS }}>

              {/* Topdown Text는 extra_info를 맨 아래로 이동 (이 자리에서는 렌더 X) */}
              {(card.extra_info || editable) && !hideEventLabel && card.layout_id !== 'layout-7' && card.layout_id !== 'thank_classic' && (
                <div style={{
                  marginTop: 6, fontSize: 13, color: dbMain || tpl?.colorMain || COLORS.primaryDark,
                  letterSpacing: '0.04em', lineHeight: 1.6, whiteSpace: 'pre-wrap'
                }}>
                  <Editable fieldKey="extra_info" multiline>
                    {applyName(card.extra_info || '', recipientName)}
                  </Editable>
                </div>
              )}
            </div>
          </div>
        </FadeUp>

        {/* Topdown Text 전용: 박스 다음에 body 렌더 (divider 없음, 큰 갭) */}
        {card.layout_id === 'layout-7' && (card.body || editable) && (
          <FadeUp delay={0.45}>
            <div style={{ textAlign: 'center', padding: '130px 10px 16px' }}>
              <div style={{
                lineHeight: 2.0,
                color: dbMain || tpl?.colorMain || COLORS.textDark,
                fontSize: 15,
                padding: '0 10px',
                textAlign: 'center',
                wordBreak: 'keep-all',
                overflowWrap: 'break-word'
              }}>
                <Editable fieldKey="body" multiline>
                  {card.body
                    ? applyName(card.body, recipientName).split(/\r?\n/).map((line, i, arr) => (
                        <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                      ))
                    : <span style={{ opacity: 0.5 }}>{t('messageClickToEnter')}</span>}
                </Editable>
              </div>
            </div>
          </FadeUp>
        )}

        {rsvpSlot && card.layout_id !== 'thank_classic' && (
          <FadeUp delay={0.35}>
            <div style={{ padding: '0 16px 18px' }}>
              {rsvpSlot}
            </div>
          </FadeUp>
        )}

        {/* thank_classic 전용 — From 라인을 작은 필기체로 표시 (앞 'from'은 작게, 이름은 크게) */}
        {card.layout_id === 'thank_classic' && (card.contact_name || editable) && (() => {
          const raw = applyName(card.contact_name || (editable ? 'from' : ''), recipientName);
          const m = raw.match(/^(from\s+)(.+)$/i);
          const prefix = m ? m[1] : '';
          const rest = m ? m[2] : raw;
          const titleColor = dbMain || tpl?.colorMain || palette.title;
          return (
            <div style={{ textAlign: 'center', padding: '6px 20px 24px' }}>
              <p style={{ margin: 0, lineHeight: 1.2, color: titleColor, fontFamily: "'Sacramento', 'Great Vibes', 'Noto Serif KR', cursive" }}>
                <Editable fieldKey="contact_name">
                  {prefix && (
                    <span style={{ fontSize: 14, opacity: 0.75, marginRight: 4 }}>{prefix.trim()} </span>
                  )}
                  <span style={{ fontSize: 22 }}>{rest}</span>
                </Editable>
              </p>
            </div>
          );
        })()}

        {card.layout_id !== 'thank_classic' && (card.contact_name || card.contact_phone || editable) && (
          <div style={{ textAlign: 'center', padding: '10px 20px 20px' }}>
            {(card.contact_name || editable) && (
              <p style={{ fontSize: 13, color: dbMain || tpl?.colorMain || COLORS.textLight, letterSpacing: '0.15em' }}>
                <Editable fieldKey="contact_name">{applyName(card.contact_name || (editable ? '호스트 이름' : ''), recipientName)}</Editable>
              </p>
            )}
            {(card.contact_phone || editable) && !hideEventLabel && (() => {
              const isPhoneHi = highlightedField === 'contact_phone';
              return (
              <p
                data-field-key="contact_phone"
                onClick={editable ? (e) => { e.stopPropagation(); onFieldClick?.('contact_phone'); } : undefined}
                style={{
                fontSize: 11, color: dbMain || tpl?.colorMain || COLORS.textLight, marginTop: 4,
                letterSpacing: '0.05em', opacity: 0.85, display: 'inline-block',
                cursor: editable ? 'pointer' : 'default',
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
                  : <span style={{ color: dbMain || tpl?.colorMain || COLORS.textLight, opacity: 0.6 }}>{t('phoneClickToEnter')}</span>
                }
              </p>
              );
            })()}
          </div>
        )}

        {/* Topdown Text 전용: extra_info를 맨 아래에 표시 */}
        {card.layout_id === 'layout-7' && (card.extra_info || editable) && !hideEventLabel && (
          <div style={{ textAlign: 'center', padding: '0 20px 20px' }}>
            <p style={{ fontSize: 12, color: dbMain || tpl?.colorMain || COLORS.primaryDark, letterSpacing: '0.04em', lineHeight: 1.6, opacity: 0.85 }}>
              <Editable fieldKey="extra_info" multiline>
                {card.extra_info
                  ? applyName(card.extra_info, recipientName)
                  : <span style={{ opacity: 0.5 }}>{t('extraClickToEnter')}</span>}
              </Editable>
            </p>
          </div>
        )}

      </div>
      {/* wizard 가이드 오버레이 — 카드 외각에 absolute로 (flow layout 좌표 없이도 표시 가능) */}
      {guideOverlay}
    </div>
  );
}
