'use client';
import { FONT_STACKS } from '@/lib/font-keys';

import { infoBoxWidthPercent, layoutFieldToRoleStyle, resolveRoleStyle, typographyForLayout, type TemplateTypography, type TextRole, type RoleStyle } from '@/lib/typography';
import { FitText } from '@/components/typography/fit-text';
import { useZoneFit } from '@/components/cards/use-zone-fit';
import { getBackgroundZone } from '@/lib/background-zones';
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
    card_max_width?: number | null;
    card_min_height?: number | null;
    content_top?: number | null;
    content_side?: number | null;
    box_max_width?: number | null;
    /** 관리자 글꼴 override (DB) */
    typography?: TemplateTypography | null;
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

const SERIF = FONT_STACKS.notoSerif;
/** 표지 글 영역에서 제목이 줄어들 수 있는 최소 크기(px) — 이보다 작으면 카드의 얼굴 역할을 못 함 */
const ZONE_MIN_TITLE_SIZE = 18;
/** 표지 글 영역 안 조각(라벨·부제·제목·본문) 사이 간격(px) */
const ZONE_GAP = 8;

/**
 * 레이아웃 고유 기본값 — 템플릿과 무관하게 그 레이아웃이면 항상 적용되던 모양.
 * thank_classic 은 어떤 배경과 짝지어져도 필기체 큰 제목이어야 하므로 템플릿이 아니라 레이아웃에 둔다.
 */
