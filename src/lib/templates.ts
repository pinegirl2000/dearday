// 큐레이션된 템플릿 — bg_id + layout_id를 묶어서 한 단위로 선택하게 함.
// envelope은 별도 선택. layout은 사용자에게 노출하지 않고 템플릿이 결정.

import type { BackgroundId } from '@/lib/backgrounds';
import type { LayoutId } from '@/lib/layouts';
import type { EventType } from '@/types/card';
import type { TemplateTypography } from '@/lib/typography';

export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  bg_id: BackgroundId;
  layout_id: LayoutId;
  /**
   * 메인 텍스트 색상 (제목, 이벤트 라벨 등 강조 텍스트용).
   * 정의되어 있으면 layout의 기본 색상을 override.
   */
  colorMain?: string;
  /**
   * 서브 텍스트 색상 (부제, 본문, 날짜/장소 등 보조 텍스트용).
   * 정의되어 있으면 layout의 기본 색상을 override.
   */
  colorSub?: string;
  /**
   * 날짜/장소 반투명 박스(layout-5/rightbottom/6 한정)의 스타일 override.
   * 미정의 시 colorSub 기반 default(흰색 frosted glass)가 적용됨.
   * - bg: CSS background 값 (linear-gradient 권장 — 반투명 + 톤)
   * - textColor: 박스 안 텍스트 색상 (날짜/장소). 미정의 시 colorMain 또는 layout 기본
   * - borderColor: 박스 테두리 (옵션)
   */
  infoBox?: {
    bg: string;
    textColor?: string;
    borderColor?: string;
  };
  /** 추천 이벤트 타입 */
  recommendEvents: EventType[];
  /**
   * 사용자가 이 템플릿에서 선택할 수 있는 layout 목록.
   * 미정의 시 [layout_id] 하나만 사용 가능 (현재 동작).
   */
  allowedLayouts?: LayoutId[];
  /** 썸네일 미리보기에 쓸 이름 (자유 텍스트) */
  badge?: string;
  /**
   * true면 사용자 마법사(getTemplatesFor)에서 제외 — 관리자 페이지에서는 노출.
   * layout 미지정 등 운영 준비 전인 템플릿에 사용.
   */
  draft?: boolean;
  /**
   * 역할별 글꼴·크기·자간 기본값 (관리자 DB 값이 있으면 그쪽이 우선).
   * 템플릿마다 배경 분위기에 맞는 글자를 쓰기 위함.
   */
  typography?: TemplateTypography;
  /**
   * 흐름형 카드의 좌우 여백(px, 카드 기준폭 440 기준). 배경 프레임·세로선 안쪽에 글자가 머물도록.
   * 절대배치 레이아웃에는 적용하지 않음(그쪽 content_side 는 필드 위치 오프셋이라 의미가 다름).
   */
  contentSide?: number;
}

/** 템플릿이 허용하는 layout 목록을 안전하게 반환 */
export function getTemplateLayouts(t: TemplateMeta): LayoutId[] {
  if (t.allowedLayouts && t.allowedLayouts.length > 0) return t.allowedLayouts;
  return [t.layout_id];
}

/**
 * 템플릿 분위기별 글꼴 조합 — 같은 분위기의 템플릿이 같은 글자 리듬을 갖도록 묶어서 관리.
 * 한 템플릿 안에서는 글꼴 최대 2종, 필기체는 제목에만(작은 글자에 쓰면 읽기 어려움).
 */
