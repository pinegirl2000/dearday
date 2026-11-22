/**
 * 표지의 글 영역(zone)에 제목부를 세로로 맞추는 계획.
 * 배경 그림의 빈 자리는 높이가 정해져 있으므로, 넘치면 그림을 가리는 대신 내용 면(표지 아래)으로 내려보낸다.
 */
export interface ZoneMeasure {
  /** 글 영역 높이(px). 0 이면 아직 레이아웃 전 */
  zoneH: number;
  /** 각 조각의 현재 높이(px). 없는 조각은 0 */
  labelH: number;
  subtitleH: number;
  titleH: number;
  bodyH: number;
  /** 조각 사이 간격(px) */
  gap: number;
  /** titleH 를 잰 시점의 제목 크기(px) */
  titleSize: number;
  minTitleSize: number;
}

export interface ZonePlan {
  /** 본문을 내용 면으로 */
  bodyBelow: boolean;
  /** 부제를 내용 면으로 */
  subtitleBelow: boolean;
  /** 제목부 전체를 내용 면으로 — 표지는 그림만 */
  headBelow: boolean;
  /** 다음 렌더에 쓸 제목 크기. 바뀌면 다시 측정해야 함 */
  titleSize: number;
}

export const ZONE_INITIAL = { bodyBelow: false, subtitleBelow: false, headBelow: false } as const;
/** 제목을 한 번에 줄이는 크기(px) — 줄일 때마다 재측정이 필요해 너무 작으면 렌더가 늘어남 */
export const TITLE_STEP = 2;

/** 있는 조각(높이 > 0)만 쌓았을 때의 전체 높이 */
function stack(heights: number[], gap: number): number {
  const present = heights.filter((h) => h > 0);
  return present.reduce((a, b) => a + b, 0) + gap * Math.max(0, present.length - 1);
}

/**
 * 한 번 호출에 한 단계만 진행한다(제목 크기를 줄이면 높이를 다시 재야 하므로).
 * 순서: ① 본문 내림 → ② 제목을 최소 크기까지 축소 → ③ 부제 내림 → ④ 제목부 전체 내림.
 * 본문을 먼저 내리는 이유: 본문은 내용 면에서도 자연스럽지만 제목은 표지에 있어야 카드의 얼굴이 되기 때문.
 */
export function planZone(m: ZoneMeasure): ZonePlan {
  const { zoneH, labelH, subtitleH, titleH, bodyH, gap, titleSize, minTitleSize } = m;
  // 아직 크기를 모르면 아무것도 내리지 않고 기다림 — 섣불리 내리면 깜빡임
  if (!(zoneH > 0)) return { ...ZONE_INITIAL, titleSize };
  if (stack([labelH, subtitleH, titleH, bodyH], gap) <= zoneH) return { ...ZONE_INITIAL, titleSize };
  if (stack([labelH, subtitleH, titleH], gap) <= zoneH) return { ...ZONE_INITIAL, bodyBelow: true, titleSize };
  if (titleSize > minTitleSize) {
    return { ...ZONE_INITIAL, bodyBelow: true, titleSize: Math.max(minTitleSize, titleSize - TITLE_STEP) };
  }
  if (stack([labelH, titleH], gap) <= zoneH) return { bodyBelow: true, subtitleBelow: true, headBelow: false, titleSize };
  return { bodyBelow: true, subtitleBelow: true, headBelow: true, titleSize };
}
