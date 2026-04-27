import type { LayoutMeta } from './types';

// 레이아웃 4 — Happy Wedding 스타일 (상단 날짜 → 스크립트 타이틀 → 본문 → 하단 이름)
export const LAYOUT_4: LayoutMeta = {
  id: 'layout-4',
  name: 'Vintage Script',
  description: '상단 날짜 → 큰 스크립트 → 본문 → 하단 이름',
  renderStyle: 'absolute',
  aspectRatio: '420/700',
  accent: '#A07C2C',
  fields: {
    greeting: { x: 15, y: 18, w: 70, align: 'center', fontSize: 12, color: '#8A6A2C' },
    subtitle: { x: 12, y: 25, w: 76, align: 'center', fontSize: 13, color: '#8A6A2C', letterSpacing: '0.1em' },
    title:    { x: 12, y: 32, w: 76, align: 'center', fontSize: 40, fontWeight: 500, color: '#A07C2C', fontFamily: "'Great Vibes', cursive", lineHeight: 1.05 },
    date:     { x: 15, y: 60, w: 70, align: 'center', fontSize: 13, color: '#8A6A2C' },
    body:     { x: 18, y: 70, w: 64, align: 'center', fontSize: 12, color: '#5A4520', lineHeight: 1.6 },
    place:    { x: 15, y: 88, w: 70, align: 'center', fontSize: 11, color: '#8A6A2C' }
  }
};
