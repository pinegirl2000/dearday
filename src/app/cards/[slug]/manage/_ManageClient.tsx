'use client';

import { useState, useEffect, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Trash2, Plus, Eye, Users, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { Button, Sheet, Textarea } from '@/components/ui';
import { listRecipients, bulkAddRecipients, deleteRecipient } from '@/lib/actions/recipients';

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
  rsvp_created_at: string | null;
}

export default function ManageClient({ slug, cardTitle }: Props) {
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
    if (!t) {
      setError('이 초대장의 작성자가 아닙니다. 작성한 기기에서 접속해주세요.');
      setLoading(false);
      return;
    }
    setOwnerToken(t);
    refresh(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = async (token: string) => {
    setLoading(true);
    const res = await listRecipients(slug, token);
    if (!res.ok) {
      setError(res.error);
    } else {
      setRecipients(res.recipients);
      setError(null);
    }
    setLoading(false);
  };

  const handleBulkAdd = () => {
    if (!ownerToken) return;
    const names = bulkText.split('\n').map((n) => n.trim()).filter((n) => n.length > 0);
    if (names.length === 0) {
      toast.error('이름을 입력하세요');
      return;
    }
    startTransition(async () => {
      const res = await bulkAddRecipients(slug, ownerToken, names);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`${res.count}명 추가됨`);
      setBulkText('');
      setSheetOpen(false);
      refresh(ownerToken);
    });
  };

  const handleDelete = (id: string) => {
    if (!ownerToken) return;
    if (!confirm('정말 삭제하시겠습니까?')) return;
    startTransition(async () => {
      await deleteRecipient(slug, ownerToken, id);
      refresh(ownerToken);
    });
  };

  const copyLink = async (num: string) => {
    const url = `${origin}/i/${slug}/${num}`;
    await navigator.clipboard.writeText(url);
    setCopiedNum(num);
    toast.success('링크가 복사되었어요');
    setTimeout(() => setCopiedNum(null), 1500);
  };

  if (error) {
    return (
      <PageContainer>
        <MobileHeader title="Manage Recipients" back />
        <div className="text-center py-20">
          <p className="text-hydrangea-400 mb-4">{error}</p>
          <a href={`/i/${slug}`} className="text-hydrangea-500 underline text-sm">초대장 보기</a>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer noPadding>
      <MobileHeader title="Manage Recipients" back />
      <div className="px-5 pt-3">
        <div className="text-xs text-hydrangea-400 mb-1">초대장</div>
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

        <div className="flex items-center gap-2 text-sm font-semibold text-hydrangea-700 mb-3">
          <Users className="w-4 h-4" /> Recipients {recipients.length}
        </div>

        {loading ? (
          <p className="text-center py-12 text-hydrangea-300">로딩 중...</p>
        ) : recipients.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-hydrangea-100 p-10 text-center">
            <p className="text-sm text-hydrangea-400 mb-4">수신자를 등록하면<br />각자 이름이 들어간 링크가 생성됩니다</p>
            <Button onClick={() => setSheetOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" /> 처음 등록하기
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-hydrangea-100 bg-white overflow-hidden pb-1 mb-12">
            <div className="grid grid-cols-[32px_80px_1fr_56px_56px_24px] items-center gap-2 px-3 py-2 border-b border-hydrangea-100 bg-hydrangea-50/40 text-[10px] font-semibold text-hydrangea-500 uppercase tracking-wider">
              <div>#</div>
              <div>Name</div>
              <div>Link</div>
              <div className="text-center">RSVP</div>
              <div className="text-center">Guests</div>
              <div></div>
            </div>
            <AnimatePresence>
              {recipients.map((r) => {
                const link = `${origin}/i/${slug}/${r.num}`;
                const copied = copiedNum === r.num;
                const expanded = expandedNames === r.id;
                const hasNames = !!r.rsvp_attendee_names && r.rsvp_attendee_names.length > 0;
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
                      <span className="text-[10px] font-semibold text-hydrangea-500 bg-hydrangea-100 px-1.5 py-0.5 rounded text-center">{r.num}</span>
                      <span className="font-medium text-hydrangea-700 truncate">{r.name}</span>
                      <button
                        onClick={() => copyLink(r.num)}
                        className={`min-w-0 flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono text-left transition ${
                          copied ? 'bg-green-50 text-green-700' : 'text-hydrangea-500 hover:bg-hydrangea-50 active:scale-95'
                        }`}
                        title={copied ? 'Copied!' : 'Copy link'}
                      >
                        {copied ? <Check className="w-3 h-3 flex-shrink-0" /> : <Copy className="w-3 h-3 flex-shrink-0" />}
                        <span className="truncate">{link}</span>
                      </button>
                      <span className="text-[11px] text-hydrangea-500 text-center">{fmtDate(r.rsvp_created_at)}</span>
                      <button
                        type="button"
                        onClick={() => hasNames && setExpandedNames(expanded ? null : r.id)}
                        disabled={!hasNames && r.rsvp_count === null}
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
                    {expanded && hasNames && (
                      <div className="px-3 pb-3 -mt-1">
                        <div className="bg-hydrangea-50 rounded-lg p-2 text-xs text-hydrangea-700">
                          {r.rsvp_attendee_names!.join(', ')}
                        </div>
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
          const attending = attendingRows.reduce((s, r) => s + (r.rsvp_count || 0), 0);
          const adults = attendingRows.reduce((s, r) => s + (r.rsvp_adult_count || 0), 0);
          const children = attendingRows.reduce((s, r) => s + (r.rsvp_child_count || 0), 0);
          const declined = recipients.filter((r) => r.rsvp_attend === false).length;
          const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          return (
            <div className="rounded-2xl border border-hydrangea-100 bg-hydrangea-50/40 p-4 mb-12">
              <div className="text-[11px] text-hydrangea-400 mb-3">As of {today} · Total {total}</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 rounded-lg bg-white/70">
                  <span className="font-semibold text-green-700">Attending {attending}</span>
                  <span className="text-xs text-hydrangea-500">Adult: {adults} / Child: {children}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white/70">
                  <span className="font-semibold text-red-600">Declined {declined}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title="수신자 일괄 등록" description="한 줄에 한 명씩 입력하세요">
        <Textarea
          rows={10}
          placeholder={'홍길동\n김철수\n이영희\n박민수'}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          className="text-base"
        />
        <p className="text-xs text-hydrangea-400 mt-2 mb-4">
          {bulkText.split('\n').filter((n) => n.trim()).length}명 입력됨
        </p>
        <Button onClick={handleBulkAdd} disabled={pending} full size="lg">
          {pending ? '등록 중...' : '등록하기'}
        </Button>
      </Sheet>
    </PageContainer>
  );
}
