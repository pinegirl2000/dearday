import { FONT_STACKS } from '@/lib/font-keys';
import type { LayoutMeta } from './types';

// 레이아웃 5 — Side Text
// 왼쪽 일러스트 + 오른쪽 텍스트 (위쪽: invite/event/name 우측 컬럼,
// 아래쪽: date/place/extra 카드 전체 폭)
// 모든 카드 입력 항목 포함:
//   subtitle, eventLabel, body, title, date, place, extra,
//   그리고 place 아래 자동 렌더되는 contact_name/phone/map_url
export const LAYOUT_5: LayoutMeta = {
  id: 'layout-5',
  name: 'Rightside Text',
  description: '왼쪽 일러스트, 오른쪽 텍스트 — 하단 정보는 전체 폭',
  renderStyle: 'absolute',
  aspectRatio: '420/700',
  accent: '#5E6B7C',
  fields: {
    // 작은 안내 (greeting_oneliner) — title 바로 위
    subtitle: {
      x: 40, y: 25, w: 54, align: 'center',
      fontSize: 11, fontWeight: 500, color: '#5E6B7C',
      letterSpacing: '0.18em', lineHeight: 1.5,
      fontFamily: FONT_STACKS.cormorant
    },
    // 메인 이름 — 큰 스크립트 (박스 가운데 정렬)
    title: {
      x: 40, y: 30, w: 54, align: 'center',
      fontSize: 36, fontWeight: 400, color: '#5E6B7C',
      letterSpacing: '0', lineHeight: 1.05,
      fontFamily: FONT_STACKS.sacramento
    },
    // 작은 italic 안내 (body 자리) — 박스 가운데 정렬
    body: {
      x: 40, y: 48, w: 54, align: 'center',
      fontSize: 13, color: '#5E6B7C',
      lineHeight: 1.6,
      fontFamily: FONT_STACKS.cormorant
    },
    // 날짜 — 우측 세로 박스 안 (박스가 카드 우측에 위치)
    date: {
      x: 40, y: 63, w: 54, align: 'center',
      fontSize: 13, fontWeight: 500, color: '#5E6B7C',
      letterSpacing: '0.06em', lineHeight: 1.5,
      fontFamily: FONT_STACKS.cormorant
    },
    // 주소 — 우측 박스 안
    place: {
      x: 40, y: 70, w: 54, align: 'center',
      fontSize: 12, color: '#5E6B7C',
      letterSpacing: '0.04em', lineHeight: 1.5,
      fontFamily: FONT_STACKS.cormorant
    },
    // 박스 외 작은 안내
    extra: {
      x: 8, y: 96, w: 84, align: 'center',
      fontSize: 11, color: '#5E6B7C',
      letterSpacing: '0.04em', lineHeight: 1.5,
      fontFamily: FONT_STACKS.cormorant
    }
  }
};
