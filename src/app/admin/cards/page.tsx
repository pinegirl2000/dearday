import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { pool } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { PageContainer } from '@/components/layout/PageContainer';
import { MobileHeader } from '@/components/layout/MobileHeader';
import RecentCardSelector from '@/app/cards/_RecentCardSelector';
import type { BaseCard } from '@/types/card';
import type { CardStats } from '@/lib/actions/getCardStats';

export const dynamic = 'force-dynamic';

interface AdminCardRow extends BaseCard {
  user_email: string | null;
  user_name: string | null;
}

async function getAllCards(): Promise<AdminCardRow[]> {
  const { rows } = await pool.query<AdminCardRow>(
    `SELECT
       c.*,
       u.email AS user_email,
       u.name AS user_name
     FROM dearday_card c
     LEFT JOIN dearday_user u ON u.id = c.user_id
     ORDER BY COALESCE(c.updated_at, c.created_at) DESC
     LIMIT 500`
  );
  return rows;
}

async function getStatsForCards(cardIds: string[]): Promise<Record<string, CardStats>> {
  if (cardIds.length === 0) return {};
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
     FROM dearday_card c WHERE c.id = ANY($1::uuid[])`,
    [cardIds]
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

export default async function AdminCardsPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    redirect('/');
  }

  const cards = await getAllCards();
  const stats = await getStatsForCards(cards.map((c) => c.id));
  // 카드별 소유자 매핑 — RecentCardSelector의 admin-only owners prop으로 전달
  const owners: Record<string, { name?: string | null; email?: string | null }> = {};
  for (const c of cards) {
    owners[c.id] = { name: c.user_name, email: c.user_email };
  }

  return (
    <PageContainer noPadding>
      <MobileHeader title="Admin · All Invitations" back />
      <div className="px-4 pt-3 pb-12">
        <div className="text-xs text-hydrangea-400 mb-3">
          {cards.length} card{cards.length !== 1 ? 's' : ''} · 모든 사용자 발행 카드
        </div>
        {cards.length === 0 ? (
          <p className="text-center text-sm text-hydrangea-400 py-8">No cards yet.</p>
        ) : (
          <RecentCardSelector cards={cards} stats={stats} owners={owners} />
        )}
      </div>
    </PageContainer>
  );
}
