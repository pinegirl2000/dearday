'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Send, ThumbsUp, ThumbsDown, Users, Eye, EyeOff, RefreshCw, Check, X, Minus, Calendar, MapPin } from 'lucide-react';
import type { ShareStatus, ShareRecipient } from '@/lib/actions/shareStatus';

interface Props {
  data: ShareStatus;
}

type Filter = 'all' | 'attend' | 'decline' | 'pending';

/**
 * 응답 현황 공유 페이지 — 로그인 없이 열람하는 읽기 전용 화면.
 * 관리 화면의 통계 카드와 같은 계산/톤을 쓰되, 링크 복사·삭제 등 조작은 없음.
 */
export default function ShareStatusView({ data }: Props) {
  const t = useTranslations('ShareStatus');
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const { card, recipients } = data;

  const stats = useMemo(() => {
    const total = recipients.length;
    const read = recipients.filter((r) => !!r.read_at).length;
    const attending = recipients.filter((r) => r.rsvp_attend === true);
    const declined = recipients.filter((r) => r.rsvp_attend === false);
    const attendingTotal = attending.reduce((s, r) => s + (r.rsvp_count || 1), 0);
    const replies = attending.length + declined.length;
    const denom = Math.max(total, replies);
    const rate = denom > 0 ? Math.min(100, Math.round((replies / denom) * 100)) : 0;
    return {
      total, read,
      attendingRecords: attending.length, attendingTotal,
      declinedRecords: declined.length,
      pending: total - replies,
      replies, rate,
      attendPct: denom > 0 ? (attending.length / denom) * 100 : 0,
      declinePct: denom > 0 ? (declined.length / denom) * 100 : 0
    };
  }, [recipients]);

  const list = useMemo(() => {
    const sorted = [...recipients].sort((a, b) => {
      // 참석 → 불참 → 미응답, 그 안에서는 응답 시각 최신순, 미응답은 이름순
      const rank = (r: ShareRecipient) => (r.rsvp_attend === true ? 0 : r.rsvp_attend === false ? 1 : 2);
      const d = rank(a) - rank(b);
      if (d !== 0) return d;
      if (a.rsvp_created_at && b.rsvp_created_at) return b.rsvp_created_at.localeCompare(a.rsvp_created_at);
      return a.name.localeCompare(b.name, 'ko');
    });
    if (filter === 'attend') return sorted.filter((r) => r.rsvp_attend === true);
    if (filter === 'decline') return sorted.filter((r) => r.rsvp_attend === false);
    if (filter === 'pending') return sorted.filter((r) => r.rsvp_attend === null);
    return sorted;
  }, [recipients, filter]);

  const fmtDate = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const filterBtn = (key: Filter, label: string, n: number) => (
    <button
      type="button"
      onClick={() => setFilter(key)}
      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
        filter === key
          ? 'bg-hydrangea-600 text-white border-hydrangea-600'
          : 'bg-white text-hydrangea-600 border-hydrangea-200 hover:bg-hydrangea-50'
      }`}
    >
      {label} <span className="opacity-70">{n}</span>
    </button>
  );

  return (
    <main className="min-h-screen bg-hydrangea-50 px-4 py-6">
      <div className="max-w-md mx-auto space-y-4">
        {/* 헤더 */}
        <header className="bg-white rounded-2xl border border-hydrangea-100 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-hydrangea-400 uppercase tracking-wide">{t('title')}</div>
              <h1 className="text-lg font-bold text-hydrangea-800 leading-snug break-words">{card.title}</h1>
            </div>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-hydrangea-200 text-[11px] text-hydrangea-600 hover:bg-hydrangea-50 active:scale-95 transition"
              title={t('refresh')}
            >
              <RefreshCw className="w-3.5 h-3.5" /> {t('refresh')}
            </button>
          </div>
          <div className="mt-2 space-y-0.5 text-[11px] text-hydrangea-500">
            {card.event_date && (
              <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {t('eventDate')}: {fmtDate(card.event_date)}</div>
            )}
            {card.event_place && (
              <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {t('place')}: {card.event_place}</div>
            )}
            {card.rsvp_deadline && (
              <div className="flex items-center gap-1"><Send className="w-3 h-3" /> {t('deadline')}: {fmtDate(card.rsvp_deadline)}</div>
            )}
          </div>
          <p className="mt-2 text-[10px] text-hydrangea-400">{t('readOnly')}</p>
        </header>

        {card.expired && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-800">{t('expired')}</div>
        )}

        {/* 통계 */}
        <section className="rounded-2xl border border-hydrangea-100 bg-white p-3 space-y-3 shadow-sm">
          <div className="flex items-baseline gap-2">
            <h2 className="text-[11px] font-bold text-hydrangea-700 uppercase tracking-wide">{t('title')}</h2>
            <span className="text-[10px] text-hydrangea-400">
              {t('asOf', { date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) })}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-gradient-to-br from-hydrangea-50 to-hydrangea-100 border border-hydrangea-200 p-3 shadow-sm relative overflow-hidden">
              <Send className="absolute -bottom-2 -right-2 w-12 h-12 text-hydrangea-300/40" strokeWidth={1.5} />
              <div className="relative">
                <div className="text-[10px] font-semibold text-hydrangea-500 mb-0.5">{t('totalSent')}</div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-2xl font-extrabold leading-none text-hydrangea-700">{stats.total}</span>
                  <span className="text-[10px] text-hydrangea-500">{t('unit')}</span>
                </div>
                <div className="mt-1">
                  <div className="text-[10px] inline-flex items-center gap-1 bg-hydrangea-500 text-white px-1.5 py-0.5 rounded-full font-semibold">
                    <Eye className="w-2.5 h-2.5" /> {t('readCount', { n: stats.read })}
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 p-3 shadow-sm relative overflow-hidden">
              <ThumbsUp className="absolute -bottom-2 -right-2 w-12 h-12 text-emerald-300/40" strokeWidth={1.5} />
              <div className="relative">
                <div className="text-[10px] font-semibold text-emerald-600 mb-0.5">{t('attending')}</div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-2xl font-extrabold leading-none text-emerald-700">{stats.attendingRecords}</span>
                  <span className="text-[10px] text-emerald-600">{t('unit')}</span>
                </div>
                <div className="text-[10px] mt-1 inline-flex items-center gap-1 bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-semibold">
                  <Users className="w-2.5 h-2.5" /> {t('totalPeople', { n: stats.attendingTotal })}
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 p-3 shadow-sm relative overflow-hidden">
              <ThumbsDown className="absolute -bottom-2 -right-2 w-12 h-12 text-rose-300/40" strokeWidth={1.5} />
              <div className="relative">
                <div className="text-[10px] font-semibold text-rose-600 mb-0.5">{t('declined')}</div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-2xl font-extrabold leading-none text-rose-700">{stats.declinedRecords}</span>
                  <span className="text-[10px] text-rose-600">{t('unit')}</span>
                </div>
              </div>
            </div>
          </div>
          {stats.total > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-hydrangea-600">{t('responseRate')}</span>
                <span className="text-[11px] font-bold text-hydrangea-700">
                  {t('replyVsSend', { replies: stats.replies, total: stats.total })}
                  <span className="text-hydrangea-400 font-medium ml-1">({stats.rate}%)</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-hydrangea-100 overflow-hidden flex">
                {stats.attendingRecords > 0 && <div className="bg-emerald-500 h-full" style={{ width: `${stats.attendPct}%` }} />}
                {stats.declinedRecords > 0 && <div className="bg-rose-400 h-full" style={{ width: `${stats.declinePct}%` }} />}
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[9px] text-hydrangea-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {t('attending')}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400" /> {t('declined')}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-hydrangea-100 border border-hydrangea-200" /> {t('pending')}</span>
              </div>
            </div>
          )}
        </section>

        {/* 명단 */}
        <section className="rounded-2xl border border-hydrangea-100 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <h2 className="text-[11px] font-bold text-hydrangea-700 uppercase tracking-wide">{t('listTitle')}</h2>
            <div className="flex gap-1 flex-wrap">
              {filterBtn('all', t('all'), stats.total)}
              {filterBtn('attend', t('attending'), stats.attendingRecords)}
              {filterBtn('decline', t('declined'), stats.declinedRecords)}
              {filterBtn('pending', t('pending'), stats.pending)}
            </div>
          </div>
          <ul className="divide-y divide-hydrangea-50">
            {list.map((r) => {
              const status = r.rsvp_attend;
              const companions = (r.rsvp_attendee_names || []).filter((n) => n && n.trim() && n.trim() !== r.name.trim());
              return (
                <li key={r.id} className="py-2.5 flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[13px] font-semibold text-hydrangea-800 break-words">{r.name}</span>
                      {r.group_name && <span className="text-[10px] text-hydrangea-400">{r.group_name}</span>}
                      <span
                        className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full border ${
                          r.read_at ? 'text-hydrangea-600 border-hydrangea-200 bg-hydrangea-50' : 'text-gray-400 border-gray-200 bg-gray-50'
                        }`}
                        title={r.read_at ? fmtDate(r.read_at) : undefined}
                      >
                        {r.read_at ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                        {r.read_at ? t('read') : t('unread')}
                      </span>
                    </div>
                    {status === true && companions.length > 0 && (
                      <div className="text-[11px] text-emerald-700/80 mt-0.5">{t('companions', { names: companions.join(', ') })}</div>
                    )}
                    {r.rsvp_oneliner && (
                      <div className="text-[11px] text-hydrangea-500 mt-0.5 italic">“{r.rsvp_oneliner}”</div>
                    )}
                  </div>
                  <div className="shrink-0">
                    {status === true && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check className="w-3 h-3" /> {t('attending')}
                        <span className="ml-0.5 px-1.5 rounded-full bg-emerald-600 text-white text-[10px]">{r.rsvp_count || 1}</span>
                      </span>
                    )}
                    {status === false && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        <X className="w-3 h-3" /> {t('declined')}
                      </span>
                    )}
                    {status === null && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-gray-50 text-gray-400 border border-gray-200">
                        <Minus className="w-3 h-3" /> {t('pending')}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
            {list.length === 0 && (
              <li className="py-6 text-center text-[12px] text-hydrangea-400">—</li>
            )}
          </ul>
        </section>

        <footer className="text-center text-[10px] text-hydrangea-400 pb-4">{t('poweredBy')}</footer>
      </div>
    </main>
  );
}
