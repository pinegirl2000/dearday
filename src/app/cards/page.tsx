import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { pool } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { PageContainer } from '@/components/layout/PageContainer';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { getEventTypeMeta } from '@/lib/eventType';
import { getBackground } from '@/lib/backgrounds';
import { ExternalLink, Settings, Pencil } from 'lucide-react';
import type { BaseCard } from '@/types/card';
import LoginPrompt from './_LoginPrompt';

export const dynamic = 'force-dynamic';

/**
 * 로그인한 사용자의 카드 목록 조회.
 * 비로그인이면 빈 배열 반환 (목록 페이지에서 로그인 안내).
 */
async function getMyCards(userId: string | null): Promise<BaseCard[]> {
  if (!userId) return [];
  const { rows } = await pool.query<BaseCard>(
    `SELECT * FROM dearday_card WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200`,
    [userId]
  );
  return rows;
}

function fmtDate(iso?: string | null) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return ''; }
}

export default async function CardsListPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || null;
  const cards = await getMyCards(userId);

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
          {cards.map((c) => {
            const meta = getEventTypeMeta(c.event_type);
            const bg = getBackground(c.bg_id);
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-hydrangea-100 bg-white overflow-hidden"
              >
                <div className="flex">
                  {/* 썸네일 */}
                  <div className="w-20 h-20 flex-shrink-0 relative bg-hydrangea-50">
                    {bg.imageUrl ? (
                      <img src={bg.imageUrl} alt={bg.name} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0" style={{ background: bg.gradient }} />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center text-2xl drop-shadow">
                      {meta.emoji}
                    </div>
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0 p-3">
                    <div className="text-[11px] text-hydrangea-400 mb-0.5">
                      {meta.label} · {fmtDate(c.created_at)}
                    </div>
                    <div className="font-semibold text-sm text-hydrangea-700 truncate">
                      {c.title}
                    </div>
                    {c.event_date && (
                      <div className="text-[11px] text-hydrangea-500 mt-0.5">
                        🗓 {fmtDate(c.event_date)}
                      </div>
                    )}
                    <div className="text-[10px] text-hydrangea-300 mt-1 truncate font-mono">
                      /{c.slug}
                    </div>
                  </div>
                </div>

                {/* 액션 */}
                <div className="flex border-t border-hydrangea-100/60">
                  <Link
                    href={`/i/${c.slug}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-hydrangea-700 hover:bg-hydrangea-50 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View
                  </Link>
                  <div className="w-px bg-hydrangea-100/60" />
                  <Link
                    href={`/cards/${c.slug}/edit`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-hydrangea-700 hover:bg-hydrangea-50 transition"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </Link>
                  <div className="w-px bg-hydrangea-100/60" />
                  <Link
                    href={`/cards/${c.slug}/manage`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-hydrangea-700 hover:bg-hydrangea-50 transition"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Manage
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
