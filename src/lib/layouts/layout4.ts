import type { LayoutMeta } from './types';

// 레이아웃 4 — Vintage Script
// 첨부 레퍼런스(BAILEY DUPONT & OLIVIA WILSON 스타일)에 맞춰 재구성:
// 상단 작은 안내 → 큰 볼드 세리프 이름 → 날짜 라인 → 주소 → 메모 → 호스트
// 모든 카드 입력 필드(eventLabel, subtitle, title, body, date, place, extra,
// 그리고 place 아래 자동 렌더되는 contact_name/phone/map_url)가 포함됨.
export const LAYOUT_4: LayoutMeta = {
  id: 'layout-4',
  name: 'Vintage Script',
  description: '큰 볼드 세리프 이름 + 날짜 라인 + 주소 + RSVP 메모 + 호스트',
  renderStyle: 'absolute',
  aspectRatio: '420/700',
  accent: '#1A2A3A',
  fields: {
    eventLabel: {
      x: 10, y: 7, w: 80, align: 'center',
      fontSize: 11, fontWeight: 500, color: '#1A2A3A',
      letterSpacing: '0.45em',
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    subtitle: {
      x: 12, y: 14, w: 76, align: 'center',
      fontSize: 11, fontWeight: 400, color: '#1A2A3A',
      letterSpacing: '0.2em', lineHeight: 1.7,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    title: {
      x: 6, y: 27, w: 88, align: 'center',
      fontSize: 30, fontWeight: 700, color: '#1A2A3A',
      letterSpacing: '0.06em', lineHeight: 1.1,
      fontFamily: "'Playfair Display', 'Cormorant Garamond', serif"
    },
    body: {
      x: 14, y: 49, w: 72, align: 'center',
      fontSize: 11, color: '#1A2A3A',
      lineHeight: 1.7,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    date: {
      x: 12, y: 64, w: 76, align: 'center',
      fontSize: 13, fontWeight: 500, color: '#1A2A3A',
      letterSpacing: '0.2em',
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    place: {
      x: 12, y: 72, w: 76, align: 'center',
      fontSize: 11, color: '#1A2A3A',
      letterSpacing: '0.18em',
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    extra: {
      x: 12, y: 86, w: 76, align: 'center',
      fontSize: 10, color: '#1A2A3A',
      lineHeight: 1.7, letterSpacing: '0.04em',
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    }
  }
};
