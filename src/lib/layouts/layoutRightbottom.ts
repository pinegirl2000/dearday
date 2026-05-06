import type { LayoutMeta } from './types';

// Rightbottom Text — Rightside Text(layout-5)을 복제한 변형 layout.
// 구조/필드 동일, 별도 id로 분리하여 향후 차별화 가능.
export const LAYOUT_RIGHTBOTTOM: LayoutMeta = {
  id: 'layout-rightbottom',
  name: 'Rightbottom Text',
  description: 'Rightside Text 기반 — 향후 차별화용 변형',
  renderStyle: 'absolute',
  aspectRatio: '420/700',
  accent: '#5E6B7C',
  fields: {
    subtitle: {
      x: 50, y: 18, w: 46, align: 'center',
      fontSize: 11, fontWeight: 500, color: '#5E6B7C',
      letterSpacing: '0.18em', lineHeight: 1.5,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    title: {
      x: 50, y: 30, w: 48, align: 'center',
      fontSize: 36, fontWeight: 400, color: '#5E6B7C',
      letterSpacing: '0', lineHeight: 1.05,
      fontFamily: "'Sacramento', 'Great Vibes', cursive"
    },
    body: {
      x: 50, y: 48, w: 46, align: 'center',
      fontSize: 13, color: '#5E6B7C',
      lineHeight: 1.6,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    date: {
      x: 8, y: 65, w: 84, align: 'center',
      fontSize: 13, fontWeight: 500, color: '#5E6B7C',
      letterSpacing: '0.06em', lineHeight: 1.5,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    place: {
      x: 8, y: 72, w: 84, align: 'center',
      fontSize: 12, color: '#5E6B7C',
      letterSpacing: '0.04em', lineHeight: 1.5,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    extra: {
      x: 8, y: 96, w: 84, align: 'center',
      fontSize: 11, color: '#5E6B7C',
      letterSpacing: '0.04em', lineHeight: 1.5,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    }
  }
};
