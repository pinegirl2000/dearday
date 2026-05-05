import type { LayoutMeta } from './types';

// 레이아웃 6 — Center Text (Editorial을 카드 중앙에 모은 버전)
// Editorial(layout-3)과 동일한 스타일/필드 — 위치만 카드 가로 세로 중앙에
// 컴팩트하게 모아 시선이 가운데에 집중되도록 배치.
export const LAYOUT_6: LayoutMeta = {
  id: 'layout-6',
  name: 'Center Text',
  description: 'Editorial 스타일 + 가로 세로 중앙에 텍스트 집중',
  renderStyle: 'absolute',
  aspectRatio: '420/700',
  accent: '#A07C2C',
  fields: {
    // 큰 스크립트 라벨 — 카드 중상단
    eventLabel: {
      x: 8, y: 38, w: 84, align: 'center',
      fontSize: 48, fontWeight: 400, color: '#1A2A3A',
      letterSpacing: '0', lineHeight: 1.0,
      fontFamily: "'Sacramento', 'Great Vibes', cursive"
    },
    // 메인 이름 — 정중앙 (y:46)
    title: {
      x: 10, y: 46, w: 80, align: 'center',
      fontSize: 22, fontWeight: 600, color: '#1A2A3A',
      letterSpacing: '0.18em', lineHeight: 1.2,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // 메시지
    body: {
      x: 14, y: 56, w: 72, align: 'center',
      fontSize: 13, color: '#1A2A3A',
      lineHeight: 1.6,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // MAY | 18 | 2025 + SATURDAY, AT 6 O'CLOCK
    date: {
      x: 8, y: 66, w: 84, align: 'center',
      fontSize: 13, fontWeight: 500, color: '#1A2A3A',
      letterSpacing: '0.18em',
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // 주소
    place: {
      x: 10, y: 78, w: 80, align: 'center',
      fontSize: 12, color: '#1A2A3A',
      letterSpacing: '0.16em', lineHeight: 1.6,
      fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif"
    },
    // Reception to follow — script (정보 박스 안, place 바로 아래)
    extra: {
      x: 12, y: 84, w: 76, align: 'center',
      fontSize: 16, fontWeight: 400, color: '#1A2A3A',
      lineHeight: 1.2, letterSpacing: '0',
      fontFamily: "'Sacramento', 'Great Vibes', cursive"
    }
  }
};
