'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const GOLD = '#C4A36A';

const PRESETS = [
  {
    id: 'wedding',
    label: 'Wedding',
    emoji: '💒',
    title: 'Daniel ♥ Olivia',
    sub: 'Together with our families',
    date: 'Jun 14, 2026 · The Grand Ballroom',
    accent: '#7B5EA7'
  },
  {
    id: 'birthday',
    label: 'Birthday',
    emoji: '🎂',
    title: "Riley's First Birthday",
    sub: 'A precious first year',
    date: 'Jul 5, 2026 · The Lounge',
    accent: '#E89AA0'
  },
  {
    id: 'baptism',
    label: 'Baptism',
    emoji: '🕊️',
    title: "Avery's Baptism Day",
    sub: 'A blessed first step',
    date: 'May 3, 2026 · Grace Church',
    accent: '#5A8AB8'
  },
  {
    id: 'opening',
    label: 'Opening',
    emoji: '🎉',
    title: 'Round Cafe · Grand Opening',
    sub: 'A new beginning',
    date: 'Sep 20, 2026 · Orchard Lane',
    accent: '#A07C2C'
  }
];

export default function LiveDemo() {
  const [activeId, setActiveId] = useState<string>('wedding');
  const active = PRESETS.find((p) => p.id === activeId) || PRESETS[0];

  return (
    <div className="rounded-3xl bg-gradient-to-br from-white via-white to-hydrangea-50/40 border border-hydrangea-100/80 shadow-xl shadow-hydrangea-500/10 overflow-hidden">
      {/* Card preview */}
      <div className="px-6 pt-8 pb-6 relative" style={{ background: `linear-gradient(135deg, ${active.accent}11 0%, transparent 60%)` }}>
        <div className="absolute top-3 right-3">
          <span className="text-[9px] uppercase tracking-widest" style={{ color: GOLD }}>Live demo</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="rounded-2xl bg-white/95 backdrop-blur border border-white/80 shadow-lg p-7 mx-auto max-w-sm"
            style={{ borderColor: `${GOLD}33` }}
          >
            <div className="text-center" style={{ color: GOLD, fontSize: 14, marginBottom: 10 }}>✽</div>
            <div className="text-center text-[10px] tracking-[0.4em] mb-4" style={{ color: active.accent }}>
              {active.label.toUpperCase()} INVITATION
            </div>
            <div
              className="text-center text-2xl mb-3"
              style={{
                color: active.accent,
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                letterSpacing: '0.06em'
              }}
            >
              {active.title}
            </div>
            <div className="text-center text-[11px] text-hydrangea-500 italic mb-5"
              style={{ fontFamily: "var(--font-cormorant), serif" }}>
              {active.sub}
            </div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="block w-8 h-px" style={{ background: GOLD, opacity: 0.6 }} />
              <span className="text-[9px] tracking-[0.3em]" style={{ color: GOLD }}>SAVE THE DATE</span>
              <span className="block w-8 h-px" style={{ background: GOLD, opacity: 0.6 }} />
            </div>
            <div className="text-center text-[11px] tracking-[0.18em] text-hydrangea-700 font-medium mt-2">
              {active.date}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Event picker */}
      <div className="px-4 py-4 border-t border-hydrangea-100/60 bg-white/60 backdrop-blur">
        <div className="flex flex-wrap gap-1.5 justify-center">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveId(p.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium transition active:scale-95 ${
                activeId === p.id
                  ? 'bg-hydrangea-700 text-white shadow-sm'
                  : 'bg-white text-hydrangea-600 border border-hydrangea-100 hover:bg-hydrangea-50/60'
              }`}
            >
              <span>{p.emoji}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
        <Link
          href={`/cards/new?type=${activeId}`}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-white text-sm font-medium active:scale-95 transition"
          style={{ background: `linear-gradient(135deg, ${active.accent} 0%, ${GOLD} 140%)` }}
        >
          Try this template
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
