import type { LayoutMeta } from './types';

// 레이아웃 5 — Side Text (text on the right)
// 카드 왼편에 일러스트/꽃/곰돌이 등 배경 이미지 영역을 비워두고,
// 모든 텍스트는 오른쪽 절반에 좌측 정렬로 배치.
export const LAYOUT_5: LayoutMeta = {
  id: 'layout-5',
  name: 'Side Text',
  description: '왼쪽 일러스트, 오른쪽 텍스트 — 좌측 정렬',
  renderStyle: 'absolute',
  aspectRatio: '420/700',
  accent: '#1A2A3A',
  fields: {
    // 작은 안내 (small caps)
    subtitle: {
      x: 48, y: 20, w: 48, align: 'left',
      fontSize: 11, fontWeight: 500, color: '#1A2A3A',
      letterSpacing: '0.22em', lineHeight: 1.7,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // 큰 스크립트 라벨 — 이벤트별 자동
    eventLabel: {
      x: 48, y: 26, w: 48, align: 'left',
      fontSize: 36, fontWeight: 400, color: '#1A2A3A',
      letterSpacing: '0', lineHeight: 1.0,
      fontFamily: "'Sacramento', 'Great Vibes', cursive"
    },
    // 메인 이름
    title: {
      x: 48, y: 38, w: 48, align: 'left',
      fontSize: 22, fontWeight: 700, color: '#1A2A3A',
      letterSpacing: '0.05em', lineHeight: 1.2,
      fontFamily: "'Playfair Display', 'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // 본문
    body: {
      x: 48, y: 50, w: 48, align: 'left',
      fontSize: 12, color: '#1A2A3A',
      lineHeight: 1.7,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // 날짜
    date: {
      x: 48, y: 64, w: 48, align: 'left',
      fontSize: 13, fontWeight: 500, color: '#1A2A3A',
      letterSpacing: '0.18em',
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // 주소
    place: {
      x: 48, y: 71, w: 48, align: 'left',
      fontSize: 12, color: '#1A2A3A',
      letterSpacing: '0.12em', lineHeight: 1.6,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // extra (Reception to follow 등)
    extra: {
      x: 48, y: 88, w: 48, align: 'left',
      fontSize: 11, color: '#1A2A3A',
      lineHeight: 1.6, letterSpacing: '0.04em',
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    }
  }
};
