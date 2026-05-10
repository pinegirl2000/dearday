'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';

const GOLD = '#C4A36A';

type LayoutStyle = 'centered' | 'rightside' | 'bottombox' | 'topstack' | 'centerdown' | 'thankcard';

interface Sample {
  id: string;
  emoji: string;
  event: string;
  title: string;
  subtitle: string;
  body: string;
  date: string;
  place: string;
  host: string;
  bg: string;
  main: string;
  sub: string;
  style: LayoutStyle;
}

// 화려한 actual template 배경 이미지 5종
const SAMPLES: Sample[] = [
  {
    id: 'black-gold',
    emoji: '🥂',
    event: 'GRAND OPENING',
    title: 'Round Cafe',
    subtitle: 'A new chapter begins',
    body: 'Join us for an evening of\ncocktails, hors d\'oeuvres & music.',
    date: 'FRI 20 SEP · 7 PM',
    place: 'Round Cafe, 1 Orchard Lane',
    host: '— The Round Cafe Team —',
    bg: "url('/templates/template-19-bg.png') center/cover",
    main: '#F5E29A',
    sub: '#D4A943',
    style: 'centered'
  },
  {
    id: 'thank-mom',
    emoji: '💝',
    event: "MOTHER'S DAY",
    title: 'Avery',
    subtitle: "To the World's Best Mom,",
    body: 'Happy Mother\'s Day!\nHope your day is as lovely as you are!',
    date: '',
    place: '',
    host: 'your loving one',
    bg: "url('/templates/template-20-bg.png') center/cover",
    main: '#8B6075',
    sub: '#C97796',
    style: 'thankcard'
  },
  {
    id: 'pink-ribbon-arch',
    emoji: '🎀',
    event: 'BAPTISM',
    title: "Avery's Baptism Day",
    subtitle: 'A blessed first step',
    body: 'Please join us as we celebrate\nAvery\'s baptism in the Lord.',
    date: 'SUN 3 MAY · 10 AM',
    place: 'Grace Church, Main Sanctuary',
    host: '— Love, David & Rachel —',
    bg: "url('/templates/template-8-bg.png') center/cover",
    main: '#A65A6F',
    sub: '#E89AA0',
    style: 'centered'
  },
  {
    id: 'eucalyptus-gold',
    emoji: '🌿',
    event: 'WEDDING',
    title: 'James ♥ Sophie',
    subtitle: 'Two hearts, one journey',
    body: 'Join us for a garden ceremony\nunder the eucalyptus arch.',
    date: 'SAT 11 OCT · 4 PM',
    place: 'Botanic Gardens, Symphony Lawn',
    host: '— With our families —',
    bg: "url('/templates/template-10-bg.png') center/cover",
    main: '#A07C2C',
    sub: '#7A9B6E',
    style: 'centered'
  },
  {
    id: 'pressed-flowers',
    emoji: '💐',
    event: 'WEDDING',
    title: 'Daniel ♥ Olivia',
    subtitle: 'Together with our families',
    body: 'We invite you to share in\nthe joy of our wedding day.',
    date: 'SAT 14 JUN · 4 PM',
    place: 'The Grand Ballroom, Marina Hotel',
    host: '— Daniel & Olivia —',
    bg: "url('/templates/template-15-bg.png') center/cover",
    main: '#7A5E2E',
    sub: '#B89456',
    style: 'centered'
  },
  {
    id: 'watercolor-purple',
    emoji: '🤝',
    event: 'GATHERING',
    title: 'Spring Gathering',
    subtitle: 'See you again',
    body: 'It has been too long.\nLet\'s gather and catch up.',
    date: 'SUN 12 APR · 2 PM',
    place: 'Hangang Park, Open Lawn',
    host: '— From the Hosts —',
    bg: "url('/templates/template-2-bg.png') center/cover",
    main: '#5A3D7A',
    sub: '#7B5EA7',
    style: 'centered'
  }
];

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative mx-auto"
      style={{
        width: 260,
        height: 540,
        borderRadius: 36,
        background: 'linear-gradient(155deg, #2A2A2E 0%, #1A1A1E 100%)',
        boxShadow: '0 25px 60px -15px rgba(40, 30, 60, 0.45), 0 0 0 1px rgba(255,255,255,0.04) inset',
        padding: 8
      }}
    >
      {/* notch */}
      <div
        className="absolute top-2 left-1/2 -translate-x-1/2 z-20"
        style={{ width: 90, height: 22, borderRadius: 14, background: '#0A0A0E' }}
      />
      {/* screen */}
      <div
        className="relative w-full h-full overflow-hidden"
        style={{ borderRadius: 28, background: '#fff' }}
      >
        {children}
      </div>
    </div>
  );
}

