'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';
import type { EnvelopeProps } from './FoldEnvelope';
import { shade } from './utils';

export default function PopEnvelope({
  isOpen,
  envelopeColor = '#7B5EA7',
  sealColor = '#C9A0DC',
  children,
  width = 380
}: EnvelopeProps) {
  const prefersReducedMotion = useReducedMotion();
  const height = Math.round(width * 0.66);
  const cardHeight = Math.round(width * 1.15);

  const cardVariants = useMemo(
    () => ({
      hidden: { y: 0, scale: 0.4, opacity: 0, rotate: -8 },
      visible: {
        y: -(cardHeight * 0.55),
        scale: 1,
        opacity: 1,
        rotate: 0,
        transition: prefersReducedMotion
          ? { duration: 0.001 }
          : { type: 'spring' as const, stiffness: 260, damping: 14, mass: 0.9, delay: 0.15 }
      }
    }),
    [cardHeight, prefersReducedMotion]
  );

  const sealVariants = {
    closed: { scale: 1, opacity: 1 },
    open: {
      scale: prefersReducedMotion ? 0 : [1, 1.4, 0],
      opacity: [1, 1, 0],
      rotate: 360,
      transition: { duration: prefersReducedMotion ? 0.001 : 0.5, times: [0, 0.4, 1] }
    }
  };

  const confetti = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    angle: (i / 8) * Math.PI * 2,
    color: i % 2 === 0 ? sealColor : shade(envelopeColor, 30)
  }));

  return (
    <div className="relative mx-auto select-none" style={{ width, height: cardHeight + 80 }} aria-live="polite">
      <div
        className="absolute left-0 right-0 bottom-0 rounded-md shadow-xl overflow-hidden"
        style={{ height, background: `linear-gradient(160deg, ${envelopeColor} 0%, ${shade(envelopeColor, -15)} 100%)`, zIndex: 2 }}
      >
        <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full">
          <polygon points={`0,0 ${width},0 ${width / 2},${height * 0.55}`} fill={shade(envelopeColor, -22)} />
        </svg>
      </div>

      <AnimatePresence>
        {isOpen && !prefersReducedMotion &&
          confetti.map((c) => (
            <motion.div
              key={`confetti-${c.id}`}
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{ width: 8, height: 8, background: c.color, zIndex: 3 }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={{
                x: Math.cos(c.angle) * 120,
                y: Math.sin(c.angle) * 120,
                opacity: [0, 1, 0],
                scale: [0, 1, 0.6]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: 'easeOut' }}
            />
          ))}
      </AnimatePresence>

      <motion.div
        className="absolute left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center shadow-md"
        style={{
          top: cardHeight + 80 - height + height * 0.45,
          width: 44,
          height: 44,
          background: `radial-gradient(circle at 35% 30%, ${shade(sealColor, 18)}, ${sealColor} 60%, ${shade(sealColor, -18)} 100%)`,
          zIndex: 4
        }}
        variants={sealVariants}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
      >
        <span className="text-white text-xs font-serif tracking-widest">D</span>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="pop-card"
            className="absolute left-1/2 bottom-0 rounded-lg bg-white shadow-2xl overflow-hidden"
            style={{ width: width - 40, height: cardHeight, x: '-50%', transformOrigin: 'bottom center', zIndex: 5 }}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="w-full h-full p-6 flex items-center justify-center text-center text-neutral-700" style={{ background: 'linear-gradient(180deg,#ffffff 0%,#f6efff 100%)' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
