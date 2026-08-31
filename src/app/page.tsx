import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  Sparkles, Heart, ArrowRight, List, Calendar, Bell,
  Cake, Baby, Home as HomeIcon, Gem, Feather, Users, Flower, Flower2,
  GraduationCap, Briefcase, HandHeart, TrendingUp, HeartCrack,
  HeartHandshake, Gift, Moon, Flame, Cookie, TreePine, Flag,
  type LucideIcon
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import MobileShowcase from './_components/MobileShowcase';
import FadeIn from './_components/FadeIn';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUpcomingReminders } from '@/lib/actions/reminders';

const GOLD = '#C4A36A';

interface Occasion { id: string; Icon: LucideIcon; label: string; tint: string }

// 톤은 모든 occasion에 동일한 hydrangea 베이스 — 색상은 아이콘 stroke로만 차별화 (세련된 단일톤)
const INVITATIONS: Occasion[] = [
  { id: 'birthday',         Icon: Cake,         label: 'Birthday',        tint: '#B5896A' },
  { id: 'baby-full-month',  Icon: Baby,         label: 'Baby Full Month', tint: '#D89AAA' },
  { id: 'first-birthday',   Icon: Cookie,       label: '1st Birthday',    tint: '#C49880' },
  { id: 'housewarming',     Icon: HomeIcon,     label: 'Housewarming',    tint: '#7A9D85' },
  { id: 'engagement',       Icon: Gem,          label: 'Engagement',      tint: '#A985B5' },
  { id: 'baptism',          Icon: Feather,      label: 'Baptism',         tint: '#7E9AB5' },
  { id: 'meeting',          Icon: Users,        label: 'Gathering',       tint: '#6FA098' }
];

const THANKS: Occasion[] = [
  { id: 'mothers-day',  Icon: Flower,         label: 'Mum',         tint: '#D08AA5' },
  { id: 'fathers-day',  Icon: Briefcase,      label: 'Dad',         tint: '#5A7B96' },
  { id: 'teachers-day', Icon: Flower2,        label: 'Teacher',     tint: '#B58AA8' },
  { id: 'graduation',   Icon: GraduationCap,  label: 'Graduation',  tint: '#8A6FB5' },
  { id: 'thank-you',    Icon: HandHeart,      label: 'Thank you',   tint: '#B5896A' },
  { id: 'get-well',     Icon: Heart,          label: 'Get well',    tint: '#7A9D85' },
  { id: 'promotion',    Icon: TrendingUp,     label: 'Promotion',   tint: '#5F6FB5' },
  { id: 'sorry',        Icon: HeartCrack,     label: 'Sorry',       tint: '#8B95A0' }
];

const ANNIVERSARIES: Occasion[] = [
  { id: 'wedding-anniversary', Icon: HeartHandshake, label: 'Wedding Anniv.', tint: '#C97A8C' },
  { id: 'cny',                 Icon: Gift,           label: 'CNY',            tint: '#B85050' },
  { id: 'hari-raya',           Icon: Moon,           label: 'Hari Raya',      tint: '#5A8A6F' },
  { id: 'deepavali',           Icon: Flame,          label: 'Deepavali',      tint: '#C97A50' },
  { id: 'mid-autumn',          Icon: Cookie,         label: 'Mid-Autumn',     tint: '#B59850' },
  { id: 'christmas',           Icon: TreePine,       label: 'Christmas',      tint: '#5A8A6F' },
  { id: 'national-day',        Icon: Flag,           label: 'National Day',   tint: '#C95757' },
  { id: 'valentines',          Icon: Heart,          label: "Valentine's",    tint: '#C97A95' }
];

