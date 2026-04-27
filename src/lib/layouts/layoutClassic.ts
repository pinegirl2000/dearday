import type { LayoutMeta } from './types';

export const LAYOUT_CLASSIC: LayoutMeta = {
  id: 'layout-classic',
  name: 'Classic',
  description: '보라색 수국 · 위→아래 흐름형',
  renderStyle: 'flow',
  aspectRatio: '440/700',
  accent: '#7B5EA7',
  fields: {
    greeting: { x: 0, y: 0, w: 100, align: 'center', fontSize: 16, color: '#7B5EA7', letterSpacing: '0.06em', fontFamily: "'Noto Serif KR', serif" },
    subtitle: { x: 0, y: 0, w: 100, align: 'center', fontSize: 13, color: '#8B7A9E', letterSpacing: '0.3em', fontWeight: 300, fontFamily: "'Noto Serif KR', serif" },
    title:    { x: 0, y: 0, w: 100, align: 'center', fontSize: 30, color: '#7B5EA7', letterSpacing: '0.4em', fontWeight: 700, lineHeight: 1.3, fontFamily: "'Noto Serif KR', serif" },
    date:     { x: 0, y: 0, w: 100, align: 'center', fontSize: 14, color: '#3A2D4F', fontFamily: "'Noto Sans KR', sans-serif" },
    place:    { x: 0, y: 0, w: 100, align: 'center', fontSize: 14, color: '#3A2D4F', fontFamily: "'Noto Sans KR', sans-serif" },
    body:     { x: 0, y: 0, w: 100, align: 'center', fontSize: 15, color: '#3A2D4F', lineHeight: 2.2, fontFamily: "'Noto Serif KR', serif" },
    extra:    { x: 0, y: 0, w: 100, align: 'center', fontSize: 13, color: '#5A3D7A', fontFamily: "'Noto Sans KR', sans-serif" }
  }
};
