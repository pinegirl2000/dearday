import type { LayoutMeta } from './types';

// 레이아웃 3 — Bailey Dupont 스타일 (산세리프 대문자 이름 + 날짜 그리드)
export const LAYOUT_3: LayoutMeta = {
  id: 'layout-3',
  name: 'Modern Bold',
  description: '산세리프 대문자 + 날짜 그리드',
  renderStyle: 'absolute',
  aspectRatio: '420/700',
  accent: '#1A2A3A',
  fields: {
    greeting: { x: 12, y: 25, w: 76, align: 'center', fontSize: 11, color: '#1A2A3A', letterSpacing: '0.12em', fontFamily: "'Cormorant Garamond', serif" },
    subtitle: { x: 12, y: 30, w: 76, align: 'center', fontSize: 11, color: '#1A2A3A', letterSpacing: '0.12em' },
    title:    { x: 10, y: 38, w: 80, align: 'center', fontSize: 28, fontWeight: 700, color: '#1A2A3A', letterSpacing: '0.04em', lineHeight: 1.15 },
    date:     { x: 10, y: 60, w: 80, align: 'center', fontSize: 14, fontWeight: 600, color: '#1A2A3A', letterSpacing: '0.15em' },
    place:    { x: 10, y: 68, w: 80, align: 'center', fontSize: 11, color: '#1A2A3A', letterSpacing: '0.1em' },
    body:     { x: 12, y: 75, w: 76, align: 'center', fontSize: 11, color: '#1A2A3A', lineHeight: 1.6 }
  }
};