// 시즌별 강조 — 현재 월 기반
function getSeasonalHighlights(): Array<{ id: string; label: string; daysAway: number; emoji: string }> {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const highlights: Array<{ id: string; label: string; daysAway: number; emoji: string }> = [];

  // 5월 어버이날 (US 2nd Sun ~ May 11), 5월 어버이날 시즌
  if (m === 5 && d <= 14) highlights.push({ id: 'mothers-day', label: "Mother's Day", daysAway: Math.max(0, 11 - d), emoji: '💝' });
  // 6월 아버지의 날
  if (m === 6 && d <= 22) highlights.push({ id: 'fathers-day', label: "Father's Day", daysAway: Math.max(0, 15 - d), emoji: '💙' });
  // 8월 9일 National Day
  if (m === 8 && d <= 10) highlights.push({ id: 'national-day', label: 'National Day', daysAway: Math.max(0, 9 - d), emoji: '🇸🇬' });
  // 9월 1일 Teacher's Day
  if (m === 9 && d <= 2) highlights.push({ id: 'teachers-day', label: "Teacher's Day", daysAway: Math.max(0, 1 - d), emoji: '🌸' });
  // 9~10월 Mid-Autumn (변동 — 대략 9월 중순~10월 초)
  if ((m === 9 && d >= 10) || (m === 10 && d <= 7)) highlights.push({ id: 'mid-autumn', label: 'Mid-Autumn', daysAway: 0, emoji: '🥮' });
  // 11월 Deepavali (변동)
  if (m === 10 && d >= 20) highlights.push({ id: 'deepavali', label: 'Deepavali', daysAway: 0, emoji: '🪔' });
  if (m === 11 && d <= 5) highlights.push({ id: 'deepavali', label: 'Deepavali', daysAway: 0, emoji: '🪔' });
  // 12월 Christmas
  if (m === 12) highlights.push({ id: 'christmas', label: 'Christmas', daysAway: Math.max(0, 25 - d), emoji: '🎄' });
  // 1~2월 CNY
  if (m === 1 || (m === 2 && d <= 15)) highlights.push({ id: 'cny', label: 'Chinese New Year', daysAway: 0, emoji: '🧧' });
  // 2월 Valentine
  if (m === 2 && d <= 14) highlights.push({ id: 'valentines', label: "Valentine's Day", daysAway: Math.max(0, 14 - d), emoji: '❤️' });

  return highlights.slice(0, 2); // 최대 2개만
}

