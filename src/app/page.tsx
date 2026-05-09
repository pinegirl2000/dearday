import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Sparkles, Plus, Heart, ArrowRight, List } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import MobileShowcase from './_components/MobileShowcase';
import FadeIn from './_components/FadeIn';

const EVENT_KEYS = ['wedding', 'birthday', 'opening', 'baptism', 'meeting', 'etc'] as const;
const EVENT_EMOJI: Record<string, string> = {
  wedding: '💒', birthday: '🎂', opening: '🎉', baptism: '🕊️', meeting: '🤝', etc: '✉️'
};
const GOLD = '#C4A36A';

export default function Home() {
  const t = useTranslations('Home');
  const tEvent = useTranslations('EventTypes');

  return (
    <PageContainer noPadding className="bg-gradient-to-b from-hydrangea-50 via-white to-hydrangea-100/30">
      {/* ===== Hero ===== */}
      <section className="px-6 pt-10 pb-14 text-center relative">
        {/* gold corner ornaments */}
        <div className="absolute top-6 left-4 w-10 h-10 border-t border-l opacity-40 pointer-events-none"
          style={{ borderColor: GOLD }} />
        <div className="absolute top-6 right-4 w-10 h-10 border-t border-r opacity-40 pointer-events-none"
          style={{ borderColor: GOLD }} />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-hydrangea-100/60 text-xs text-hydrangea-700 font-medium mb-5">
          <Sparkles className="w-3 h-3" />
          Beta
        </div>

        <h1
          className="text-7xl mb-3 leading-[1.0] tracking-wide"
          style={{
            fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            fontWeight: 600,
            background: `linear-gradient(135deg, #4A2D6F 0%, #7B5EA7 55%, ${GOLD} 130%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: '#4A2D6F'
          }}
        >
          DearDay
        </h1>
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="block w-8 h-px" style={{ background: GOLD, opacity: 0.6 }} />
          <span className="text-[10px] tracking-[0.4em]" style={{ color: GOLD }}>EST. 2026 · SG</span>
          <span className="block w-8 h-px" style={{ background: GOLD, opacity: 0.6 }} />
        </div>
        <p className="text-hydrangea-500 text-base mb-1" style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic' }}>
          {t('tagline')}
        </p>
        <p className="text-hydrangea-400 text-xs tracking-widest uppercase">{t('subTagline')}</p>

        <div className="mt-9 flex flex-col gap-3">
          <Link
            href="/cards/new"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-white font-medium shadow-xl shadow-hydrangea-500/25 active:scale-95 transition relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, #5A3D7A 0%, #7B5EA7 60%, ${GOLD} 140%)`
            }}
          >
            <Plus className="w-5 h-5" />
            {t('createButton')}
          </Link>
          <Link
            href="/cards"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/70 backdrop-blur text-hydrangea-700 text-sm font-medium border border-hydrangea-100 active:scale-95 transition"
          >
            <List className="w-4 h-4" />
            {t('myInvitations')}
          </Link>
        </div>
      </section>

      {/* ===== Mobile Showcase — templates × samples × envelopes ===== */}
      <section className="px-4 pb-14">
        <FadeIn>
          <div className="text-center mb-5">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="block w-6 h-px" style={{ background: GOLD, opacity: 0.6 }} />
              <span className="text-[10px] tracking-[0.4em]" style={{ color: GOLD }}>SHOWCASE</span>
              <span className="block w-6 h-px" style={{ background: GOLD, opacity: 0.6 }} />
            </div>
            <h2
              className="text-3xl text-hydrangea-700 mb-1"
              style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500 }}
            >
              Designed for the smallest screen
            </h2>
            <p className="text-xs text-hydrangea-400">
              Real samples in real time — pick an event, see the magic
            </p>
          </div>
          <MobileShowcase />
        </FadeIn>
      </section>

      {/* ===== Event types ===== */}
      <section className="px-6 pb-12">
        <h2 className="text-xs font-semibold text-hydrangea-400 mb-3 tracking-wider uppercase text-center">
          {t('askEvent')}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {EVENT_KEYS.map((id, i) => (
            <FadeIn key={id} delay={i * 0.05}>
              <Link
                href={`/cards/new?type=${id}`}
                className="aspect-square rounded-2xl bg-white border border-hydrangea-100/50 flex flex-col items-center justify-center gap-1 active:scale-95 transition shadow-sm hover:border-hydrangea-200"
              >
                <span className="text-3xl">{EVENT_EMOJI[id]}</span>
                <span className="text-xs font-medium text-hydrangea-700">{tEvent(id)}</span>
              </Link>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ===== Why DearDay (3-column) ===== */}
      <section className="px-6 pb-14 relative">
        <FadeIn>
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="block w-6 h-px" style={{ background: GOLD, opacity: 0.6 }} />
              <span className="text-[10px] tracking-[0.4em]" style={{ color: GOLD }}>WHY US</span>
              <span className="block w-6 h-px" style={{ background: GOLD, opacity: 0.6 }} />
            </div>
            <h2
              className="text-3xl text-hydrangea-700"
              style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500 }}
            >
              {t('whyTitle')}
            </h2>
          </div>
        </FadeIn>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { titleKey: 'why1Title', descKey: 'why1Desc' },
            { titleKey: 'why2Title', descKey: 'why2Desc' },
            { titleKey: 'why3Title', descKey: 'why3Desc' }
          ].map((it, i) => (
            <FadeIn key={it.titleKey} delay={i * 0.08}>
              <div className="h-full p-5 rounded-2xl bg-white border border-hydrangea-100/60 shadow-sm">
                <h3 className="text-sm font-semibold text-hydrangea-700 mb-1.5">{t(it.titleKey)}</h3>
                <p className="text-xs text-hydrangea-500 leading-relaxed">{t(it.descKey)}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="px-6 pb-10 pt-4 text-center space-y-3 border-t border-hydrangea-100/50 mt-2">
        <p className="text-xs text-hydrangea-300 flex items-center justify-center gap-1">
          {t('footer')} <Heart className="w-3 h-3 fill-current text-hydrangea-400" /> DearDay
        </p>
        <nav className="flex items-center justify-center gap-3 text-[11px] text-hydrangea-400">
          <Link href="/about" className="hover:text-hydrangea-700">About</Link>
          <span>·</span>
          <Link href="/blog" className="hover:text-hydrangea-700">Blog</Link>
          <span>·</span>
          <Link href="/envelopes-demo" className="hover:text-hydrangea-700">Templates</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-hydrangea-700">Privacy</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-hydrangea-700">Terms</Link>
          <span>·</span>
          <Link href="/contact" className="hover:text-hydrangea-700">Contact</Link>
        </nav>
        <p className="text-[10px] text-hydrangea-300">© {new Date().getFullYear()} Steward+AI</p>
      </footer>
    </PageContainer>
  );
}
