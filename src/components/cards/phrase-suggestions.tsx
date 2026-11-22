'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { getPhraseSuggestions, type PhraseLang } from '@/lib/phrases';

const LANGS: Array<{ id: PhraseLang; label: string }> = [
  { id: 'en', label: 'English' },
  { id: 'ko', label: '한국어' }
];

interface Props {
  /** 행사 id (draft.event_type) */
  eventId: string | null | undefined;
  /** 편집 중인 입력칸 키 — 한 줄 문구·본문만 추천이 있음 */
  field: string;
  /** 현재 입력값 — 같은 문구는 선택 상태로 표시 */
  value: string;
  onPick: (phrase: string) => void;
  title: string;
  hint: string;
}

/**
 * 추천 문구 목록 — 행사에 맞는 자주 쓰는 문구를 눌러 입력칸에 넣는다.
 * 넣은 뒤 사용자가 이름·사정에 맞게 고쳐 쓰는 것을 전제로, 누르면 입력값을 통째로 바꾼다.
 */
export function PhraseSuggestions({ eventId, field, value, onPick, title, hint }: Props) {
  // 처음엔 사이트 언어에 맞는 문구를 보여 주되, 한국어 화면에서도 영어 카드를 쓰는 경우가 많아 바로 바꿀 수 있게 함
  const locale = useLocale();
  const [lang, setLang] = useState<PhraseLang>(locale === 'ko' ? 'ko' : 'en');
  const suggestions = getPhraseSuggestions(eventId, field, lang);
  if (suggestions.length === 0) return null;
  return (
    <div className="pt-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-hydrangea-700">{title}</p>
        <div className="inline-flex rounded-full border border-hydrangea-200 p-0.5" role="group" aria-label="Language">
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              aria-pressed={lang === l.id}
              onClick={() => setLang(l.id)}
              className={`px-3 min-h-[32px] rounded-full text-[11px] font-medium transition ${
                lang === l.id ? 'bg-hydrangea-600 text-white' : 'text-hydrangea-600 hover:bg-hydrangea-50'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-hydrangea-400 mb-1.5">{hint}</p>
      <ul className="space-y-1.5 max-h-[38vh] overflow-y-auto pr-0.5" data-phrase-list>
        {suggestions.map((phrase) => {
          const selected = value === phrase;
          return (
            <li key={phrase}>
              <button
                type="button"
                data-phrase
                aria-pressed={selected}
                onClick={() => onPick(phrase)}
                className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-left text-[13px] leading-snug whitespace-pre-line transition ${
                  selected
                    ? 'border-hydrangea-500 bg-hydrangea-50 text-hydrangea-700'
                    : 'border-hydrangea-100 bg-white text-hydrangea-600 hover:border-hydrangea-300 hover:bg-hydrangea-50/60'
                }`}
              >
                {phrase}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
