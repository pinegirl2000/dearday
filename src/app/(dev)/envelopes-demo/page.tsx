'use client';

import { useState } from 'react';
import { ClassicEnvelope, EnvelopeBeige, NoneEnvelope } from '@/components/envelopes';

type Key = 'envelope-1' | 'envelope-2' | 'none';

const ITEMS: {
  key: Key;
  title: string;
  recommend: string;
  Component: React.ComponentType<any>;
  highlight?: boolean;
  content: React.ReactNode;
}[] = [
  {
    key: 'envelope-1',
    title: '보라 클래식 ⭐',
    recommend: '결혼 / 환영회',
    Component: ClassicEnvelope,
    highlight: true,
    content: (
      <div>
        <p className="font-serif text-lg">민준 ♥ 서연</p>
        <p className="mt-2 text-sm text-neutral-500">2026년 6월 14일 토요일</p>
      </div>
    )
  },
  {
    key: 'envelope-2',
    title: '베이지 입체',
    recommend: '세례 / 모임',
    Component: EnvelopeBeige,
    content: (
      <div>
        <p className="font-serif text-lg">하준 세례식</p>
        <p className="mt-2 text-sm text-neutral-500">2026년 5월 3일 일요일</p>
      </div>
    )
  },
  {
    key: 'none',
    title: '봉투 없음',
    recommend: '간편 모임',
    Component: NoneEnvelope,
    content: (
      <div>
        <p className="font-serif text-lg">봉투 없는 깔끔 카드</p>
        <p className="mt-2 text-sm text-neutral-500">바로 펼쳐지는 미니멀</p>
      </div>
    )
  }
];

export default function EnvelopesDemoPage() {
  const [open, setOpen] = useState<Record<Key, boolean>>({ 'envelope-1': false, 'envelope-2': false, none: false });
  const toggle = (k: Key) => setOpen((s) => ({ ...s, [k]: !s[k] }));

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7f3fb] to-[#ece2f5] py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-serif text-[#4a3570]">DearDay 봉투</h1>
          <p className="mt-2 text-neutral-500 text-sm">카드를 클릭해서 열어보세요</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ITEMS.map(({ key, title, recommend, Component, highlight, content }) => (
            <section
              key={key}
              className={`bg-white/60 backdrop-blur rounded-2xl p-6 shadow-sm flex flex-col items-center ${highlight ? 'ring-2 ring-[#7B5EA7]/40' : ''}`}
            >
              <div className="w-full flex items-baseline justify-between mb-4">
                <h2 className="font-serif text-xl text-[#4a3570]">{title}</h2>
                <span className="text-xs text-neutral-500">{recommend}</span>
              </div>

              <div className="w-full flex justify-center min-h-[420px] items-end">
                <Component isOpen={open[key]} width={300}>
                  {content}
                </Component>
              </div>

              <button
                type="button"
                onClick={() => toggle(key)}
                className="mt-6 px-6 py-2.5 rounded-full bg-[#7B5EA7] text-white text-sm font-medium shadow-lg hover:bg-[#6B4D9C] active:scale-95 transition self-center"
              >
                {open[key] ? '닫기' : '열기'}
              </button>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
