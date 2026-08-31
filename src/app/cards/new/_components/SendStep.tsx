'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Mail, Link as LinkIcon, Plus, Trash2, Send, Copy, Check, Calendar, Users, Download, ThumbsUp, ThumbsDown, TrendingUp } from 'lucide-react';
import {
  listRecipients,
  addRecipientsWithDetails,
  deleteRecipient,
  sendInvitationsToRecipients,
  updateRecipientName
} from '@/lib/actions/recipients';
import type { BaseCard } from '@/types/card';

interface Recipient {
  id: string;
  num: string;
  name: string;
  email: string | null;
  delivery_method: string | null;
  sent_at: string | null;
  sent_status: string | null;
  read_at: string | null;
  created_at: string | null;
  rsvp_attend: boolean | null;
  rsvp_count: number | null;
  rsvp_attendee_names: string[] | null;
  rsvp_oneliner: string | null;
  rsvp_created_at: string | null;
}

interface Props {
  slug: string;
  ownerToken: string | null;
  /** RSVP 설정 표시용 (카드 데이터 — 옵션) */
  card?: Partial<BaseCard> & { title?: string };
}

type Mode = 'email' | 'link';
type AddMode = 'single' | 'bulk';

export default function SendStep({ slug, ownerToken, card }: Props) {
  const t = useTranslations('Send');
  const [mode, setMode] = useState<Mode>('link');
  const [addMode, setAddMode] = useState<AddMode>('single');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [pending, startTransition] = useTransition();

  // 단일 입력
  const [singleName, setSingleName] = useState('');
  const [singleEmail, setSingleEmail] = useState('');

  // 벌크 입력
  const [bulkText, setBulkText] = useState('');

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent_response' | 'recent_input' | 'name'>('recent_response');
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  const handleSaveName = (id: string, original: string) => {
    const next = editingNameValue.trim();
    setEditingNameId(null);
    if (!next || next === original) return;
    // 낙관적 업데이트
    setRecipients((rs) => rs.map((r) => (r.id === id ? { ...r, name: next } : r)));
    startTransition(async () => {
      const res = await updateRecipientName(slug, ownerToken, id, next);
      if (!res.ok) {
        toast.error(res.error || t('nameUpdateFailed'));
        // rollback
        setRecipients((rs) => rs.map((r) => (r.id === id ? { ...r, name: original } : r)));
        return;
      }
      toast.success(t('nameUpdated'));
    });
  };

  // 초기 로드 + 갱신
  const load = () => {
    if (!slug) return;
    listRecipients(slug, ownerToken).then((res) => {
      if (res.ok) setRecipients(res.recipients as Recipient[]);
    });
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [slug, ownerToken]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const linkFor = (num: string) => `${baseUrl}/i/${slug}/${num}`;

  // Smart copy 메시지 프리셋 — 사용자가 선택한 톤이 모든 copy 액션에 적용됨
  const SMART_PRESETS: Array<{ id: string; label: string; build: (name: string) => string }> = [
    { id: 'none',      label: t('smartLinkOnly'),       build: ()    => '' },
    { id: 'mom',       label: 'Mom 💝',                  build: ()    => 'Mom, I made this special card for you! ❤️' },
    { id: 'dad',       label: 'Dad 💙',                  build: ()    => 'Dad, I made this special card for you! ❤️' },
    { id: 'teacher',   label: 'Teacher 🌸',              build: ()    => 'Teacher, thank you — I made this card for you. 🌸' },
    { id: 'congrats',  label: 'Congrats 🎓',             build: ()    => 'Congrats! Here\'s a little card to celebrate. 🎓' },
    { id: 'birthday',  label: 'Birthday 🎂',             build: (n)   => n ? `Happy Birthday, ${n}! Here's a card just for you. 🎂` : 'Happy Birthday! Here\'s a card just for you. 🎂' },
    { id: 'thanks',    label: 'Thanks 🙏',               build: (n)   => n ? `${n}, thank you — I made this card for you. 🙏` : 'Thank you — I made this card for you. 🙏' },
    { id: 'special',   label: 'Special card 💌',         build: (n)   => n ? `Hi ${n}, I made a special card just for you. 💌` : 'I made a special card just for you. 💌' }
  ];
  const [smartPresetId, setSmartPresetId] = useState<string>('none');
  const buildSmartShare = (recipientName: string, num: string) => {
    const preset = SMART_PRESETS.find((p) => p.id === smartPresetId) || SMART_PRESETS[0];
    const msg = preset.build(recipientName || '').trim();
    const link = linkFor(num);
    return msg ? `${msg}\n${link}` : link;
  };

  const handleAddSingle = () => {
    if (!singleName.trim()) { toast.error(t('nameRequired')); return; }
    if (mode === 'email' && !singleEmail.trim()) { toast.error(t('emailRequired')); return; }
    startTransition(async () => {
      const res = await addRecipientsWithDetails(slug, ownerToken,
        [{ name: singleName.trim(), email: mode === 'email' ? singleEmail.trim() : null }],
        mode
      );
      if (!res.ok) { toast.error(res.error); return; }
      toast.success(t('addedCount', { n: res.count }));
      setSingleName('');
      setSingleEmail('');
      load();
    });
  };

  const handleAddBulk = () => {
    const lines = bulkText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) { toast.error(t('emptyBulk')); return; }
    const items: Array<{ name: string; email?: string | null }> = lines.map((l) => {
      // 구분자 "/" — "이름/이메일" 또는 이름만
      const parts = l.split('/').map((p) => p.trim());
      return { name: parts[0], email: mode === 'email' ? (parts[1] || '') : null };
    });
    if (mode === 'email') {
      const missing = items.filter((it) => !it.email);
      if (missing.length > 0) {
        toast.error(t('emailMissing', { n: missing.length }));
        return;
      }
    }
    startTransition(async () => {
      const res = await addRecipientsWithDetails(slug, ownerToken, items, mode);
      if (!res.ok) { toast.error(res.error); return; }
      toast.success(t('addedCount', { n: res.count }));
      setBulkText('');
      load();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    startTransition(async () => {
      const res = await deleteRecipient(slug, ownerToken, id);
      if (!res.ok) { toast.error(res.error || t('deleteFailed')); return; }
      toast.success(t('deleted'));
      load();
    });
  };

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleCopy = async (num: string, id: string, name?: string) => {
    try {
      await navigator.clipboard.writeText(buildSmartShare(name || '', num));
      // 같은 항목 재클릭 시에도 시각 피드백이 다시 트리거되도록 잠깐 reset
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      setCopiedId(null);
      requestAnimationFrame(() => {
        setCopiedId(id);
        copyTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
      });
      toast.success(t('linkCopied'));
    } catch {
      toast.error(t('linkCopyFailed'));
    }
  };

  const handleSendOne = (id: string) => {
    setSendingId(id);
    startTransition(async () => {
      const res = await sendInvitationsToRecipients(slug, ownerToken, [id]);
      setSendingId(null);
      if (!res.ok) { toast.error(res.error); return; }
      if (res.failed > 0) {
        toast.error(t('sendFailed', { n: res.failed, failures: res.failures.join(', ') }));
      } else {
        toast.success(t('sentSuccess', { n: res.sent }));
      }
      load();
    });
  };

  const handleSendAllPending = () => {
    const pendingIds = recipients
      .filter((r) => r.delivery_method === 'email' && r.email && r.sent_status !== 'sent')
      .map((r) => r.id);
    if (pendingIds.length === 0) { toast.message(t('noPending')); return; }
    startTransition(async () => {
      const res = await sendInvitationsToRecipients(slug, ownerToken, pendingIds);
      if (!res.ok) { toast.error(res.error); return; }
      if (res.failed > 0) {
        toast.error(t('sentMixed', { ok: res.sent, fail: res.failed }));
      } else {
        toast.success(t('sentAll', { n: res.sent }));
      }
      load();
    });
  };

  const pendingEmailCount = recipients.filter(
    (r) => r.delivery_method === 'email' && r.email && r.sent_status !== 'sent'
  ).length;

  return (
    <div className="space-y-5 mt-2">
      {/* 발송 모드 선택 */}
      <div>
        <label className="block text-xs font-semibold text-hydrangea-700 mb-2">{t('modeLabel')}</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode('link')}
            className={`relative px-3 py-3 rounded-xl border-2 text-left transition active:scale-95 ${
              mode === 'link' ? 'border-hydrangea-500 bg-hydrangea-50' : 'border-hydrangea-100 bg-white'
            }`}
          >
            <LinkIcon className="w-4 h-4 text-hydrangea-500 mb-1" />
            <div className="text-xs font-semibold text-hydrangea-700">Link only</div>
            <div className="text-[10px] text-hydrangea-400 mt-0.5 leading-snug">
              {t('linkOnlyDesc')}
              <span className="inline-flex items-center gap-0.5 mx-0.5"><Copy className="inline w-2.5 h-2.5" /></span>
              {t('linkCopyHint')}
            </div>
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="relative px-3 py-3 rounded-xl border-2 text-left transition border-hydrangea-100 bg-hydrangea-50/40 opacity-60 cursor-not-allowed"
            title={t('comingSoon')}
          >
            <Mail className="w-4 h-4 text-hydrangea-300 mb-1" />
            <div className="text-xs font-semibold text-hydrangea-400 flex items-center gap-1.5">
              Email
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-hydrangea-200 text-hydrangea-600">{t('comingSoon')}</span>
            </div>
            <div className="text-[10px] text-hydrangea-300 mt-0.5">{t('emailDesc')}</div>
          </button>
        </div>
      </div>

      {/* 추가 방식 선택 */}
      <div>
        <label className="block text-xs font-semibold text-hydrangea-700 mb-2">{t('addLabel')}</label>
        {/* Segmented control — 한 줄 전체 폭, 두 모드 모두 확실히 보이게 */}
        <div className="flex p-1 rounded-xl bg-hydrangea-100/70 border border-hydrangea-200 mb-2">
          <button
            type="button"
            onClick={() => setAddMode('single')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition active:scale-95 ${
              addMode === 'single'
                ? 'bg-white text-hydrangea-700 shadow-sm'
                : 'text-hydrangea-500 hover:text-hydrangea-700'
            }`}
          >
            {t('addOne')}
          </button>
          <button
            type="button"
            onClick={() => setAddMode('bulk')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition active:scale-95 ${
              addMode === 'bulk'
                ? 'bg-white text-hydrangea-700 shadow-sm'
                : 'text-hydrangea-500 hover:text-hydrangea-700'
            }`}
          >
            {t('addBulk')}
          </button>
        </div>

        {addMode === 'single' ? (
          <div className="space-y-2">
            <input
              type="text"
              placeholder={t('namePlaceholder')}
              value={singleName}
              onChange={(e) => setSingleName(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl border border-hydrangea-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-hydrangea-300"
            />
            {mode === 'email' && (
              <input
                type="email"
                placeholder={t('emailPlaceholder')}
                value={singleEmail}
                onChange={(e) => setSingleEmail(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-hydrangea-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-hydrangea-300"
              />
            )}
            <button
              type="button"
              onClick={handleAddSingle}
              disabled={pending}
              className="w-full min-h-[44px] rounded-xl bg-hydrangea-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> {t('addButton')}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              placeholder={mode === 'email' ? t('bulkEmailPlaceholder') : t('bulkNamePlaceholder')}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={6}
              className="w-full px-3 py-2.5 rounded-xl border border-hydrangea-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-hydrangea-300 font-mono"
            />
            <button
              type="button"
              onClick={handleAddBulk}
              disabled={pending}
              className="w-full min-h-[44px] rounded-xl bg-hydrangea-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> {t('bulkButton')}
            </button>
          </div>
        )}
      </div>

      {/* RSVP 설정 / 마감 정보 — card 정보 있을 때만 */}
      {card?.rsvp_enabled && (() => {
        const deadline = card.rsvp_deadline ? new Date(card.rsvp_deadline) : null;
        const validDeadline = deadline && !isNaN(deadline.getTime()) ? deadline : null;
        const now = new Date();
        const daysLeft = validDeadline
          ? Math.ceil((validDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null;
        const expired = daysLeft !== null && daysLeft < 0;
        const maxPerCard = card.rsvp_max_per_card || 1;
        const allowGroup = maxPerCard > 1;
        const collectNames = !!card.rsvp_collect_names;
        return (
          <div className="rounded-xl border border-hydrangea-200 bg-hydrangea-50/50 p-3 space-y-2 text-[11px]">
            {/* 마감일 */}
            {validDeadline && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-hydrangea-500 flex-shrink-0" />
                <span className="text-hydrangea-700 font-medium">{t('rsvpDeadline')}</span>
                <span className="text-hydrangea-500">
                  {validDeadline.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
                <span className={`ml-auto px-1.5 py-0.5 rounded-full font-bold ${
                  expired ? 'bg-rose-500 text-white'
                    : daysLeft! <= 3 ? 'bg-amber-500 text-white'
                    : 'bg-emerald-500 text-white'
                }`}>
                  {expired ? t('expired') : daysLeft === 0 ? t('today') : t('daysLeft', { n: daysLeft! })}
                </span>
              </div>
            )}
            {/* RSVP 옵션 */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Users className="w-3.5 h-3.5 text-hydrangea-500 flex-shrink-0" />
              <span className="text-hydrangea-700 font-medium">{t('options')}</span>
              <span className={`px-1.5 py-0.5 rounded-full font-semibold ${
                allowGroup ? 'bg-hydrangea-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {allowGroup ? t('guestMax', { n: maxPerCard }) : t('guestNone')}
              </span>
              {allowGroup && (
                <span className={`px-1.5 py-0.5 rounded-full font-semibold ${
                  collectNames ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {collectNames ? t('namesRequired') : t('namesNone')}
                </span>
              )}
            </div>
          </div>
        );
      })()}

      {/* 수신자 리스트 */}
      <div>
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <label className="block text-xs font-semibold text-hydrangea-700">
              {t('recipientsTitle')} ({recipients.length})
            </label>
            {recipients.length > 1 && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="text-[10px] px-1.5 py-0.5 rounded-md border border-hydrangea-200 bg-white text-hydrangea-600 font-medium focus:outline-none focus:ring-2 focus:ring-hydrangea-300"
              >
                <option value="recent_response">{t('sortRecentResponse')}</option>
                <option value="recent_input">{t('sortRecentInput')}</option>
                <option value="name">{t('sortName')}</option>
              </select>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {/* 참석자 명단 + 링크 텍스트 export */}
            {recipients.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const lines: string[] = [];
                  const titleRaw = (card?.title && card.title.trim()) || slug;
                  const cardTitle = `[${titleRaw}]`;
                  lines.push(t('exportTitleLine', { title: cardTitle }));
                  lines.push(t('exportCreated', { datetime: new Date().toLocaleString() }));
                  lines.push('');
                  const attending = recipients.filter((r) => r.rsvp_attend === true);
                  const declined = recipients.filter((r) => r.rsvp_attend === false);
                  const noResp = recipients.filter((r) => r.rsvp_attend === null);
                  const totalPeople = attending.reduce((sum, r) => sum + (r.rsvp_count || 1), 0);
                  lines.push(t('exportAttending', { records: attending.length, people: totalPeople }));
                  for (const r of attending) {
                    const cnt = r.rsvp_count || 1;
                    const names = r.rsvp_attendee_names && r.rsvp_attendee_names.length > 0
                      ? `: ${r.rsvp_attendee_names.join(', ')}`
                      : '';
                    lines.push(`- ${r.name} ${t('exportPersonCount', { n: cnt })}${names}${r.rsvp_oneliner ? ` — "${r.rsvp_oneliner}"` : ''} | ${linkFor(r.num)}`);
                  }
                  lines.push('');
                  lines.push(t('exportDeclined', { n: declined.length }));
                  for (const r of declined) {
                    lines.push(`- ${r.name}${r.rsvp_oneliner ? ` — "${r.rsvp_oneliner}"` : ''} | ${linkFor(r.num)}`);
                  }
                  lines.push('');
                  lines.push(t('exportNoResponse', { n: noResp.length }));
                  for (const r of noResp) {
                    lines.push(`- ${r.name} | ${linkFor(r.num)}`);
                  }
                  const text = lines.join('\n');
                  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = t('exportFileName', { title: cardTitle, date: new Date().toISOString().slice(0,10) });
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success(t('exportSuccess'));
                }}
                title={t('exportTitle')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-hydrangea-200 text-hydrangea-600 text-[11px] font-semibold hover:bg-hydrangea-50 active:scale-95 transition"
              >
                <Download className="w-3 h-3" /> {t('exportButton')}
              </button>
            )}
            {/* RSVP만 export — 링크 제외, 응답 정보만 */}
            {recipients.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const lines: string[] = [];
                  const titleRaw = (card?.title && card.title.trim()) || slug;
                  const cardTitle = `[${titleRaw}]`;
                  lines.push(t('exportTitleLine', { title: cardTitle }));
                  lines.push(t('exportCreated', { datetime: new Date().toLocaleString() }));
                  lines.push('');
                  const attending = recipients.filter((r) => r.rsvp_attend === true);
                  const declined = recipients.filter((r) => r.rsvp_attend === false);
                  const noResp = recipients.filter((r) => r.rsvp_attend === null);
                  const totalPeople = attending.reduce((sum, r) => sum + (r.rsvp_count || 1), 0);
                  lines.push(t('exportAttending', { records: attending.length, people: totalPeople }));
                  for (const r of attending) {
                    const cnt = r.rsvp_count || 1;
                    const names = r.rsvp_attendee_names && r.rsvp_attendee_names.length > 0
                      ? `: ${r.rsvp_attendee_names.join(', ')}`
                      : '';
                    lines.push(`- ${r.name} ${t('exportPersonCount', { n: cnt })}${names}${r.rsvp_oneliner ? ` — "${r.rsvp_oneliner}"` : ''}`);
                  }
                  lines.push('');
                  lines.push(t('exportDeclined', { n: declined.length }));
                  for (const r of declined) {
                    lines.push(`- ${r.name}${r.rsvp_oneliner ? ` — "${r.rsvp_oneliner}"` : ''}`);
                  }
                  lines.push('');
                  lines.push(t('exportNoResponse', { n: noResp.length }));
                  for (const r of noResp) {
                    lines.push(`- ${r.name}`);
                  }
                  const text = lines.join('\n');
                  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = t('exportFileName', { title: `${cardTitle}-rsvp`, date: new Date().toISOString().slice(0,10) });
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success(t('exportSuccess'));
                }}
                title={t('exportRsvpTitle')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-hydrangea-200 text-hydrangea-600 text-[11px] font-semibold hover:bg-hydrangea-50 active:scale-95 transition"
              >
                <Download className="w-3 h-3" /> {t('exportRsvpButton')}
              </button>
            )}
            {pendingEmailCount > 0 && (
              <button
                type="button"
                onClick={handleSendAllPending}
                disabled={pending}
                className="px-3 py-1.5 rounded-lg bg-hydrangea-500 text-white text-[11px] font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                <Send className="w-3 h-3" /> {t('sendAll', { n: pendingEmailCount })}
              </button>
            )}
          </div>
        </div>

        {/* Smart copy 메시지 프리셋 — copy 시 링크 앞에 메시지 자동 prepend */}
        {recipients.length > 0 && (
          <div className="mb-2 p-2 rounded-xl bg-hydrangea-50/60 border border-hydrangea-100">
            <div className="text-[10px] font-semibold text-hydrangea-700 mb-1.5 flex items-center gap-1">
              <Copy className="w-3 h-3" /> {t('smartCopyLabel')}
            </div>
            <div className="flex flex-wrap gap-1">
              {SMART_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSmartPresetId(p.id)}
                  className={`text-[10px] px-2 py-1 rounded-full transition active:scale-95 ${
                    smartPresetId === p.id
                      ? 'bg-hydrangea-500 text-white font-semibold'
                      : 'bg-white text-hydrangea-600 border border-hydrangea-200 hover:bg-hydrangea-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {recipients.length === 0 ? (
          <div className="text-center py-8 text-xs text-hydrangea-400 bg-hydrangea-50/40 rounded-xl">
            {t('noRecipients')}
          </div>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {[...recipients].sort((a, b) => {
              if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
              if (sortBy === 'recent_response') {
                const av = a.rsvp_created_at ? new Date(a.rsvp_created_at).getTime() : 0;
                const bv = b.rsvp_created_at ? new Date(b.rsvp_created_at).getTime() : 0;
                return bv - av; // 응답 있는 게 위, 최근 응답 우선
              }
              // recent_input: 최근 입력 순 (created_at DESC)
              const ai = a.created_at ? new Date(a.created_at).getTime() : 0;
              const bi = b.created_at ? new Date(b.created_at).getTime() : 0;
              return bi - ai;
            }).map((r) => (
              <div key={r.id} className="rounded-lg border border-hydrangea-100 bg-white">
              <div
                className="grid items-center gap-1.5 px-2 py-1.5 text-xs"
                style={{ gridTemplateColumns: 'minmax(60px,1fr) auto auto auto auto' }}
              >
                {/* col1: 이름 — 클릭하면 인라인 편집 */}
                <div className="min-w-0">
                  {editingNameId === r.id ? (
                    <input
                      type="text"
                      autoFocus
                      value={editingNameValue}
                      onChange={(e) => setEditingNameValue(e.target.value)}
                      onBlur={() => handleSaveName(r.id, r.name)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        } else if (e.key === 'Escape') {
                          setEditingNameId(null);
                        }
                      }}
                      className="w-full px-1 py-0.5 rounded border border-hydrangea-400 bg-white text-xs font-semibold text-hydrangea-700 focus:outline-none focus:ring-2 focus:ring-hydrangea-300"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNameId(r.id);
                        setEditingNameValue(r.name);
                      }}
                      title={t('editNameTitle')}
                      className="w-full text-left font-semibold text-hydrangea-700 truncate hover:text-hydrangea-500 hover:underline underline-offset-2 transition cursor-text"
                    >
                      {r.name}
                    </button>
                  )}
                </div>
                {/* col2: 링크복사 버튼 */}
                <button
                  type="button"
                  onClick={() => handleCopy(r.num, r.id, r.name)}
                  title={t('copyLink')}
                  className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition active:scale-95 ${
                    copiedId === r.id
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-hydrangea-50 text-hydrangea-600 border border-hydrangea-200 hover:bg-hydrangea-100'
                  }`}
                >
                  {copiedId === r.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{t('linkCopied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t('linkLabel')}</span>
                    </>
                  )}
                </button>
                {/* col3: 읽음/안읽음 */}
                {r.read_at ? (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-hydrangea-50 text-hydrangea-700 border border-hydrangea-200 text-[10px] font-semibold">
                    {t('read')}
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200 text-[10px]">
                    {t('unread')}
                  </span>
                )}
                {/* col4: RSVP 상태 + 인원수 — 참석은 클릭 시 attendee 이름 펼침 */}
                {r.rsvp_attend === true ? (
                  <button
                    type="button"
                    onClick={() => setExpandedId((cur) => (cur === r.id ? null : r.id))}
                    title={t('viewAttendees')}
                    className="inline-flex items-center justify-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold hover:bg-emerald-100 active:scale-95 transition cursor-pointer"
                  >
                    {t('attend')}
                    {r.rsvp_count && r.rsvp_count > 0 && (
                      <span className="ml-0.5 px-1 rounded bg-emerald-500 text-white">{r.rsvp_count}</span>
                    )}
                  </button>
                ) : r.rsvp_attend === false ? (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold">
                    {t('decline')}
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-400 border border-gray-200 text-[10px]">
                    {t('noResponse')}
                  </span>
                )}
                {/* col5: 액션 — 이메일 발송(있을 때) + 삭제 */}
                <div className="flex items-center gap-0.5">
                  {r.delivery_method === 'email' && r.email && (
                    <button
                      type="button"
                      onClick={() => handleSendOne(r.id)}
                      disabled={pending && sendingId === r.id}
                      title={r.sent_status === 'sent' ? t('resend') : t('sendEmail')}
                      className="p-1.5 rounded-md text-hydrangea-500 hover:bg-hydrangea-50 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    title={t('deleteAria')}
                    className="p-1.5 rounded-md text-red-400 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {/* 펼침 영역 — 참석자 이름 + 한줄 응답 (옵션) */}
              {expandedId === r.id && r.rsvp_attend === true && (
                <div className="px-3 pb-2 pt-0 border-t border-hydrangea-100/60 bg-emerald-50/30">
                  <div className="text-[10px] font-semibold text-emerald-700 mt-1.5 mb-1">
                    {t('attendees', { n: r.rsvp_count || 1 })}
                  </div>
                  {r.rsvp_attendee_names && r.rsvp_attendee_names.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {r.rsvp_attendee_names.map((n, i) => (
                        <span
                          key={i}
                          className="inline-block px-2 py-0.5 rounded-full bg-white text-emerald-700 border border-emerald-200 text-[10px] font-medium"
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-emerald-600/70">
                      {t('noIndividualNames')}
                    </div>
                  )}
                  {r.rsvp_oneliner && (
                    <div className="mt-1.5 text-[10px] text-emerald-700 italic">
                      💬 {r.rsvp_oneliner}
                    </div>
                  )}
                </div>
              )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 응답 통계 — 수신자 등록 페이지 하단에도 노출 (recipients에서 직접 계산) */}
      {recipients.length > 0 && (() => {
        const totalRecipients = recipients.length;
        const readRecipients = recipients.filter((r) => !!r.read_at).length;
        const attending = recipients.filter((r) => r.rsvp_attend === true);
        const declined = recipients.filter((r) => r.rsvp_attend === false);
        const attendingRecords = attending.length;
        const attendingTotal = attending.reduce((sum, r) => sum + (r.rsvp_count || 1), 0);
        const declinedRecords = declined.length;
        const totalReplies = attendingRecords + declinedRecords;
        const denom = Math.max(totalRecipients, totalReplies);
        const replyRate = denom > 0 ? Math.min(100, Math.round((totalReplies / denom) * 100)) : 0;
        const attendPct = denom > 0 ? (attendingRecords / denom) * 100 : 0;
        const declinePct = denom > 0 ? (declinedRecords / denom) * 100 : 0;
        return (
          <div className="rounded-xl border border-hydrangea-100 bg-hydrangea-50/30 p-3 space-y-3">
            <div className="flex items-baseline gap-2">
              <h3 className="text-[11px] font-bold text-hydrangea-700 uppercase tracking-wide flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> {t('statsTitle')}
              </h3>
              <span className="text-[10px] text-hydrangea-400">
                {t('asOf', { date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) })}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-gradient-to-br from-hydrangea-50 to-hydrangea-100 border border-hydrangea-200 p-3 shadow-sm relative overflow-hidden">
                <Send className="absolute -bottom-2 -right-2 w-12 h-12 text-hydrangea-300/40" strokeWidth={1.5} />
                <div className="relative">
                  <div className="text-[10px] font-semibold text-hydrangea-500 mb-0.5">{t('totalLinksSent')}</div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl font-extrabold leading-none text-hydrangea-700">{totalRecipients}</span>
                    <span className="text-[10px] text-hydrangea-500">{t('unit')}</span>
                  </div>
                  <div className="mt-1">
                    <div className="text-[10px] inline-flex items-center gap-1 bg-hydrangea-500 text-white px-1.5 py-0.5 rounded-full font-semibold">
                      👁 {t('readCount', { n: readRecipients })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 p-3 shadow-sm relative overflow-hidden">
                <ThumbsUp className="absolute -bottom-2 -right-2 w-12 h-12 text-emerald-300/40" strokeWidth={1.5} />
                <div className="relative">
                  <div className="text-[10px] font-semibold text-emerald-600 mb-0.5">{t('attendingLabel')}</div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl font-extrabold leading-none text-emerald-700">{attendingRecords}</span>
                    <span className="text-[10px] text-emerald-600">{t('unit')}</span>
                  </div>
                  <div className="text-[10px] mt-1 inline-flex items-center gap-1 bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-semibold">
                    <Users className="w-2.5 h-2.5" /> {t('totalPeople', { n: attendingTotal })}
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 p-3 shadow-sm relative overflow-hidden">
                <ThumbsDown className="absolute -bottom-2 -right-2 w-12 h-12 text-rose-300/40" strokeWidth={1.5} />
                <div className="relative">
                  <div className="text-[10px] font-semibold text-rose-600 mb-0.5">{t('declinedLabel')}</div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl font-extrabold leading-none text-rose-700">{declinedRecords}</span>
                    <span className="text-[10px] text-rose-600">{t('unit')}</span>
                  </div>
                </div>
              </div>
            </div>
            {totalRecipients > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold text-hydrangea-600">{t('responseRate')}</span>
                  <span className="text-[11px] font-bold text-hydrangea-700">
                    {t('replyVsSend', { replies: totalReplies, total: totalRecipients })}
                    <span className="text-hydrangea-400 font-medium ml-1">({replyRate}%)</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-hydrangea-100 overflow-hidden flex">
                  {attendingRecords > 0 && (
                    <div className="bg-emerald-500 h-full" style={{ width: `${attendPct}%` }} title={t('attendingLabel') + ' ' + attendingRecords} />
                  )}
                  {declinedRecords > 0 && (
                    <div className="bg-rose-400 h-full" style={{ width: `${declinePct}%` }} title={t('declinedLabel') + ' ' + declinedRecords} />
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[9px] text-hydrangea-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {t('attendingLabel')}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400" /> {t('declinedLabel')}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-hydrangea-100 border border-hydrangea-200" /> {t('noResponse')}</span>
                </div>
              </div>
            )}
          </div>
        );
      })()}

    </div>
  );
}
