'use client';

import { useWizardStore } from '@/stores/wizardStore';
import { Button, Input } from '@/components/ui';
import { Minus, Plus } from 'lucide-react';

export default function StepRsvp() {
  const { draft, setDraft, next } = useWizardStore();
  const max = (draft.rsvp_max_per_card || 4) as number;

  const adjustMax = (delta: number) => {
    const newMax = Math.max(1, Math.min(5, max + delta));
    setDraft({ rsvp_max_per_card: newMax as 1 | 2 | 3 | 4 | 5 });
  };

  return (
    <div>
      <h2 className="text-2xl font-serif text-hydrangea-700 mb-1">응답 설정</h2>
      <p className="text-sm text-hydrangea-400 mb-6">RSVP 옵션을 정해주세요</p>

      <div className="space-y-4">
        {/* RSVP enable toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-hydrangea-100/60">
          <div>
            <div className="font-semibold text-sm text-hydrangea-700">RSVP 받기</div>
            <div className="text-xs text-hydrangea-400 mt-0.5">참석 여부를 받습니다</div>
          </div>
          <button
            onClick={() => setDraft({ rsvp_enabled: !draft.rsvp_enabled })}
            className={`relative w-12 h-7 rounded-full transition ${
              draft.rsvp_enabled ? 'bg-hydrangea-500' : 'bg-hydrangea-100'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                draft.rsvp_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {draft.rsvp_enabled && (
          <>
            {/* Max per card */}
            <div className="p-4 rounded-xl bg-white border border-hydrangea-100/60">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-hydrangea-700">한 그룹 최대 인원</div>
                  <div className="text-xs text-hydrangea-400 mt-0.5">한 답신당 인원 제한</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => adjustMax(-1)}
                    className="w-8 h-8 rounded-full bg-hydrangea-100 flex items-center justify-center active:scale-90 transition"
                    disabled={max <= 1}
                  >
                    <Minus className="w-4 h-4 text-hydrangea-700" />
                  </button>
                  <span className="font-bold text-lg text-hydrangea-700 w-6 text-center">{max}</span>
                  <button
                    onClick={() => adjustMax(1)}
                    className="w-8 h-8 rounded-full bg-hydrangea-100 flex items-center justify-center active:scale-90 transition"
                    disabled={max >= 5}
                  >
                    <Plus className="w-4 h-4 text-hydrangea-700" />
                  </button>
                </div>
              </div>
            </div>

            {/* Collect names */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-hydrangea-100/60">
              <div>
                <div className="font-semibold text-sm text-hydrangea-700">참석자 이름 받기</div>
                <div className="text-xs text-hydrangea-400 mt-0.5">각 참석자 이름 입력 받음</div>
              </div>
              <button
                onClick={() => setDraft({ rsvp_collect_names: !draft.rsvp_collect_names })}
                className={`relative w-12 h-7 rounded-full transition ${
                  draft.rsvp_collect_names ? 'bg-hydrangea-500' : 'bg-hydrangea-100'
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    draft.rsvp_collect_names ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* RSVP deadline */}
            <Input
              label="RSVP 마감일 (선택)"
              type="date"
              value={draft.rsvp_deadline ? draft.rsvp_deadline.slice(0, 10) : ''}
              onChange={(e) => setDraft({ rsvp_deadline: e.target.value ? new Date(e.target.value).toISOString() : null })}
            />
          </>
        )}

        {/* Card expiry */}
        <Input
          label="카드 만료일 (선택)"
          type="date"
          hint="만료된 후엔 안내 메시지가 표시됩니다"
          value={draft.expiry_date ? draft.expiry_date.slice(0, 10) : ''}
          onChange={(e) => setDraft({ expiry_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
        />
      </div>

      <div className="mt-8 sticky bottom-0 bg-white pt-4 pb-4 -mx-5 px-5 border-t border-hydrangea-100/50">
        <Button onClick={next} full size="lg">
          미리보기
        </Button>
      </div>
    </div>
  );
}
