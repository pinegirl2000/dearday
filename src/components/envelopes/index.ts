export { default as FoldEnvelope } from './FoldEnvelope';
export { default as SlideEnvelope } from './SlideEnvelope';
export { default as FlipEnvelope } from './FlipEnvelope';
export { default as PopEnvelope } from './PopEnvelope';
export type { EnvelopeProps } from './FoldEnvelope';
export { shade } from './utils';

export const ENVELOPE_ANIMS = [
  { id: 'fold', name: 'Fold', desc: '편지지가 펼쳐지는 클래식', recommend: '결혼 / 세례' },
  { id: 'slide', name: 'Slide', desc: '카드가 봉투에서 슬라이드', recommend: '생일 / 돌잔치' },
  { id: 'flip', name: 'Flip', desc: '3D 플립으로 변신', recommend: '개업 / 약혼' },
  { id: 'pop', name: 'Pop', desc: '탄성 spring + 컨페티', recommend: '캐주얼 모임' }
] as const;

export type EnvelopeAnimId = (typeof ENVELOPE_ANIMS)[number]['id'];
