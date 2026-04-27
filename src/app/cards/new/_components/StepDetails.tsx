'use client';

import { useEffect } from 'react';
import { useWizardStore } from '@/stores/wizardStore';
import { getEventTypeMeta } from '@/lib/eventType';
import { Input, Textarea, Button, PhoneInput } from '@/components/ui';

export default function StepDetails() {
  const { draft, setDraft, next } = useWizardStore();
  const meta = getEventTypeMeta(draft.event_type || 'etc');

  // 첫 진입 시 placeholder가 비어있으면 기본 메시지 적용 (한 번만)
  useEffect(() => {
    if (!draft.body && !draft.title && draft.event_type) {
      setDraft({
        body: meta.fields.bodyPlaceholder,
        theme: meta.recommendTheme as any,
        envelope_anim: meta.recommendEnvelope as any
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canProceed = !!(draft.title && draft.title.trim() && draft.event_date);

  return (
    <div>
      <h2 className="text-2xl font-serif text-hydrangea-700 mb-1">{meta.label} 정보를 입력하세요</h2>
      <p className="text-sm text-hydrangea-400 mb-6">필수 정보 4가지</p>

      <div className="space-y-4">
        <Input
          label={meta.fields.titleLabel}
          placeholder={meta.fields.titlePlaceholder}
          value={draft.title || ''}
          onChange={(e) => setDraft({ title: e.target.value })}
        />

        <Input
          label="부제목 (제목 아래 한 줄)"
          placeholder="예: 두 사람이 하나가 되는 날"
          hint="비워둬도 됩니다"
          value={draft.greeting_oneliner || ''}
          onChange={(e) => setDraft({ greeting_oneliner: e.target.value })}
        />

        {(() => {
          const dt = draft.event_date ? new Date(draft.event_date) : null;
          const dateStr = dt && !isNaN(dt.getTime())
            ? `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
            : '';
          const timeStr = dt && !isNaN(dt.getTime())
            ? `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`
            : '';
          const updateDateTime = (date: string, time: string) => {
            if (!date) {
              setDraft({ event_date: null });
              return;
            }
            const [h, m] = (time || '00:00').split(':').map(Number);
            const [y, mo, d] = date.split('-').map(Number);
            const local = new Date(y, mo - 1, d, h || 0, m || 0);
            setDraft({ event_date: local.toISOString() });
          };
          return (
            <div>
              <label className="block text-sm font-medium text-hydrangea-700 mb-1.5">일시</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => updateDateTime(e.target.value, timeStr)}
                  className="w-full min-h-[56px] px-4 rounded-xl border border-hydrangea-100 bg-white text-hydrangea-700 text-base focus:outline-none focus:ring-2 focus:ring-hydrangea-300 [color-scheme:light]"
                  style={{ fontSize: '16px' }}
                />
                <input
                  type="time"
                  step={300}
                  value={timeStr}
                  onChange={(e) => updateDateTime(dateStr, e.target.value)}
                  className="w-full min-h-[56px] px-4 rounded-xl border border-hydrangea-100 bg-white text-hydrangea-700 text-base focus:outline-none focus:ring-2 focus:ring-hydrangea-300 [color-scheme:light]"
                  style={{ fontSize: '16px' }}
                />
              </div>
              {dt && !isNaN(dt.getTime()) && (
                <p className="text-xs text-hydrangea-500 mt-2">
                  {dt.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })} {dt.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })}
                </p>
              )}
            </div>
          );
        })()}

        <Input
          label="장소"
          placeholder="예: 라비두스 웨딩홀 5F"
          value={draft.event_place || ''}
          onChange={(e) => setDraft({ event_place: e.target.value })}
        />

        <Input
          label="지도 링크 (선택)"
          placeholder="네이버/구글 지도 URL"
          value={draft.map_url || ''}
          onChange={(e) => setDraft({ map_url: e.target.value })}
        />

        <Input
          label="연락처 이름"
          placeholder="대표"
          value={draft.contact_name || ''}
          onChange={(e) => setDraft({ contact_name: e.target.value })}
        />
        <PhoneInput
          label="전화"
          value={draft.contact_phone || ''}
          onChange={(phone) => setDraft({ contact_phone: phone })}
        />

        <Textarea
          label="본문 메시지"
          placeholder={meta.fields.bodyPlaceholder}
          value={draft.body || ''}
          onChange={(e) => setDraft({ body: e.target.value })}
          rows={5}
        />

        <Textarea
          label="기타 안내 (선택)"
          placeholder="주차 안내, 주의사항 등"
          value={draft.extra_info || ''}
          onChange={(e) => setDraft({ extra_info: e.target.value })}
          rows={3}
        />

      </div>

      <div className="mt-8 sticky bottom-0 bg-white pt-4 pb-4 -mx-5 px-5 border-t border-hydrangea-100/50">
        <Button onClick={next} disabled={!canProceed} full size="lg">
          다음
        </Button>
        {!canProceed && (
          <p className="text-xs text-hydrangea-400 text-center mt-2">제목과 일시는 필수입니다</p>
        )}
      </div>
    </div>
  );
}
