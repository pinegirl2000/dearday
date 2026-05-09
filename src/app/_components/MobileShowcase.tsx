'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';

const GOLD = '#C4A36A';

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
}

const SAMPLES: Sample[] = [
  {
    id: 'wedding',
    emoji: '💒',
    event: 'WEDDING',
    title: 'Daniel ♥ Olivia',
    subtitle: 'Together with our families',
    body: 'We invite you to share in\nthe joy of our wedding day.',
    date: 'SAT 14 JUN · 7 PM',
    place: 'The Grand Ballroom, Marina Hotel',
    host: 'From Daniel & Olivia',
    bg: 'linear-gradient(160deg, #F4ECFA 0%, #E8DFF3 50%, #D5C5E8 100%)',
    main: '#5A3D7A',
    sub: '#8B7A9E'
  },
  {
    id: 'birthday',
    emoji: '🎂',
    event: 'BIRTHDAY',
    title: "Avery's 1st Birthday",
    subtitle: 'A precious first year',
    body: 'Come share laughter, joy, and cake\nas we celebrate Avery\'s special day.',
    date: 'SUN 5 JUL · 11 AM',
    place: 'The Lounge Function Room',
    host: '— Jane Doe —',
    bg: 'linear-gradient(160deg, #FFF1EB 0%, #FCE5DD 50%, #F5C8B8 100%)',
    main: '#9C5040',
    sub: '#C68676'
  },
  {
    id: 'baptism',
    emoji: '🕊️',
    event: 'BAPTISM',
    title: "Avery's Baptism Day",
    subtitle: 'A blessed first step',
    body: 'Please join us as we celebrate\nAvery\'s baptism in the Lord.',
    date: 'SUN 3 MAY · 10 AM',
    place: 'Grace Church, Main Sanctuary',
    host: '— Jane Doe —',
    bg: 'linear-gradient(160deg, #F1FAF4 0%, #DBEEDF 50%, #C8E5D2 100%)',
    main: '#3D5C3F',
    sub: '#7AA088'
  },
  {
    id: 'opening',
    emoji: '🎉',
    event: 'OPENING',
    title: 'Round Cafe',
    subtitle: 'A new beginning',
    body: 'We\'re excited to open our doors\nand share this moment with you.',
    date: 'FRI 20 SEP · 5 PM',
    place: 'Round Cafe, 1 Orchard Lane',
    host: '— The Round Cafe Team —',
    bg: 'linear-gradient(160deg, #FBF5E8 0%, #F0E5CD 50%, #E8DCC4 100%)',
    main: '#7A5E2E',
    sub: '#9C8B6E'
  },
  {
    id: 'gathering',
    emoji: '🤝',
    event: 'GATHERING',
    title: 'Spring Gathering',
    subtitle: 'See you again',
    body: 'It has been too long.\nLet\'s gather and catch up.',
    date: 'SUN 12 APR · 2 PM',
    place: 'Hangang Park, Open Lawn',
    host: '— Jane Doe —',
    bg: 'linear-gradient(160deg, #FFFFFF 0%, #F2F8FC 50%, #E0EDF6 100%)',
    main: '#2E5478',
    sub: '#5A7B96'
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
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-6 py-8 text-center"
      style={{ background: sample.bg }}
    >
      {/* event label with dividers */}
      <div className="flex items-center gap-2 mb-3 opacity-80">
        <span className="block w-6 h-px" style={{ background: GOLD, opacity: 0.7 }} />
        <span className="text-[9px] tracking-[0.4em] font-semibold" style={{ color: GOLD }}>
          {sample.event}
        </span>
        <span className="block w-6 h-px" style={{ background: GOLD, opacity: 0.7 }} />
      </div>

      {/* subtitle */}
      <p
        className="text-[10px] tracking-[0.3em] uppercase mb-2"
        style={{ color: sample.main, fontWeight: 500, opacity: 0.85 }}
      >
        {sample.subtitle}
      </p>

      {/* title */}
      <h3
        className="mb-3"
        style={{
          fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
          fontSize: 26,
          fontWeight: 600,
          color: sample.main,
          letterSpacing: '0.04em',
          lineHeight: 1.15
        }}
      >
        {sample.title}
      </h3>

      {/* body */}
      <p
        className="text-[10px] mb-4 whitespace-pre-line"
        style={{ color: sample.main, opacity: 0.75, lineHeight: 1.6 }}
      >
        {sample.body}
      </p>

      {/* divider with icon */}
      <div className="flex items-center gap-2 mb-3">
        <span className="block w-8 h-px" style={{ background: sample.main, opacity: 0.4 }} />
        <span className="text-base" style={{ color: sample.main, opacity: 0.7 }}>✦</span>
        <span className="block w-8 h-px" style={{ background: sample.main, opacity: 0.4 }} />
      </div>

      {/* date */}
      <p
        className="text-[10px] tracking-[0.18em] mb-1"
        style={{ color: sample.main, fontWeight: 500 }}
      >
        {sample.date}
      </p>
      {/* place */}
      <p className="text-[9px] mb-2" style={{ color: sample.sub }}>
        {sample.place}
      </p>
      <p className="text-[9px] italic" style={{ color: sample.sub, opacity: 0.85 }}>
        {sample.host}
      </p>
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