const LAYOUT_ROLE_DEFAULTS: Partial<Record<string, Partial<Record<TextRole, RoleStyle>>>> = {
  thank_classic: {
    title: { font: 'sacramento', size: 44, spacing: 0.01, weight: 400, lineHeight: 1.15 },
    subtitle: { size: 12 }
  }
};
const SANS = FONT_STACKS.notoSans;

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

  // 배치 override는 admin이 기준 폭(card_max_width)에서 맞춘 px 값.
  // 배경 프레임은 카드 폭의 비율로 그려지므로, px를 기준 폭 대비 %로 환산해야
  // 좁은 모바일 화면에서도 텍스트/박스가 프레임 안쪽에 그대로 머문다.
  const refWidth = templateColorOverride?.card_max_width || 440;
  const pctOf = (px?: number | null) => (px == null ? undefined : `${((px / refWidth) * 100).toFixed(3)}%`);
  // 좌우 여백: DB → 템플릿 코드 기본값. 둘 다 없으면 기존 고정 20px(shorthand) 유지 — 지정 안 한 템플릿 모양 보존
  const contentSide = templateColorOverride?.content_side ?? tpl?.contentSide;

  // 역할별 글꼴·크기·자간 — DB(관리자) → 템플릿 기본값 → (eventLabel 만) 레이아웃 정의 → 전역 기본.
  // title/subtitle/body 에 레이아웃 정의를 넘기지 않는 이유: 기존 화면이 그 값을 쓰지 않았으므로 기본 모양을 유지하기 위함
  const layoutMeta = getLayout(card.layout_id);
  // 템플릿·DB 값은 그 템플릿의 기본 레이아웃에서만 — 다른 레이아웃(thank_classic 등) 고유 모양 보존
  const typoSources = typographyForLayout(tpl, card.layout_id, templateColorOverride?.typography);
  const labelStyle = resolveRoleStyle('eventLabel', { ...typoSources, layout: layoutFieldToRoleStyle(layoutMeta.fields.eventLabel) });
  const layoutRoles = LAYOUT_ROLE_DEFAULTS[card.layout_id];
  const subtitleStyle = resolveRoleStyle('subtitle', { ...typoSources, layout: layoutRoles?.subtitle });
  const titleStyle = resolveRoleStyle('title', { ...typoSources, layout: layoutRoles?.title });
  const bodyStyle = resolveRoleStyle('body', typoSources);

  // 배경에 글 영역이 지정되어 있으면 "표지 + 내용 면" 구조로 그림 (훅은 조건과 무관하게 항상 호출)
  const bgZone = getBackgroundZone(card.bg_id, card.layout_id);
  const { plan: zonePlan, debug: zoneDebug, measured: zoneMeasured, refs: zoneRefs } = useZoneFit({
    enabled: !!bgZone,
    // 표지에 놓이는 글의 내용·글꼴·크기와 배경(영역)이 바뀌면 처음부터 다시 — 줄어든 쪽으로 바뀌어도 표지로 돌아오게
    resetKey: [
      card.title, card.greeting_oneliner, card.body, card.event_label, card.event_type, card.bg_id, hideEventLabel, recipientName,
      titleStyle.fontFamily, titleStyle.spacing, labelStyle.fontFamily, labelStyle.size,
      subtitleStyle.fontFamily, subtitleStyle.size, bodyStyle.fontFamily, bodyStyle.size, bodyStyle.lineHeight
    ].join('\u0001'),
    baseTitleSize: titleStyle.size,
    minTitleSize: Math.min(ZONE_MIN_TITLE_SIZE, titleStyle.size),
    gap: ZONE_GAP
  });

  // ── 행사 정보·RSVP·연락처 — 기존 흐름형과 "표지+내용 면" 구조가 함께 쓰는 블록 ──
  const detailsBlock = (
    <>
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
                // admin 배치 override — 정보 박스 가로.
                // 기준 폭 대비 %로 환산 → 좁은 화면에서도 프레임 안쪽에 여백을 두고 들어감
                // 템플릿 기본 여백으로 콘텐츠가 좁아져도 박스 실제 폭은 유지 ("8 PM" 줄바꿈 방지)
                // 내용 면은 배경 프레임과 무관한 깨끗한 면이라 px 폭 그대로 — % 로 좁히면 "8 PM" 이 두 줄로 깨짐
                maxWidth: bgZone
                  ? (templateColorOverride?.box_max_width || 320)
                  : infoBoxWidthPercent(templateColorOverride?.box_max_width || 320, refWidth, templateColorOverride?.content_side, tpl?.contentSide),
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
              <p style={{ margin: 0, lineHeight: 1.2, color: titleColor, fontFamily: FONT_STACKS.sacramento }}>
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

    </>
  );

  // ── 표지 + 내용 면 구조 (배경에 글 영역이 지정된 경우) ──
  // 그림의 빈 자리에 제목부만 두고, 나머지는 표지 아래 깨끗한 면에 둔다 — 글과 그림이 겹치지 않게
  if (bgZone && background) {
    const z = bgZone.zone;
    const zAlign = z.align || 'center';
    const showLabel = !!layoutMeta.fields.eventLabel && !hideEventLabel && !(card.event_type === 'baptism' && !card.event_label);
    const labelText = card.event_label || getEventLabelText(card.event_type);
    const subtitleText = applyName(card.greeting_oneliner || '', recipientName);
    const titleText = applyName(card.title, recipientName);
    const bodyText = applyName(card.body || '', recipientName);
    const mainColor = dbMain || tpl?.colorMain || COLORS.textDark;
    // 영역 높이에 맞춰 줄어든 제목 크기 — 가로 맞춤(FitText)의 하한도 그보다 크지 않게
    const zoneTitleStyle = { ...titleStyle, size: zonePlan.titleSize, minSize: Math.min(titleStyle.minSize, zonePlan.titleSize) };

    const labelEl = showLabel
      ? <FitText text={labelText} style={labelStyle} color={dbTitleAccent || dbMain || tpl?.colorMain || palette.title} align={zAlign} />
      : null;
    const subtitleEl = (card.greeting_oneliner || editable)
      ? <FitText text={subtitleText} style={subtitleStyle} color={palette.subtitle} align={zAlign}><Editable fieldKey="greeting_oneliner">{subtitleText}</Editable></FitText>
      : null;
    const titleEl = (
      <FitText as="h1" text={titleText} style={zoneTitleStyle} color={palette.title} align={zAlign}>
        <Editable fieldKey="title">{titleText}</Editable>
      </FitText>
    );
    const bodyEl = (card.body || editable)
      ? <FitText text={bodyText} style={bodyStyle} color={mainColor} align={zAlign} shrinkToFit={false}><Editable fieldKey="body" multiline>{bodyText}</Editable></FitText>
      : null;
    // 측정 전용 사본 — 내용 면으로 내려간 조각을 영역 안에서 숨긴 채 잴 때 쓴다.
    // 편집 버튼(Editable)·h1 을 빼는 이유: 보이지 않는 사본이 Tab 포커스를 받거나 h1 이 두 개가 되면 안 되므로
    const subtitleGhost = subtitleEl ? <FitText text={subtitleText} style={subtitleStyle} color={palette.subtitle} align={zAlign} /> : null;
    const titleGhost = <FitText text={titleText} style={zoneTitleStyle} color={palette.title} align={zAlign} />;
    const bodyGhost = bodyEl ? <FitText text={bodyText} style={bodyStyle} color={mainColor} align={zAlign} shrinkToFit={false} /> : null;

    // 내용 면으로 내려간 조각은 영역 안에서 숨긴 채 남겨 높이를 계속 잰다(결과가 왔다 갔다 하지 않게)
    // opacity 0 도 함께 — 안쪽 FitText 가 visibility: visible 을 직접 지정해 부모의 hidden 을 뚫고 보이기 때문
    const parked: React.CSSProperties = { position: 'absolute', left: 0, right: 0, visibility: 'hidden', opacity: 0, pointerEvents: 'none' };
    const { headBelow, subtitleBelow, bodyBelow } = zonePlan;
    // 조각 감싸기 스타일: 내려간 조각은 숨긴 채 유지, 내용이 없는 조각은 흐름에서 제외
    // (빈 div 도 flex gap 을 차지해 간격이 벌어지고 planZone 계산과 실제 높이가 어긋나기 때문)
    const slotStyle = (el: React.ReactNode, below: boolean): React.CSSProperties | undefined =>
      !el ? { display: 'none' } : below ? parked : undefined;
    // 숨긴 사본은 포커스·검색·스크린리더에서 완전히 제외
    // inert 는 React 18 이 불리언을 속성으로 내보내지 않아 빈 문자열로 전달(타입은 불리언만 허용해 object 로 우회)
    const ghostProps = (below: boolean): React.HTMLAttributes<HTMLDivElement> =>
      (below ? { 'aria-hidden': true, ...({ inert: '' } as object) } : {});
    const hasPanelText = headBelow || (subtitleBelow && !!subtitleEl) || (bodyBelow && !!bodyEl);

    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: templateColorOverride?.card_max_width || 440,
          margin: '0 auto',
          background: bgZone.panelColor,
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(123,94,167,0.18)',
          fontFamily: SERIF,
          color: mainColor
        }}
      >
        {/* 표지 — 배경 원본 비율 고정이라 글 길이와 무관하게 그림이 잘리거나 움직이지 않음 */}
        {/* coverCrop 이 있으면 그림 위쪽만 보이도록 표지를 낮춤(가로는 그대로라 그림 비율은 유지) */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: String(bgZone.aspect / (bgZone.coverCrop ?? 1)), overflow: 'hidden' }}>
          <img
            src={imgUrl(background.imageUrl)}
            alt=""
            style={{ position: 'absolute', left: 0, top: 0, width: '100%', aspectRatio: String(bgZone.aspect), pointerEvents: 'none' }}
          />
          <div
            ref={zoneRefs.zoneRef}
            style={{
              position: 'absolute',
              left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%`,
              display: 'flex', flexDirection: 'column', gap: ZONE_GAP,
              justifyContent: z.valign === 'top' ? 'flex-start' : z.valign === 'bottom' ? 'flex-end' : 'center',
              // 첫 측정이 끝나기 전에는 숨김 — 서버가 보낸 첫 화면에서 본문이 그림 위에 겹쳐 보였다가 내려가는 것 방지
              visibility: zoneMeasured ? undefined : 'hidden',
              outline: zoneDebug ? '1px dashed rgba(255,0,80,0.8)' : undefined
            }}
          >
            <div ref={zoneRefs.labelRef} {...ghostProps(headBelow)} style={slotStyle(labelEl, headBelow)}>{labelEl}</div>
            <div ref={zoneRefs.subtitleRef} {...ghostProps(headBelow || subtitleBelow)} style={slotStyle(subtitleEl, headBelow || subtitleBelow)}>{headBelow || subtitleBelow ? subtitleGhost : subtitleEl}</div>
            <div ref={zoneRefs.titleRef} {...ghostProps(headBelow)} style={slotStyle(titleEl, headBelow)}>{headBelow ? titleGhost : titleEl}</div>
            <div ref={zoneRefs.bodyRef} {...ghostProps(headBelow || bodyBelow)} style={slotStyle(bodyEl, headBelow || bodyBelow)}>{headBelow || bodyBelow ? bodyGhost : bodyEl}</div>
          </div>
        </div>

        {/* 내용 면 — 표지에 들어가지 못한 글 + 날짜·장소·RSVP·연락처 */}
        <div style={{ position: 'relative', padding: '22px 20px 44px' }}>
          {hasPanelText && (
            <FadeUp delay={0.2}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: ZONE_GAP, padding: '0 10px 18px', textAlign: 'center' }}>
                {headBelow && labelEl}
                {(headBelow || subtitleBelow) && subtitleEl}
                {headBelow && titleEl}
                {(headBelow || bodyBelow) && bodyEl}
              </div>
            </FadeUp>
          )}
          {detailsBlock}
        </div>
        {guideOverlay}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        // admin 배치 override — 미지정 시 코드 default
        maxWidth: templateColorOverride?.card_max_width || 440,
        minHeight: templateColorOverride?.card_min_height || undefined,
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
            // fit: 'fill' 배경(프레임 디자인)은 카드 크기에 맞춰 늘려 좌우 꽃 잘림 방지
            objectFit: background!.fit === 'fill' ? 'fill' : 'cover',
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
        // admin 배치 override — 지정된 항목만 위 default를 덮어씀 (shorthand 뒤에 와야 적용됨)
        ...(templateColorOverride?.content_top != null && { paddingTop: pctOf(templateColorOverride.content_top) }),
        ...(contentSide != null && {
          paddingLeft: pctOf(contentSide),
          paddingRight: pctOf(contentSide)
        }),
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
        {/* 상단 장식 — 템플릿 메인 색상으로 ✽ + gradient 라인.
            (Topdown Text, Thank-Classic 제외. 프레임형 배경은 아치 테두리와 겹쳐 생략) */}
        {card.layout_id !== 'layout-7' && card.layout_id !== 'thank_classic' && background?.fit !== 'fill' && (
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
                <FitText
                  text={card.event_label || getEventLabelText(card.event_type)}
                  style={labelStyle}
                  // 우선순위: DB title_accent → DB main → 템플릿 코드 main → layout default
                  color={dbTitleAccent || dbMain || tpl?.colorMain || labelField.color}
                  align={labelField.align}
                  extraStyle={{ marginTop: -4, marginBottom: 12 }}
                />
              );
            })()}
            {/* subtitle (greeting_oneliner) — eventLabel 아래, title 바로 위 (작은 글씨) */}
            {(card.greeting_oneliner || editable) && (
              <FitText
                text={applyName(card.greeting_oneliner || '', recipientName)}
                style={subtitleStyle}
                color={palette.subtitle}
                extraStyle={{ marginTop: card.layout_id === 'thank_classic' ? 10 : 0, marginBottom: 8 }}
              >
                <Editable fieldKey="greeting_oneliner">{applyName(card.greeting_oneliner || '', recipientName)}</Editable>
              </FitText>
            )}
            {/* 글꼴·크기·자간은 템플릿 설정에서 — 여백만 레이아웃별로 다름 */}
            <FitText
              as="h1"
              text={applyName(card.title, recipientName)}
              style={titleStyle}
              color={palette.title}
              extraStyle={{ margin: card.layout_id === 'thank_classic' ? '8px 0 10px' : '0 0 8px' }}
            >
              <Editable fieldKey="title">{applyName(card.title, recipientName)}</Editable>
            </FitText>
            {(card.body || editable) && card.layout_id !== 'layout-7' && (
              <div style={{ marginTop: card.layout_id === 'thank_classic' ? -20 : 0 }}>
                <Divider color={palette.title} icon={decoIcon} />
                <FitText
                  text={applyName(card.body || '', recipientName)}
                  style={bodyStyle}
                  color={dbMain || tpl?.colorMain || COLORS.textDark}
                  shrinkToFit={false}
                  extraStyle={{ padding: '0 10px', boxSizing: 'border-box' }}
                >
                  <Editable fieldKey="body" multiline>
                    {applyName(card.body || '', recipientName)}
                  </Editable>
                </FitText>
              </div>
            )}
          </div>
        </FadeUp>

        {detailsBlock}

      </div>
      {/* wizard 가이드 오버레이 — 카드 외각에 absolute로 (flow layout 좌표 없이도 표시 가능) */}
      {guideOverlay}
    </div>
  );
}
