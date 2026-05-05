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
  /** 추천 이벤트 타입 */
  recommendEvents: EventType[];
  /** 썸네일 미리보기에 쓸 이름 (자유 텍스트) */
  badge?: string;
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
    recommendEvents: ['wedding', 'baptism', 'meeting', 'etc'],
    badge: 'Wedding'
  },
  {
    id: 'tpl-watercolor-purple',
    name: 'Watercolor Lavender',
    description: 'Hand-painted purple florals on cream paper',
    bg_id: 'bg-img-2',
    layout_id: 'layout-classic',
    recommendEvents: ['wedding', 'meeting', 'etc'],
    badge: 'Romantic'
  },
  {
    id: 'tpl-watercolor-green',
    name: 'Watercolor Eucalyptus',
    description: 'Fresh green watercolor leaves',
    bg_id: 'bg-img-1',
    layout_id: 'layout-classic',
    recommendEvents: ['baptism', 'meeting', 'etc']
  },
  {
    id: 'tpl-beige-warm',
    name: 'Beige Warm',
    description: 'Cream beige — gentle and reverent',
    bg_id: 'bg-2',
    layout_id: 'layout-classic',
    recommendEvents: ['baptism', 'meeting', 'opening', 'etc']
  },
  {
    id: 'tpl-mint-fresh',
    name: 'Mint Fresh',
    description: 'Soft mint — fresh and breezy',
    bg_id: 'bg-3',
    layout_id: 'layout-classic',
    recommendEvents: ['birthday', 'meeting', 'opening', 'etc']
  },
  {
    id: 'tpl-coral-bright',
    name: 'Coral Bright',
    description: 'Light coral — joyful and bright',
    bg_id: 'bg-4',
    layout_id: 'layout-classic',
    recommendEvents: ['birthday', 'opening', 'etc']
  },
  {
    id: 'tpl-vintage-gold',
    name: 'Vintage Gold',
    description: 'Eucalyptus with gold geometric frame',
    bg_id: 'bg-img-4',
    layout_id: 'layout-classic',
    recommendEvents: ['wedding', 'opening', 'etc']
  }
];

export function getTemplate(id: string | null | undefined): TemplateMeta {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}

/** bg_id + layout_id 조합으로 역검색 (기존 카드 → 템플릿 추정용) */
export function findTemplateByPair(bg_id?: string | null, layout_id?: string | null): TemplateMeta | undefined {
  if (!bg_id || !layout_id) return undefined;
  return TEMPLATES.find((t) => t.bg_id === bg_id && t.layout_id === layout_id);
}

/** 이벤트 타입에 추천되는 템플릿만 정렬 */
export function getTemplatesFor(event: EventType): TemplateMeta[] {
  const recommended = TEMPLATES.filter((t) => t.recommendEvents.includes(event));
  const others = TEMPLATES.filter((t) => !t.recommendEvents.includes(event));
  return [...recommended, ...others];
}
