import type { LayoutMeta } from './types';

// 레이아웃 7 — Topdown Text
// Classic을 복제한 동일 흐름형 레이아웃. ClassicTemplateCard가 렌더 담당.
// 향후 Classic과 다르게 발전시킬 수 있음.
export const LAYOUT_7: LayoutMeta = {
  id: 'layout-7',
  name: 'Topdown Text',
  description: '위→아래 흐름형 (Classic 복제)',
  renderStyle: 'flow',
  aspectRatio: '440/700',
  accent: '#7B5EA7',
  fields: {
    eventLabel: { x: 0, y: 0, w: 100, align: 'center', fontSize: 11, color: '#9B7FCB', letterSpacing: '0.5em', fontWeight: 600, fontFamily: "'Playfair Display', 'Noto Serif KR', serif" },
    greeting: { x: 0, y: 0, w: 100, align: 'center', fontSize: 16, color: '#7B5EA7', letterSpacing: '0.06em', fontFamily: "'Noto Serif KR', serif" },
    subtitle: { x: 0, y: 0, w: 100, align: 'center', fontSize: 13, color: '#8B7A9E', letterSpacing: '0.3em', fontWeight: 300, fontFamily: "'Noto Serif KR', serif" },
    title:    { x: 0, y: 0, w: 100, align: 'center', fontSize: 24, color: '#7B5EA7', letterSpacing: '0.4em', fontWeight: 500, lineHeight: 1.3, fontFamily: "'Noto Serif KR', serif" },
    date:     { x: 0, y: 0, w: 100, align: 'center', fontSize: 14, color: '#3A2D4F', fontFamily: "'Noto Sans KR', sans-serif" },
    place:    { x: 0, y: 0, w: 100, align: 'center', fontSize: 14, color: '#3A2D4F', fontFamily: "'Noto Sans KR', sans-serif" },
    body:     { x: 0, y: 0, w: 100, align: 'center', fontSize: 15, color: '#3A2D4F', lineHeight: 2.2, fontFamily: "'Noto Serif KR', serif" },
    extra:    { x: 0, y: 0, w: 100, align: 'center', fontSize: 13, color: '#5A3D7A', fontFamily: "'Noto Sans KR', sans-serif" }
  }
};
