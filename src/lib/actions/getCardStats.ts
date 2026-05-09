'use server';

import { pool } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';

export interface CardStats {
  totalRecipients: number;
  todayRecipients: number;
  readRecipients: number;
  attendingRecords: number;
  attendingTotal: number;
  declinedRecords: number;
}

/**
 * 로그인 사용자가 소유한 카드들의 통계를 실시간 조회.
 * - 본인 user_id 또는 admin만 접근 가능 (서버 측 권한 검증).
 * - 통계 탭 클릭/카드 전환 시 클라이언트가 호출 → 페이지 reload 없이 최신 데이터 갱신.
 */
export async function getCardStats(cardIds: string[]): Promise<Record<string, CardStats>> {
  if (!cardIds || cardIds.length === 0) return {};
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || null;
  const email = session?.user?.email;
  if (!userId && !isAdminEmail(email)) return {};

  const { rows } = await pool.query<{
    card_id: string;
    total_recipients: string;
    today_recipients: string;
    read_recipients: string;
    attending_records: string;
    attending_total: string;
    declined_records: string;
  }>(
    `SELECT
       c.id as card_id,
       (SELECT COUNT(*) FROM dearday_recipient WHERE card_id=c.id) AS total_recipients,
       (SELECT COUNT(*) FROM dearday_recipient WHERE card_id=c.id AND created_at::date = CURRENT_DATE) AS today_recipients,
       (SELECT COUNT(*) FROM dearday_recipient WHERE card_id=c.id AND read_at IS NOT NULL) AS read_recipients,
       (SELECT COUNT(*) FROM dearday_rsvp WHERE card_id=c.id AND attend=true) AS attending_records,
       (SELECT COALESCE(SUM(count),0) FROM dearday_rsvp WHERE card_id=c.id AND attend=true) AS attending_total,
       (SELECT COUNT(*) FROM dearday_rsvp WHERE card_id=c.id AND attend=false) AS declined_records
     FROM dearday_card c
     WHERE c.id = ANY($1::uuid[])
       AND (${isAdminEmail(email) ? 'TRUE' : 'c.user_id = $2::uuid'})`,
    isAdminEmail(email) ? [cardIds] : [cardIds, userId]
  );
  const out: Record<string, CardStats> = {};
  for (const r of rows) {
    out[r.card_id] = {
      totalRecipients: Number(r.total_recipients) || 0,
      todayRecipients: Number(r.today_recipients) || 0,
      readRecipients: Number(r.read_recipients) || 0,
      attendingRecords: Number(r.attending_records) || 0,
      attendingTotal: Number(r.attending_total) || 0,
      declinedRecords: Number(r.declined_records) || 0
    };
  }
  return out;
}
