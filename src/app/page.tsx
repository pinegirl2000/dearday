import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  Sparkles, Heart, ArrowRight, List, Calendar, Bell, PartyPopper, CalendarHeart,
  Cake, Baby, Home as HomeIcon, Gem, Feather, Users, Flower, Flower2,
  GraduationCap, Briefcase, HandHeart, TrendingUp, HeartCrack,
  HeartHandshake, Gift, Moon, Flame, Cookie, TreePine, Flag,
  type LucideIcon
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import MobileShowcase from './_components/MobileShowcase';
import FadeIn from './_components/FadeIn';
import HeroCards from './_components/HeroCards';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUpcomingReminders } from '@/lib/actions/reminders';

const GOLD = '#C4A36A';
// 랜딩 본문 글자색 — 순검정 대신 브랜드 보라를 깊게 내린 가지색 (흰 배경 대비 13:1 / 보조 7:1)
const INK = '#2E2140';
const INK_SOFT = '#5B4C70';
// 🔧 장식선은 GOLD 유지, 작은 글자는 대비 확보를 위해 짙은 금색 사용 (#C4A36A 는 흰 배경 2.4:1)
const GOLD_TEXT = '#8A6D33';

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

/** 사용법 3단계 — 카드 만들기 화면의 실제 순서(디자인 → 내용 → 보내기)와 같다 */
const HOW_IT_WORKS = [
  { title: 'Pick a design', body: 'Choose an occasion and a card. Each one comes with an envelope that opens when your guest taps it.' },
  { title: 'Write your message', body: 'Start from wording people actually use for that occasion, then make it yours. Add the date and place.' },
  { title: 'Share one link', body: 'Send it on WhatsApp or anywhere else. Replies come in as guests answer, so you always know the headcount.' }
];

