import type { LayoutMeta } from './types';

// 레이아웃 3 — Modern Bold (Happy Wedding 스타일)
// 첨부된 그림 구조에 맞춰 재구성:
//   - 상단: 작은 날짜 (DD.MM.YYYY 같은 압축)
//   - 가운데 위: 큰 스크립트 라벨 (자동 — "Happy Wedding" 등 이벤트별)
//   - 가운데: 본문 메시지
//   - 하단: 작은 스크립트 시그니처 (커플/주인공 이름)
export const LAYOUT_3: LayoutMeta = {
  id: 'layout-3',
  name: 'Modern Bold',
  description: '큰 스크립트 라벨 중앙 + 메시지 + 작은 시그니처',
  renderStyle: 'absolute',
  aspectRatio: '420/700',
  accent: '#A07C2C',
  fields: {
    // 상단 작은 날짜 — TemplateCard에서 layout-3은 짧은 형식(DD.MM.YYYY)으로 렌더
    date: {
      x: 10, y: 6, w: 80, align: 'center',
      fontSize: 12, fontWeight: 500, color: '#1A2A3A',
      letterSpacing: '0.18em',
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // 큰 스크립트 라벨 — 이벤트별 자동 ("Happy Wedding", "Birthday Party" 등)
    eventLabel: {
      x: 8, y: 22, w: 84, align: 'center',
      fontSize: 56, fontWeight: 400, color: '#1A2A3A',
      letterSpacing: '0', lineHeight: 1.0,
      fontFamily: "'Sacramento', 'Great Vibes', cursive"
    },
    // 본문 메시지
    body: {
      x: 14, y: 56, w: 72, align: 'center',
      fontSize: 13, color: '#1A2A3A',
      lineHeight: 1.7,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // 하단 작은 스크립트 시그니처 — 커플/주인공 이름 (title 입력)
    title: {
      x: 12, y: 84, w: 76, align: 'center',
      fontSize: 24, fontWeight: 400, color: '#1A2A3A',
      letterSpacing: '0', lineHeight: 1.1,
      fontFamily: "'Sacramento', 'Great Vibes', cursive"
    }
  }
};
