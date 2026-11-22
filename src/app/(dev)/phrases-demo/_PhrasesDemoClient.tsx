'use client';

import { useState } from 'react';
import { PhraseSuggestions } from '@/components/cards/phrase-suggestions';
import { PHRASES } from '@/lib/phrases';

/** 개발 전용 — 카드 만들기 2단계가 로그인을 요구해 로컬에서 열 수 없으므로, 추천 문구 목록의 동작을 여기서 확인 */
export default function PhrasesDemoClient() {
  const [eventId, setEventId] = useState('birthday');
  const [field, setField] = useState<'greeting_oneliner' | 'body' | 'title'>('body');
  const [value, setValue] = useState('');
  return (
    <main className="max-w-md mx-auto p-4 space-y-3">
      <div className="flex gap-2">
        <select aria-label="occasion" value={eventId} onChange={(e) => { setEventId(e.target.value); setValue(''); }} className="border rounded px-2 py-1 text-sm">
          {Object.keys(PHRASES).map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <select aria-label="field" value={field} onChange={(e) => { setField(e.target.value as typeof field); setValue(''); }} className="border rounded px-2 py-1 text-sm">
          <option value="greeting_oneliner">greeting_oneliner</option>
          <option value="body">body</option>
          <option value="title">title</option>
        </select>
      </div>
      <textarea aria-label="value" value={value} onChange={(e) => setValue(e.target.value)} rows={4} className="w-full border rounded-xl p-3 text-sm" />
      <PhraseSuggestions eventId={eventId} field={field} value={value} onPick={setValue} title="Popular wording" hint="Tap one to use it, then edit as you like" />
    </main>
  );
}
