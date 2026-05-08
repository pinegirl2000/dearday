'use server';

import { pool } from '@/lib/db';

export interface SampleData {
  id: string;
  event_type: string;
  label: string;
  title: string | null;
  greeting_oneliner: string | null;
  body: string | null;
  event_place: string | null;
  map_url: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  extra_info: string | null;
  sort_order: number;
}

/** 이벤트 타입별 sample data 목록 — sort_order 오름차순 */
export async function listSamplesByEventType(eventType: string): Promise<SampleData[]> {
  if (!eventType) return [];
  const { rows } = await pool.query<SampleData>(
    `SELECT id, event_type, label, title, greeting_oneliner, body,
            event_place, map_url, contact_name, contact_phone, extra_info, sort_order
     FROM dearday_sample_data
     WHERE event_type = $1
     ORDER BY sort_order ASC, label ASC`,
    [eventType]
  );
  return rows;
}
