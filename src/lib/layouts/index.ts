// 레이아웃 카탈로그 — 배경(backgrounds.ts)과 독립적으로 선택

import { LAYOUT_CLASSIC } from './layoutClassic';
import { LAYOUT_3 } from './layout3';
import { LAYOUT_4 } from './layout4';
import { LAYOUT_5 } from './layout5';
import { LAYOUT_6 } from './layout6';
import { LAYOUT_7 } from './layout7';
import { LAYOUT_TOPCENTER } from './layoutTopcenter';
import { LAYOUT_RIGHTBOTTOM } from './layoutRightbottom';
import { LAYOUT_CENTER } from './layoutCenter';
import type { LayoutId, LayoutMeta } from './types';

export type { LayoutId, LayoutMeta, TextField, RenderStyle } from './types';
export { templateToTheme, formatGreeting, applyName } from './types';

export const LAYOUTS: LayoutMeta[] = [
  LAYOUT_CLASSIC,
  LAYOUT_7,
  LAYOUT_4,
  LAYOUT_3,
  LAYOUT_6,
  LAYOUT_TOPCENTER,
  LAYOUT_5,
  LAYOUT_RIGHTBOTTOM,
  LAYOUT_CENTER
];

export function getLayout(id: LayoutId | string | null | undefined): LayoutMeta {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}
