import type { LayoutMeta } from './types';

// 레이아웃 3 — Modern Bold (Happy Wedding 스타일)
// 구조:
//   1. eventLabel: 큰 스크립트 ("The Wedding" 등 자동)
//   2. title: 그 아래 이름 (민준 ♥ 서연)
//   3. subtitle: small caps 안내 ("INVITE YOU TO CELEBRATE...")
//   4. date: MAY | 18 | 2025 (split with dividers) + SATURDAY, AT 6 O'CLOCK
//   5. place: 주소 (멀티라인)
//   6. extra: Reception to follow (script italic)
export const LAYOUT_3: LayoutMeta = {
  id: 'layout-3',
  name: 'Modern Bold',
  description: '큰 스크립트 + 이름 + 깔끔 정보 + script extra',
  renderStyle: 'absolute',
  aspectRatio: '420/700',
  accent: '#A07C2C',
  fields: {
    // 큰 스크립트 라벨 — 이벤트별 자동 ("The Wedding" 등)
    eventLabel: {
      x: 8, y: 10, w: 84, align: 'center',
      fontSize: 52, fontWeight: 400, color: '#1A2A3A',
      letterSpacing: '0', lineHeight: 1.0,
      fontFamily: "'Sacramento', 'Great Vibes', cursive"
    },
    // 메인 이름 (커플)
    title: {
      x: 10, y: 28, w: 80, align: 'center',
      fontSize: 22, fontWeight: 600, color: '#1A2A3A',
      letterSpacing: '0.18em', lineHeight: 1.2,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // INVITE YOU TO CELEBRATE THEIR MARRIAGE
    subtitle: {
      x: 12, y: 46, w: 76, align: 'center',
      fontSize: 11, fontWeight: 500, color: '#1A2A3A',
      letterSpacing: '0.22em', lineHeight: 1.7,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // MAY | 18 | 2025 + SATURDAY, AT 6 O'CLOCK — TemplateCard에서 분할 렌더
    date: {
      x: 8, y: 58, w: 84, align: 'center',
      fontSize: 13, fontWeight: 500, color: '#1A2A3A',
      letterSpacing: '0.18em',
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // 주소 (멀티라인 OK)
    place: {
      x: 10, y: 73, w: 80, align: 'center',
      fontSize: 12, color: '#1A2A3A',
      letterSpacing: '0.16em', lineHeight: 1.7,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // Reception to follow — script italic
    extra: {
      x: 12, y: 89, w: 76, align: 'center',
      fontSize: 22, fontWeight: 400, color: '#1A2A3A',
      lineHeight: 1.2, letterSpacing: '0',
      fontFamily: "'Sacramento', 'Great Vibes', cursive"
    }
  }
};
