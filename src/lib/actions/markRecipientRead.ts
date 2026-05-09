'use server';

import { pool } from '@/lib/db';

/**
 * 수신자가 초청장을 처음 열람한 시점 기록.
 * 이미 read_at이 있으면 갱신하지 않음 (최초 열람 시각만 의미 있음).
 */
export async function markRecipientRead(recipientId: string): Promise<void> {
  if (!recipientId) return;
  try {
    await pool.query(
      `UPDATE dearday_recipient SET read_at = NOW()
       WHERE id = $1 AND read_at IS NULL`,
      [recipientId]
    );
  } catch (e) {
    console.error('markRecipientRead error:', e);
  }
}
