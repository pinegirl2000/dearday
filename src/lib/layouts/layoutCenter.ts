import type { LayoutMeta } from './types';

// Center Text — Topcenter2(layout-3) 복제 후 세로 compact + eventLabel 제거.
export const LAYOUT_CENTER: LayoutMeta = {
  id: 'layout-center',
  name: 'Center Text',
  description: 'Topcenter2 기반 — eventLabel 없이 세로 콤팩트',
  renderStyle: 'absolute',
  aspectRatio: '420/700',
  accent: '#A07C2C',
  fields: {
    // eventLabel 의도적으로 제외 — "Birthday Party" 등 자동 라벨 표시 안 함
    subtitle: {
      x: 12, y: 20.5, w: 76, align: 'center',
      fontSize: 10, fontWeight: 500, color: '#1A2A3A',
      letterSpacing: '0.22em', lineHeight: 1.5,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    title: {
      x: 10, y: 25.5, w: 80, align: 'center',
      fontSize: 22, fontWeight: 600, color: '#1A2A3A',
      letterSpacing: '0.06em', lineHeight: 1.2,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    body: {
      x: 14, y: 36.5, w: 72, align: 'center',
      fontSize: 12, color: '#1A2A3A',
      lineHeight: 1.5,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    date: {
      x: 8, y: 45.5, w: 84, align: 'center',
      fontSize: 13, fontWeight: 500, color: '#1A2A3A',
      letterSpacing: '0.18em',
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    place: {
      x: 10, y: 56.5, w: 80, align: 'center',
      fontSize: 12, color: '#1A2A3A',
      letterSpacing: '0.16em', lineHeight: 1.5,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    extra: {
      x: 12, y: 68.5, w: 76, align: 'center',
      fontSize: 14, fontWeight: 400, color: '#1A2A3A',
      lineHeight: 1.2, letterSpacing: '0',
      fontFamily: "'Sacramento', 'Great Vibes', cursive"
    }
  }
};
