/**
 * 글자색 대비 계산 (WCAG 2.x 상대 휘도).
 * 템플릿마다 버튼 바탕색이 달라 흰 글자가 항상 맞지 않는다 — 금색처럼 밝은 바탕에서는 흰 글자가 사라짐.
 */

/** 밝은 바탕 위 글자색 — 브랜드 보라를 깊게 내린 잉크색 */
export const DARK_INK = '#2E2140';
export const LIGHT_INK = '#FFFFFF';

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance([r, g, b]: [number, number, number]): number {
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

/** 두 색의 대비율(1~21). 읽을 수 없는 값은 1(대비 없음)로 본다 */
export function contrastRatio(a: string, b: string): number {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return 1;
  const [hi, lo] = [luminance(ca), luminance(cb)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * 바탕색 위에서 더 잘 읽히는 글자색(흰색 또는 짙은 잉크).
 * 그라데이션 등 해석할 수 없는 값이면 기존 동작대로 흰색.
 */
export function readableTextOn(background: string): string {
  if (!parseHex(background || '')) return LIGHT_INK;
  return contrastRatio(LIGHT_INK, background) >= contrastRatio(DARK_INK, background) ? LIGHT_INK : DARK_INK;
}
