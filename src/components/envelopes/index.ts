export { default as ClassicEnvelope } from './ClassicEnvelope';
export { default as EnvelopeBeige } from './EnvelopeBeige';
export { default as NoneEnvelope } from './NoneEnvelope';
export type { EnvelopeProps } from './FoldEnvelope';
export { shade } from './utils';

/**
 * 봉투 카탈로그 — 향후 envelope-3, envelope-4 ... 추가 예정.
 * id를 envelope_anim 컬럼에 저장.
 */
export const ENVELOPE_ANIMS = [
  { id: 'envelope-1', name: '보라 클래식',   desc: '보라색 수국 봉투 + 흰 편지지', recommend: '결혼 / 환영회' },
  { id: 'envelope-2', name: '베이지 입체',   desc: '크림 베이지 입체 봉투',         recommend: '세례 / 모임' },
  { id: 'none',       name: '봉투 없음',     desc: '봉투 없이 카드 바로 표시',     recommend: '간편 모임' }
] as const;

export type EnvelopeAnimId = (typeof ENVELOPE_ANIMS)[number]['id'];
