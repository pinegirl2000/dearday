'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, ExternalLink, Settings, Pencil, Check, Send, Users, ThumbsUp, ThumbsDown, TrendingUp, X, Maximize2, RotateCcw, RefreshCw } from 'lucide-react';
import { getCardStats } from '@/lib/actions/getCardStats';
import { getEventTypeMeta } from '@/lib/eventType';
import { getBackground } from '@/lib/backgrounds';
import TemplateCard from '@/app/i/[slug]/_components/TemplateCard';
import SendStep from '@/app/cards/new/_components/SendStep';
import type { BaseCard } from '@/types/card';

interface CardStats {
  totalRecipients: number;
  todayRecipients: number;
  readRecipients: number;
  attendingRecords: number;
  attendingTotal: number;
  declinedRecords: number;
}

function fmtDate(iso?: string | null) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return ''; }
}

export default function RecentCardSelector({
  cards,
  stats,
  owners
}: {
  cards: BaseCard[];
  stats: Record<string, CardStats>;
  /** admin 전용 — 카드별 소유자 정보 (cardId → { name?, email? }) */
  owners?: Record<string, { name?: string | null; email?: string | null }>;
}) {
  const [liveStats, setLiveStats] = useState<Record<string, CardStats>>(stats);
  const [refreshing, setRefreshing] = useState(false);

  const refreshStats = async () => {
    setRefreshing(true);
    try {
      const fresh = await getCardStats(cards.map((x) => x.id));
      setLiveStats((prev) => ({ ...prev, ...fresh }));
    } finally {
      setRefreshing(false);
    }
  };
  const [selectedId, setSelectedId] = useState<string>(cards[0]?.id || '');
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [showReload, setShowReload] = useState(false);
  const [cardOpened, setCardOpened] = useState(false);
  const [tab, setTab] = useState<'recipients' | 'stats'>('stats');

  // 팝업 닫히면 상태 초기화
  useEffect(() => {
    if (!previewOpen) {
      setShowReload(false);
      setCardOpened(false);
    }
  }, [previewOpen]);

  // iframe → 부모 postMessage 받으면 cardOpened 표시 (라벨 "다시보기"로 전환)
  useEffect(() => {
    if (!previewOpen) return;
    const onMsg = (e: MessageEvent) => {
      if (e?.data?.type === 'dearday:envelope_opened') setCardOpened(true);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [previewOpen]);

  // 통계 탭이 열리거나 카드가 바뀌면 DB에서 최신 통계를 다시 fetch (실시간 반영)
  useEffect(() => {
    if (tab !== 'stats') return;
    refreshStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selectedId]);

  const handleReload = () => {
    setShowReload(false);
    setCardOpened(false);
    setIframeKey((k) => k + 1);
  };
  const c = cards.find((x) => x.id === selectedId) || cards[0];
  if (!c) return null;
  const meta = getEventTypeMeta(c.event_type);
  const bg = getBackground(c.bg_id);
  const s: CardStats = liveStats[c.id] || {
    totalRecipients: 0, todayRecipients: 0, readRecipients: 0,
    attendingRecords: 0, attendingTotal: 0, declinedRecords: 0
  };
  const totalReplies = s.attendingRecords + s.declinedRecords;
  // 응답수가 발송수보다 클 수 있어(테스트/직접 RSVP 등) 분모를 max로 보정 → 100% 초과 방지
  const denom = Math.max(s.totalRecipients, totalReplies);
  const replyRate = denom > 0 ? Math.min(100, Math.round((totalReplies / denom) * 100)) : 0;
  const attendPct = denom > 0 ? (s.attendingRecords / denom) * 100 : 0;
  const declinePct = denom > 0 ? (s.declinedRecords / denom) * 100 : 0;

  return (
    <div className="rounded-2xl border-2 border-hydrangea-300 bg-white overflow-hidden shadow-md ring-2 ring-hydrangea-100">
      {/* 헤더 + 드롭다운 trigger — 선택된 초청장 제목을 큰 글씨로 표시 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3.5 bg-gradient-to-r from-hydrangea-600 to-hydrangea-500 text-white flex items-center gap-2 hover:from-hydrangea-700 hover:to-hydrangea-600 transition shadow-inner"
      >
        <div className="flex-1 min-w-0 text-left">
          <div className="text-[10px] font-medium opacity-80 mb-0.5 flex items-center gap-1">
            <span>✨</span>
            <span>{c.id === cards[0].id ? '가장 최근 작업한 초청장' : '선택된 초청장'}</span>
          </div>
          <div className="text-lg font-extrabold uppercase tracking-wide truncate drop-shadow-sm">
            {c.title || '(제목 없음)'}
          </div>
          {owners && (owners[c.id]?.name || owners[c.id]?.email) && (
            <div className="text-[10px] opacity-90 mt-0.5 truncate">
              👤 by {owners[c.id]?.name || ''}
              {owners[c.id]?.email && (
                <span className="opacity-75"> · {owners[c.id]?.email}</span>
              )}
            </div>
          )}
          {(c.updated_at || c.created_at) && (
            <div className="text-[10px] opacity-75 mt-0.5">
              최종작성일 {fmtDate(c.updated_at || c.created_at)}
            </div>
          )}
        </div>
        <span className="flex-shrink-0 text-[10px] bg-white/20 px-2 py-1 rounded-full font-semibold">
          총 {cards.length}개
        </span>
        <ChevronDown className={`flex-shrink-0 w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={2.5} />
      </button>

      {/* 드롭다운 리스트 — 과거 카드 제목 순서대로 */}
      {open && (
        <div className="border-b border-hydrangea-100 bg-hydrangea-50/40 max-h-64 overflow-y-auto">
          {cards.map((card, idx) => {
            const cMeta = getEventTypeMeta(card.event_type);
            const isSelected = card.id === selectedId;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => { setSelectedId(card.id); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs border-b border-hydrangea-100/60 last:border-b-0 transition ${
                  isSelected ? 'bg-hydrangea-100 text-hydrangea-700 font-semibold' : 'text-hydrangea-700 hover:bg-white'
                }`}
              >
                <span className="text-base flex-shrink-0">{cMeta.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="truncate">
                    {idx === 0 && <span className="text-[10px] text-hydrangea-400 mr-1">최근</span>}
                    {card.title || '(제목 없음)'}
                  </div>
                  {owners && (owners[card.id]?.name || owners[card.id]?.email) && (
                    <div className="text-[10px] text-hydrangea-400 truncate font-normal">
                      👤 {owners[card.id]?.name || owners[card.id]?.email}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-hydrangea-400 flex-shrink-0">{fmtDate(card.event_date)}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-hydrangea-500 flex-shrink-0" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      )}

      {/* 선택된 카드 미리보기 — 클릭 시 팝업으로 풀 미리보기 */}
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className="relative aspect-[16/9] bg-hydrangea-50 overflow-hidden w-full cursor-zoom-in group"
        aria-label="초청장 전체 보기">
        {/* 실제 텍스트가 포함된 TemplateCard — title 영역을 줌인해서 보여줌 */}
        <div
          className="absolute left-1/2 top-0 pointer-events-none"
          style={{
            width: 420,
            transform: 'translateX(-50%) scale(0.85)',
            transformOrigin: 'top center'
          }}
          aria-hidden
        >
          <TemplateCard card={c} recipientName="John" />
        </div>
        {/* 하단 텍스트 가독성을 위한 subtle 그라데이션만 — 그림 색상은 최대한 보존 */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        {/* 클릭 가능 힌트 — hover 시 노출 */}
        <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 bg-black/55 backdrop-blur text-white text-[10px] font-semibold px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition">
          <Maximize2 className="w-3 h-3" /> 크게 보기
        </div>
      </button>

      {/* 수정하기 — 가로 풀 너비 버튼 */}
      <div className="px-3 pt-3 border-t border-hydrangea-100/60">
        <Link
          href={`/cards/${c.slug}/edit`}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-hydrangea-500 text-white text-sm font-semibold hover:bg-hydrangea-600 active:scale-95 transition"
        >
          <Pencil className="w-4 h-4" /> 수정하기
        </Link>
      </div>

      {/* === 노트 탭 — Recipients 관리 / Send 통계 === */}
      <div className="border-t border-hydrangea-100/60 bg-hydrangea-50/30">
        <div className="flex gap-1 px-3 pt-2 -mb-px">
          {([
            { id: 'stats'      as const, label: '응답 통계',   icon: TrendingUp },
            { id: 'recipients' as const, label: '수신자 등록', icon: Send }
          ]).map((t) => {
            const isActive = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-1 px-3 py-2 text-[11px] font-semibold rounded-t-lg border border-b-0 transition ${
                  isActive
                    ? 'bg-white text-hydrangea-700 border-hydrangea-200 shadow-[0_-2px_4px_rgba(0,0,0,0.04)] z-10'
                    : 'bg-hydrangea-100/60 text-hydrangea-500 border-transparent hover:bg-hydrangea-100'
                }`}
              >
                <Icon className="w-3 h-3" />
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="border-t border-hydrangea-200" />
      </div>

      {tab === 'recipients' && (
        <div className="bg-white p-3">
          <SendStep slug={c.slug} ownerToken={null} card={c} />
        </div>
      )}

      {tab === 'stats' && (
      <div className="bg-hydrangea-50/30 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h3 className="text-[11px] font-bold text-hydrangea-700 uppercase tracking-wide flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> 응답 통계
            </h3>
            <span className="text-[10px] text-hydrangea-400">
              {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 기준
            </span>
          </div>
          <button
            type="button"
            onClick={refreshStats}
            disabled={refreshing}
            title="새로고침"
            className="text-hydrangea-500 hover:text-hydrangea-700 active:scale-95 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* 3개 stat 타일 — 총 링크 / 참석 / 불참 */}
        <div className="grid grid-cols-3 gap-2">
          {/* 총 링크 발송 */}
          <div className="rounded-xl bg-gradient-to-br from-hydrangea-50 to-hydrangea-100 border border-hydrangea-200 p-3 shadow-sm relative overflow-hidden">
            <Send className="absolute -bottom-2 -right-2 w-12 h-12 text-hydrangea-300/40" strokeWidth={1.5} />
            <div className="relative">
              <div className="text-[10px] font-semibold text-hydrangea-500 mb-0.5">총 링크 발송</div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-extrabold leading-none text-hydrangea-700">{s.totalRecipients}</span>
                <span className="text-[10px] text-hydrangea-500">건</span>
              </div>
              <div className="mt-1">
                <div className="text-[10px] inline-flex items-center gap-1 bg-hydrangea-500 text-white px-1.5 py-0.5 rounded-full font-semibold">
                  👁 {s.readRecipients}명 읽음
                </div>
              </div>
            </div>
          </div>

          {/* 참석 — 건수 + 동반자 포함 인원 */}
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 p-3 shadow-sm relative overflow-hidden">
            <ThumbsUp className="absolute -bottom-2 -right-2 w-12 h-12 text-emerald-300/40" strokeWidth={1.5} />
            <div className="relative">
              <div className="text-[10px] font-semibold text-emerald-600 mb-0.5">참석</div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-extrabold leading-none text-emerald-700">{s.attendingRecords}</span>
                <span className="text-[10px] text-emerald-600">건</span>
              </div>
              <div className="text-[10px] mt-1 inline-flex items-center gap-1 bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-semibold">
                <Users className="w-2.5 h-2.5" /> 총 {s.attendingTotal}명
              </div>
            </div>
          </div>

          {/* 불참 — 건수 */}
          <div className="rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 p-3 shadow-sm relative overflow-hidden">
            <ThumbsDown className="absolute -bottom-2 -right-2 w-12 h-12 text-rose-300/40" strokeWidth={1.5} />
            <div className="relative">
              <div className="text-[10px] font-semibold text-rose-600 mb-0.5">불참</div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-extrabold leading-none text-rose-700">{s.declinedRecords}</span>
                <span className="text-[10px] text-rose-600">건</span>
              </div>
            </div>
          </div>
        </div>

        {/* 응답률 progress bar */}
        {s.totalRecipients > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-hydrangea-600">응답률</span>
              <span className="text-[11px] font-bold text-hydrangea-700">
                응답 {totalReplies}건 / 발송 {s.totalRecipients}건
                <span className="text-hydrangea-400 font-medium ml-1">({replyRate}%)</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-hydrangea-100 overflow-hidden flex">
              {s.attendingRecords > 0 && (
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${attendPct}%` }}
                  title={`참석 ${s.attendingRecords}`}
                />
              )}
              {s.declinedRecords > 0 && (
                <div
                  className="bg-rose-400 h-full"
                  style={{ width: `${declinePct}%` }}
                  title={`불참 ${s.declinedRecords}`}
                />
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-[9px] text-hydrangea-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 참석</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400" /> 불참</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-hydrangea-100 border border-hydrangea-200" /> 미응답</span>
            </div>
          </div>
        )}

        {s.totalRecipients === 0 && (
          <div className="text-center py-2 text-[11px] text-hydrangea-400">
            아직 발송된 초청장이 없습니다.
          </div>
        )}
      </div>
      )}

      {/* === 풀 미리보기 팝업 — 봉투 열리는 화면부터 라이브 초청장 페이지를 iframe으로 === */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="absolute inset-0 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 상단 닫기 버튼 — 풀스크린 좌측 상단 */}
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              aria-label="닫기"
              className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-white/90 text-hydrangea-700 shadow-lg flex items-center justify-center hover:bg-white active:scale-95 transition"
            >
              <X className="w-5 h-5" strokeWidth={2.5} />
            </button>
            {/* iframe 풀스크린 — RSVP 등 하단 콘텐츠까지 자연스럽게 스크롤 */}
            <div className="flex-1 min-h-0 bg-hydrangea-50/30 relative overflow-hidden">
              <iframe
                key={`${c.slug}-${iframeKey}`}
                src={`/i/${c.slug}?preview_name=${encodeURIComponent('Ms. Avery')}`}
                title={`${c.title} 미리보기`}
                className="w-full h-full border-0"
                scrolling="auto"
                onLoad={() => setShowReload(true)}
              />
              {/* 워터마크: 로딩 완료 시 SAMPLE preview → 카드까지 펼쳐지면 "다시보기" */}
              {showReload && (
                <button
                  type="button"
                  onClick={cardOpened ? handleReload : undefined}
                  disabled={!cardOpened}
                  aria-label={cardOpened ? '다시 재생' : 'Sample preview'}
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-white/30 backdrop-blur-md border border-white/40 text-hydrangea-700 flex flex-col items-center justify-center gap-0.5 shadow-lg transition opacity-60 ${
                    cardOpened
                      ? 'hover:bg-white/50 hover:opacity-100 active:scale-95 cursor-pointer'
                      : 'cursor-default'
                  }`}
                >
                  {cardOpened ? (
                    <>
                      <RotateCcw className="w-6 h-6" strokeWidth={2.5} />
                      <span className="text-[10px] font-semibold tracking-wide">다시보기</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[9px] font-bold tracking-widest uppercase">Sample</span>
                      <span className="text-[9px] font-semibold tracking-wide">preview</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
