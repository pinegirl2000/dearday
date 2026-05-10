'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { pool } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import type { LayoutId } from '@/lib/layouts';

/**
 * 템플릿 설정 override — admin이 코드 default(allowedLayouts)를 덮어씀.
 * - DB에 row 있으면 그 값이 우선
 * - 없으면 코드 정의(allowedLayouts || [layout_id])가 적용
 */

export interface TemplateConfig {
  template_id: string;
  allowed_layouts: string[];
  updated_at: string | null;
}

export interface TemplateColors {
  color_main: string | null;
  color_sub: string | null;
  color_box_text: string | null;
  box_bg_top: string | null;
  box_bg_bottom: string | null;
  color_title_accent: string | null;
  rsvp_button_color: string | null;
}

/** 모든 템플릿 설정을 가져와 Map으로 반환 (template_id → allowed_layouts) */
export async function getAllTemplateConfigs(): Promise<Map<string, string[]>> {
  try {
    const { rows } = await pool.query<TemplateConfig>(
      'SELECT template_id, allowed_layouts, updated_at FROM dearday_template_config'
    );
    const map = new Map<string, string[]>();
    for (const r of rows) {
      map.set(r.template_id, r.allowed_layouts || []);
    }
    return map;
  } catch (e) {
    console.error('getAllTemplateConfigs error:', e);
    return new Map();
  }
}

/** 단일 템플릿 설정 조회 */
export async function getTemplateConfig(templateId: string): Promise<string[] | null> {
  try {
    const { rows } = await pool.query<TemplateConfig>(
      'SELECT allowed_layouts FROM dearday_template_config WHERE template_id=$1',
      [templateId]
    );
    return rows[0]?.allowed_layouts ?? null;
  } catch (e) {
    console.error('getTemplateConfig error:', e);
    return null;
  }
}

/** admin: 특정 템플릿의 allowedLayouts 저장 (upsert) */
export async function saveTemplateAllowedLayouts(
  templateId: string,
  allowedLayouts: LayoutId[]
): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return { ok: false, error: 'Permission denied' };
  }
  if (!templateId) return { ok: false, error: 'templateId 누락' };
  if (!Array.isArray(allowedLayouts) || allowedLayouts.length === 0) {
    return { ok: false, error: '최소 1개 layout 필요' };
  }
  try {
    await pool.query(
      `INSERT INTO dearday_template_config (template_id, allowed_layouts, updated_at, updated_by)
       VALUES ($1, $2, NOW(), $3)
       ON CONFLICT (template_id)
       DO UPDATE SET allowed_layouts = $2, updated_at = NOW(), updated_by = $3`,
      [templateId, allowedLayouts, session?.user?.email || null]
    );
    revalidatePath('/admin/templates');
    revalidatePath('/cards/new');
    return { ok: true };
  } catch (e: any) {
    console.error('saveTemplateAllowedLayouts error:', e);
    return { ok: false, error: e.message || 'DB 저장 실패' };
  }
}

/** 모든 template의 색상 override를 Map으로 반환 */
export async function getAllTemplateColors(): Promise<Map<string, TemplateColors>> {
  try {
    const { rows } = await pool.query<TemplateColors & { template_id: string }>(
      'SELECT template_id, color_main, color_sub, color_box_text, box_bg_top, box_bg_bottom, color_title_accent, rsvp_button_color FROM dearday_template_config'
    );
    const map = new Map<string, TemplateColors>();
    for (const r of rows) {
      if (r.color_main || r.color_sub || r.color_box_text || r.box_bg_top || r.box_bg_bottom || r.color_title_accent || r.rsvp_button_color) {
        map.set(r.template_id, {
          color_main: r.color_main,
          color_sub: r.color_sub,
          color_box_text: r.color_box_text,
          box_bg_top: r.box_bg_top,
          box_bg_bottom: r.box_bg_bottom,
          color_title_accent: r.color_title_accent,
          rsvp_button_color: r.rsvp_button_color
        });
      }
    }
    return map;
  } catch (e) {
    console.error('getAllTemplateColors error:', e);
    return new Map();
  }
}

/** admin: 단일 template의 색상 override 저장 (upsert) */
export async function saveTemplateColors(
  templateId: string,
  colors: Partial<TemplateColors>
): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return { ok: false, error: 'Permission denied' };
  }
  if (!templateId) return { ok: false, error: 'templateId 누락' };
  try {
    // 빈 문자열은 null로 정규화 (코드 default로 복귀)
    const norm = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);
    await pool.query(
      `INSERT INTO dearday_template_config
        (template_id, allowed_layouts, color_main, color_sub, color_box_text, box_bg_top, box_bg_bottom, color_title_accent, rsvp_button_color, updated_at, updated_by)
       VALUES ($1, '{}', $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
       ON CONFLICT (template_id) DO UPDATE SET
         color_main = $2,
         color_sub = $3,
         color_box_text = $4,
         box_bg_top = $5,
         box_bg_bottom = $6,
         color_title_accent = $7,
         rsvp_button_color = $8,
         updated_at = NOW(),
         updated_by = $9`,
      [
        templateId,
        norm(colors.color_main),
        norm(colors.color_sub),
        norm(colors.color_box_text),
        norm(colors.box_bg_top),
        norm(colors.box_bg_bottom),
        norm(colors.color_title_accent),
        norm(colors.rsvp_button_color),
        session?.user?.email || null
      ]
    );
    revalidatePath('/admin/templates');
    revalidatePath('/cards/new');
    return { ok: true };
  } catch (e: any) {
    console.error('saveTemplateColors error:', e);
    return { ok: false, error: e.message || 'DB 저장 실패' };
  }
}

/** admin: 설정 삭제 (코드 default로 복귀) */
export async function resetTemplateConfig(
  templateId: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return { ok: false, error: 'Permission denied' };
  }
  try {
    await pool.query('DELETE FROM dearday_template_config WHERE template_id=$1', [templateId]);
    revalidatePath('/admin/templates');
    revalidatePath('/cards/new');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
