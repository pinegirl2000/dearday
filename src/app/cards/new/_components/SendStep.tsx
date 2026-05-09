'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
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
        toast.error(res.error || '이름 수정 실패');
        // rollback
        setRecipients((rs) => rs.map((r) => (r.id === id ? { ...r, name: original } : r)));
        return;
      }
      toast.success('이름 수정됨');
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
  const linkFor = (num: string) => `${baseUrl}/i/${slug}/${num}?v=4`;

  const handleAddSingle = () => {
    if (!singleName.trim()) { toast.error('이름을 입력하세요'); return; }
    if (mode === 'email' && !singleEmail.trim()) { toast.error('이메일을 입력하세요'); return; }
    startTransition(async () => {
      const res = await addRecipientsWithDetails(slug, ownerToken,
        [{ name: singleName.trim(), email: mode === 'email' ? singleEmail.trim() : null }],
        mode
      );
      if (!res.ok) { toast.error(res.error); return; }
      toast.success(`${res.count}명 추가됨`);
      setSingleName('');
      setSingleEmail('');
      load();
    });
  };

  const handleAddBulk = () => {
    const lines = bulkText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) { toast.error('비어있습니다'); return; }
    const items: Array<{ name: string; email?: string | null }> = lines.map((l) => {
      // 구분자 "/" — "이름/이메일" 또는 이름만
      const parts = l.split('/').map((p) => p.trim());
      return { name: parts[0], email: mode === 'email' ? (parts[1] || '') : null };
    });
    if (mode === 'email') {
      const missing = items.filter((it) => !it.email);
      if (missing.length > 0) {
        toast.error(`이메일 누락 ${missing.length}건. 형식: "이름/이메일"`);
        return;
      }
    }
    startTransition(async () => {
      const res = await addRecipientsWithDetails(slug, ownerToken, items, mode);
      if (!res.ok) { toast.error(res.error); return; }
      toast.success(`${res.count}명 추가됨`);
      setBulkText('');
      load();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('이 수신자를 삭제하시겠어요?')) return;
    startTransition(async () => {
      const res = await deleteRecipient(slug, ownerToken, id);
      if (!res.ok) { toast.error(res.error || '삭제 실패'); return; }
      toast.success('삭제됨');
      load();
    });
  };

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleCopy = async (num: string, id: string) => {
    try {
      await navigator.clipboard.writeText(linkFor(num));
      // 같은 항목 재클릭 시에도 시각 피드백이 다시 트리거되도록 잠깐 reset
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      setCopiedId(null);
      requestAnimationFrame(() => {
        setCopiedId(id);
        copyTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
      });
      toast.success('링크 복사됨');
    } catch {
      toast.error('복사 실패');
    }
  };

  const handleSendOne = (id: string) => {
    setSendingId(id);
    startTransition(async () => {
      const res = await sendInvitationsToRecipients(slug, ownerToken, [id]);
      setSendingId(null);
      if (!res.ok) { toast.error(res.error); return; }
      if (res.failed > 0) {
        toast.error(`${res.failed}건 실패: ${res.failures.join(', ')}`);
      } else {
        toast.success(`${res.sent}건 발송 완료`);
      }
      load();
    });
  };

  const handleSendAllPending = () => {
    const pendingIds = recipients
      .filter((r) => r.delivery_method === 'email' && r.email && r.sent_status !== 'sent')
      .map((r) => r.id);
    if (pendingIds.length === 0) { toast.message('보낼 수신자가 없습니다'); return; }
    startTransition(async () => {
      const res = await sendInvitationsToRecipients(slug, ownerToken, pendingIds);
      if (!res.ok) { toast.error(res.error); return; }
      if (res.failed > 0) {
        toast.error(`${res.sent}건 성공 / ${res.failed}건 실패`);
      } else {
        toast.success(`${res.sent}건 모두 발송됨`);
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
        <label className="block text-xs font-semibold text-hydrangea-700 mb-2">발송 방법</label>
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
              개인 링크 생성 후 메신저를 이용해 직접 링크를 보내는 방식입니다.
              <span className="inline-flex items-center gap-0.5 mx-0.5"><Copy className="inline w-2.5 h-2.5" /></span>
              아이콘을 클릭하면 링크가 복사됩니다.
            </div>
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="relative px-3 py-3 rounded-xl border-2 text-left transition border-hydrangea-100 bg-hydrangea-50/40 opacity-60 cursor-not-allowed"
            title="준비중"
          >
            <Mail className="w-4 h-4 text-hydrangea-300 mb-1" />
            <div className="text-xs font-semibold text-hydrangea-400 flex items-center gap-1.5">
              Email
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-hydrangea-200 text-hydrangea-600">준비중</span>
            </div>
            <div className="text-[10px] text-hydrangea-300 mt-0.5">DearDay에서 직접 이메일 발송</div>
          </button>
        </div>
      </div>

      {/* 추가 방식 선택 */}
      <div>
        <label className="block text-xs font-semibold text-hydrangea-700 mb-2">수신자 추가</label>
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
            👤 한 명씩
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
            📋 한꺼번에 (Bulk)
          </button>
        </div>

        {addMode === 'single' ? (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="이름 (예: Ms. Sarah)"
              value={singleName}
              onChange={(e) => setSingleName(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl border border-hydrangea-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-hydrangea-300"
            />
            {mode === 'email' && (
              <input
                type="email"
                placeholder="이메일 (예: sarah@example.com)"
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
              <Plus className="w-4 h-4" /> 추가
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              placeholder={mode === 'email'
                ? '한 줄에 한 명씩 — "이름/이메일" 형식\n예:\nMs. Sarah/sarah@example.com\nMr. Daniel/daniel@example.com'
                : '한 줄에 한 명씩 (이름만)\n예:\nMs. Sarah\nMr. Daniel'}
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
              <Plus className="w-4 h-4" /> 일괄 추가
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
                <span className="text-hydrangea-700 font-medium">RSVP 마감</span>
                <span className="text-hydrangea-500">
                  {validDeadline.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
                <span className={`ml-auto px-1.5 py-0.5 rounded-full font-bold ${
                  expired ? 'bg-rose-500 text-white'
                    : daysLeft! <= 3 ? 'bg-amber-500 text-white'
                    : 'bg-emerald-500 text-white'
                }`}>
                  {expired ? '마감됨' : daysLeft === 0 ? '오늘 마감' : `${daysLeft}일 남음`}
                </span>
              </div>
            )}
            {/* RSVP 옵션 */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Users className="w-3.5 h-3.5 text-hydrangea-500 flex-shrink-0" />
              <span className="text-hydrangea-700 font-medium">옵션</span>
              <span className={`px-1.5 py-0.5 rounded-full font-semibold ${
                allowGroup ? 'bg-hydrangea-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                동반자 {allowGroup ? `최대 ${maxPerCard}명` : '불가'}
              </span>
              {allowGroup && (
                <span className={`px-1.5 py-0.5 rounded-full font-semibold ${
                  collectNames ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  이름 입력 {collectNames ? '필수' : '없음'}
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
              수신자 ({recipients.length})
            </label>
            {recipients.length > 1 && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="text-[10px] px-1.5 py-0.5 rounded-md border border-hydrangea-200 bg-white text-hydrangea-600 font-medium focus:outline-none focus:ring-2 focus:ring-hydrangea-300"
              >
                <option value="recent_response">최근응답순</option>
                <option value="recent_input">최근입력순</option>
                <option value="name">이름순</option>
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
                  lines.push(`=== ${cardTitle} 참석자 명단 ===`);
                  lines.push(`생성: ${new Date().toLocaleString('ko-KR')}`);
                  lines.push('');
                  const attending = recipients.filter((r) => r.rsvp_attend === true);
                  const declined = recipients.filter((r) => r.rsvp_attend === false);
                  const noResp = recipients.filter((r) => r.rsvp_attend === null);
                  const totalPeople = attending.reduce((sum, r) => sum + (r.rsvp_count || 1), 0);
                  lines.push(`[참석 — ${attending.length}건 / 총 ${totalPeople}명]`);
                  for (const r of attending) {
                    const cnt = r.rsvp_count || 1;
                    const names = r.rsvp_attendee_names && r.rsvp_attendee_names.length > 0
                      ? `: ${r.rsvp_attendee_names.join(', ')}`
                      : '';
                    lines.push(`- ${r.name} (${cnt}명)${names}${r.rsvp_oneliner ? ` — "${r.rsvp_oneliner}"` : ''} | ${linkFor(r.num)}`);
                  }
                  lines.push('');
                  lines.push(`[불참 — ${declined.length}건]`);
                  for (const r of declined) {
                    lines.push(`- ${r.name}${r.rsvp_oneliner ? ` — "${r.rsvp_oneliner}"` : ''} | ${linkFor(r.num)}`);
                  }
                  lines.push('');
                  lines.push(`[미응답 — ${noResp.length}건]`);
                  for (const r of noResp) {
                    lines.push(`- ${r.name} | ${linkFor(r.num)}`);
                  }
                  const text = lines.join('\n');
                  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${cardTitle}_참석자명단_${new Date().toISOString().slice(0,10)}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success('참석자 명단 다운로드');
                }}
                title="참석자 명단 텍스트 파일로 저장"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-hydrangea-200 text-hydrangea-600 text-[11px] font-semibold hover:bg-hydrangea-50 active:scale-95 transition"
              >
                <Download className="w-3 h-3" /> 명단-링크 export
              </button>
            )}
            {pendingEmailCount > 0 && (
              <button
                type="button"
                onClick={handleSendAllPending}
                disabled={pending}
                className="px-3 py-1.5 rounded-lg bg-hydrangea-500 text-white text-[11px] font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                <Send className="w-3 h-3" /> 모두 발송 ({pendingEmailCount})
              </button>
            )}
          </div>
        </div>

        {recipients.length === 0 ? (
          <div className="text-center py-8 text-xs text-hydrangea-400 bg-hydrangea-50/40 rounded-xl">
            아직 등록된 수신자가 없습니다
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
                      title="클릭해서 이름 수정"
                      className="w-full text-left font-semibold text-hydrangea-700 truncate hover:text-hydrangea-500 hover:underline underline-offset-2 transition cursor-text"
                    >
                      {r.name}
                    </button>
                  )}
                </div>
                {/* col2: 링크복사 버튼 */}
                <button
                  type="button"
                  onClick={() => handleCopy(r.num, r.id)}
                  title="링크 복사"
                  className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition active:scale-95 ${
                    copiedId === r.id
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-hydrangea-50 text-hydrangea-600 border border-hydrangea-200 hover:bg-hydrangea-100'
                  }`}
                >
                  {copiedId === r.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>링크복사</span>
                    </>
                  )}
                </button>
                {/* col3: 읽음/안읽음 */}
                {r.read_at ? (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-hydrangea-50 text-hydrangea-700 border border-hydrangea-200 text-[10px] font-semibold">
                    👁 읽음
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200 text-[10px]">
                    안읽음
                  </span>
                )}
                {/* col4: RSVP 상태 + 인원수 — 참석은 클릭 시 attendee 이름 펼침 */}
                {r.rsvp_attend === true ? (
                  <button
                    type="button"
                    onClick={() => setExpandedId((cur) => (cur === r.id ? null : r.id))}
                    title="참석자 이름 보기"
                    className="inline-flex items-center justify-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold hover:bg-emerald-100 active:scale-95 transition cursor-pointer"
                  >
                    ✓ 참석
                    {r.rsvp_count && r.rsvp_count > 0 && (
                      <span className="ml-0.5 px-1 rounded bg-emerald-500 text-white">{r.rsvp_count}</span>
                    )}
                  </button>
                ) : r.rsvp_attend === false ? (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold">
                    ✕ 불참
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-400 border border-gray-200 text-[10px]">
                    미응답
                  </span>
                )}
                {/* col5: 액션 — 이메일 발송(있을 때) + 삭제 */}
                <div className="flex items-center gap-0.5">
                  {r.delivery_method === 'email' && r.email && (
                    <button
                      type="button"
                      onClick={() => handleSendOne(r.id)}
                      disabled={pending && sendingId === r.id}
                      title={r.sent_status === 'sent' ? '재발송' : '이메일 발송'}
                      className="p-1.5 rounded-md text-hydrangea-500 hover:bg-hydrangea-50 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    title="삭제"
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
                    참석자 ({r.rsvp_count || 1}명)
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
                      개별 이름은 입력되지 않았습니다.
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
                <TrendingUp className="w-3.5 h-3.5" /> 응답 통계
              </h3>
              <span className="text-[10px] text-hydrangea-400">
                {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 기준
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-gradient-to-br from-hydrangea-50 to-hydrangea-100 border border-hydrangea-200 p-3 shadow-sm relative overflow-hidden">
                <Send className="absolute -bottom-2 -right-2 w-12 h-12 text-hydrangea-300/40" strokeWidth={1.5} />
                <div className="relative">
                  <div className="text-[10px] font-semibold text-hydrangea-500 mb-0.5">총 링크 발송</div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl font-extrabold leading-none text-hydrangea-700">{totalRecipients}</span>
                    <span className="text-[10px] text-hydrangea-500">건</span>
                  </div>
                  <div className="mt-1">
                    <div className="text-[10px] inline-flex items-center gap-1 bg-hydrangea-500 text-white px-1.5 py-0.5 rounded-full font-semibold">
                      👁 {readRecipients}명 읽음
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 p-3 shadow-sm relative overflow-hidden">
                <ThumbsUp className="absolute -bottom-2 -right-2 w-12 h-12 text-emerald-300/40" strokeWidth={1.5} />
                <div className="relative">
                  <div className="text-[10px] font-semibold text-emerald-600 mb-0.5">참석</div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl font-extrabold leading-none text-emerald-700">{attendingRecords}</span>
                    <span className="text-[10px] text-emerald-600">건</span>
                  </div>
                  <div className="text-[10px] mt-1 inline-flex items-center gap-1 bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-semibold">
                    <Users className="w-2.5 h-2.5" /> 총 {attendingTotal}명
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 p-3 shadow-sm relative overflow-hidden">
                <ThumbsDown className="absolute -bottom-2 -right-2 w-12 h-12 text-rose-300/40" strokeWidth={1.5} />
                <div className="relative">
                  <div className="text-[10px] font-semibold text-rose-600 mb-0.5">불참</div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl font-extrabold leading-none text-rose-700">{declinedRecords}</span>
                    <span className="text-[10px] text-rose-600">건</span>
                  </div>
                </div>
              </div>
            </div>
            {totalRecipients > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold text-hydrangea-600">응답률</span>
                  <span className="text-[11px] font-bold text-hydrangea-700">
                    응답 {totalReplies}건 / 발송 {totalRecipients}건
                    <span className="text-hydrangea-400 font-medium ml-1">({replyRate}%)</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-hydrangea-100 overflow-hidden flex">
                  {attendingRecords > 0 && (
                    <div className="bg-emerald-500 h-full" style={{ width: `${attendPct}%` }} title={`참석 ${attendingRecords}`} />
                  )}
                  {declinedRecords > 0 && (
                    <div className="bg-rose-400 h-full" style={{ width: `${declinePct}%` }} title={`불참 ${declinedRecords}`} />
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[9px] text-hydrangea-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 참석</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400" /> 불참</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-hydrangea-100 border border-hydrangea-200" /> 미응답</span>
                </div>
              </div>
            )}
          </div>
        );
      })()}

    </div>
  );
}