const TYPO = {
  /** 수채화·꽃 — 우아한 Cormorant 제목 + Playfair 라벨 */
  elegant: {
    eventLabel: { font: 'playfair', size: 11, spacing: 0.42, weight: 600 },
    subtitle: { font: 'cormorant', size: 15, spacing: 0.18, weight: 500 },
    title: { font: 'cormorant', size: 34, spacing: 0.12, weight: 500, lineHeight: 1.15 },
    body: { font: 'cormorant', size: 17, spacing: 0.01, weight: 500, lineHeight: 1.85 }
  },
  /** 금박·블랙 — 대비 강한 Playfair 제목 + Cormorant 본문 */
  luxe: {
    eventLabel: { font: 'playfair', size: 11, spacing: 0.45, weight: 600 },
    subtitle: { font: 'cormorant', size: 15, spacing: 0.2, weight: 500 },
    title: { font: 'playfair', size: 30, spacing: 0.08, weight: 500, lineHeight: 1.2 },
    body: { font: 'cormorant', size: 17, spacing: 0.01, weight: 500, lineHeight: 1.85 }
  },
  /** 단색 그라데이션 — 부드러운 고운바탕 명조 */
  softClassic: {
    eventLabel: { font: 'playfair', size: 11, spacing: 0.45, weight: 600 },
    subtitle: { font: 'gowunBatang', size: 13, spacing: 0.16, weight: 400 },
    title: { font: 'gowunBatang', size: 27, spacing: 0.2, weight: 400, lineHeight: 1.3 },
    body: { font: 'gowunBatang', size: 15, spacing: 0, weight: 400, lineHeight: 2.0 }
  },
  /** 곰돌이·풍선·케이크 — 둥근 고운돋움, 좁은 자간으로 경쾌하게 */
  playful: {
    eventLabel: { font: 'playfair', size: 11, spacing: 0.4, weight: 600 },
    subtitle: { font: 'gowunDodum', size: 14, spacing: 0.06, weight: 400 },
    title: { font: 'gowunDodum', size: 29, spacing: 0.04, weight: 400, lineHeight: 1.25 },
    body: { font: 'gowunDodum', size: 15, spacing: 0.01, weight: 400, lineHeight: 1.9 }
  },
  /** 리본·로즈골드 — 필기체 제목 + Cormorant */
  romanticScript: {
    eventLabel: { font: 'cormorant', size: 12, spacing: 0.4, weight: 600 },
    subtitle: { font: 'cormorant', size: 15, spacing: 0.18, weight: 500 },
    title: { font: 'greatVibes', size: 42, spacing: 0, weight: 400, lineHeight: 1.15 },
    body: { font: 'cormorant', size: 17, spacing: 0.01, weight: 500, lineHeight: 1.85 }
  },
  /** 로마 대문자풍 Cinzel 제목 — 금박·격식 있는 행사 */
  monument: {
    eventLabel: { font: 'josefin', size: 11, spacing: 0.42, weight: 500 },
    subtitle: { font: 'cormorant', size: 15, spacing: 0.18, weight: 500 },
    title: { font: 'cinzel', size: 27, spacing: 0.1, weight: 500, lineHeight: 1.25 },
    body: { font: 'cormorant', size: 17, spacing: 0.01, weight: 500, lineHeight: 1.85 }
  },
  /** 클래식 한글 명조(나눔명조) */
  classicKo: {
    eventLabel: { font: 'playfair', size: 11, spacing: 0.45, weight: 600 },
    subtitle: { font: 'nanumMyeongjo', size: 13, spacing: 0.16, weight: 400 },
    title: { font: 'nanumMyeongjo', size: 27, spacing: 0.18, weight: 700, lineHeight: 1.3 },
    body: { font: 'nanumMyeongjo', size: 15, spacing: 0, weight: 400, lineHeight: 2.0 }
  },
  /** 모던 기하학 Josefin Sans — 깔끔한 모임·오픈 행사 */
  modern: {
    eventLabel: { font: 'josefin', size: 11, spacing: 0.42, weight: 500 },
    subtitle: { font: 'josefin', size: 13, spacing: 0.2, weight: 400 },
    title: { font: 'josefin', size: 30, spacing: 0.14, weight: 400, lineHeight: 1.25 },
    body: { font: 'quicksand', size: 15, spacing: 0.01, weight: 500, lineHeight: 1.9 }
  },
  /** 둥근 Quicksand — 아기·곰돌이 */
  rounded: {
    eventLabel: { font: 'quicksand', size: 11, spacing: 0.36, weight: 600 },
    subtitle: { font: 'quicksand', size: 14, spacing: 0.06, weight: 500 },
    title: { font: 'quicksand', size: 30, spacing: 0.02, weight: 600, lineHeight: 1.25 },
    body: { font: 'quicksand', size: 15, spacing: 0.01, weight: 500, lineHeight: 1.9 }
  },
  /** 굵은 Gmarket Sans 제목 — 생일·파티 */
  cheer: {
    eventLabel: { font: 'gmarket', size: 10, spacing: 0.3, weight: 500 },
    subtitle: { font: 'gowunDodum', size: 14, spacing: 0.06, weight: 400 },
    title: { font: 'gmarket', size: 27, spacing: 0, weight: 700, lineHeight: 1.3 },
    body: { font: 'gowunDodum', size: 15, spacing: 0.01, weight: 400, lineHeight: 1.9 }
  },
  /** 손글씨(강원교육새음) 제목 + Quicksand 본문 — 동화 같은 분위기 */
  storybook: {
    eventLabel: { font: 'quicksand', size: 11, spacing: 0.36, weight: 600 },
    subtitle: { font: 'quicksand', size: 14, spacing: 0.06, weight: 500 },
    title: { font: 'gangwonSaeeum', size: 38, spacing: 0.02, weight: 400, lineHeight: 1.2 },
    body: { font: 'quicksand', size: 15, spacing: 0.01, weight: 500, lineHeight: 1.9 }
  },
  /** Alex Brush 붓 필기체 제목 */
  brushScript: {
    eventLabel: { font: 'cormorant', size: 12, spacing: 0.4, weight: 600 },
    subtitle: { font: 'cormorant', size: 15, spacing: 0.18, weight: 500 },
    title: { font: 'alexBrush', size: 44, spacing: 0, weight: 400, lineHeight: 1.15 },
    body: { font: 'cormorant', size: 17, spacing: 0.01, weight: 500, lineHeight: 1.85 }
  },
  /** Allura 필기체 제목 */
  alluraScript: {
    eventLabel: { font: 'cormorant', size: 12, spacing: 0.4, weight: 600 },
    subtitle: { font: 'cormorant', size: 15, spacing: 0.18, weight: 500 },
    title: { font: 'allura', size: 46, spacing: 0, weight: 400, lineHeight: 1.15 },
    body: { font: 'cormorant', size: 17, spacing: 0.01, weight: 500, lineHeight: 1.85 }
  },
  /** 손글씨(강원교육새음) 제목 — 편지 같은 분위기. 손글씨 글꼴의 영문은 본문 크기에서 읽기 어려워 본문·부제는 Cormorant */
  letter: {
    eventLabel: { font: 'cormorant', size: 12, spacing: 0.4, weight: 600 },
    subtitle: { font: 'cormorant', size: 15, spacing: 0.18, weight: 500 },
    title: { font: 'gangwonSaeeum', size: 38, spacing: 0.02, weight: 400, lineHeight: 1.2 },
    body: { font: 'cormorant', size: 17, spacing: 0.01, weight: 500, lineHeight: 1.85 }
  },
  /** Amatic SC 손글씨 대문자 제목 */
  doodle: {
    eventLabel: { font: 'quicksand', size: 11, spacing: 0.36, weight: 600 },
    subtitle: { font: 'quicksand', size: 14, spacing: 0.06, weight: 500 },
    title: { font: 'amatic', size: 46, spacing: 0.06, weight: 700, lineHeight: 1.1 },
    body: { font: 'quicksand', size: 15, spacing: 0.01, weight: 500, lineHeight: 1.9 }
  },
  /** Abril Fatface 굵은 디스플레이 제목 */
  bold: {
    eventLabel: { font: 'josefin', size: 11, spacing: 0.42, weight: 500 },
    subtitle: { font: 'cormorant', size: 15, spacing: 0.18, weight: 500 },
    title: { font: 'abril', size: 30, spacing: 0.02, weight: 400, lineHeight: 1.2 },
    body: { font: 'cormorant', size: 17, spacing: 0.01, weight: 500, lineHeight: 1.85 }
  },
  /** 강원교육튼튼 굵은 제목 — 신나는 파티 */
  chunky: {
    eventLabel: { font: 'gmarket', size: 10, spacing: 0.3, weight: 500 },
    subtitle: { font: 'gowunDodum', size: 14, spacing: 0.06, weight: 400 },
    title: { font: 'gangwonTeunteun', size: 29, spacing: 0.02, weight: 400, lineHeight: 1.25 },
    body: { font: 'gowunDodum', size: 15, spacing: 0.01, weight: 400, lineHeight: 1.9 }
  },
  /** 강원교육모두 Bold 둥근 제목 — 밝고 친근한 모임 */
  friendly: {
    eventLabel: { font: 'quicksand', size: 11, spacing: 0.36, weight: 600 },
    subtitle: { font: 'gowunDodum', size: 14, spacing: 0.06, weight: 400 },
    title: { font: 'gangwonModu', size: 28, spacing: 0.02, weight: 700, lineHeight: 1.3 },
    body: { font: 'gowunDodum', size: 15, spacing: 0.01, weight: 400, lineHeight: 1.9 }
  }
} satisfies Record<string, TemplateTypography>;