function CardPreview({ sample }: { sample: Sample }) {
  const titleStyle = {
    fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
    fontWeight: 600,
    color: sample.main,
    letterSpacing: '0.04em',
    lineHeight: 1.15
  } as const;
  const eventChip = (
    <div className="flex items-center gap-2 opacity-80">
      <span className="block w-6 h-px" style={{ background: GOLD, opacity: 0.7 }} />
      <span className="text-[9px] tracking-[0.4em] font-semibold" style={{ color: GOLD }}>
        {sample.event}
      </span>
      <span className="block w-6 h-px" style={{ background: GOLD, opacity: 0.7 }} />
    </div>
  );

  // ── style별 레이아웃 분기 ──────────────────────────────────────────────
  if (sample.style === 'thankcard') {
    // thank_classic 미니어처 — bg(top 고정) + 사각 사진 + 필기체 title + 메시지 + From 라인
    return (
      <div
        className="absolute inset-0 flex flex-col items-center px-5 text-center"
        style={{
          backgroundImage: "url('/templates/template-20-bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
          paddingTop: 38,
          paddingBottom: 14
        }}
      >
        {/* 상단 사각 사진 — 절대 위치로 고정 */}
        <div
          style={{
            width: 96, height: 96,
            borderRadius: 0, overflow: 'hidden',
            background: '#fff',
            boxShadow: `0 2px 6px ${sample.main}33, 0 10px 20px ${sample.main}26`,
            marginBottom: 14
          }}
        >
          <img src="/samples/mom-thank.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
        {/* subtitle (small serif) */}
        <p className="text-[9px] tracking-[0.2em] font-medium mb-1" style={{ color: sample.sub, fontFamily: "'Cormorant Garamond', serif" }}>
          {sample.subtitle}
        </p>
        {/* title (script font, large) */}
        <h3 className="mb-2" style={{
          fontFamily: "'Sacramento', 'Great Vibes', cursive",
          fontWeight: 400, fontSize: 30, lineHeight: 1.05,
          color: sample.main, letterSpacing: '0.01em'
        }}>{sample.title}</h3>
        {/* small ✽ divider */}
        <span className="text-[10px] mb-2" style={{ color: sample.main, opacity: 0.6 }}>✽</span>
        {/* body */}
        <p className="text-[9.5px] whitespace-pre-line mb-3" style={{ color: sample.main, opacity: 0.85, lineHeight: 1.6, fontFamily: "'Cormorant Garamond', serif" }}>
          {sample.body}
        </p>
        {/* From line — 작은 'from' + 큰 이름 in script. body 바로 아래에 (flex spacer 없음) */}
        <p style={{ margin: '8px 0 0', lineHeight: 1.2, color: sample.main, fontFamily: "'Sacramento', 'Great Vibes', cursive" }}>
          <span style={{ fontSize: 9, opacity: 0.7, marginRight: 3 }}>from </span>
          <span style={{ fontSize: 17 }}>{sample.host}</span>
        </p>
      </div>
    );
  }

  if (sample.style === 'rightside') {
    // 우측 세로 텍스트 + 좌측 빈 영역 (mimics layout-5)
    return (
      <div className="absolute inset-0 flex" style={{ background: sample.bg }}>
        <div className="w-[40%]" />
        <div className="flex-1 flex flex-col justify-center pr-5 pl-2 py-8 text-right">
          {eventChip}
          <p className="text-[9px] tracking-[0.3em] uppercase mt-3 mb-1" style={{ color: sample.main, opacity: 0.85 }}>
            {sample.subtitle}
          </p>
          <h3 className="mb-2" style={{ ...titleStyle, fontSize: 22 }}>{sample.title}</h3>
          <p className="text-[9px] whitespace-pre-line mb-3" style={{ color: sample.main, opacity: 0.75, lineHeight: 1.5 }}>
            {sample.body}
          </p>
          <div className="rounded-lg px-3 py-2 mb-2" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(4px)' }}>
            <p className="text-[9px] tracking-[0.18em] font-semibold" style={{ color: sample.main }}>{sample.date}</p>
            <p className="text-[8px] mt-0.5" style={{ color: sample.sub }}>{sample.place}</p>
          </div>
          <p className="text-[8px] italic" style={{ color: sample.sub, opacity: 0.85 }}>{sample.host}</p>
        </div>
      </div>
    );
  }

  if (sample.style === 'bottombox') {
    // 상단 제목 + 하단 정보박스 (mimics layout-6)
    return (
      <div className="absolute inset-0 flex flex-col px-5 py-7 text-center" style={{ background: sample.bg }}>
        <div className="flex flex-col items-center mt-2">
          {eventChip}
          <p className="text-[10px] tracking-[0.3em] uppercase mt-3 mb-1" style={{ color: sample.main, opacity: 0.85 }}>
            {sample.subtitle}
          </p>
          <h3 className="mb-2" style={{ ...titleStyle, fontSize: 26 }}>{sample.title}</h3>
        </div>
        <div className="flex-1" />
        <div
          className="rounded-xl px-3 py-3 mb-3 backdrop-blur-md"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.10) 100%)',
            border: `1px solid ${sample.main}55`
          }}
        >
          <p className="text-[10px] tracking-[0.18em] font-semibold mb-0.5" style={{ color: sample.main }}>{sample.date}</p>
          <p className="text-[9px]" style={{ color: sample.sub }}>{sample.place}</p>
        </div>
        <p className="text-[9px] italic" style={{ color: sample.sub, opacity: 0.85 }}>{sample.host}</p>
      </div>
    );
  }

  if (sample.style === 'topstack') {
    // 상단 집중형 (mimics layout-7)
    return (
      <div className="absolute inset-0 flex flex-col px-6 py-8 text-center" style={{ background: sample.bg }}>
        {eventChip}
        <p className="text-[10px] tracking-[0.3em] uppercase mt-3 mb-1" style={{ color: sample.main, opacity: 0.85 }}>
          {sample.subtitle}
        </p>
        <h3 className="mb-3" style={{ ...titleStyle, fontSize: 28 }}>{sample.title}</h3>
        <p className="text-[10px] whitespace-pre-line mb-4" style={{ color: sample.main, opacity: 0.75, lineHeight: 1.55 }}>
          {sample.body}
        </p>
        <div className="flex-1" />
        <p className="text-[10px] tracking-[0.18em] font-semibold mb-0.5" style={{ color: sample.main }}>{sample.date}</p>
        <p className="text-[9px] mb-1" style={{ color: sample.sub }}>{sample.place}</p>
        <p className="text-[9px] italic" style={{ color: sample.sub, opacity: 0.85 }}>{sample.host}</p>
      </div>
    );
  }

  if (sample.style === 'centerdown') {
    // 정중앙 큰 제목 + 그 아래 몰림 (mimics layout-classic with centered emphasis)
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-5 py-8 text-center" style={{ background: sample.bg }}>
        {eventChip}
        <p className="text-[10px] tracking-[0.3em] uppercase mt-3" style={{ color: sample.main, opacity: 0.85 }}>
          {sample.subtitle}
        </p>
        <h3 className="my-2" style={{ ...titleStyle, fontSize: 30 }}>{sample.title}</h3>
        <div className="flex items-center gap-2 my-2">
          <span className="block w-8 h-px" style={{ background: sample.main, opacity: 0.4 }} />
          <span className="text-base" style={{ color: sample.main, opacity: 0.7 }}>✦</span>
          <span className="block w-8 h-px" style={{ background: sample.main, opacity: 0.4 }} />
        </div>
        <p className="text-[10px] tracking-[0.18em] font-semibold mt-1" style={{ color: sample.main }}>{sample.date}</p>
        <p className="text-[9px] mt-0.5" style={{ color: sample.sub }}>{sample.place}</p>
        <p className="text-[9px] italic mt-1" style={{ color: sample.sub, opacity: 0.85 }}>{sample.host}</p>
      </div>
    );
  }

  // ── default: centered ─────────────────────────────────────────────
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-6 py-8 text-center"
      style={{ background: sample.bg }}
    >
      {eventChip}
      <p className="text-[10px] tracking-[0.3em] uppercase mt-3 mb-2" style={{ color: sample.main, opacity: 0.85 }}>
        {sample.subtitle}
      </p>
      <h3 className="mb-3" style={{ ...titleStyle, fontSize: 26 }}>{sample.title}</h3>
      <p className="text-[10px] mb-4 whitespace-pre-line" style={{ color: sample.main, opacity: 0.75, lineHeight: 1.6 }}>
        {sample.body}
      </p>
      <div className="flex items-center gap-2 mb-3">
        <span className="block w-8 h-px" style={{ background: sample.main, opacity: 0.4 }} />
        <span className="text-base" style={{ color: sample.main, opacity: 0.7 }}>✦</span>
        <span className="block w-8 h-px" style={{ background: sample.main, opacity: 0.4 }} />
      </div>
      <p className="text-[10px] tracking-[0.18em] mb-1" style={{ color: sample.main, fontWeight: 500 }}>{sample.date}</p>
      <p className="text-[9px] mb-2" style={{ color: sample.sub }}>{sample.place}</p>
      <p className="text-[9px] italic" style={{ color: sample.sub, opacity: 0.85 }}>{sample.host}</p>
    </div>
  );
}

