import { FONT_STACKS, isFontKey, type FontKey } from './font-keys';

/** 카드에서 타이포그래피를 템플릿별로 지정할 수 있는 텍스트 역할 */
export type TextRole = 'eventLabel' | 'subtitle' | 'title' | 'body';

export type FontWeight = 300 | 400 | 500 | 600 | 700;

/** 역할 하나의 스타일 — 모든 속성이 선택(부분 override 를 표현하기 위함) */
export interface RoleStyle {
  font?: FontKey;
  /** px, 기준 카드폭(card_max_width || 440) 기준 */
  size?: number;
  /** 자동 맞춤 시 줄어들 수 있는 최소 크기(px) */
  minSize?: number;
  /** em */
  spacing?: number;
  /** 자동 맞춤 시 줄어들 수 있는 최소 자간(em) */
  minSpacing?: number;
  weight?: FontWeight;
  lineHeight?: number;
  uppercase?: boolean;
}

export type TemplateTypography = Partial<Record<TextRole, RoleStyle>>;

/** 병합이 끝나 렌더러가 바로 쓸 수 있는 값 */
export interface ResolvedRoleStyle {
  fontFamily: string;
  size: number;
  minSize: number;
  spacing: number;
  minSpacing: number;
  weight: number;
  lineHeight: number;
  uppercase: boolean;
}

type RoleDefault = Required<Pick<RoleStyle, 'font' | 'size' | 'spacing' | 'weight' | 'lineHeight'>>;

/**
 * 전역 기본값 — 지금 화면(ClassicTemplateCard 하드코딩 값)과 동일하게 맞춤.
 * 템플릿 기본값을 아직 넣지 않은 템플릿은 모양이 바뀌지 않도록 하기 위함.
 */
export const ROLE_DEFAULTS: Record<TextRole, RoleDefault> = {
  title: { font: 'notoSerif', size: 24, spacing: 0.4, weight: 500, lineHeight: 1.3 },
  subtitle: { font: 'notoSerif', size: 13, spacing: 0.2, weight: 400, lineHeight: 1.5 },
  eventLabel: { font: 'playfair', size: 11, spacing: 0.5, weight: 600, lineHeight: 1.4 },
  body: { font: 'notoSerif', size: 15, spacing: 0, weight: 400, lineHeight: 2.0 }
};

/** 자동 맞춤 최소 크기 = 지정 크기의 72% — 이보다 작아지면 제목 위계가 무너짐 */
const MIN_SIZE_RATIO = 0.72;
/** 자동 맞춤 최소 자간(em) — 이 이하로 줄이면 장식 자간의 느낌이 사라짐 */
const MIN_SPACING_DEFAULT = 0.04;
/** 흐름형 카드 기본 좌우 여백(px) — 기존 padding 값 */
export const DEFAULT_CONTENT_SIDE = 20;

/** 앞에서부터 처음 나오는 유효한 숫자 */
function firstNumber(...vals: Array<number | undefined>): number | undefined {
  return vals.find((v) => typeof v === 'number' && Number.isFinite(v));
}

/**
 * 역할 하나의 최종 스타일을 속성 단위로 병합.
 * 우선순위: DB(관리자 조정) → 템플릿 코드 기본값 → 레이아웃 기본 → 전역 기본.
 * 속성 단위로 병합하는 이유: 관리자가 자간 하나만 바꿔도 나머지는 템플릿 기본값을 그대로 따르게 하기 위함.
 */
export function resolveRoleStyle(
  role: TextRole,
  sources: {
    db?: TemplateTypography | null;
    template?: TemplateTypography;
    layout?: RoleStyle;
    /** 절대배치 레이아웃이 원래 쓰던 font-family 스택 — DB·템플릿이 글꼴을 지정하지 않으면 이 값을 유지 */
    layoutFontFamily?: string;
  }
): ResolvedRoleStyle {
  const chain: Array<RoleStyle | undefined> = [sources.db?.[role], sources.template?.[role], sources.layout];
  const pick = <K extends keyof RoleStyle>(key: K): RoleStyle[K] | undefined =>
    chain.map((s) => s?.[key]).find((v) => v !== undefined && v !== null);
  const def = ROLE_DEFAULTS[role];

  // 글꼴은 알려진 키만 유효 — 목록에서 빠진 옛 키가 DB 에 남아 있어도 다음 우선순위로 넘어감
  const font = chain.map((s) => s?.font).find(isFontKey);
  const size = firstNumber(...chain.map((s) => s?.size)) ?? def.size;
  const spacing = firstNumber(...chain.map((s) => s?.spacing)) ?? def.spacing;
  const minSize = firstNumber(...chain.map((s) => s?.minSize)) ?? Math.round(size * MIN_SIZE_RATIO);
  const minSpacing = firstNumber(...chain.map((s) => s?.minSpacing)) ?? Math.min(spacing, MIN_SPACING_DEFAULT);

  return {
    fontFamily: font ? FONT_STACKS[font] : (sources.layoutFontFamily ?? FONT_STACKS[def.font]),
    size,
    minSize: Math.min(minSize, size),
    spacing,
    minSpacing: Math.min(minSpacing, spacing),
    weight: firstNumber(pick('weight')) ?? def.weight,
    lineHeight: firstNumber(pick('lineHeight')) ?? def.lineHeight,
    uppercase: pick('uppercase') ?? false
  };
}