export const TEMPLATES: TemplateMeta[] = [
  {
    id: 'tpl-lavender-classic',
    typography: TYPO.softClassic,
    name: 'Lavender Classic',
    description: 'Soft lavender gradient — timeless and elegant',
    bg_id: 'bg-1',
    layout_id: 'layout-classic',
    colorMain: '#7B5EA7',
    colorSub: '#FFFFFF',
    recommendEvents: ['baptism', 'meeting', 'etc'],
    allowedLayouts: ['layout-classic'],
    badge: 'Wedding'
  },
  {
    id: 'tpl-cream-classic',
    typography: TYPO.monument,
    name: 'Cream Classic',
    description: 'Soft cream gradient — warm and timeless',
    bg_id: 'bg-cream',
    layout_id: 'layout-classic',
    colorMain: '#8C6F4A',
    colorSub: '#FFFFFF',
    recommendEvents: ['baptism', 'meeting', 'etc'],
    allowedLayouts: ['layout-classic']
  },
  {
    id: 'tpl-watercolor-purple',
    typography: TYPO.elegant,
    contentSide: 28,
    name: 'Watercolor Lavender',
    description: 'Hand-painted purple florals on cream paper',
    bg_id: 'bg-img-2',
    layout_id: 'layout-classic',
    colorMain: '#7B5EA7',
    colorSub: '#5A3D7A',
    recommendEvents: ['meeting', 'etc'],
    allowedLayouts: ['layout-classic', 'layout-4'],
    badge: 'Romantic'
  },
  {
    id: 'tpl-watercolor-purple-soft',
    typography: TYPO.letter,
    contentSide: 28,
    name: 'Watercolor Lavender Soft',
    description: 'Soft purple florals with lavender leaves — feminine and gentle',
    bg_id: 'bg-img-3',
    layout_id: 'layout-classic',
    colorMain: '#7B5EA7',
    colorSub: '#EFE7F8',
    recommendEvents: ['baptism', 'meeting', 'etc'],
    allowedLayouts: ['layout-classic', 'layout-4', 'layout-7']
  },
  {
    id: 'tpl-watercolor-green',
    typography: TYPO.elegant,
    contentSide: 76,
    name: 'Watercolor Eucalyptus',
    description: 'Fresh green watercolor leaves',
    bg_id: 'bg-img-1',
    layout_id: 'layout-classic',
    colorMain: '#476956',
    colorSub: '#D4E0CC',
    recommendEvents: ['baptism', 'meeting', 'etc'],
    allowedLayouts: ['layout-classic']
  },
  {
    id: 'tpl-beige-warm',
    typography: TYPO.classicKo,
    name: 'Beige Warm',
    description: 'Cream beige — gentle and reverent',
    bg_id: 'bg-2',
    layout_id: 'layout-classic',
    colorMain: '#6E5A3D',
    colorSub: '#F0E5CD',
    recommendEvents: ['baptism', 'meeting', 'opening', 'etc'],
    allowedLayouts: ['layout-classic']
  },
  {
    id: 'tpl-mint-fresh',
    typography: TYPO.modern,
    name: 'Mint Fresh',
    description: 'Soft mint — fresh and breezy',
    bg_id: 'bg-3',
    layout_id: 'layout-classic',
    colorMain: '#476956',
    colorSub: '#E8F0E5',
    recommendEvents: ['birthday', 'meeting', 'opening', 'etc'],
    allowedLayouts: ['layout-classic']
  },
  {
    id: 'tpl-coral-bright',
    typography: TYPO.friendly,
    name: 'Coral Bright',
    description: 'Light coral — joyful and bright',
    bg_id: 'bg-4',
    layout_id: 'layout-classic',
    colorMain: '#8E5A4D',
    colorSub: '#FCEAE2',
    recommendEvents: ['birthday', 'opening', 'etc'],
    allowedLayouts: ['layout-classic', 'layout-4']
  },
  {
    id: 'tpl-vintage-gold',
    typography: TYPO.luxe,
    contentSide: 52,
    name: 'Vintage Gold',
    description: 'Eucalyptus with gold geometric frame',
    bg_id: 'bg-img-4',
    layout_id: 'layout-classic',
    colorMain: '#A07C2C',
    colorSub: '#F4E9CC',
    recommendEvents: ['opening', 'etc'],
    allowedLayouts: ['layout-classic', 'layout-3']
  },
  {
    id: 'tpl-teddy-pink',
    typography: TYPO.storybook,
    contentSide: 36,
    name: 'Pink Teddy Balloons',
    description: 'Watercolor teddy bear with pink balloons',
    bg_id: 'bg-img-6',
    layout_id: 'layout-classic',
    colorMain: '#8E5A4D',
    colorSub: '#E89AA0', // 풍선/리본의 로즈핑크 — 십자가 색상에도 사용
    recommendEvents: ['birthday', 'baptism', 'etc'],
    allowedLayouts: ['layout-classic'] // 표지+내용 면 구조 전용 — 보조 레이아웃은 그림과 글이 겹쳐 제외
  },
  {
    id: 'tpl-teddy-blue',
    typography: TYPO.rounded,
    contentSide: 36,
    name: 'Blue Teddy Cloud',
    description: 'Watercolor teddy bear on a soft pastel cloud',
    bg_id: 'bg-img-7',
    layout_id: 'layout-classic',
    colorMain: '#5A8AB8',
    colorSub: '#85A8C9',
    recommendEvents: ['birthday', 'baptism', 'etc'],
    allowedLayouts: ['layout-classic'] // 표지+내용 면 구조 전용 — 보조 레이아웃은 그림과 글이 겹쳐 제외
  },
  {
    id: 'tpl-pink-ribbon-arch',
    typography: TYPO.brushScript,
    contentSide: 60,
    name: 'Pink Ribbon Arch',
    description: 'Soft pink ribbon over a clean white arch',
    bg_id: 'bg-img-8',
    layout_id: 'layout-classic',
    colorMain: '#A65A6F',
    colorSub: '#E89AA0',
    recommendEvents: ['birthday', 'baptism', 'etc'],
    allowedLayouts: ['layout-classic'] // 표지+내용 면 구조 전용 — 보조 레이아웃은 그림과 글이 겹쳐 제외
  },
  {
    id: 'tpl-pink-ribbon-mono',
    typography: TYPO.alluraScript,
    contentSide: 28,
    name: 'Pink Ribbon',
    description: 'Soft pink ribbon on a monochrome pink wash',
    bg_id: 'bg-img-9',
    layout_id: 'layout-classic',
    colorMain: '#A65A6F',
    colorSub: '#E89AA0',
    recommendEvents: ['birthday', 'baptism', 'etc'],
    allowedLayouts: ['layout-classic'] // 표지+내용 면 구조 전용 — 보조 레이아웃은 그림과 글이 겹쳐 제외
  },
  {
    id: 'tpl-eucalyptus-gold',
    typography: TYPO.bold,
    contentSide: 76,
    name: 'Eucalyptus Gold',
    description: 'Eucalyptus leaves with gold geometric frame',
    bg_id: 'bg-img-10',
    layout_id: 'layout-classic',
    colorMain: '#A07C2C',
    colorSub: '#D4E0CC',
    recommendEvents: ['opening', 'meeting', 'etc'],
    allowedLayouts: ['layout-classic', 'layout-3']
  },
  {
    id: 'tpl-bear-blue-sky',
    typography: TYPO.rounded,
    contentSide: 36,
    name: 'Blue Bear Sky',
    description: 'Watercolor bear floating among blue clouds',
    bg_id: 'bg-img-11',
    layout_id: 'layout-classic',
    colorMain: '#5A8AB8',
    colorSub: '#9CC0DD',
    recommendEvents: ['birthday', 'baptism', 'etc'],
    allowedLayouts: ['layout-classic'] // 표지+내용 면 구조 전용 — 보조 레이아웃은 그림과 글이 겹쳐 제외
  },
  // === Draft batch (admin only — layout not yet curated) ===
  {
    id: 'tpl-party-balloons-cake',
    typography: TYPO.chunky,
    contentSide: 56,
    name: 'Party Balloons & Cake',
    description: 'Bright multicolor balloons with cake & gift — kids party',
    bg_id: 'bg-img-12',
    layout_id: 'layout-classic',
    colorMain: '#E8588F',
    colorSub: '#FCE4EE',
    recommendEvents: ['birthday', 'etc'],
    draft: true
  },
  {
    id: 'tpl-pink-castle',
    typography: TYPO.storybook,
    contentSide: 44,
    name: 'Pink Castle Floral',
    description: 'Watercolor princess castle on pink clouds with rose border',
    bg_id: 'bg-img-13',
    layout_id: 'layout-classic',
    colorMain: '#D67BA8',
    colorSub: '#FCE8EE',
    recommendEvents: ['birthday', 'baptism', 'etc'],
    draft: true
  },
  {
    id: 'tpl-sage-teddy',
    typography: TYPO.friendly,
    contentSide: 56,
    name: 'Sage Teddy Frame',
    description: 'Sage green stripes with teddy bear and ribbon frame',
    bg_id: 'bg-img-14',
    layout_id: 'layout-classic',
    colorMain: '#6F9B7A',
    colorSub: '#E8F1E5',
    recommendEvents: ['birthday', 'baptism', 'etc'],
    draft: true
  },
  {
    id: 'tpl-pressed-flowers',
    // 종이 패널 폭이 250px 남짓이라 본문을 한 단계 줄여 마지막 단어만 홀로 떨어지는 줄을 방지
    typography: { ...TYPO.elegant, body: { ...TYPO.elegant.body, size: 15 } },
    contentSide: 104,
    name: 'Pressed Flowers',
    description: 'Pressed wildflowers on warm beige — botanical editorial',
    bg_id: 'bg-img-15',
    layout_id: 'layout-classic',
    colorMain: '#B89456',
    colorSub: '#7A5E2E',
    recommendEvents: ['meeting', 'opening', 'etc'],
    draft: true
  },
  {
    id: 'tpl-pastel-cake-bunting',
    typography: TYPO.doodle,
    contentSide: 32,
    name: 'Pastel Cake Bunting',
    description: 'Pastel cakes & bunting flags on lilac — playful baby vibe',
    bg_id: 'bg-img-16',
    layout_id: 'layout-classic',
    colorMain: '#5BA8C9',
    colorSub: '#E8F4F8',
    recommendEvents: ['birthday', 'baptism', 'etc'],
    draft: true
  },
  {
    id: 'tpl-rose-gold-balloons',
    typography: TYPO.romanticScript,
    contentSide: 48,
    name: 'Rose Gold Balloons',
    description: 'Rose gold balloons on watercolor pink — elegant celebration',
    bg_id: 'bg-img-17',
    layout_id: 'layout-classic',
    colorMain: '#C97766',
    colorSub: '#FCE5DD',
    recommendEvents: ['birthday', 'etc'],
    draft: true
  },
  {
    id: 'tpl-gold-splatter',
    typography: TYPO.modern,
    contentSide: 56,
    name: 'Gold Splatter Beige',
    description: 'Gold splatter & beige abstract — modern minimal luxe',
    bg_id: 'bg-img-18',
    layout_id: 'layout-classic',
    colorMain: '#A07C2C',
    colorSub: '#F5EFE0',
    recommendEvents: ['opening', 'meeting', 'etc'],
    draft: true
  },
  {
    id: 'tpl-black-gold-gala',
    typography: TYPO.monument,
    contentSide: 48,
    name: 'Black Gold Gala',
    description: 'Black background with gold balloons — gala / adult party',
    bg_id: 'bg-img-19',
    layout_id: 'layout-classic',
    // 검정 배경에서 읽히는 금색 기본값 — DB 값이 없을 때 기본 보라색(대비 부족)으로 떨어지지 않게
    colorMain: '#E9CF95',
    colorSub: '#F3E6C4',
    // colorMain/colorSub/infoBox는 DB(dearday_template_config)에 저장됨 — admin에서 수정 가능
    recommendEvents: ['birthday', 'opening', 'etc'],
    draft: true
  },
  {
    id: 'tpl-iris-hearts',
    contentSide: 28,
    name: 'Iris & Hearts',
    description: 'Pink background with purple irises and heart macarons — thank/love themed',
    bg_id: 'bg-img-20',
    layout_id: 'thank_classic',
    colorMain: '#5B3F8F',
    colorSub: '#FCE4EC',
    recommendEvents: ['birthday', 'etc'],
    draft: true
  },
  {
    id: 'tpl-lavender-peony',
    typography: TYPO.elegant,
    contentSide: 72,
    name: 'Lavender Peony Frame',
    description: 'Pink peonies & baby’s breath on lavender with an arched cream panel',
    bg_id: 'bg-img-21',
    layout_id: 'layout-classic',
    colorMain: '#A85FBA',
    colorSub: '#EFE0F5',
    recommendEvents: ['baptism', 'meeting', 'birthday', 'etc'],
    // 아치형 프레임 안에 텍스트가 정확히 들어가는 2종만 허용
    allowedLayouts: ['layout-classic'] // 표지+내용 면 구조 전용 — 보조 레이아웃은 그림과 글이 겹쳐 제외
  },
  // ── 코드로 그린 새 템플릿 (글 영역을 처음부터 비워 둔 디자인) — 공개 전 검토용으로 draft ──
  {
    id: 'tpl-botanical-arch',
    typography: TYPO.elegant,
    name: 'Botanical Arch',
    description: 'Sage arch with leaf sprigs on cream — calm and elegant',
    bg_id: 'bg-svg-botanical',
    layout_id: 'layout-classic',
    colorMain: '#55705A',
    colorSub: '#7C9878',
    recommendEvents: ['meeting', 'baptism', 'etc'],
    allowedLayouts: ['layout-classic'],
    draft: true
  },
  {
    id: 'tpl-confetti-party',
    typography: TYPO.cheer,
    name: 'Confetti Party',
    description: 'Pastel bunting and confetti — bright and cheerful',
    bg_id: 'bg-svg-confetti',
    layout_id: 'layout-classic',
    colorMain: '#6B5B95',
    colorSub: '#8C7FB0',
    recommendEvents: ['birthday', 'meeting', 'etc'],
    allowedLayouts: ['layout-classic'],
    draft: true
  },
  {
    id: 'tpl-lunar-red-gold',
    typography: TYPO.monument,
    name: 'Lunar Red & Gold',
    description: 'Festive red with gold lanterns — Chinese New Year and reunion dinners',
    bg_id: 'bg-svg-lunar',
    layout_id: 'layout-classic',
    colorMain: '#F1D58E',
    colorSub: '#F6E6B8',
    recommendEvents: ['meeting', 'opening', 'etc'],
    allowedLayouts: ['layout-classic'],
    draft: true
  }
];

export function getTemplate(id: string | null | undefined): TemplateMeta {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}

/**
 * bg_id + layout_id 조합으로 역검색 (기존 카드 → 템플릿 추정용).
 * 정확한 페어가 없으면 bg_id만 매칭하는 첫 템플릿을 fallback으로 반환 —
 * admin에서 layout을 임시 override하거나 layout이 바뀌어도 색상 페어링은 유지되도록.
 */
export function findTemplateByPair(bg_id?: string | null, layout_id?: string | null): TemplateMeta | undefined {
  if (!bg_id) return undefined;
  if (layout_id) {
    const exact = TEMPLATES.find((t) => t.bg_id === bg_id && t.layout_id === layout_id);
    if (exact) return exact;
  }
  return TEMPLATES.find((t) => t.bg_id === bg_id);
}

/**
 * 이벤트 타입에 추천되는 템플릿만 반환.
 * 사용자 마법사에서 이 결과를 그대로 노출 → wedding 이벤트에는 wedding이
 * recommendEvents에 포함된 템플릿만 나타남.
 */
export function getTemplatesFor(event: EventType): TemplateMeta[] {
  return TEMPLATES.filter((t) => !t.draft && t.recommendEvents.includes(event));
}
