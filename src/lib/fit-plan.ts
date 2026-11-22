import type { ResolvedRoleStyle } from './typography';

/** 측정 함수 — DOM 에서는 숨긴 span 의 offsetWidth, 테스트에서는 가짜 함수 */
export interface FitMeasure {
  /** 명시적 줄바꿈(\n)으로 나눈 줄 중 가장 넓은 줄의 폭(px) */
  widestLine(size: number, spacing: number): number;
  /** 공백 기준 단어 중 가장 넓은 단어의 폭(px) */
  longestWord(size: number, spacing: number): number;
}

export interface FitResult {
  size: number;
  spacing: number;
  /** true 면 단어 단위 줄바꿈 허용 */
  wrap: boolean;
}

/** 자간을 줄이는 단위(em) — 너무 크면 맞는 값을 지나치고, 너무 작으면 측정 횟수가 늘어남 */
export const SPACING_STEP = 0.02;
/** 글자 크기를 줄이는 단위(px) */
export const SIZE_STEP = 1;
/** 최종 안전장치 하한(px) — 이보다 작으면 읽을 수 없으므로 여기서 멈춤 */
export const FLOOR_SIZE = 10;

/** 부동소수점 누적 오차로 0.04 가 0.039999 가 되는 것 방지 */
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * 텍스트를 가용 폭 안에 넣기 위한 크기·자간·줄바꿈 결정.
 * 순서가 중요: 자간 → 크기 → 줄바꿈 → (한 단어가 넘칠 때만) 하한까지 추가 축소.
 * 장식 자간부터 줄이는 이유는 제목 크기(위계)를 최대한 지키기 위함이고,
 * 줄바꿈을 마지막에 두는 이유는 두 줄 제목이 카드 높이를 바꾸기 때문.
 */
export function planFit(
  text: string,
  available: number,
  style: Pick<ResolvedRoleStyle, 'size' | 'minSize' | 'spacing' | 'minSpacing'>,
  measure: FitMeasure
): FitResult {
  const { size, minSize, spacing, minSpacing } = style;
  const unchanged: FitResult = { size, spacing, wrap: false };
  // 빈 텍스트·아직 레이아웃 안 된 컨테이너(폭 0)는 측정 의미가 없으므로 원래 스타일 유지
  if (!text.trim() || !(available > 0)) return unchanged;
  if (measure.widestLine(size, spacing) <= available) return unchanged;

  for (let sp = round2(spacing - SPACING_STEP); sp >= minSpacing; sp = round2(sp - SPACING_STEP)) {
    if (measure.widestLine(size, sp) <= available) return { size, spacing: sp, wrap: false };
  }
  for (let sz = size - SIZE_STEP; sz >= minSize; sz -= SIZE_STEP) {
    if (measure.widestLine(sz, minSpacing) <= available) return { size: sz, spacing: minSpacing, wrap: false };
  }
  if (measure.longestWord(minSize, minSpacing) <= available) return { size: minSize, spacing: minSpacing, wrap: true };

  // 한 단어가 최소 크기에서도 넘침 — 선을 넘지 않는 것이 우선이므로 하한까지 더 줄임
  for (let sz = minSize - SIZE_STEP; sz > FLOOR_SIZE; sz -= SIZE_STEP) {
    if (measure.longestWord(sz, minSpacing) <= available) return { size: sz, spacing: minSpacing, wrap: true };
  }
  // 최소 크기가 이미 하한보다 작으면(작은 라벨) 하한으로 다시 키우지 않음 — 커지면 오히려 선을 넘음
  return { size: Math.min(FLOOR_SIZE, minSize), spacing: minSpacing, wrap: true };
}
