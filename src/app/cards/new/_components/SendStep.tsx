'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Mail, Link as LinkIcon, Plus, Trash2, Send, Copy, Check } from 'lucide-react';
import {
  listRecipients,
  addRecipientsWithDetails,
  deleteRecipient,
  sendInvitationsToRecipients
} from '@/lib/actions/recipients';

interface Recipient {
  id: string;
  num: string;
  name: string;
  email: string | null;
  delivery_method: string | null;
  sent_at: string | null;
  sent_status: string | null;
  read_at: string | null;
  rsvp_attend: boolean | null;
  rsvp_count: number | null;
  rsvp_attendee_names: string[] | null;
  rsvp_oneliner: string | null;
}

interface Props {
  slug: string;
  ownerToken: string | null;
}

type Mode = 'email' | 'link';
type AddMode = 'single' | 'bulk';

export default function SendStep({ slug, ownerToken }: Props) {
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
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-hydrangea-700">수신자 추가</label>
          <div className="flex gap-1 text-[10px]">
            <button
              type="button"
              onClick={() => setAddMode('single')}
              className={`px-2 py-1 rounded-md ${addMode === 'single' ? 'bg-hydrangea-500 text-white' : 'bg-hydrangea-50 text-hydrangea-500'}`}
            >Single</button>
            <button
              type="button"
              onClick={() => setAddMode('bulk')}
              className={`px-2 py-1 rounded-md ${addMode === 'bulk' ? 'bg-hydrangea-500 text-white' : 'bg-hydrangea-50 text-hydrangea-500'}`}
            >Bulk</button>
          </div>
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

      {/* 수신자 리스트 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-hydrangea-700">
            수신자 ({recipients.length})
          </label>
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

        {recipients.length === 0 ? (
          <div className="text-center py-8 text-xs text-hydrangea-400 bg-hydrangea-50/40 rounded-xl">
            아직 등록된 수신자가 없습니다
          </div>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {recipients.map((r) => (
              <div key={r.id} className="rounded-lg border border-hydrangea-100 bg-white">
              <div
                className="grid items-center gap-1.5 px-2 py-1.5 text-xs"
                style={{ gridTemplateColumns: 'minmax(0,1fr) 84px 64px 78px auto' }}
              >
                {/* col1: 이름 */}
                <div className="min-w-0 font-semibold text-hydrangea-700 truncate">{r.name}</div>
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

    </div>
  );
}
