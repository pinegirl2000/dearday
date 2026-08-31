// 큐레이션된 템플릿 — bg_id + layout_id를 묶어서 한 단위로 선택하게 함.
// envelope은 별도 선택. layout은 사용자에게 노출하지 않고 템플릿이 결정.

import type { BackgroundId } from '@/lib/backgrounds';
import type { LayoutId } from '@/lib/layouts';
import type { EventType } from '@/types/card';

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
}

/** 템플릿이 허용하는 layout 목록을 안전하게 반환 */
export function getTemplateLayouts(t: TemplateMeta): LayoutId[] {
  if (t.allowedLayouts && t.allowedLayouts.length > 0) return t.allowedLayouts;
  return [t.layout_id];
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: 'tpl-lavender-classic',
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
    name: 'Pink Teddy Balloons',
    description: 'Watercolor teddy bear with pink balloons',
    bg_id: 'bg-img-6',
    layout_id: 'layout-classic',
    colorMain: '#8E5A4D',
    colorSub: '#E89AA0', // 풍선/리본의 로즈핑크 — 십자가 색상에도 사용
    recommendEvents: ['birthday', 'baptism', 'etc'],
    allowedLayouts: ['layout-classic', 'layout-5']
  },
  {
    id: 'tpl-teddy-blue',
    name: 'Blue Teddy Cloud',
    description: 'Watercolor teddy bear on a soft pastel cloud',
    bg_id: 'bg-img-7',
    layout_id: 'layout-classic',
    colorMain: '#5A8AB8',
    colorSub: '#85A8C9',
    recommendEvents: ['birthday', 'baptism', 'etc'],
    allowedLayouts: ['layout-classic', 'layout-5']
  },
  {
    id: 'tpl-pink-ribbon-arch',
    name: 'Pink Ribbon Arch',
    description: 'Soft pink ribbon over a clean white arch',
    bg_id: 'bg-img-8',
    layout_id: 'layout-classic',
    colorMain: '#A65A6F',
    colorSub: '#E89AA0',
    recommendEvents: ['birthday', 'baptism', 'etc'],
    allowedLayouts: ['layout-classic', 'layout-4']
  },
  {
    id: 'tpl-pink-ribbon-mono',
    name: 'Pink Ribbon',
    description: 'Soft pink ribbon on a monochrome pink wash',
    bg_id: 'bg-img-9',
    layout_id: 'layout-classic',
    colorMain: '#A65A6F',
    colorSub: '#E89AA0',
    recommendEvents: ['birthday', 'baptism', 'etc'],
    allowedLayouts: ['layout-classic']
  },
  {
    id: 'tpl-eucalyptus-gold',
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
    name: 'Blue Bear Sky',
    description: 'Watercolor bear floating among blue clouds',
    bg_id: 'bg-img-11',
    layout_id: 'layout-classic',
    colorMain: '#5A8AB8',
    colorSub: '#9CC0DD',
    recommendEvents: ['birthday', 'baptism', 'etc'],
    allowedLayouts: ['layout-classic', 'layout-5']
  },
  // === Draft batch (admin only — layout not yet curated) ===
  {
    id: 'tpl-party-balloons-cake',
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
    name: 'Black Gold Gala',
    description: 'Black background with gold balloons — gala / adult party',
    bg_id: 'bg-img-19',
    layout_id: 'layout-classic',
    // colorMain/colorSub/infoBox는 DB(dearday_template_config)에 저장됨 — admin에서 수정 가능
    recommendEvents: ['birthday', 'opening', 'etc'],
    draft: true
  },
  {
    id: 'tpl-iris-hearts',
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
    name: 'Lavender Peony Frame',
    description: 'Pink peonies & baby’s breath on lavender with an arched cream panel',
    bg_id: 'bg-img-21',
    layout_id: 'layout-classic',
    colorMain: '#A85FBA',
    colorSub: '#EFE0F5',
    recommendEvents: ['baptism', 'meeting', 'birthday', 'etc'],
    allowedLayouts: ['layout-classic']
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