/** 흐름형 카드 좌우 여백 — DB → 템플릿 코드 → 기본 20px */
export function resolveContentSide(db: number | null | undefined, template: number | undefined): number {
  return firstNumber(db ?? undefined, template) ?? DEFAULT_CONTENT_SIDE;
}

/**
 * 레이아웃 파일의 TextField(문자열 em 자간) 를 RoleStyle 로 변환.
 * 레이아웃은 글꼴을 CSS 문자열로 갖고 있어 font 키로는 옮기지 않는다(글꼴은 템플릿·전역 기본이 결정).
 */
export function layoutFieldToRoleStyle(
  field: { fontSize: number; fontWeight?: number; letterSpacing?: string; lineHeight?: number } | undefined
): RoleStyle | undefined {
  if (!field) return undefined;
  const em = field.letterSpacing ? parseFloat(field.letterSpacing) : undefined;
  return {
    size: field.fontSize,
    spacing: em !== undefined && Number.isFinite(em) ? em : undefined,
    weight: field.fontWeight as FontWeight | undefined,
    lineHeight: field.lineHeight
  };
}

/** 퍼센트 문자열 — 소수 셋째 자리 (기존 pctOf 와 같은 형식) */
const toPct = (n: number) => `${Number(n.toFixed(3))}%`;

/**
 * 흐름형 카드 날짜·장소 정보 박스의 max-width(%).
 * 박스 폭은 콘텐츠 영역(좌우 여백 안쪽) 기준 % 라서, 템플릿 기본 여백(contentSide)으로 콘텐츠가 좁아지면
 * 박스까지 같이 좁아져 "8 PM" 이 두 줄로 깨진다. 템플릿 기본 여백일 때는 박스의 실제 폭을 기존과 같게 보정한다.
 * DB 여백(관리자가 미리보기로 맞춘 값)이 있으면 기존 계산 그대로 — 이미 맞춰 둔 배치를 바꾸지 않기 위함.
 */
export function infoBoxWidthPercent(
  boxPx: number,
  refWidth: number,
  dbSide: number | null | undefined,
  templateSide: number | undefined
): string {
  const legacy = (boxPx / refWidth) * 100;
  if (dbSide != null || templateSide == null) return toPct(legacy);
  const legacyActualPx = (legacy / 100) * (refWidth - DEFAULT_CONTENT_SIDE * 2);
  const container = refWidth - templateSide * 2;
  return container > 0 ? toPct(Math.min(100, (legacyActualPx / container) * 100)) : '100%';
}

/**
 * 템플릿·DB 글꼴 설정을 이 레이아웃에 적용할지 결정.
 * 템플릿 typography 는 그 템플릿의 기본 레이아웃(layout_id) 화면을 보고 맞춘 값이다.
 * 같은 배경을 다른 레이아웃(layout-3/5, thank_classic 등)으로 쓰면 그 레이아웃 고유의 글자 모양
 * (필기체 라벨, 작은 본문 등)을 유지해야 하므로 적용하지 않는다 — 발행된 카드 모양이 갑자기 바뀌는 것 방지.
 */
export function typographyForLayout(
  tpl: { layout_id: string; typography?: TemplateTypography } | null | undefined,
  layoutId: string,
  db: TemplateTypography | null | undefined
): { template?: TemplateTypography; db?: TemplateTypography | null } {
  if (!tpl || tpl.layout_id !== layoutId) return { template: undefined, db: undefined };
  return { template: tpl.typography, db };
}
