'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { pool } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';

/**
 * 이벤트별 템플릿 제외 — admin이 (event, template) 쌍을 숨김.
 * 코드의 TEMPLATES.recommendEvents는 그대로 유지하면서 admin이 특정 조합을 가림.
 */

export async function getAllTemplateEventExcludes(): Promise<Map<string, string[]>> {
  try {
    const { rows } = await pool.query<{ event_id: string; template_id: string }>(
      'SELECT event_id, template_id FROM dearday_template_event_exclude'
    );
    const map = new Map<string, string[]>();
    for (const r of rows) {
      const list = map.get(r.event_id) || [];
      list.push(r.template_id);
      map.set(r.event_id, list);
    }
    return map;
  } catch (e) {
    console.error('getAllTemplateEventExcludes error:', e);
    return new Map();
  }
}

export async function addTemplateEventExclude(
  eventId: string,
  templateId: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) return { ok: false, error: 'Permission denied' };
  if (!eventId || !templateId) return { ok: false, error: 'eventId/templateId 누락' };
  try {
    await pool.query(
      `INSERT INTO dearday_template_event_exclude (event_id, template_id, updated_at, updated_by)
       VALUES ($1, $2, NOW(), $3)
       ON CONFLICT (event_id, template_id) DO NOTHING`,
      [eventId, templateId, session?.user?.email || null]
    );
    revalidatePath('/admin/templates');
    revalidatePath('/cards/new');
    return { ok: true };
  } catch (e: any) {
    console.error('addTemplateEventExclude error:', e);
    return { ok: false, error: e.message || 'DB 저장 실패' };
  }
}

export async function removeTemplateEventExclude(
  eventId: string,
  templateId: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) return { ok: false, error: 'Permission denied' };
  try {
    await pool.query(
      'DELETE FROM dearday_template_event_exclude WHERE event_id=$1 AND template_id=$2',
      [eventId, templateId]
    );
    revalidatePath('/admin/templates');
    revalidatePath('/cards/new');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
