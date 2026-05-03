import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { pool } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { PageContainer } from '@/components/layout/PageContainer';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { ExternalLink, Settings, Pencil } from 'lucide-react';
import type { BaseCard } from '@/types/card';

export const dynamic = 'force-dynamic';

interface AdminCardRow extends BaseCard {
  user_email: string | null;
  user_name: string | null;
  recipient_count: number;
  rsvp_count: number;
}

async function getAllCards(): Promise<AdminCardRow[]> {
  const { rows } = await pool.query<AdminCardRow>(
    `SELECT
       c.*,
       u.email AS user_email,
       u.name AS user_name,
       (SELECT COUNT(*)::int FROM dearday_recipient r WHERE r.card_id = c.id) AS recipient_count,
       (SELECT COUNT(*)::int FROM dearday_rsvp v WHERE v.card_id = c.id) AS rsvp_count
     FROM dearday_card c
     LEFT JOIN dearday_user u ON u.id = c.user_id
     ORDER BY c.created_at DESC
     LIMIT 500`
  );
  return rows;
}

function fmtDate(iso?: string | Date | null) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return ''; }
}

export default async function AdminCardsPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    redirect('/');
  }

  const cards = await getAllCards();

  return (
    <PageContainer noPadding>
      <MobileHeader title="Admin · All Invitations" back />
      <div className="px-4 pt-3 pb-12">
        <div className="text-xs text-hydrangea-400 mb-3">
          {cards.length} card{cards.length !== 1 ? 's' : ''} across all users
        </div>
        <div className="space-y-2">
          {cards.map((c) => (
            <div key={c.id} className="rounded-2xl border border-hydrangea-100 bg-white overflow-hidden">
              <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-hydrangea-400">
                      {c.event_type} · created {fmtDate(c.created_at)}
                    </div>
                    <div className="text-sm font-semibold text-hydrangea-700 truncate">{c.title}</div>
                  </div>
                  <span className="text-[10px] font-mono text-hydrangea-400 shrink-0">{c.slug}</span>
                </div>
                <div className="text-[11px] text-hydrangea-500 truncate">
                  Owner: {c.user_name || '—'} {c.user_email ? `· ${c.user_email}` : ''}
                </div>
                {c.event_date && (
                  <div className="text-[11px] text-hydrangea-500 mt-0.5">Event: {fmtDate(c.event_date)}</div>
                )}
                <div className="text-[11px] text-hydrangea-500 mt-0.5">
                  Recipients: {c.recipient_count} · RSVPs: {c.rsvp_count}
                </div>
              </div>
              <div className="flex border-t border-hydrangea-100/60">
                <Link
                  href={`/i/${c.slug}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-hydrangea-700 hover:bg-hydrangea-50 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View
                </Link>
                <div className="w-px bg-hydrangea-100/60" />
                <Link
                  href={`/cards/${c.slug}/edit`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-hydrangea-700 hover:bg-hydrangea-50 transition"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Link>
                <div className="w-px bg-hydrangea-100/60" />
                <Link
                  href={`/cards/${c.slug}/manage`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-hydrangea-700 hover:bg-hydrangea-50 transition"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Manage
                </Link>
              </div>
            </div>
          ))}
          {cards.length === 0 && (
            <p className="text-center text-sm text-hydrangea-400 py-8">No cards yet.</p>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
