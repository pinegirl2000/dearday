import { z } from 'zod';
import { FONT_KEYS } from './font-keys';
import type { RoleStyle, TemplateTypography, TextRole } from './typography';

/**
 * 관리자 글꼴 설정 검증 범위.
 * 범위를 두는 이유: 잘못된 값(예: 크기 0, 자간 5em)이 저장되면 발행된 카드까지 즉시 깨지기 때문.
 */
export const TYPOGRAPHY_LIMITS = {
  size: { min: 8, max: 80 },
  minSize: { min: 6, max: 80 },
  spacing: { min: -0.02, max: 0.6 },
  lineHeight: { min: 1.0, max: 2.4 }
} as const;

const L = TYPOGRAPHY_LIMITS;

const roleStyleSchema = z
  .object({
    font: z.enum(FONT_KEYS).optional(),
    size: z.number().min(L.size.min).max(L.size.max).optional(),
    minSize: z.number().min(L.minSize.min).max(L.minSize.max).optional(),
    spacing: z.number().min(L.spacing.min).max(L.spacing.max).optional(),
    minSpacing: z.number().min(L.spacing.min).max(L.spacing.max).optional(),
    weight: z.union([z.literal(300), z.literal(400), z.literal(500), z.literal(600), z.literal(700)]).optional(),
    lineHeight: z.number().min(L.lineHeight.min).max(L.lineHeight.max).optional(),
    uppercase: z.boolean().optional()
  })
  // 알 수 없는 속성(예: color)은 거부 — 오타가 조용히 무시되는 것 방지
  .strict();

export const typographySchema = z
  .object({
    eventLabel: roleStyleSchema.optional(),
    subtitle: roleStyleSchema.optional(),
    title: roleStyleSchema.optional(),
    body: roleStyleSchema.optional()
  })
  .strict();

const ROLES: TextRole[] = ['eventLabel', 'subtitle', 'title', 'body'];
const roleShape = roleStyleSchema.shape;

/**
 * DB 저장·조회 직전 정리 — 속성 단위로 관대하게.
 * - 잘못된 속성(목록에서 빠진 글꼴 키, 범위 밖 값, 모르는 키)만 버리고 나머지는 살림
 *   → 글꼴 목록을 바꿔도 같은 역할의 크기·자간 조정은 유지되고, 화면은 하위 우선순위 값으로 그려짐
 * - 속성이 하나도 없는 역할은 제거, 전부 비면 null (불필요한 override row 방지)
 * 저장 경로는 먼저 typographySchema(엄격)로 거부하므로, 여기서 버려지는 건 옛 데이터뿐이다.
 */
export function sanitizeTypography(input: unknown): TemplateTypography | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const src = input as Record<string, unknown>;
  const out: TemplateTypography = {};
  for (const role of ROLES) {
    const style = src[role];
    if (!style || typeof style !== 'object' || Array.isArray(style)) continue;
    const kept: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(style as Record<string, unknown>)) {
      const field = roleShape[key as keyof typeof roleShape];
      if (field && value !== undefined && field.safeParse(value).success) kept[key] = value;
    }
    if (Object.keys(kept).length > 0) out[role] = kept as RoleStyle;
  }
  return Object.keys(out).length > 0 ? out : null;
}
