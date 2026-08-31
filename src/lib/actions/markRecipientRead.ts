'use server';

import { pool } from '@/lib/db';
import { lockSlotByRecipient } from '@/lib/actions/payment';

/**
 * 수신자가 초청장을 처음 열람한 시점 기록.
 * 이미 read_at이 있으면 갱신하지 않음 (최초 열람 시각만 의미 있음).
 * 결제 slot이 연결된 카드면 slot도 영구 lock(박제) — Pro 활성 시.
 */
export async function markRecipientRead(recipientId: string): Promise<void> {
  if (!recipientId) return;
  try {
    const { rowCount } = await pool.query(
      `UPDATE dearday_recipient SET read_at = NOW()
       WHERE id = $1 AND read_at IS NULL`,
      [recipientId]
    );
    // 첫 열람 발생한 경우에만 slot lock
    if ((rowCount || 0) > 0) {
      await lockSlotByRecipient(recipientId);
    }
  } catch (e) {
    console.error('markRecipientRead error:', e);
  }
}