function OccasionGrid({ items }: { items: Occasion[] }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((occ) => (
        <Link
          key={occ.id}
          href={`/cards/new?type=${occ.id}`}
          className="group relative flex flex-col items-center justify-center gap-2 py-4 min-h-[86px] rounded-xl bg-gradient-to-b from-white to-hydrangea-50/40 border border-hydrangea-100/60 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-hydrangea-200 active:scale-95 transition"
        >
          <span
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-hydrangea-100/80 group-hover:scale-105 transition"
            style={{ color: occ.tint }}
          >
            <occ.Icon className="w-5 h-5" strokeWidth={1.5} aria-hidden />
          </span>
          <span className="text-[11px] font-medium text-hydrangea-700 text-center leading-tight px-1 tracking-tight">
            {occ.label}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default async function Home() {
  const t = await getTranslations('Home');
  const seasonals = getSeasonalHighlights();
  // 로그인 사용자의 다가오는 기념일 (다음 14일 이내) — 배너 노출
  const session = await getServerSession(authOptions);
  const upcomingReminders = session ? await getUpcomingReminders(14) : [];

  return (
    <PageContainer noPadding className="bg-gradient-to-b from-hydrangea-50 via-white to-hydrangea-100/30">
      {/* ===== Hero ===== */}
      <section className="px-6 pt-10 pb-6 text-center relative">
        <div className="absolute top-6 left-4 w-10 h-10 border-t border-l opacity-40 pointer-events-none" style={{ borderColor: GOLD }} />
        <div className="absolute top-6 right-4 w-10 h-10 border-t border-r opacity-40 pointer-events-none" style={{ borderColor: GOLD }} />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-hydrangea-100/60 text-xs text-hydrangea-700 font-medium mb-4">
          <Sparkles className="w-3 h-3" />
          Beta · Free
        </div>

        <h1
          className="text-6xl mb-2 leading-[1.0] tracking-wide"
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
        <p className="text-base text-hydrangea-700 mb-1" style={{ fontFamily: "var(--font-cormorant), serif" }}>
          Send a heartfelt card in 30 seconds
        </p>
        <p className="text-xs text-hydrangea-400 tracking-wide">
          Invitations · Greetings · Holidays — all in one place
        </p>
      </section>

      {/* ===== Personal reminders (로그인 사용자의 다가오는 기념일) ===== */}
      {upcomingReminders.length > 0 && (
        <section className="px-5 pb-4">
          <FadeIn>
            <div className="space-y-2">
              {upcomingReminders.slice(0, 2).map((r) => {
                const occMeta: Record<string, { emoji: string; label: string }> = {
                  'birthday':              { emoji: '🎂', label: 'Birthday' },
                  'mothers-day':           { emoji: '💝', label: "Mother's Day" },
                  'fathers-day':           { emoji: '💙', label: "Father's Day" },
                  'wedding-anniversary':   { emoji: '💑', label: 'Wedding Anniversary' },
                  'graduation':            { emoji: '🎓', label: 'Graduation' }
                };
                const meta = occMeta[r.occasion] || { emoji: '📅', label: r.occasion_label || 'Special day' };
                const cardType = r.occasion === 'other' ? 'etc' : r.occasion;
                return (
                  <Link
                    key={r.id}
                    href={`/cards/new?type=${cardType}`}
                    className="block px-4 py-3 rounded-2xl bg-gradient-to-r from-hydrangea-100 via-purple-50 to-pink-50 border border-hydrangea-200/50 active:scale-[0.98] transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{meta.emoji}</span>
                        <div>
                          <div className="text-sm font-semibold text-hydrangea-700">
                            {r.person_name}'s {meta.label}
                          </div>
                          <div className="text-[10px] text-hydrangea-500">
                            {r.days_away === 0 ? 'Today' : r.days_away === 1 ? 'Tomorrow' : `in ${r.days_away} days`} · Tap to make a card →
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-hydrangea-600 flex-shrink-0" />
                    </div>
                  </Link>
                );
              })}
              <Link
                href="/reminders"
                className="block text-center text-[10px] text-hydrangea-500 hover:text-hydrangea-700 py-1"
              >
                <Bell className="w-3 h-3 inline -mt-0.5 mr-0.5" />
                Manage my reminders
              </Link>
            </div>
          </FadeIn>
        </section>
      )}

      {/* ===== Seasonal highlights ===== */}
      {seasonals.length > 0 && (
        <section className="px-5 pb-4">
          <FadeIn>
            <div className="space-y-2">
              {seasonals.map((s) => (
                <Link
                  key={s.id}
                  href={`/cards/new?type=${s.id}`}
                  className="block px-4 py-3 rounded-2xl bg-gradient-to-r from-rose-100 via-pink-50 to-amber-50 border border-rose-200/50 active:scale-[0.98] transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{s.emoji}</span>
                      <div>
                        <div className="text-sm font-semibold text-rose-700">
                          {s.label}{s.daysAway > 0 ? ` in ${s.daysAway} ${s.daysAway === 1 ? 'day' : 'days'}` : ' is here'}
                        </div>
                        <div className="text-[10px] text-rose-500">Tap to start your card →</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </FadeIn>
        </section>
      )}

      {/* ===== 3 Categories ===== */}
      <section className="px-5 pb-8 space-y-6">
        <FadeIn delay={0.05}>
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-base font-semibold text-hydrangea-700 flex items-center gap-1.5">
                🎉 <span>Invitation</span>
              </h2>
              <span className="text-[10px] text-hydrangea-400">Date · Place · RSVP</span>
            </div>
            <OccasionGrid items={INVITATIONS} />
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-base font-semibold text-hydrangea-700 flex items-center gap-1.5">
                💝 <span>Thank · Congrats</span>
              </h2>
              <span className="text-[10px] text-hydrangea-400">For someone special</span>
            </div>
            <OccasionGrid items={THANKS} />
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-base font-semibold text-hydrangea-700 flex items-center gap-1.5">
                📅 <span>Anniversary · Holiday</span>
              </h2>
              <span className="text-[10px] text-hydrangea-400">Seasonal & annual</span>
            </div>
            <OccasionGrid items={ANNIVERSARIES} />
          </div>
        </FadeIn>

        <div className="text-center pt-2">
          <Link
            href="/cards"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white text-hydrangea-600 text-xs font-medium border border-hydrangea-100 active:scale-95 transition"
          >
            <List className="w-3.5 h-3.5" />
            {t('myInvitations')}
          </Link>
        </div>
      </section>

      {/* ===== Mobile Showcase ===== */}
      <section className="px-4 pb-10">
        <FadeIn>
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-3 mb-1.5">
              <span className="block w-6 h-px" style={{ background: GOLD, opacity: 0.6 }} />
              <span className="text-[10px] tracking-[0.4em]" style={{ color: GOLD }}>SHOWCASE</span>
              <span className="block w-6 h-px" style={{ background: GOLD, opacity: 0.6 }} />
            </div>
            <h2 className="text-2xl text-hydrangea-700" style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500 }}>
              Beautiful by default
            </h2>
            <p className="text-xs text-hydrangea-400 mt-1">
              No design skills needed — your card is ready in seconds
            </p>
          </div>
          <MobileShowcase />
        </FadeIn>
      </section>

      {/* ===== Footer ===== */}
      <footer className="px-6 pb-10 pt-4 text-center space-y-3 border-t border-hydrangea-100/50 mt-2">
        <p className="text-xs text-hydrangea-300 flex items-center justify-center gap-1">
          {t('footer')} <Heart className="w-3 h-3 fill-current text-hydrangea-400" /> DearDay
        </p>
        <nav className="flex items-center justify-center gap-3 text-[11px] text-hydrangea-400 flex-wrap">
          <Link href="/reminders" className="hover:text-hydrangea-700">Reminders</Link>
          <span>·</span>
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
