'use client';

import { useState, useEffect, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Trash2, Plus, Eye, Users } from 'lucide-react';
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
        <MobileHeader title="수신자 관리" back />
        <div className="text-center py-20">
          <p className="text-hydrangea-400 mb-4">{error}</p>
          <a href={`/i/${slug}`} className="text-hydrangea-500 underline text-sm">초대장 보기</a>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer noPadding>
      <MobileHeader title="수신자 관리" back />
      <div className="px-5 pt-3">
        <div className="text-xs text-hydrangea-400 mb-1">초대장</div>
        <h1 className="text-lg font-semibold text-hydrangea-700 mb-1 truncate">{cardTitle}</h1>
        <a href={`/i/${slug}`} className="inline-flex items-center gap-1 text-xs text-hydrangea-500 mb-6">
          <Eye className="w-3 h-3" /> 미리보기
        </a>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-hydrangea-700">
            <Users className="w-4 h-4" /> 수신자 {recipients.length}명
          </div>
          <Button size="sm" onClick={() => setSheetOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> 일괄 등록
          </Button>
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
          <div className="space-y-2 pb-12">
            <AnimatePresence>
              {recipients.map((r) => {
                const link = `${origin}/i/${slug}/${r.num}`;
                const copied = copiedNum === r.num;
                return (
                  <motion.div
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-2xl border border-hydrangea-100 p-4"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-semibold text-hydrangea-500 bg-hydrangea-100 px-1.5 py-0.5 rounded">
                            {r.num}
                          </span>
                          <span className="text-sm font-semibold text-hydrangea-700 truncate">{r.name}</span>
                        </div>
                        <p className="text-[11px] text-hydrangea-400 truncate font-mono">{link}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-hydrangea-300 hover:text-red-500 active:scale-90 transition p-1"
                        aria-label="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => copyLink(r.num)}
                      className={`w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition ${
                        copied ? 'bg-green-100 text-green-700' : 'bg-hydrangea-50 text-hydrangea-700 active:scale-95'
                      }`}
                    >
                      {copied ? <><Check className="w-3.5 h-3.5" /> 복사됨!</> : <><Copy className="w-3.5 h-3.5" /> 링크 복사</>}
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
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
