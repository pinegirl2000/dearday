'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Share2, Copy, Check, RefreshCw, ExternalLink } from 'lucide-react';
import { ensureShareToken, regenerateShareToken } from '@/lib/actions/shareStatus';

interface Props {
  slug: string;
  ownerToken: string | null;
  cardTitle?: string;
  /** 헤더 안에 작게 넣을 때 */
  compact?: boolean;
}

/**
 * 응답 현황 공유 — 로그인 없이 볼 수 있는 읽기 전용 링크(/r/[slug]/[token])를
 * 발급·복사·재발급한다. 소유자 화면(수신자 등록 / 관리)에서만 노출.
 */
export default function ShareStatusButton({ slug, ownerToken, cardTitle, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const buildUrl = (token: string) => `${window.location.origin}/r/${slug}/${token}`;

  const copy = async (u: string) => {
    try {
      await navigator.clipboard.writeText(u);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast.success('현황 링크를 복사했습니다');
    } catch {
      toast.message(u);
    }
  };

  const openPanel = () => {
    setOpen(true);
    if (url) return;
    startTransition(async () => {
      const res = await ensureShareToken(slug, ownerToken);
      if (!res.ok) { toast.error(res.error); setOpen(false); return; }
      setUrl(buildUrl(res.token));
    });
  };

  const regenerate = () => {
    if (!confirm('링크를 재발급하면 기존에 공유한 링크는 더 이상 열리지 않습니다. 계속할까요?')) return;
    startTransition(async () => {
      const res = await regenerateShareToken(slug, ownerToken);
      if (!res.ok) { toast.error(res.error); return; }
      setUrl(buildUrl(res.token));
      toast.success('새 링크를 발급했습니다 — 이전 링크는 무효화됨');
    });
  };

  const nativeShare = async (u: string) => {
    const text = `${cardTitle ? `[${cardTitle}] ` : ''}참석 현황 보기`;
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try { await (navigator as any).share({ title: text, text, url: u }); return; } catch { /* 취소 */ }
    }
    copy(u);
  };

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        className={
          compact
            ? 'inline-flex items-center gap-1 px-2 py-1 rounded-md border border-hydrangea-200 bg-white text-[10px] font-semibold text-hydrangea-600 hover:bg-hydrangea-50 active:scale-95 transition'
            : 'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-hydrangea-200 bg-white text-xs font-semibold text-hydrangea-700 hover:bg-hydrangea-50 active:scale-95 transition'
        }
        title="로그인 없이 볼 수 있는 응답 현황 링크"
      >
        <Share2 className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} /> 현황 공유
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div>
              <h3 className="text-sm font-bold text-hydrangea-800">응답 현황 공유</h3>
              <p className="text-[11px] text-hydrangea-500 mt-0.5 leading-relaxed">
                이 링크를 받은 사람은 <b>로그인 없이</b> 누가 참석·불참했는지 볼 수 있습니다.
                수정·삭제·개인 초대 링크는 노출되지 않습니다.
              </p>
            </div>

            <div className="rounded-lg border border-hydrangea-200 bg-hydrangea-50/50 px-2.5 py-2 text-[11px] text-hydrangea-700 break-all min-h-[36px] flex items-center">
              {pending && !url ? '링크 발급 중…' : (url || '')}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!url || pending}
                onClick={() => url && copy(url)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-hydrangea-600 text-white text-xs font-semibold hover:bg-hydrangea-700 active:scale-95 transition disabled:opacity-50"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? '복사됨' : '링크 복사'}
              </button>
              <button
                type="button"
                disabled={!url || pending}
                onClick={() => url && nativeShare(url)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-hydrangea-200 text-hydrangea-700 text-xs font-semibold hover:bg-hydrangea-50 active:scale-95 transition disabled:opacity-50"
              >
                <Share2 className="w-3.5 h-3.5" /> 공유하기
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <a
                href={url || '#'}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-1 text-[11px] text-hydrangea-500 hover:text-hydrangea-700 ${!url ? 'pointer-events-none opacity-40' : ''}`}
              >
                <ExternalLink className="w-3 h-3" /> 미리보기
              </a>
              <button
                type="button"
                disabled={pending}
                onClick={regenerate}
                className="inline-flex items-center gap-1 text-[11px] text-rose-500 hover:text-rose-700 disabled:opacity-50"
                title="기존 링크 무효화 후 새 링크 발급"
              >
                <RefreshCw className="w-3 h-3" /> 링크 재발급
              </button>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full mt-1 px-3 py-2 rounded-lg text-xs text-hydrangea-500 hover:bg-hydrangea-50"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