export default function MobileShowcase() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % SAMPLES.length), 3500);
    return () => clearInterval(t);
  }, []);

  const current = SAMPLES[idx];

  return (
    <div className="relative">
      {/* glow background */}
      <div
        className="absolute inset-0 -z-10 blur-3xl opacity-40"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 50%, ${current.main}55, transparent 70%)`,
          transition: 'background 0.6s ease'
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-[260px_1fr] gap-6 items-center">
        {/* Phone with rotating preview */}
        <div className="flex justify-center">
          <PhoneFrame>
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="absolute inset-0"
              >
                <CardPreview sample={current} />
              </motion.div>
            </AnimatePresence>

            {/* sample event chip */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {SAMPLES.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setIdx(i)}
                  aria-label={s.event}
                  className="transition"
                  style={{
                    width: i === idx ? 18 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === idx ? current.main : '#D9D5DD'
                  }}
                />
              ))}
            </div>
          </PhoneFrame>
        </div>

        {/* Right column — pitch */}
        <div className="text-center sm:text-left px-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-hydrangea-100/60 text-[10px] text-hydrangea-700 font-medium mb-3 tracking-wider uppercase">
            <Sparkles className="w-3 h-3" />
            Mobile · Editorial · Curated
          </div>

          <h3
            className="text-2xl text-hydrangea-700 mb-3"
            style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 600, lineHeight: 1.15 }}
          >
            Editorial templates,<br />tuned for every event.
          </h3>

          <p className="text-xs text-hydrangea-500 leading-relaxed mb-5">
            6 event types · 20+ curated templates · 11 envelope palettes ·
            built-in sample copy that reads like a real invitation — not a placeholder.
          </p>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { num: '20+', label: 'Templates' },
              { num: '9', label: 'Layouts' },
              { num: '11', label: 'Envelopes' }
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-white border border-hydrangea-100/70 px-2 py-2.5 text-center shadow-sm"
              >
                <div
                  className="text-lg leading-none mb-0.5"
                  style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 600, color: GOLD }}
                >
                  {s.num}
                </div>
                <div className="text-[9px] tracking-wider uppercase text-hydrangea-400">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Mini event tags */}
          <div className="flex flex-wrap gap-1.5 mb-5 justify-center sm:justify-start">
            {SAMPLES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIdx(i)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition active:scale-95 ${
                  i === idx
                    ? 'bg-hydrangea-700 text-white'
                    : 'bg-white text-hydrangea-600 border border-hydrangea-200/70'
                }`}
              >
                <span className="mr-1">{s.emoji}</span>
                {s.event.charAt(0) + s.event.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <Link
            href="/cards/new"
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-white text-sm font-medium shadow-lg active:scale-95 transition"
            style={{ background: `linear-gradient(135deg, #5A3D7A 0%, #7B5EA7 60%, ${GOLD} 140%)` }}
          >
            Try this template <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
