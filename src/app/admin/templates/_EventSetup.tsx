'use client';

import { useState, useTransition, useMemo } from 'react';
import { toast } from 'sonner';
import { Check, Plus, X, Trash2, ArrowUp, ArrowDown, Move } from 'lucide-react';
import { TEMPLATES } from '@/lib/templates';
import { getBackground } from '@/lib/backgrounds';
import { toggleTemplateForEvent } from '@/lib/actions/templateEventInclude';
import { addEvent, deleteEvent, reorderEvents, type EventRow, type EventCardType } from '@/lib/actions/events';

interface Props {
  /** 코드 default 외 추가 포함된 (event_id → template_id[]) */
  includes: Record<string, string[]>;
  /** 코드 default에서 제외된 (event_id → template_id[]) */
  excludes: Record<string, string[]>;
  /** DB가 source of truth인 모든 이벤트 */
  events: EventRow[];
}

/**
 * Event 설정 — 이벤트별로 모든 템플릿 썸네일을 보여주고 토글로 포함/제외.
 * 최종 노출 = (recommendEvents UNION include) MINUS exclude
 */
export default function EventSetup({ includes, excludes, events }: Props) {
  const [eventId, setEventId] = useState<string>(events[0]?.id || 'birthday');
  const [pending, startTransition] = useTransition();
  const [localIncludes, setLocalIncludes] = useState<Record<string, string[]>>({ ...includes });
  const [localExcludes, setLocalExcludes] = useState<Record<string, string[]>>({ ...excludes });
  const [localEvents, setLocalEvents] = useState<EventRow[]>([...events]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newEmoji, setNewEmoji] = useState('🎉');
  const [newCardType, setNewCardType] = useState<EventCardType>('invitation');
  const [reorderMode, setReorderMode] = useState(false);

  const handleMove = (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= localEvents.length) return;
    const before = [...localEvents]; // rollback용
    const reordered = [...localEvents];
    [reordered[idx], reordered[next]] = [reordered[next], reordered[idx]];
    setLocalEvents(reordered);
    startTransition(async () => {
      const res = await reorderEvents(reordered.map((e) => e.id));
      if (!res.ok) {
        toast.error(res.error || '순서 저장 실패');
        setLocalEvents(before);
      }
    });
  };

  // label → id 자동 생성 (slugify): 소문자, 공백/특수문자 → '-', 영숫자만
  const slugify = (s: string): string => {
    const base = s.toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
    return base || `event-${Date.now().toString(36).slice(-5)}`;
  };
  // 중복 시 -2, -3 접미사
  const makeUniqueId = (base: string): string => {
    if (!localEvents.some((e) => e.id === base)) return base;
    let n = 2;
    while (localEvents.some((e) => e.id === `${base}-${n}`)) n++;
    return `${base}-${n}`;
  };
  const previewId = newLabel.trim() ? makeUniqueId(slugify(newLabel)) : '';

  // DB의 모든 이벤트 (default + custom 통합)
  const allEvents = localEvents.map((e) => ({ id: e.id, label: e.label, emoji: e.emoji, custom: !e.is_default }));

  const handleAddEvent = () => {
    const label = newLabel.trim();
    const emoji = newEmoji.trim() || '🎉';
    if (!label) { toast.error('Label을 입력하세요'); return; }
    const id = previewId;
    if (!id) { toast.error('Label에서 ID 생성 실패'); return; }
    startTransition(async () => {
      const res = await addEvent(id, label, emoji, newCardType);
      if (!res.ok) { toast.error(res.error || '추가 실패'); return; }
      setLocalEvents((s) => [...s, { id, label, emoji, is_default: false, sort_order: 100, card_type: newCardType }]);
      setAddModalOpen(false);
      setNewLabel(''); setNewEmoji('🎉'); setNewCardType('invitation');
      setEventId(id);
      toast.success(`"${label}" 이벤트 추가됨 (${newCardType === 'thankcard' ? 'Thank Card' : newCardType === 'congrats' ? 'Congrats' : 'Invitation'})`);
    });
  };

  const handleDeleteCustom = (id: string, label: string) => {
    if (!confirm(`커스텀 이벤트 "${label}"을(를) 삭제할까요?`)) return;
    startTransition(async () => {
      const res = await deleteEvent(id);
      if (!res.ok) { toast.error(res.error || '삭제 실패'); return; }
      setLocalEvents((s) => s.filter((e) => e.id !== id));
      if (eventId === id) setEventId(localEvents[0]?.id || 'birthday');
      toast.success('삭제됨');
    });
  };

  // 현재 이벤트에서 각 template의 활성 여부 계산
  const isTemplateActive = (tplId: string, recommendEvents: string[]): boolean => {
    const inCode = recommendEvents.includes(eventId);
    const inInclude = (localIncludes[eventId] || []).includes(tplId);
    const inExclude = (localExcludes[eventId] || []).includes(tplId);
    return (inCode || inInclude) && !inExclude;
  };

  // 현재 이벤트 활성 템플릿 수 (count badge용)
  const activeCount = useMemo(() => {
    return TEMPLATES.filter((t) => isTemplateActive(t.id, t.recommendEvents)).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, localIncludes, localExcludes]);

  const handleToggle = (tpl: typeof TEMPLATES[number]) => {
    const isInRec = (tpl.recommendEvents as readonly string[]).includes(eventId);
    const currentlyActive = isTemplateActive(tpl.id, tpl.recommendEvents);
    const next = !currentlyActive;

    // 낙관적 업데이트
    if (next) {
      // 활성화 — exclude 제거 + (코드에 없으면) include 추가
      setLocalExcludes((s) => ({
        ...s,
        [eventId]: (s[eventId] || []).filter((id) => id !== tpl.id)
      }));
      if (!isInRec) {
        setLocalIncludes((s) => ({
          ...s,
          [eventId]: Array.from(new Set([...(s[eventId] || []), tpl.id]))
        }));
      }
    } else {
      // 비활성화 — include 제거 + (코드에 있으면) exclude 추가
      setLocalIncludes((s) => ({
        ...s,
        [eventId]: (s[eventId] || []).filter((id) => id !== tpl.id)
      }));
      if (isInRec) {
        setLocalExcludes((s) => ({
          ...s,
          [eventId]: Array.from(new Set([...(s[eventId] || []), tpl.id]))
        }));
      }
    }

    startTransition(async () => {
      const res = await toggleTemplateForEvent(eventId, tpl.id, next, isInRec);
      if (!res.ok) {
        toast.error(res.error || '저장 실패');
        // rollback
        if (next) {
          setLocalIncludes((s) => ({
            ...s,
            [eventId]: (s[eventId] || []).filter((id) => id !== tpl.id)
          }));
          if (isInRec) {
            setLocalExcludes((s) => ({
              ...s,
              [eventId]: Array.from(new Set([...(s[eventId] || []), tpl.id]))
            }));
          }
        } else {
          setLocalExcludes((s) => ({
            ...s,
            [eventId]: (s[eventId] || []).filter((id) => id !== tpl.id)
          }));
          if (!isInRec) {
            setLocalIncludes((s) => ({
              ...s,
              [eventId]: Array.from(new Set([...(s[eventId] || []), tpl.id]))
            }));
          }
        }
      }
    });
  };

  const eventMeta = allEvents.find((e) => e.id === eventId);

  return (
    <div className="space-y-3">
      {/* Event 선택 — 이모지 칩 + 순서 변경 모드 + + 추가 버튼 */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] font-semibold text-hydrangea-700">Event</label>
          <button
            type="button"
            onClick={() => setReorderMode((v) => !v)}
            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition ${
              reorderMode
                ? 'bg-hydrangea-500 text-white'
                : 'bg-hydrangea-100 text-hydrangea-700 hover:bg-hydrangea-200'
            }`}
          >
            <Move className="w-3 h-3 inline mr-1" />
            {reorderMode ? '완료' : '순서 변경'}
          </button>
        </div>
        {reorderMode ? (
          /* 순서 변경 모드 — 세로 리스트 + 위/아래 화살표 */
          <div className="space-y-1">
            {localEvents.map((e, idx) => (
              <div
                key={e.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white border border-hydrangea-100"
              >
                <span className="text-base">{e.emoji}</span>
                <span className="flex-1 text-xs font-medium text-hydrangea-700 truncate">{e.label}</span>
                <span className="text-[9px] text-hydrangea-400 font-mono">{e.id}</span>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                  e.card_type === 'thankcard' ? 'bg-amber-100 text-amber-700'
                    : e.card_type === 'congrats' ? 'bg-pink-100 text-pink-700'
                    : 'bg-hydrangea-100 text-hydrangea-700'
                }`}>
                  {e.card_type === 'thankcard' ? 'Thank' : e.card_type === 'congrats' ? 'Congrats' : 'Invite'}
                </span>
                <button
                  type="button"
                  onClick={() => handleMove(idx, -1)}
                  disabled={idx === 0 || pending}
                  title="위로"
                  className="p-1 rounded text-hydrangea-600 hover:bg-hydrangea-50 disabled:opacity-30 active:scale-95"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(idx, 1)}
                  disabled={idx === localEvents.length - 1 || pending}
                  title="아래로"
                  className="p-1 rounded text-hydrangea-600 hover:bg-hydrangea-50 disabled:opacity-30 active:scale-95"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {allEvents.map((e) => {
              const selected = eventId === e.id;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setEventId(e.id)}
                  onContextMenu={(ev) => {
                    if (e.custom) {
                      ev.preventDefault();
                      handleDeleteCustom(e.id, e.label);
                    }
                  }}
                  className={`relative flex flex-col items-center gap-0.5 px-1.5 py-2 rounded-lg transition active:scale-95 ${
                    selected
                      ? 'bg-hydrangea-500 text-white shadow ring-2 ring-hydrangea-300'
                      : 'bg-white text-hydrangea-700 border border-hydrangea-100 hover:bg-hydrangea-50'
                  }`}
                  title={e.custom ? '우클릭/길게 누르면 삭제' : ''}
                >
                  <span className="text-base leading-none">{e.emoji}</span>
                  <span className="text-[10px] font-medium truncate max-w-full">{e.label}</span>
                  {e.custom && (
                    <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                      selected ? 'bg-white text-hydrangea-700' : 'bg-hydrangea-100 text-hydrangea-700'
                    }`} title="custom">+</span>
                  )}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 px-1.5 py-2 rounded-lg border-2 border-dashed border-hydrangea-300 text-hydrangea-500 hover:bg-hydrangea-50 active:scale-95 transition"
              title="커스텀 이벤트 추가"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[10px] font-medium">추가</span>
            </button>
          </div>
        )}
      </div>

      {/* 추가 모달 */}
      {addModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setAddModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 flex items-center justify-between border-b border-hydrangea-100">
              <div className="text-sm font-semibold text-hydrangea-700">커스텀 이벤트 추가</div>
              <button type="button" onClick={() => setAddModalOpen(false)}
                className="text-hydrangea-400 hover:text-hydrangea-700 text-2xl leading-none">×</button>
            </div>
            <div className="p-4 space-y-3">
              {/* 카드 타입 — 가장 먼저 선택 */}
              <div>
                <label className="block text-[10px] font-semibold text-hydrangea-700 mb-1.5">카드 타입</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCardType('invitation')}
                    className={`px-2 py-2 rounded-lg text-left transition active:scale-95 border-2 ${
                      newCardType === 'invitation'
                        ? 'border-hydrangea-500 bg-hydrangea-50'
                        : 'border-hydrangea-100 bg-white hover:bg-hydrangea-50/40'
                    }`}
                  >
                    <div className="text-xs font-semibold text-hydrangea-700">📅 Invitation</div>
                    <div className="text-[9px] text-hydrangea-400 mt-0.5">날짜·장소 필요</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCardType('thankcard')}
                    className={`px-2 py-2 rounded-lg text-left transition active:scale-95 border-2 ${
                      newCardType === 'thankcard'
                        ? 'border-hydrangea-500 bg-hydrangea-50'
                        : 'border-hydrangea-100 bg-white hover:bg-hydrangea-50/40'
                    }`}
                  >
                    <div className="text-xs font-semibold text-hydrangea-700">💌 Thank Card</div>
                    <div className="text-[9px] text-hydrangea-400 mt-0.5">감사·답례 메시지</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCardType('congrats')}
                    className={`px-2 py-2 rounded-lg text-left transition active:scale-95 border-2 ${
                      newCardType === 'congrats'
                        ? 'border-hydrangea-500 bg-hydrangea-50'
                        : 'border-hydrangea-100 bg-white hover:bg-hydrangea-50/40'
                    }`}
                  >
                    <div className="text-xs font-semibold text-hydrangea-700">🎉 Congrats</div>
                    <div className="text-[9px] text-hydrangea-400 mt-0.5">축하 메시지</div>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-hydrangea-700 mb-1">Label (표시 이름)</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="예: Graduation"
                  className="w-full px-2 py-2 rounded-md border border-hydrangea-200 text-xs"
                />
                {previewId && (
                  <div className="mt-1 text-[10px] text-hydrangea-400">
                    자동 생성 ID: <code className="bg-hydrangea-50 px-1 rounded text-hydrangea-700">{previewId}</code>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-hydrangea-700 mb-1">Emoji</label>
                <input
                  type="text"
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  maxLength={4}
                  className="w-20 px-2 py-2 rounded-md border border-hydrangea-200 text-base text-center"
                />
              </div>
              {/* 기존 이벤트 ID 참고 리스트 */}
              <div className="pt-2 border-t border-hydrangea-100">
                <div className="text-[10px] font-semibold text-hydrangea-700 mb-1.5">기존 이벤트 ID 참고</div>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {localEvents.map((e) => (
                    <span
                      key={e.id}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
                        e.is_default
                          ? 'bg-hydrangea-50 text-hydrangea-600 border border-hydrangea-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                      title={`${e.label} (${e.is_default ? 'default' : 'custom'})`}
                    >
                      <span>{e.emoji}</span>
                      <code className="font-mono">{e.id}</code>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-3 flex gap-2 border-t border-hydrangea-100">
              <button type="button" onClick={() => setAddModalOpen(false)}
                className="flex-1 px-3 py-2 rounded-xl border border-hydrangea-200 text-hydrangea-700 text-sm font-medium">
                취소
              </button>
              <button type="button" onClick={handleAddEvent} disabled={pending}
                className="flex-1 px-3 py-2 rounded-xl bg-hydrangea-500 text-white text-sm font-semibold disabled:opacity-50">
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 활성 카운트 */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-hydrangea-700">
          <span className="text-base">{eventMeta?.emoji}</span>{' '}
          <span className="font-semibold">{eventMeta?.label}</span> · 활성 템플릿{' '}
          <span className="font-bold text-hydrangea-500">{activeCount}</span> / {TEMPLATES.length}
        </span>
        {pending && <span className="text-[10px] text-hydrangea-400">저장 중...</span>}
      </div>

      {/* 모든 템플릿 썸네일 그리드 — 토글로 활성/비활성 */}
      <div className="grid grid-cols-3 gap-2">
        {TEMPLATES.map((t) => {
          const active = isTemplateActive(t.id, t.recommendEvents);
          const inCode = (t.recommendEvents as readonly string[]).includes(eventId);
          const bg = getBackground(t.bg_id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleToggle(t)}
              disabled={pending}
              className={`relative aspect-[3/4] rounded-lg border-2 overflow-hidden transition active:scale-95 ${
                active
                  ? 'border-hydrangea-500 ring-2 ring-hydrangea-300 shadow-md'
                  : 'border-hydrangea-100/60 opacity-50 grayscale hover:opacity-75'
              }`}
              title={`${t.name}${inCode ? ' (코드 default)' : ''}`}
            >
              {bg.imageUrl ? (
                <img src={bg.imageUrl} alt={t.name} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0" style={{ background: bg.gradient }} />
              )}
              {/* 활성 시 보라 오버레이 */}
              {active && <div className="absolute inset-0 bg-hydrangea-500/15 pointer-events-none" />}
              {/* 체크 배지 — 활성 시 우상단 */}
              {active && (
                <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-hydrangea-500 flex items-center justify-center shadow-md ring-2 ring-white">
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </div>
              )}
              {/* 코드 default 표시 — 좌상단 */}
              {inCode && (
                <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-black/55 text-white text-[8px] font-semibold tracking-wide">
                  default
                </div>
              )}
              {/* 이름 */}
              <div className={`absolute bottom-0 left-0 right-0 text-white text-[8px] py-0.5 text-center truncate px-0.5 ${
                active ? 'bg-hydrangea-600 font-bold' : 'bg-black/45'
              }`}>
                {t.name}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
