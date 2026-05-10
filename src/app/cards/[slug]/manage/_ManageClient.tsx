'use client';

import { useState, useEffect, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Trash2, Plus, Eye, Users, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { PageContainer } from '@/components/layout/PageContainer';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { Button, Sheet, Textarea } from '@/components/ui';
import { listRecipients, bulkAddRecipients, deleteRecipient, deleteCard } from '@/lib/actions/recipients';
import { useRouter } from 'next/navigation';
import { Trash } from 'lucide-react';

interface Props {
  slug: string;
  cardTitle: string;
  cardId: string;
}

interface Recipient {
  id: string;
  num: string;
  name: string;
  created_at: string;
  rsvp_attend: boolean | null;
  rsvp_count: number | null;
  rsvp_adult_count: number | null;
  rsvp_child_count: number | null;
  rsvp_attendee_names: string[] | null;
  rsvp_oneliner: string | null;
  rsvp_created_at: string | null;
}

export default function ManageClient({ slug, cardTitle }: Props) {
  const t = useTranslations('Manage');
  const [ownerToken, setOwnerToken] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [pending, startTransition] = useTransition();
  const [copiedNum, setCopiedNum] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');
  const [expandedNames, setExpandedNames] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'num' | 'name' | 'attend'>('recent');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingCard, setDeletingCard] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showAttendingList, setShowAttendingList] = useState(false);
  const [showDeclinedList, setShowDeclinedList] = useState(false);
  const [showPendingList, setShowPendingList] = useState(false);
  const router = useRouter();

  const handleDeleteCard = async () => {
    setDeletingCard(true);
    const res = await deleteCard(slug, ownerToken);
    setDeletingCard(false);
    if (!res.ok) {
      toast.error(res.error || 'Delete failed');
      return;
    }
    toast.success('Invitation deleted');
    setDeleteOpen(false);
    router.push('/cards');
  };

  const fmtDate = (iso: string | null) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return '—'; }
  };

  useEffect(() => {
    const t = localStorage.getItem(`dearday:owner:${slug}`);
    setOrigin(window.location.origin);
    setOwnerToken(t); // null이어도 진행 — 서버가 세션 사용자로 검증
    refresh(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = async (token: string | null) => {
    setLoading(true);
    const res = await listRecipients(slug, token);
    if (!res.ok) {
      setError('You are not the author of this invitation, or you are not signed in.');
    } else {
      setRecipients(res.recipients);
      setError(null);
    }
    setLoading(false);
  };

  const handleBulkAdd = () => {
    const names = bulkText.split('\n').map((n) => n.trim()).filter((n) => n.length > 0);
    if (names.length === 0) {
      toast.error(t('nameRequired'));
      return;
    }
    startTransition(async () => {
      const res = await bulkAddRecipients(slug, ownerToken, names);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(t('addedCount', { n: res.count }));
      setBulkText('');
      setSheetOpen(false);
      refresh(ownerToken);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete?')) return;
    startTransition(async () => {
      await deleteRecipient(slug, ownerToken, id);
      refresh(ownerToken);
    });
  };

  const copyLink = async (num: string) => {
    const url = `${origin}/i/${slug}/${num}?v=4`;
    await navigator.clipboard.writeText(url);
    setCopiedNum(num);
    toast.success(t('linkCopied'));
    setTimeout(() => setCopiedNum(null), 1500);
  };

  if (error) {
    return (
      <PageContainer>
        <MobileHeader title="Manage Recipients" back />
        <div className="text-center py-20">
          <p className="text-hydrangea-400 mb-4">{error}</p>
          <a href={`/i/${slug}`} className="text-hydrangea-500 underline text-sm">{t('viewInvitation')}</a>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer noPadding>
      <MobileHeader title="Manage Recipients" back />
      <div className="px-5 pt-3">
        <div className="text-xs text-hydrangea-400 mb-1">{t('invitationLabelHeader')}</div>
        <h1 className="text-lg font-semibold text-hydrangea-700 mb-3 truncate">{cardTitle}</h1>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-hydrangea-500 text-white text-xs font-medium active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Bulk add
          </button>
          <a
            href={`/i/${slug}`}
            className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white border border-hydrangea-200 text-hydrangea-700 text-xs font-medium active:scale-95 transition"
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </a>
          <a
            href={`/cards/${slug}/edit`}
            className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white border border-hydrangea-200 text-hydrangea-700 text-xs font-medium active:scale-95 transition"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </a>
        </div>

        <div className="flex items-center gap-2 text-sm font-semibold text-hydrangea-700 mb-2">
          <Users className="w-4 h-4" /> Recipients {recipients.length}
        </div>
        {recipients.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {([
              ['recent', 'Recent reply'],
              ['num', 'By number'],
              ['name', 'By name'],
              ['attend', 'By attendance']
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSortBy(key)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition ${
                  sortBy === key ? 'bg-hydrangea-500 text-white' : 'bg-hydrangea-50 text-hydrangea-600 hover:bg-hydrangea-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-center py-12 text-hydrangea-300">{t('loading')}</p>
        ) : recipients.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-hydrangea-100 p-10 text-center">
            <p className="text-sm text-hydrangea-400 mb-4">{t('emptyHintLine1')}<br />{t('emptyHintLine2')}</p>
            <Button onClick={() => setSheetOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" /> {t('firstAdd')}
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-hydrangea-100 bg-white overflow-hidden pb-1 mb-12">
            <div className="grid grid-cols-[32px_80px_1fr_56px_56px_24px] items-center gap-2 px-3 py-2 border-b border-hydrangea-100 bg-hydrangea-50/40 text-[10px] font-semibold text-hydrangea-500 uppercase tracking-wider">
              <div>#</div>
              <div>Name</div>
              <div>Link / Comment</div>
              <div className="text-center">RSVP</div>
              <div className="text-center">Guests</div>
              <div></div>
            </div>
            <AnimatePresence>
              {[...recipients].sort((a, b) => {
                if (sortBy === 'name') return a.name.localeCompare(b.name);
                if (sortBy === 'num') return a.num.localeCompare(b.num);
                if (sortBy === 'attend') {
                  // 참석(true) > 미응답(null) > 불참(false), 동률이면 num 오름차순
                  const rank = (v: boolean | null) => (v === true ? 0 : v === null ? 1 : 2);
                  const r = rank(a.rsvp_attend) - rank(b.rsvp_attend);
                  return r !== 0 ? r : a.num.localeCompare(b.num);
                }
                // recent: 답변 시각 내림차순, 미응답은 맨 뒤
                const at = a.rsvp_created_at ? new Date(a.rsvp_created_at).getTime() : -1;
                const bt = b.rsvp_created_at ? new Date(b.rsvp_created_at).getTime() : -1;
                if (at === -1 && bt === -1) return a.num.localeCompare(b.num);
                if (at === -1) return 1;
                if (bt === -1) return -1;
                return bt - at;
              }).map((r, idx) => {
                const link = `${origin}/i/${slug}/${r.num}?v=4`;
                const copied = copiedNum === r.num;
                const expanded = expandedNames === r.id;
                const hasNames = !!r.rsvp_attendee_names && r.rsvp_attendee_names.length > 0;
                const hasOneliner = !!r.rsvp_oneliner && r.rsvp_oneliner.trim().length > 0;
                const expandable = hasNames || hasOneliner;
                const declined = r.rsvp_attend === false;
                return (
                  <motion.div
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="border-b border-hydrangea-100/60 last:border-b-0"
                  >
                    <div className="grid grid-cols-[32px_80px_1fr_56px_56px_24px] items-center gap-2 px-3 py-2.5 text-sm">
                      <span className="text-[11px] font-semibold text-hydrangea-500 bg-hydrangea-100 px-1.5 py-0.5 rounded text-center">{idx + 1}</span>
                      <span className="font-medium text-hydrangea-700 truncate">{r.name}</span>
                      <div className="min-w-0 flex flex-col gap-0.5">
                        <button
                          onClick={() => copyLink(r.num)}
                          className={`min-w-0 flex items-center gap-1.5 px-2.5 py-2 rounded text-[11px] font-mono text-left transition min-h-[40px] ${
                            copied ? 'bg-green-50 text-green-700' : 'text-hydrangea-500 hover:bg-hydrangea-50 active:scale-95'
                          }`}
                          title={copied ? 'Copied!' : 'Copy link'}
                        >
                          {copied ? <Check className="w-4 h-4 flex-shrink-0" /> : <Copy className="w-4 h-4 flex-shrink-0" />}
                          <span className="truncate">{link}</span>
                        </button>
                        {hasOneliner && (
                          <div className="px-2 text-[11px] text-hydrangea-600 italic truncate" title={r.rsvp_oneliner!}>
                            "{r.rsvp_oneliner}"
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-hydrangea-500 text-center">{fmtDate(r.rsvp_created_at)}</span>
                      <button
                        type="button"
                        onClick={() => expandable && setExpandedNames(expanded ? null : r.id)}
                        disabled={!expandable && r.rsvp_count === null}
                        className={`text-xs font-semibold text-center px-2 py-1 rounded transition ${
                          declined ? 'text-red-500' :
                          r.rsvp_count ? 'text-hydrangea-700 hover:bg-hydrangea-50 active:scale-95' :
                          'text-hydrangea-300'
                        }`}
                      >
                        {declined ? 'Decline' : r.rsvp_count ?? '—'}
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-hydrangea-300 hover:text-red-500 active:scale-90 transition flex items-center justify-center"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {expanded && expandable && (
                      <div className="px-3 pb-3 -mt-1 space-y-1.5">
                        {hasNames && (
                          <div className="bg-hydrangea-50 rounded-lg p-2 text-xs text-hydrangea-700">
                            <div className="text-[10px] uppercase tracking-wider text-hydrangea-400 mb-0.5">Attendees</div>
                            {r.rsvp_attendee_names!.join(', ')}
                          </div>
                        )}
                        {hasOneliner && (
                          <div className="bg-hydrangea-50 rounded-lg p-2 text-xs text-hydrangea-700 italic">
                            <div className="text-[10px] uppercase tracking-wider text-hydrangea-400 mb-0.5 not-italic">Reply</div>
                            "{r.rsvp_oneliner}"
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {!loading && recipients.length > 0 && (() => {
          const total = recipients.length;
          const attendingRows = recipients.filter((r) => r.rsvp_attend === true);
          const attendingGroups = attendingRows.length;
          const attendingPeople = attendingRows.reduce((s, r) => s + (r.rsvp_count || 0), 0);
          const adults = attendingRows.reduce((s, r) => s + (r.rsvp_adult_count || 0), 0);
          const children = attendingRows.reduce((s, r) => s + (r.rsvp_child_count || 0), 0);
          const declined = recipients.filter((r) => r.rsvp_attend === false).length;
          const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          const declinedRows = recipients.filter((r) => r.rsvp_attend === false);
          const pendingRows = recipients.filter((r) => r.rsvp_attend === null || r.rsvp_attend === undefined);
          return (
            <div className="rounded-2xl border border-hydrangea-100 bg-hydrangea-50/40 p-4 mb-12">
              <div className="text-[11px] text-hydrangea-400 mb-3">As of {today} · Total {total}</div>
              <div className="space-y-2 text-sm">
                <div className="rounded-lg bg-white/70 overflow-hidden">
                  <div className="flex items-center justify-between p-2">
                    <span className="font-semibold text-green-700">
                      Attending {attendingGroups} group{attendingGroups === 1 ? '' : 's'} <span className="text-xs font-normal text-green-600">- total {attendingPeople} {attendingPeople === 1 ? 'person' : 'people'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAttendingList((v) => !v)}
                      className="inline-flex items-center gap-0.5 text-green-700 active:scale-90 transition"
                      title={showAttendingList ? 'Hide list' : 'Show attending list'}
                      aria-label={showAttendingList ? 'Hide list' : 'Show attending list'}
                    >
                      <Users className="w-4 h-4" />
                      {showAttendingList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                  {showAttendingList && (
                    <div className="px-3 pb-2 text-xs text-hydrangea-700 border-t border-hydrangea-100/60 pt-2">
                      {(() => {
                        const names = attendingRows.flatMap((r) =>
                          (r.rsvp_attendee_names && r.rsvp_attendee_names.length > 0)
                            ? r.rsvp_attendee_names
                            : [r.name]
                        );
                        return names.length === 0
                          ? <span className="text-hydrangea-400">No attendees yet</span>
                          : names.join(', ');
                      })()}
                    </div>
                  )}
                </div>
                <div className="rounded-lg bg-white/70 overflow-hidden">
                  <div className="flex items-center justify-between p-2">
                    <span className="font-semibold text-red-600">Declined {declined}</span>
                    <button
                      type="button"
                      onClick={() => setShowDeclinedList((v) => !v)}
                      className="inline-flex items-center gap-0.5 text-red-600 active:scale-90 transition"
                      title={showDeclinedList ? 'Hide list' : 'Show declined list'}
                      aria-label={showDeclinedList ? 'Hide list' : 'Show declined list'}
                    >
                      <Users className="w-4 h-4" />
                      {showDeclinedList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                  {showDeclinedList && (
                    <div className="px-3 pb-2 text-xs text-hydrangea-700 border-t border-hydrangea-100/60 pt-2">
                      {declinedRows.length === 0
                        ? <span className="text-hydrangea-400">No declines yet</span>
                        : declinedRows.map((r) => r.name).join(', ')}
                    </div>
                  )}
                </div>
                <div className="rounded-lg bg-white/70 overflow-hidden">
                  <div className="flex items-center justify-between p-2">
                    <span className="font-semibold text-hydrangea-500">No response {pendingRows.length}</span>
                    <button
                      type="button"
                      onClick={() => setShowPendingList((v) => !v)}
                      className="inline-flex items-center gap-0.5 text-hydrangea-500 active:scale-90 transition"
                      title={showPendingList ? 'Hide list' : 'Show pending list'}
                      aria-label={showPendingList ? 'Hide list' : 'Show pending list'}
                    >
                      <Users className="w-4 h-4" />
                      {showPendingList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                  {showPendingList && (
                    <div className="px-3 pb-2 text-xs text-hydrangea-700 border-t border-hydrangea-100/60 pt-2">
                      {pendingRows.length === 0
                        ? <span className="text-hydrangea-400">All recipients have replied</span>
                        : pendingRows.map((r) => r.name).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Danger zone: 카드 + 데이터 모두 삭제 */}
        {!loading && !error && (
          <div className="mt-4 mb-12 rounded-2xl border border-red-200 bg-red-50/40 p-4">
            <p className="text-[11px] text-red-500 mb-3">
              Clicking the button below will permanently delete this invitation along with all recipients and RSVP data.
            </p>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold active:scale-95 transition"
            >
              <Trash className="w-4 h-4" />
              Delete this invitation and all data
            </button>
          </div>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => {
            if (!deletingCard) { setDeleteOpen(false); setDeleteConfirm(''); }
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 w-10 h-10 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <Trash className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-base font-semibold text-hydrangea-700 text-center mb-1.5">Are you sure you want to delete?</h3>
            <p className="text-xs text-hydrangea-500 text-center mb-3">
              "{cardTitle}" — this action cannot be undone. All recipients and RSVP responses will be removed.
            </p>
            <p className="text-xs text-hydrangea-600 text-center mb-2">
              Type <span className="font-mono font-semibold text-red-600">yes</span> in the box below to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="yes"
              autoFocus
              className="w-full px-3 py-2 mb-4 rounded-xl border border-hydrangea-200 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setDeleteOpen(false); setDeleteConfirm(''); }}
                disabled={deletingCard}
                className="flex-1 py-2.5 rounded-xl border border-hydrangea-200 text-sm text-hydrangea-700 font-medium active:scale-95 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCard}
                disabled={deletingCard || deleteConfirm !== 'yes'}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deletingCard ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title="Add recipients in bulk" description="One name per line">
        <Textarea
          rows={10}
          placeholder={"Mr. James Kim\nMs. Sarah Lee\nMdm. Helen Tan\nDr. Daniel Park\nEmma"}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          className="text-base"
        />
        <p className="text-xs text-hydrangea-400 mt-2 mb-4">
          {bulkText.split('\n').filter((n) => n.trim()).length} entered
        </p>
        <Button onClick={handleBulkAdd} disabled={pending} full size="lg">
          {pending ? 'Adding...' : 'Add recipients'}
        </Button>
      </Sheet>
    </PageContainer>
  );
}
