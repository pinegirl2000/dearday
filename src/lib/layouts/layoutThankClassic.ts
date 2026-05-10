import type { LayoutMeta } from './types';

/**
 * Thank-Classic — 감사·축하 카드 전용 (예: Mother's Day, Thank You).
 * Classic 레이아웃 기반이지만 날짜/장소/연락처 필드 제거 — 메시지에 집중.
 */
export const LAYOUT_THANK_CLASSIC: LayoutMeta = {
  id: 'thank_classic',
  name: 'Thank · Classic',
  description: '감사 메시지 전용 — 위→아래 흐름형 (날짜/장소/연락처 없음)',
  renderStyle: 'flow',
  aspectRatio: '440/700',
  accent: '#7B5EA7',
  fields: {
    // eventLabel — thank/congrats 카드에서는 "YOU'RE INVITED" 같은 라벨 불필요 → 정의 안 함
    greeting:   { x: 0, y: 0, w: 100, align: 'center', fontSize: 16, color: '#7B5EA7', letterSpacing: '0.06em', fontFamily: "'Noto Serif KR', serif" },
    subtitle:   { x: 0, y: 0, w: 100, align: 'center', fontSize: 13, color: '#8B7A9E', letterSpacing: '0.3em', fontWeight: 300, fontFamily: "'Noto Serif KR', serif" },
    title:      { x: 0, y: 0, w: 100, align: 'center', fontSize: 26, color: '#7B5EA7', letterSpacing: '0.4em', fontWeight: 500, lineHeight: 1.3, fontFamily: "'Noto Serif KR', serif" },
    body:       { x: 0, y: 0, w: 100, align: 'center', fontSize: 15, color: '#3A2D4F', lineHeight: 2.2, fontFamily: "'Noto Serif KR', serif" }
    // date / place / contact / extra — Thank-Classic에서는 사용 안 함
  }
};
