'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { pool } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import type { EventType } from '@/types/card';

/**
 * 이벤트별 템플릿 노출 순서 — admin이 drag&drop으로 지정.
 * - DB에 row 있으면 sort_order 기준으로 정렬
 * - 없으면 코드 default 순서(getTemplatesFor의 filter 결과 그대로)
 */

/** 모든 이벤트의 순서 데이터를 한 번에 조회 — Map<event_id, template_id[]> */
export async function getAllTemplateEventOrders(): Promise<Map<string, string[]>> {
  try {
    const { rows } = await pool.query<{ event_id: string; template_id: string }>(
      `SELECT event_id, template_id
         FROM dearday_template_event_order
         ORDER BY event_id, sort_order`
    );
    const map = new Map<string, string[]>();
    for (const r of rows) {
      const arr = map.get(r.event_id) || [];
      arr.push(r.template_id);
      map.set(r.event_id, arr);
    }
    return map;
  } catch (e) {
    console.error('getAllTemplateEventOrders error:', e);
    return new Map();
  }
}

/** 특정 이벤트의 순서 조회 */
export async function getTemplateEventOrder(event: EventType): Promise<string[]> {
  try {
    const { rows } = await pool.query<{ template_id: string }>(
      `SELECT template_id
         FROM dearday_template_event_order
         WHERE event_id=$1
         ORDER BY sort_order`,
      [event]
    );
    return rows.map((r) => r.template_id);
  } catch (e) {
    console.error('getTemplateEventOrder error:', e);
    return [];
  }
}

/** admin: 이벤트의 템플릿 순서 저장 (전체 교체) */
export async function saveTemplateEventOrder(
  event: EventType,
  templateIds: string[]
): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return { ok: false, error: 'Permission denied' };
  }
  if (!event) return { ok: false, error: 'event 누락' };
  if (!Array.isArray(templateIds)) return { ok: false, error: '잘못된 입력' };

  const updatedBy = session?.user?.email || null;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM dearday_template_event_order WHERE event_id=$1', [event]);
    for (let i = 0; i < templateIds.length; i++) {
      await client.query(
        `INSERT INTO dearday_template_event_order (event_id, template_id, sort_order, updated_at, updated_by)
         VALUES ($1, $2, $3, NOW(), $4)`,
        [event, templateIds[i], i, updatedBy]
      );
    }
    await client.query('COMMIT');
    revalidatePath('/admin/templates');
    revalidatePath('/cards/new');
    return { ok: true };
  } catch (e: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('saveTemplateEventOrder error:', e);
    return { ok: false, error: e.message || 'DB 저장 실패' };
  } finally {
    client.release();
  }
}
