import type { LayoutMeta } from './types';

/**
 * Thank-Minimal — 사진 없이 텍스트 중심의 우아한 카드.
 * 메시지가 짧을 때 가장 잘 어울림 (Mother's Day 한 줄 인사, Thank you 등).
 */
export const LAYOUT_THANK_MINIMAL: LayoutMeta = {
  id: 'thank_minimal',
  name: 'Thank · Minimal',
  description: '사진 없이 텍스트만으로 우아하게',
  renderStyle: 'flow',
  aspectRatio: '440/700',
  accent: '#7B5EA7',
  fields: {
    greeting: { x: 0, y: 0, w: 100, align: 'center', fontSize: 14, color: '#8B7A9E', letterSpacing: '0.18em', fontWeight: 400, fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif" },
    subtitle: { x: 0, y: 0, w: 100, align: 'center', fontSize: 12, color: '#8B7A9E', letterSpacing: '0.2em', fontWeight: 400, fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif" },
    title:    { x: 0, y: 0, w: 100, align: 'center', fontSize: 46, color: '#5A3D7A', letterSpacing: '0.01em', fontWeight: 400, lineHeight: 1.1, fontFamily: "'Sacramento', 'Great Vibes', 'Noto Serif KR', cursive" },
    body:     { x: 0, y: 0, w: 100, align: 'center', fontSize: 14, color: '#3A2D4F', lineHeight: 2.0, fontFamily: "'Noto Serif KR', serif" }
    // 사진 / 날짜 / 장소 / 연락처 — Thank-Minimal에서는 사용 안 함
  }
};
