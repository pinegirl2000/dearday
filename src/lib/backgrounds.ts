// 배경 이미지 카탈로그 — layout과 독립적으로 선택 가능

import type { EventType } from '@/types/card';

export type BackgroundId =
  | 'bg-none'
  | 'bg-1' | 'bg-2' | 'bg-3' | 'bg-4'
  | 'bg-img-1' | 'bg-img-2' | 'bg-img-3' | 'bg-img-4'
  | 'bg-img-6' | 'bg-img-7';

export interface BackgroundMeta {
  id: BackgroundId;
  name: string;
  /** 빈 문자열이면 그라데이션 배경 사용 (CSS) */
  imageUrl: string;
  /** imageUrl 없을 때 사용할 그라데이션 */
  gradient?: string;
  tone: 'light' | 'medium' | 'dark';
  /**
   * 이 배경을 사용할 수 있는 이벤트 타입 목록.
   * 비어있으면 모든 이벤트에서 사용 가능.
   */
  availableEvents: EventType[];
}

// 5개 행사 공통 (wedding, birthday, opening, baptism, meeting)
const ALL_EVENTS: EventType[] = ['wedding', 'birthday', 'opening', 'baptism', 'meeting', 'etc'];

export const BACKGROUNDS: BackgroundMeta[] = [
  {
    id: 'bg-1',
    name: 'Lavender',
    imageUrl: '',
    gradient: 'linear-gradient(160deg, #F4ECFA 0%, #E8DFF3 35%, #C9A0DC 80%, #A990CC 100%)',
    tone: 'light',
    availableEvents: ALL_EVENTS
  },
  {
    id: 'bg-2',
    name: 'Beige',
    imageUrl: '',
    gradient: 'linear-gradient(160deg, #FBF5E8 0%, #F0E5CD 35%, #DACFB6 80%, #B4A485 100%)',
    tone: 'light',
    availableEvents: ALL_EVENTS
  },
  {
    id: 'bg-3',
    name: 'Mint',
    imageUrl: '',
    gradient: 'linear-gradient(160deg, #F1FAF4 0%, #DBEEDF 35%, #BFDDC9 80%, #82B095 100%)',
    tone: 'light',
    availableEvents: ALL_EVENTS
  },
  {
    id: 'bg-4',
    name: 'Coral',
    imageUrl: '',
    gradient: 'linear-gradient(160deg, #FFF1EB 0%, #F8D3C9 35%, #F2C0B3 80%, #C68676 100%)',
    tone: 'light',
    availableEvents: ALL_EVENTS
  },
  { id: 'bg-img-1', name: 'Watercolor 1', imageUrl: '/templates/template-1-bg.png', tone: 'light', availableEvents: ALL_EVENTS },
  { id: 'bg-img-2', name: 'Watercolor 2', imageUrl: '/templates/template-2-bg.png', tone: 'light', availableEvents: ALL_EVENTS },
  { id: 'bg-img-3', name: 'Watercolor 3', imageUrl: '/templates/template-3-bg.png', tone: 'light', availableEvents: ALL_EVENTS },
  { id: 'bg-img-4', name: 'Vintage Gold', imageUrl: '/templates/template-4-bg.png', tone: 'light', availableEvents: ALL_EVENTS },
  // Baby/Birthday/Baptism — 곰돌이 + 풍선
  { id: 'bg-img-6', name: 'Pink Teddy Balloons', imageUrl: '/templates/template-6-bg.png', tone: 'light', availableEvents: ['birthday', 'baptism', 'etc'] },
  { id: 'bg-img-7', name: 'Blue Teddy Cloud', imageUrl: '/templates/template-7-bg.png', tone: 'light', availableEvents: ['birthday', 'baptism', 'etc'] },
  // legacy fallback
  {
    id: 'bg-none',
    name: 'Lavender',
    imageUrl: '',
    gradient: 'linear-gradient(160deg, #F4ECFA 0%, #E8DFF3 35%, #C9A0DC 80%, #A990CC 100%)',
    tone: 'medium',
    availableEvents: ALL_EVENTS
  }
];

export const GRADIENT_BG_IDS: BackgroundId[] = ['bg-1', 'bg-2', 'bg-3', 'bg-4'];
export const IMAGE_BG_IDS: BackgroundId[] = ['bg-img-1', 'bg-img-2', 'bg-img-3', 'bg-img-4'];

export function getBackground(id: BackgroundId | string | null | undefined): BackgroundMeta {
  return BACKGROUNDS.find((b) => b.id === id) || BACKGROUNDS[0];
}

/** 특정 이벤트 타입에서 사용 가능한 배경 목록 */
export function getBackgroundsFor(event: EventType): BackgroundMeta[] {
  return BACKGROUNDS.filter((b) => b.availableEvents.includes(event));
}
