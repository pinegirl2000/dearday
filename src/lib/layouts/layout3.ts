import type { LayoutMeta } from './types';

// 레이아웃 3 — Modern Bold
// 구조:
//   1. subtitle (greeting_oneliner) — small caps, eventLabel 위
//   2. eventLabel — 큰 스크립트 ("The Wedding" 등 자동)
//   3. title — 이름 (민준 ♥ 서연)
//   4. body — 메시지
//   5. date — MAY | 18 | 2025 + SATURDAY, AT 6 O'CLOCK
//   6. place — 주소
//   7. extra — Reception to follow (script)
export const LAYOUT_3: LayoutMeta = {
  id: 'layout-3',
  name: 'Modern Bold',
  description: 'subtitle + 큰 스크립트 + 이름 + 메시지 + 정보 + script extra',
  renderStyle: 'absolute',
  aspectRatio: '420/700',
  accent: '#A07C2C',
  fields: {
    // subtitle(greeting_oneliner)은 모던 레이아웃에서는 의도적으로 노출하지 않음
    // — eventLabel 스크립트가 충분히 컨텍스트를 줌. 다른 layout에서는 정상 표시.

    // 큰 스크립트 라벨 — 이벤트별 자동 ("The Wedding" 등)
    eventLabel: {
      x: 8, y: 12, w: 84, align: 'center',
      fontSize: 50, fontWeight: 400, color: '#1A2A3A',
      letterSpacing: '0', lineHeight: 1.0,
      fontFamily: "'Sacramento', 'Great Vibes', cursive"
    },
    // 메인 이름
    title: {
      x: 10, y: 30, w: 80, align: 'center',
      fontSize: 22, fontWeight: 600, color: '#1A2A3A',
      letterSpacing: '0.18em', lineHeight: 1.2,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // 메시지 (자유 본문)
    body: {
      x: 14, y: 44, w: 72, align: 'center',
      fontSize: 13, color: '#1A2A3A',
      lineHeight: 1.7,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // MAY | 18 | 2025 + SATURDAY, AT 6 O'CLOCK
    date: {
      x: 8, y: 60, w: 84, align: 'center',
      fontSize: 13, fontWeight: 500, color: '#1A2A3A',
      letterSpacing: '0.18em',
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // 주소
    place: {
      x: 10, y: 76, w: 80, align: 'center',
      fontSize: 12, color: '#1A2A3A',
      letterSpacing: '0.16em', lineHeight: 1.7,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // Reception to follow — script
    extra: {
      x: 12, y: 90, w: 76, align: 'center',
      fontSize: 22, fontWeight: 400, color: '#1A2A3A',
      lineHeight: 1.2, letterSpacing: '0',
      fontFamily: "'Sacramento', 'Great Vibes', cursive"
    }
  }
};
