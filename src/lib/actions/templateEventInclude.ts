'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { pool } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';

/**
 * 이벤트별 템플릿 추가 포함 — admin이 코드의 recommendEvents에 없는 템플릿을 명시적으로 추가.
 * 최종 표시 = (recommendEvents UNION include) MINUS exclude
 */

export async function getAllTemplateEventIncludes(): Promise<Map<string, string[]>> {
  try {
    const { rows } = await pool.query<{ event_id: string; template_id: string }>(
      'SELECT event_id, template_id FROM dearday_template_event_include'
    );
    const map = new Map<string, string[]>();
    for (const r of rows) {
      const list = map.get(r.event_id) || [];
      list.push(r.template_id);
      map.set(r.event_id, list);
    }
    return map;
  } catch (e) {
    console.error('getAllTemplateEventIncludes error:', e);
    return new Map();
  }
}

export async function addTemplateEventInclude(eventId: string, templateId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) return { ok: false, error: 'Permission denied' };
  if (!eventId || !templateId) return { ok: false, error: 'eventId/templateId 누락' };
  try {
    await pool.query(
      `INSERT INTO dearday_template_event_include (event_id, template_id, updated_at, updated_by)
       VALUES ($1, $2, NOW(), $3)
       ON CONFLICT (event_id, template_id) DO NOTHING`,
      [eventId, templateId, session?.user?.email || null]
    );
    revalidatePath('/admin/templates');
    revalidatePath('/cards/new');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function removeTemplateEventInclude(eventId: string, templateId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) return { ok: false, error: 'Permission denied' };
  try {
    await pool.query(
      'DELETE FROM dearday_template_event_include WHERE event_id=$1 AND template_id=$2',
      [eventId, templateId]
    );
    revalidatePath('/admin/templates');
    revalidatePath('/cards/new');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/**
 * 어드민 토글: 특정 (event, template) 쌍을 포함/제외.
 * 코드 recommendEvents에 따라 분기:
 * - 코드 default 포함 + 토글 OFF → exclude 추가
 * - 코드 default 포함 + 토글 ON → exclude 제거
 * - 코드 default 제외 + 토글 ON → include 추가
 * - 코드 default 제외 + 토글 OFF → include 제거
 */
export async function toggleTemplateForEvent(
  eventId: string,
  templateId: string,
  shouldInclude: boolean,
  isInRecommendEvents: boolean
): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) return { ok: false, error: 'Permission denied' };
  try {
    if (shouldInclude) {
      // 포함시키기 — exclude 제거 + (코드에 없으면) include 추가
      await pool.query(
        'DELETE FROM dearday_template_event_exclude WHERE event_id=$1 AND template_id=$2',
        [eventId, templateId]
      );
      if (!isInRecommendEvents) {
        await pool.query(
          `INSERT INTO dearday_template_event_include (event_id, template_id, updated_at, updated_by)
           VALUES ($1, $2, NOW(), $3)
           ON CONFLICT (event_id, template_id) DO NOTHING`,
          [eventId, templateId, session?.user?.email || null]
        );
      }
    } else {
      // 제외시키기 — include 제거 + (코드에 있으면) exclude 추가
      await pool.query(
        'DELETE FROM dearday_template_event_include WHERE event_id=$1 AND template_id=$2',
        [eventId, templateId]
      );
      if (isInRecommendEvents) {
        await pool.query(
          `INSERT INTO dearday_template_event_exclude (event_id, template_id, updated_at, updated_by)
           VALUES ($1, $2, NOW(), $3)
           ON CONFLICT (event_id, template_id) DO NOTHING`,
          [eventId, templateId, session?.user?.email || null]
        );
      }
    }
    revalidatePath('/admin/templates');
    revalidatePath('/cards/new');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
