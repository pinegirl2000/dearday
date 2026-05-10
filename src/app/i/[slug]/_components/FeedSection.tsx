import { MessageCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getOnelinerFeed, getRsvpStats } from '@/lib/actions/submitRsvp';
import type { ThemeMeta } from '@/lib/theme';

interface Props {
  cardId: string;
  theme: ThemeMeta;
}

function timeAgo(iso: string, t: (key: string, values?: Record<string, unknown>) => string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return t('justNow');
  if (diff < 3600) return t('minutesAgo', { n: Math.floor(diff / 60) });
  if (diff < 86400) return t('hoursAgo', { n: Math.floor(diff / 3600) });
  if (diff < 86400 * 7) return t('daysAgo', { n: Math.floor(diff / 86400) });
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default async function FeedSection({ cardId, theme }: Props) {
  const [feed, stats, t] = await Promise.all([
    getOnelinerFeed(cardId),
    getRsvpStats(cardId),
    getTranslations('Feed')
  ]);

  return (
    <section className="mt-2">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-3 rounded-xl" style={{ background: theme.colors.bg }}>
          <div className="text-xl font-bold" style={{ color: theme.colors.primary }}>{stats.attending_groups}</div>
          <div className="text-[10px] mt-0.5" style={{ color: theme.colors.muted }}>{t('attendingGroup')}</div>
        </div>
        <div className="text-center p-3 rounded-xl" style={{ background: theme.colors.bg }}>
          <div className="text-xl font-bold" style={{ color: theme.colors.primary }}>{stats.attending_count}</div>
          <div className="text-[10px] mt-0.5" style={{ color: theme.colors.muted }}>{t('attendingPeople')}</div>
        </div>
        <div className="text-center p-3 rounded-xl" style={{ background: theme.colors.bg }}>
          <div className="text-xl font-bold" style={{ color: theme.colors.muted }}>{stats.declined}</div>
          <div className="text-[10px] mt-0.5" style={{ color: theme.colors.muted }}>{t('declined')}</div>
        </div>
      </div>

      {/* Feed */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <MessageCircle className="w-4 h-4" style={{ color: theme.colors.primary }} />
        <h3 className="text-sm font-semibold" style={{ color: theme.colors.deep }}>{t('feedTitle', { count: feed.length })}</h3>
      </div>

      {feed.length === 0 ? (
        <div className="text-center py-8 rounded-xl" style={{ background: theme.colors.bg }}>
          <p className="text-sm" style={{ color: theme.colors.muted }}>{t('feedEmpty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {feed.map((r) => (
            <div key={r.id} className="p-4 rounded-xl border-l-4" style={{ background: theme.colors.bg, borderLeftColor: r.attend ? theme.colors.primary : theme.colors.muted }}>
              <p className="text-sm leading-relaxed" style={{ color: theme.colors.ink }}>{r.oneliner}</p>
              <div className="flex items-center gap-2 mt-2 text-[11px]" style={{ color: theme.colors.muted }}>
                <span>{r.attend ? t('attendCount', { n: r.count }) : t('declined')}</span>
                <span>·</span>
                <span>{timeAgo(r.created_at, t as any)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
