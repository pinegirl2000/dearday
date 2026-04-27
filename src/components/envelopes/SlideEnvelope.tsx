'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';
import type { EnvelopeProps } from './FoldEnvelope';
import { shade } from './utils';

export default function SlideEnvelope({
  isOpen,
  envelopeColor = '#7B5EA7',
  sealColor = '#C9A0DC',
  children,
  width = 380
}: EnvelopeProps) {
  const prefersReducedMotion = useReducedMotion();
  const height = Math.round(width * 0.66);
  const cardHeight = Math.round(width * 1.2);
  const D = prefersReducedMotion ? 0.001 : 1.0;

  const cardVariants = useMemo(
    () => ({
      hidden: { y: 20, opacity: 0, scale: 0.98 },
      visible: {
        y: -(cardHeight - height * 0.4),
        opacity: 1,
        scale: 1,
        transition: { duration: D * 1.2, ease: [0.16, 1, 0.3, 1] as const }
      }
    }),
    [cardHeight, height, D]
  );

  const sealVariants = {
    closed: { scale: 1, opacity: 1, rotate: 0 },
    open: { scale: 0, opacity: 0, rotate: 90, transition: { duration: 0.35 } }
  };

  return (
    <div className="relative mx-auto select-none" style={{ width, height: cardHeight + 60 }} aria-live="polite">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="slide-card"
            className="absolute left-1/2 bottom-0 rounded-lg bg-white shadow-2xl overflow-hidden"
            style={{ width: width - 32, height: cardHeight, x: '-50%', zIndex: 1 }}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #faf6ff 100%)' }} />
            <div className="relative w-full h-full p-6 flex items-center justify-center text-center text-neutral-700">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="absolute left-0 right-0 bottom-0 rounded-md shadow-xl overflow-hidden"
        style={{ height, background: `linear-gradient(165deg, ${envelopeColor} 0%, ${shade(envelopeColor, -15)} 100%)`, zIndex: 2 }}
      >
        <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full">
          <polygon points={`0,0 ${width},0 ${width / 2},${height * 0.55}`} fill={shade(envelopeColor, -22)} />
          <line x1="0" y1="0" x2={width / 2} y2={height * 0.55} stroke={shade(envelopeColor, -30)} strokeWidth="1" />
          <line x1={width} y1="0" x2={width / 2} y2={height * 0.55} stroke={shade(envelopeColor, -30)} strokeWidth="1" />
        </svg>

        <motion.div
          className="absolute left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center shadow-md"
          style={{
            top: height * 0.45,
            width: 44,
            height: 44,
            background: `radial-gradient(circle at 35% 30%, ${shade(sealColor, 18)}, ${sealColor} 60%, ${shade(sealColor, -18)} 100%)`
          }}
          variants={sealVariants}
          initial="closed"
          animate={isOpen ? 'open' : 'closed'}
        >
          <span className="text-white text-xs font-serif tracking-widest">D</span>
        </motion.div>
      </div>
    </div>
  );
}
