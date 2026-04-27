// 배경 이미지 카탈로그 — layout과 독립적으로 선택 가능

import type { EventType } from '@/types/card';

export type BackgroundId =
  | 'bg-none'
  | 'bg-1'
  | 'bg-2'
  | 'bg-3'
  | 'bg-4';

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
    id: 'bg-none',
    name: '보라 그라데이션',
    imageUrl: '',
    gradient: 'linear-gradient(135deg, #E8D5F5 0%, #D5C5E8 30%, #C9A0DC 70%, #9B7FCB 100%)',
    tone: 'medium',
    availableEvents: ALL_EVENTS
  },
  { id: 'bg-1', name: '연두 수채화',  imageUrl: '/templates/template-1-bg.png', tone: 'light', availableEvents: ALL_EVENTS },
  { id: 'bg-2', name: '핑크 보라 잎', imageUrl: '/templates/template-2-bg.png', tone: 'light', availableEvents: ALL_EVENTS },
  { id: 'bg-3', name: '보라 수채화',  imageUrl: '/templates/template-3-bg.png', tone: 'light', availableEvents: ALL_EVENTS },
  { id: 'bg-4', name: '골드 빈티지',  imageUrl: '/templates/template-4-bg.png', tone: 'light', availableEvents: ALL_EVENTS }
];

export function getBackground(id: BackgroundId | string | null | undefined): BackgroundMeta {
  return BACKGROUNDS.find((b) => b.id === id) || BACKGROUNDS[0];
}

/** 특정 이벤트 타입에서 사용 가능한 배경 목록 */
export function getBackgroundsFor(event: EventType): BackgroundMeta[] {
  return BACKGROUNDS.filter((b) => b.availableEvents.includes(event));
}
