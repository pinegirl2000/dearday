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
      x: 50, y: 18, w: 46, align: 'center',
      fontSize: 11, fontWeight: 500, color: '#5E6B7C',
      letterSpacing: '0.18em', lineHeight: 1.5,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // 메인 이름 — 큰 스크립트 (eventLabel 대신 title을 강조)
    title: {
      x: 50, y: 30, w: 48, align: 'center',
      fontSize: 36, fontWeight: 400, color: '#5E6B7C',
      letterSpacing: '0', lineHeight: 1.05,
      fontFamily: "'Sacramento', 'Great Vibes', cursive"
    },
    // 작은 italic 안내 (body 자리) — "of our son" 같은 한 줄 코멘트
    body: {
      x: 50, y: 48, w: 46, align: 'center',
      fontSize: 13, color: '#5E6B7C',
      lineHeight: 1.6,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // 날짜 — 하단 박스 안 가운데 정렬
    date: {
      x: 8, y: 73, w: 84, align: 'center',
      fontSize: 13, fontWeight: 500, color: '#5E6B7C',
      letterSpacing: '0.06em', lineHeight: 1.5,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // 주소 — 박스 안 가운데
    place: {
      x: 8, y: 80, w: 84, align: 'center',
      fontSize: 12, color: '#5E6B7C',
      letterSpacing: '0.04em', lineHeight: 1.5,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // RSVP 등 — 박스 아래 (extra는 작은 안내)
    extra: {
      x: 8, y: 96, w: 84, align: 'center',
      fontSize: 11, color: '#5E6B7C',
      letterSpacing: '0.04em', lineHeight: 1.5,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    }
  }
};