function OccasionGrid({ items }: { items: Occasion[] }) {
  // 🔧 모바일 4열 → 데스크톱 8열: 카테고리 한 줄에 모두 보이도록
  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-3">
      {items.map((occ) => (
        <Link
          key={occ.id}
          href={`/cards/new?type=${occ.id}`}
          className="group relative flex flex-col items-center justify-center gap-2 py-4 min-h-[88px] md:min-h-[104px] rounded-xl bg-gradient-to-b from-white to-hydrangea-50/40 border border-hydrangea-100/60 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-hydrangea-200 hover:-translate-y-0.5 active:scale-95 transition duration-200"
        >
          <span
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-hydrangea-100/80 group-hover:scale-105 transition"
            style={{ color: occ.tint }}
          >
            <occ.Icon className="w-5 h-5" strokeWidth={1.5} aria-hidden />
          </span>
          <span className="text-xs md:text-[13px] font-medium text-hydrangea-700 text-center leading-tight px-1 tracking-tight">
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
    <PageContainer noPadding size="wide" className="bg-white">
      {/* ===== Hero — 왼쪽: 무엇을 하는 서비스인지 한 문장 + 시작 버튼 / 오른쪽: 실제 카드 세 장 ===== */}
      {/* overflow-x-clip: 기울어진 카드 모서리가 화면 밖으로 나가 가로 스크롤이 생기는 것 방지(세로 그림자는 유지) */}
      <section className="px-6 md:px-10 pt-10 md:pt-16 pb-10 md:pb-16 grid gap-10 md:gap-6 md:grid-cols-[1.05fr_1fr] md:items-center overflow-x-clip">
        <div className="text-center md:text-left">
          <h1
            className="text-[2.75rem] leading-[1.04] md:text-6xl lg:text-7xl md:leading-[1.02]"
            style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 500, color: INK, letterSpacing: '-0.01em' }}
          >
            Invitations people are happy to open
          </h1>
          <p className="mt-4 md:mt-5 text-base md:text-lg leading-relaxed mx-auto md:mx-0 max-w-[34ch]" style={{ color: INK_SOFT }}>
            Pick a design, write your message and share one link. Guests reply on their phone and you see who is coming.
          </p>
          <div className="mt-6 md:mt-8 flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start">
            <Link
              href="/cards/new"
              className="inline-flex items-center justify-center h-12 px-7 rounded-full text-white text-base font-medium shadow-lg hover:shadow-xl active:scale-[0.98] transition"
              style={{ background: INK }}
            >
              {t('createButton')}
            </Link>
            <Link
              href="#occasions"
              className="inline-flex items-center justify-center h-12 px-5 rounded-full text-base font-medium underline-offset-4 hover:underline"
              style={{ color: INK }}
            >
              Browse by occasion
            </Link>
          </div>
          <p className="mt-4 text-sm" style={{ color: INK_SOFT }}>Free while in beta. No app to install.</p>
        </div>
        <HeroCards />
      </section>

      {/* ===== Personal reminders (로그인 사용자의 다가오는 기념일) ===== */}
      {upcomingReminders.length > 0 && (
        <section className="px-5 md:px-10 pb-4">
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
                          <div className="text-[11px] text-hydrangea-500">
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
                className="block text-center text-[11px] text-hydrangea-500 hover:text-hydrangea-700 py-2"
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
        <section className="px-5 md:px-10 pb-4">
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
                        <div className="text-[11px] text-rose-600">Tap to start your card →</div>
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
      <section id="occasions" className="px-5 md:px-10 pb-10 md:pb-16 space-y-7 md:space-y-10 scroll-mt-16">
        <div className="text-center md:text-left">
          <h2 className="text-3xl md:text-4xl" style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 500, color: INK }}>What are you celebrating?</h2>
          <p className="mt-1 text-sm md:text-base" style={{ color: INK_SOFT }}>Choose an occasion and we will suggest designs and wording for it.</p>
        </div>
        <div>
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-xl md:text-2xl flex items-center gap-2" style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 600, color: INK }}>
                <PartyPopper className="w-4 h-4 text-hydrangea-500" aria-hidden /> <span>Invitation</span>
              </h3>
              <span className="text-xs md:text-sm" style={{ color: INK_SOFT }}>Date · Place · RSVP</span>
            </div>
            <OccasionGrid items={INVITATIONS} />
          </div>
        </div>

        <div>
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-xl md:text-2xl flex items-center gap-2" style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 600, color: INK }}>
                <Heart className="w-4 h-4 text-hydrangea-500" aria-hidden /> <span>Thank · Congrats</span>
              </h3>
              <span className="text-xs md:text-sm" style={{ color: INK_SOFT }}>For someone special</span>
            </div>
            <OccasionGrid items={THANKS} />
          </div>
        </div>

        <div>
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-xl md:text-2xl flex items-center gap-2" style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 600, color: INK }}>
                <CalendarHeart className="w-4 h-4 text-hydrangea-500" aria-hidden /> <span>Anniversary · Holiday</span>
              </h3>
              <span className="text-xs md:text-sm" style={{ color: INK_SOFT }}>Seasonal & annual</span>
            </div>
            <OccasionGrid items={ANNIVERSARIES} />
          </div>
        </div>

        <div className="text-center pt-2">
          <Link
            href="/cards"
            className="inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-full bg-white text-hydrangea-600 text-sm font-medium border border-hydrangea-100 hover:border-hydrangea-300 hover:bg-hydrangea-50 active:scale-95 transition"
          >
            <List className="w-3.5 h-3.5" />
            {t('myInvitations')}
          </Link>
        </div>
      </section>

      {/* ===== 사용법 — 실제로 순서가 있는 3단계라 번호를 붙임 ===== */}
      <section className="px-6 md:px-10 py-10 md:py-16 border-t" style={{ borderColor: 'rgba(46,33,64,0.08)' }}>
        <h2 className="text-3xl md:text-4xl text-center md:text-left" style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 500, color: INK }}>
          From idea to sent in a minute
        </h2>
        <ol className="mt-6 md:mt-8 grid gap-6 md:gap-8 md:grid-cols-3">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step.title} className="flex md:block gap-4">
              <span
                aria-hidden
                className="flex-none text-5xl leading-none md:mb-3 md:block"
                style={{ fontFamily: 'var(--font-cormorant), serif', color: GOLD_TEXT, fontWeight: 500, minWidth: '2.2rem' }}
              >
                {i + 1}
              </span>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: INK }}>{step.title}</h3>
                <p className="mt-1 text-sm md:text-base leading-relaxed" style={{ color: INK_SOFT }}>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ===== Mobile Showcase ===== */}
      <section className="px-4 md:px-10 py-10 md:py-16 border-t" style={{ borderColor: 'rgba(46,33,64,0.08)' }}>
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl" style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 500, color: INK }}>
            See it the way your guests will
          </h2>
          <p className="text-sm md:text-base mt-1" style={{ color: INK_SOFT }}>
            Every card is made for the phone screen it will be opened on.
          </p>
        </div>
        <MobileShowcase />
      </section>

      {/* ===== Footer ===== */}
      <footer className="px-6 pb-10 pt-6 text-center space-y-3 border-t border-hydrangea-100/50 mt-2">
        <p className="text-xs text-hydrangea-400 flex items-center justify-center gap-1">
          {t('footer')} <Heart className="w-3 h-3 fill-current text-hydrangea-400" /> DearDay
        </p>
        {/* 🔧 링크 사이 간격·세로 패딩을 키워 손가락 오탭 방지 */}
        <nav className="flex items-center justify-center gap-x-1 gap-y-0 text-xs text-hydrangea-500 flex-wrap" aria-label="Footer">
          <Link href="/reminders" className="inline-flex items-center min-h-[44px] px-2 hover:text-hydrangea-700">Reminders</Link>
          <span aria-hidden>·</span>
          <Link href="/about" className="inline-flex items-center min-h-[44px] px-2 hover:text-hydrangea-700">About</Link>
          <span aria-hidden>·</span>
          <Link href="/blog" className="inline-flex items-center min-h-[44px] px-2 hover:text-hydrangea-700">Blog</Link>
          <span aria-hidden>·</span>
          <Link href="/envelopes-demo" className="inline-flex items-center min-h-[44px] px-2 hover:text-hydrangea-700">Templates</Link>
          <span aria-hidden>·</span>
          <Link href="/privacy" className="inline-flex items-center min-h-[44px] px-2 hover:text-hydrangea-700">Privacy</Link>
          <span aria-hidden>·</span>
          <Link href="/terms" className="inline-flex items-center min-h-[44px] px-2 hover:text-hydrangea-700">Terms</Link>
          <span aria-hidden>·</span>
          <Link href="/contact" className="inline-flex items-center min-h-[44px] px-2 hover:text-hydrangea-700">Contact</Link>
        </nav>
        <p className="text-[11px] text-hydrangea-400">© {new Date().getFullYear()} Steward+AI</p>
      </footer>
    </PageContainer>
  );
}
