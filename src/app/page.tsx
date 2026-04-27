import Link from 'next/link';
import { Sparkles, Plus, Heart, ArrowRight } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';

const FEATURES = [
  { icon: '💌', title: '4가지 봉투', desc: 'Flip · Fold · Slide · Pop' },
  { icon: '🎨', title: '4가지 테마', desc: 'Hydrangea · Modern · Vintage · Minimal' },
  { icon: '✨', title: 'RSVP & 답신 피드', desc: '실시간 응답 + 한줄 인사' }
];

const EVENT_TYPES = [
  { id: 'wedding', emoji: '💒', label: '결혼식' },
  { id: 'birthday', emoji: '🎂', label: '생일·돌' },
  { id: 'opening', emoji: '🎉', label: '개업' },
  { id: 'baptism', emoji: '🕊️', label: '세례식' },
  { id: 'meeting', emoji: '🤝', label: '모임' },
  { id: 'etc', emoji: '✉️', label: '기타' }
];

export default function Home() {
  return (
    <PageContainer noPadding className="bg-gradient-to-b from-hydrangea-50 via-white to-hydrangea-100/30">
      {/* Hero */}
      <section className="px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-hydrangea-100/60 text-xs text-hydrangea-700 font-medium mb-6">
          <Sparkles className="w-3 h-3" />
          Beta
        </div>
        <h1 className="font-serif text-5xl text-hydrangea-700 mb-3 leading-tight">DearDay</h1>
        <p className="text-hydrangea-500 text-base mb-2">소중한 날을 초대하다</p>
        <p className="text-hydrangea-400 text-sm">결혼 · 생일 · 개업 · 모임</p>

        <div className="mt-10 flex flex-col gap-3">
          <Link
            href="/cards/new"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-hydrangea-500 text-white font-medium shadow-xl shadow-hydrangea-500/25 active:scale-95 transition"
          >
            <Plus className="w-5 h-5" />
            초대장 만들기
          </Link>
          <Link
            href="/envelopes-demo"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/70 backdrop-blur text-hydrangea-700 text-sm font-medium border border-hydrangea-100 active:scale-95 transition"
          >
            봉투 미리보기
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Event types */}
      <section className="px-6 pb-10">
        <h2 className="text-xs font-semibold text-hydrangea-400 mb-3 tracking-wider uppercase">
          어떤 날을 초대하시나요?
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {EVENT_TYPES.map((e) => (
            <Link
              key={e.id}
              href={`/cards/new?type=${e.id}`}
              className="aspect-square rounded-2xl bg-white border border-hydrangea-100/50 flex flex-col items-center justify-center gap-1 active:scale-95 transition shadow-sm"
            >
              <span className="text-3xl">{e.emoji}</span>
              <span className="text-xs font-medium text-hydrangea-700">{e.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-16">
        <div className="space-y-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-hydrangea-100/50">
              <span className="text-2xl">{f.icon}</span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-hydrangea-700">{f.title}</h3>
                <p className="text-xs text-hydrangea-400 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-6 pb-10 text-center">
        <p className="text-xs text-hydrangea-300 flex items-center justify-center gap-1">
          made with <Heart className="w-3 h-3 fill-current text-hydrangea-400" /> DearDay
        </p>
      </footer>
    </PageContainer>
  );
}
