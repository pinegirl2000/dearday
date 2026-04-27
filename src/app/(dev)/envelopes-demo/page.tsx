'use client';

import { useState } from 'react';
import { FoldEnvelope, SlideEnvelope, FlipEnvelope, PopEnvelope } from '@/components/envelopes';

type Key = 'fold' | 'slide' | 'flip' | 'pop';

const ITEMS: {
  key: Key;
  title: string;
  recommend: string;
  Component: React.ComponentType<any>;
  envelopeColor?: string;
  sealColor?: string;
  content: React.ReactNode;
}[] = [
  {
    key: 'fold',
    title: 'Fold',
    recommend: '결혼식 / 세례',
    Component: FoldEnvelope,
    envelopeColor: '#7B5EA7',
    sealColor: '#C9A0DC',
    content: (
      <div>
        <p className="font-serif text-lg">민준 ♥ 서연</p>
        <p className="mt-2 text-sm text-neutral-500">2026년 6월 14일 토요일</p>
      </div>
    )
  },
  {
    key: 'slide',
    title: 'Slide',
    recommend: '생일 / 돌잔치',
    Component: SlideEnvelope,
    envelopeColor: '#8E6FB8',
    sealColor: '#D4B0E0',
    content: (
      <div>
        <p className="font-serif text-lg">하준이 첫 생일</p>
        <p className="mt-2 text-sm text-neutral-500">2026년 5월 3일 일요일</p>
      </div>
    )
  },
  {
    key: 'flip',
    title: 'Flip',
    recommend: '개업 / 약혼',
    Component: FlipEnvelope,
    envelopeColor: '#6B4D9C',
    sealColor: '#BFA0D8',
    content: (
      <div>
        <p className="font-serif text-lg">DearDay Studio Open</p>
        <p className="mt-2 text-sm text-neutral-500">2026년 5월 20일</p>
      </div>
    )
  },
  {
    key: 'pop',
    title: 'Pop',
    recommend: '캐주얼 모임',
    Component: PopEnvelope,
    envelopeColor: '#9B7FC4',
    sealColor: '#E0BCEB',
    content: (
      <div>
        <p className="font-serif text-lg">금요일 저녁 모임</p>
        <p className="mt-2 text-sm text-neutral-500">편하게 오세요!</p>
      </div>
    )
  }
];

export default function EnvelopesDemoPage() {
  const [open, setOpen] = useState<Record<Key, boolean>>({ fold: false, slide: false, flip: false, pop: false });
  const toggle = (k: Key) => setOpen((s) => ({ ...s, [k]: !s[k] }));

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7f3fb] to-[#ece2f5] py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-serif text-[#4a3570]">DearDay 봉투 애니메이션</h1>
          <p className="mt-2 text-neutral-500 text-sm">4가지 컨셉의 모바일 초대장 봉투 — 카드를 탭해서 열어보세요.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {ITEMS.map(({ key, title, recommend, Component, envelopeColor, sealColor, content }) => (
            <section key={key} className="bg-white/60 backdrop-blur rounded-2xl p-6 shadow-sm flex flex-col items-center">
              <div className="w-full flex items-baseline justify-between mb-4">
                <h2 className="font-serif text-xl text-[#4a3570]">{title}</h2>
                <span className="text-xs text-neutral-500">추천: {recommend}</span>
              </div>
              <div className="w-full flex justify-center">
                <Component isOpen={open[key]} envelopeColor={envelopeColor} sealColor={sealColor} width={320}>
                  {content}
                </Component>
              </div>
              <button
                type="button"
                onClick={() => toggle(key)}
                className="mt-6 px-5 py-2 rounded-full bg-[#7B5EA7] text-white text-sm shadow hover:bg-[#6B4D9C] active:scale-95 transition"
              >
                {open[key] ? '봉투 닫기' : '초대장 열기'}
              </button>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
