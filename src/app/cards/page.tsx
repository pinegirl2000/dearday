import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { pool } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { PageContainer } from '@/components/layout/PageContainer';
import { MobileHeader } from '@/components/layout/MobileHeader';
import type { BaseCard } from '@/types/card';
import LoginPrompt from './_LoginPrompt';
import RecentCardSelector from './_RecentCardSelector';

export const dynamic = 'force-dynamic';

async function getMyCards(userId: string | null): Promise<BaseCard[]> {
  if (!userId) return [];
  const { rows } = await pool.query<BaseCard>(
    `SELECT * FROM dearday_card WHERE user_id=$1
     ORDER BY COALESCE(updated_at, created_at) DESC LIMIT 200`,
    [userId]
  );
  return rows;
}

export interface CardStats {
  totalRecipients: number;
  todayRecipients: number;
  readRecipients: number;
  attendingRecords: number;
  attendingTotal: number;
  declinedRecords: number;
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

export default async function CardsListPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || null;
  const cards = await getMyCards(userId);
  const stats = await getStatsForCards(cards.map((c) => c.id));

  return (
    <PageContainer noPadding>
      <MobileHeader title="My invitations" back />

      {!session ? (
        <LoginPrompt />
      ) : cards.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-sm text-hydrangea-400 mb-4">You haven't created any invitations yet.</p>
          <Link
            href="/cards/new"
            className="inline-block px-5 py-2.5 rounded-full bg-hydrangea-500 text-white text-sm font-medium"
          >
            Create invitation
          </Link>
        </div>
      ) : (
        <div className="px-4 py-3 space-y-3">
          <RecentCardSelector cards={cards} stats={stats} />
        </div>
      )}
    </PageContainer>
  );
}
