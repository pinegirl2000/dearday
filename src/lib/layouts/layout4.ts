import type { LayoutMeta } from './types';

// 레이아웃 4 — Vintage Script
// 첨부 레퍼런스 + Wedding Party 스크립트 추가 버전:
// 상단 안내 → 큰 스크립트 라벨(Wedding Party) → 큰 볼드 세리프 이름 →
// 본문 메시지 → 날짜 라인 → 주소 → RSVP 메모 → 호스트
// 모든 카드 입력 필드가 포함되도록 위치를 분산.
export const LAYOUT_4: LayoutMeta = {
  id: 'layout-4',
  name: 'Compact',
  description: '미니멀 + 흰 박스 일체형 — 짧은 라벨, 분할 날짜, 호스트 시그니처',
  renderStyle: 'flow',
  aspectRatio: '420/700',
  accent: '#1A2A3A',
  fields: {
    // 상단 영문 안내 (greeting_oneliner를 small caps로)
    subtitle: {
      x: 12, y: 8, w: 76, align: 'center',
      fontSize: 11, fontWeight: 400, color: '#1A2A3A',
      letterSpacing: '0.22em', lineHeight: 1.7,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // 큰 스크립트 라벨 — 이벤트별 자동 ('Wedding Party' / 'Birthday Party' 등)
    eventLabel: {
      x: 8, y: 18, w: 84, align: 'center',
      fontSize: 42, fontWeight: 400, color: '#1A2A3A',
      letterSpacing: '0',
      fontFamily: "'Sacramento', 'Great Vibes', cursive"
    },
    // 메인 이름 — 큰 볼드 세리프
    title: {
      x: 6, y: 32, w: 88, align: 'center',
      fontSize: 30, fontWeight: 700, color: '#1A2A3A',
      letterSpacing: '0.06em', lineHeight: 1.2,
      fontFamily: "'Playfair Display', 'Cormorant Garamond', serif"
    },
    // 자유 메시지 (본문)
    body: {
      x: 14, y: 50, w: 72, align: 'center',
      fontSize: 12, color: '#1A2A3A',
      lineHeight: 1.7,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // 날짜 — TemplateCard에서 SUNDAY | 15 NOV | AT 5 PM 분할 렌더
    date: {
      x: 12, y: 55, w: 76, align: 'center',
      fontSize: 13, fontWeight: 500, color: '#1A2A3A',
      letterSpacing: '0.2em',
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    place: {
      x: 12, y: 66, w: 76, align: 'center',
      fontSize: 12, color: '#1A2A3A',
      letterSpacing: '0.18em',
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // place 아래 contact 영역(place.y+8% = 74%)과 겹치지 않도록
    extra: {
      x: 12, y: 84, w: 76, align: 'center',
      fontSize: 10, color: '#1A2A3A',
      lineHeight: 1.7, letterSpacing: '0.04em',
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    }
  }
};
