import type { LayoutMeta } from './types';

// 레이아웃 5 — Side Text
// 왼쪽 일러스트 + 오른쪽 텍스트 (위쪽: invite/event/name 우측 컬럼,
// 아래쪽: date/place/extra 카드 전체 폭)
// 모든 카드 입력 항목 포함:
//   subtitle, eventLabel, body, title, date, place, extra,
//   그리고 place 아래 자동 렌더되는 contact_name/phone/map_url
export const LAYOUT_5: LayoutMeta = {
  id: 'layout-5',
  name: 'Side Text',
  description: '왼쪽 일러스트, 오른쪽 텍스트 — 하단 정보는 전체 폭',
  renderStyle: 'absolute',
  aspectRatio: '420/700',
  accent: '#5E6B7C',
  fields: {
    // 작은 안내 (greeting_oneliner) — 우측 상단 small caps
    subtitle: {
      x: 50, y: 14, w: 46, align: 'left',
      fontSize: 11, fontWeight: 500, color: '#5E6B7C',
      letterSpacing: '0.18em', lineHeight: 1.5,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // 큰 스크립트 라벨 — 이벤트별 자동 ("Baptism" "Birthday Party" 등)
    eventLabel: {
      x: 50, y: 24, w: 48, align: 'left',
      fontSize: 44, fontWeight: 400, color: '#5E6B7C',
      letterSpacing: '0', lineHeight: 1.05,
      fontFamily: "'Sacramento', 'Great Vibes', cursive"
    },
    // 작은 italic 안내 (body 자리) — "of our son" 같은 한 줄 코멘트
    body: {
      x: 50, y: 50, w: 46, align: 'left',
      fontSize: 13, color: '#5E6B7C',
      lineHeight: 1.6,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // 메인 이름 — sans serif 강조
    title: {
      x: 50, y: 56, w: 48, align: 'left',
      fontSize: 24, fontWeight: 600, color: '#5E6B7C',
      letterSpacing: '0.02em', lineHeight: 1.2,
      fontFamily: "'Playfair Display', 'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // 날짜 — 하단 전체 폭, italic
    date: {
      x: 6, y: 78, w: 88, align: 'left',
      fontSize: 13, fontWeight: 400, color: '#5E6B7C',
      letterSpacing: '0.04em', lineHeight: 1.5,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // 주소 — 하단 전체 폭
    place: {
      x: 6, y: 84, w: 88, align: 'left',
      fontSize: 12, color: '#5E6B7C',
      letterSpacing: '0.04em', lineHeight: 1.5,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // RSVP 안내 등 — 하단 전체 폭
    extra: {
      x: 6, y: 92, w: 88, align: 'left',
      fontSize: 11, color: '#5E6B7C',
      letterSpacing: '0.04em', lineHeight: 1.5,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    }
  }
};
