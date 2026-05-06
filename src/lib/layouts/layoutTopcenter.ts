import type { LayoutMeta } from './types';

// Topcenter — Center Text 변형. 반투명 박스 없음, 모든 텍스트가 카드 상단에 모임.
export const LAYOUT_TOPCENTER: LayoutMeta = {
  id: 'layout-topcenter',
  name: 'Topcenter1',
  description: '박스 없이 모든 텍스트를 상단에 집중',
  renderStyle: 'absolute',
  aspectRatio: '420/700',
  accent: '#A07C2C',
  fields: {
    eventLabel: {
      x: 8, y: 4, w: 84, align: 'center',
      fontSize: 42, fontWeight: 400, color: '#1A2A3A',
      letterSpacing: '0', lineHeight: 1.0,
      fontFamily: "'Sacramento', 'Great Vibes', cursive"
    },
    subtitle: {
      x: 12, y: 14, w: 76, align: 'center',
      fontSize: 10, fontWeight: 500, color: '#1A2A3A',
      letterSpacing: '0.22em', lineHeight: 1.5,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    title: {
      x: 10, y: 19, w: 80, align: 'center',
      fontSize: 22, fontWeight: 600, color: '#1A2A3A',
      letterSpacing: '0.18em', lineHeight: 1.2,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    body: {
      x: 14, y: 27, w: 72, align: 'center',
      fontSize: 13, color: '#1A2A3A',
      lineHeight: 1.6,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    date: {
      x: 8, y: 38, w: 84, align: 'center',
      fontSize: 13, fontWeight: 500, color: '#1A2A3A',
      letterSpacing: '0.18em',
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    place: {
      x: 10, y: 48, w: 80, align: 'center',
      fontSize: 12, color: '#1A2A3A',
      letterSpacing: '0.16em', lineHeight: 1.6,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    extra: {
      x: 12, y: 53, w: 76, align: 'center',
      fontSize: 14, fontWeight: 400, color: '#1A2A3A',
      lineHeight: 1.1, letterSpacing: '0',
      fontFamily: "'Sacramento', 'Great Vibes', cursive"
    }
  }
};
