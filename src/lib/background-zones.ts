/**
 * 배경 그림별 "글 영역(zone)" — 그림 안에서 글을 놓아도 되는 빈 자리.
 * 배경 이미지는 대부분 곰·리본·프레임 같은 그림과 빈 자리를 함께 디자인해 두었는데,
 * 그 자리를 모르고 글을 위에서부터 쌓으면 그림과 겹친다. 여기서 자리를 알려 주면
 * 카드는 "표지(그림 + 이 영역의 제목부) + 내용 면(날짜·연락처·RSVP)" 구조로 그려진다.
 */
export interface TextZone {
  /** 배경 이미지 대비 % (왼쪽·위·폭·높이) */
  x: number;
  y: number;
  w: number;
  h: number;
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'center' | 'bottom';
}

export interface BackgroundZone {
  zone: TextZone;
  /** 표지 가로/세로 비율 — 그림이 잘리거나 움직이지 않도록 원본 비율로 고정 */
  aspect: number;
  /** 내용 면 바탕색 — 그림의 아래쪽 바탕색과 이어지게 */
  panelColor: string;
  /**
   * 표지로 보여 줄 높이 비율(위에서부터, 0~1). 그림 아래쪽이 빈 바탕뿐인 배경은 잘라서
   * 표지와 내용 면 사이에 큰 여백이 생기지 않게 한다. 지정하면 zone 의 y·h 는 잘린 표지 기준 %.
   */
  coverCrop?: number;
}

/** 대부분의 배경 원본 크기(1240×1748) */
const CARD_ASPECT = 1240 / 1748;

export const BACKGROUND_ZONES: Record<string, BackgroundZone> = {
  // 왼쪽 위 풍선·곰 → 오른쪽 아래 빈 자리
  'bg-img-6': { zone: { x: 45, y: 30, w: 49, h: 62, align: 'center', valign: 'center' }, aspect: CARD_ASPECT, panelColor: '#FFFFFF' },
  // 위 가운데 곰 → 아래 빈 자리
  'bg-img-7': { zone: { x: 10, y: 52, w: 80, h: 42, valign: 'center' }, aspect: CARD_ASPECT, panelColor: '#FFFFFF' },
  // 아치 위 리본 → 아치 안 리본 아래
  'bg-img-8': { zone: { x: 17, y: 42, w: 66, h: 48, valign: 'center' }, aspect: CARD_ASPECT, panelColor: '#F1ECE6' },
  // 가운데 리본 띠 → 리본 위. 리본 아래는 빈 분홍 바탕뿐이라 리본 꼬리 바로 아래에서 표지를 자름
  'bg-img-9': { zone: { x: 10, y: 12, w: 80, h: 49, valign: 'center' }, aspect: CARD_ASPECT, panelColor: '#FEF5F5', coverCrop: 0.69 },
  // 위쪽 풍선·곰, 아래 무지개 → 가운데 띠
  'bg-img-11': { zone: { x: 10, y: 47, w: 80, h: 34, valign: 'center' }, aspect: CARD_ASPECT, panelColor: '#F3FAFC' },
  // 원 + 가장자리 풍선 + 아래 케이크 → 원 아래 가운데
  'bg-img-12': { zone: { x: 25, y: 40, w: 47, h: 33, valign: 'center' }, aspect: CARD_ASPECT, panelColor: '#ECE8E8' },
  // 위 가운데 성 → 성 아래
  'bg-img-13': { zone: { x: 17, y: 58, w: 66, h: 28, valign: 'center' }, aspect: CARD_ASPECT, panelColor: '#FFFFFF' },
  // 리본 프레임 + 아래 곰 → 프레임 안 곰 위
  'bg-img-14': { zone: { x: 23, y: 20, w: 54, h: 39, valign: 'center' }, aspect: CARD_ASPECT, panelColor: '#F4F8EE' },
  // 가장자리 꽃 + 흰 패널 → 흰 패널
  'bg-img-15': { zone: { x: 27, y: 20, w: 46, h: 66, valign: 'center' }, aspect: CARD_ASPECT, panelColor: '#F4EFDF' },
  // ── 코드로 그린 배경: 영역을 먼저 정하고 그림을 그 바깥에만 그림 ──
  'bg-svg-botanical': { zone: { x: 24, y: 30, w: 52, h: 52, valign: 'center' }, aspect: CARD_ASPECT, panelColor: '#F2EFE4' },
  'bg-svg-confetti': { zone: { x: 12, y: 27, w: 76, h: 52, valign: 'center' }, aspect: CARD_ASPECT, panelColor: '#FFFDFB' },
  'bg-svg-lunar': { zone: { x: 16, y: 32, w: 68, h: 50, valign: 'center' }, aspect: CARD_ASPECT, panelColor: '#8E1E1A' },
  // 꽃 + 안쪽 프레임 → 프레임 안
  'bg-img-21': { zone: { x: 15, y: 14, w: 70, h: 72, valign: 'center' }, aspect: 3369 / 4761, panelColor: '#EFE4F5' }
};

/** zone 구조를 쓰는 레이아웃 — 흐름형 기본 레이아웃만. 절대배치·감사 카드 레이아웃은 고유 배치가 있어 제외 */
const ZONE_LAYOUTS = new Set(['layout-classic']);

export function getBackgroundZone(bgId: string | null | undefined, layoutId: string | null | undefined): BackgroundZone | null {
  if (!bgId || !layoutId || !ZONE_LAYOUTS.has(layoutId)) return null;
  return BACKGROUND_ZONES[bgId] ?? null;
}
