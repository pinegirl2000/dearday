import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Sparkles, Plus, Heart, ArrowRight, List } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import AuthButton from '@/components/auth/AuthButton';

const EVENT_KEYS = ['wedding', 'birthday', 'opening', 'baptism', 'meeting', 'etc'] as const;
const EVENT_EMOJI: Record<string, string> = {
  wedding: '💒', birthday: '🎂', opening: '🎉', baptism: '🕊️', meeting: '🤝', etc: '✉️'
};

export default function Home() {
  const t = useTranslations('Home');
  const tEvent = useTranslations('EventTypes');

  return (
    <PageContainer noPadding className="bg-gradient-to-b from-hydrangea-50 via-white to-hydrangea-100/30">
      {/* Top bar with auth + locale */}
      <div className="flex justify-between items-center px-3 pt-3 gap-2">
        <AuthButton />
        <LocaleSwitcher />
      </div>

      {/* Hero */}
      <section className="px-6 pt-8 pb-12 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-hydrangea-100/60 text-xs text-hydrangea-700 font-medium mb-6">
          <Sparkles className="w-3 h-3" />
          Beta
        </div>
        <h1 className="font-serif text-5xl text-hydrangea-700 mb-3 leading-tight">DearDay</h1>
        <p className="text-hydrangea-500 text-base mb-2">{t('tagline')}</p>
        <p className="text-hydrangea-400 text-sm">{t('subTagline')}</p>

        <div className="mt-10 flex flex-col gap-3">
          <Link
            href="/cards/new"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-hydrangea-500 text-white font-medium shadow-xl shadow-hydrangea-500/25 active:scale-95 transition"
          >
            <Plus className="w-5 h-5" />
            {t('createButton')}
          </Link>
          <Link
            href="/cards"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/70 backdrop-blur text-hydrangea-700 text-sm font-medium border border-hydrangea-100 active:scale-95 transition"
          >
            <List className="w-4 h-4" />
            발행한 초대장 보기
          </Link>
          <Link
            href="/envelopes-demo"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/70 backdrop-blur text-hydrangea-700 text-sm font-medium border border-hydrangea-100 active:scale-95 transition"
          >
            {t('previewEnvelopes')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Event types */}
      <section className="px-6 pb-10">
        <h2 className="text-xs font-semibold text-hydrangea-400 mb-3 tracking-wider uppercase">
          {t('askEvent')}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {EVENT_KEYS.map((id) => (
            <Link
              key={id}
              href={`/cards/new?type=${id}`}
              className="aspect-square rounded-2xl bg-white border border-hydrangea-100/50 flex flex-col items-center justify-center gap-1 active:scale-95 transition shadow-sm"
            >
              <span className="text-3xl">{EVENT_EMOJI[id]}</span>
              <span className="text-xs font-medium text-hydrangea-700">{tEvent(id)}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-16">
        <div className="space-y-2">
          <FeatureRow icon="💌" title={t('feature1Title')} desc={t('feature1Desc')} />
          <FeatureRow icon="🎨" title={t('feature2Title')} desc={t('feature2Desc')} />
          <FeatureRow icon="✨" title={t('feature3Title')} desc={t('feature3Desc')} />
        </div>
      </section>

      <footer className="px-6 pb-10 text-center">
        <p className="text-xs text-hydrangea-300 flex items-center justify-center gap-1">
          {t('footer')} <Heart className="w-3 h-3 fill-current text-hydrangea-400" /> DearDay
        </p>
      </footer>
    </PageContainer>
  );
}

function FeatureRow({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-hydrangea-100/50">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-hydrangea-700">{title}</h3>
        <p className="text-xs text-hydrangea-400 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
