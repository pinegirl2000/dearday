'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ReactNode, useMemo } from 'react';
import { shade } from './utils';

export interface EnvelopeProps {
  isOpen: boolean;
  envelopeColor?: string;
  sealColor?: string;
  children?: ReactNode;
  width?: number;
}

export default function FoldEnvelope({
  isOpen,
  envelopeColor = '#7B5EA7',
  sealColor = '#C9A0DC',
  children,
  width = 380
}: EnvelopeProps) {
  const prefersReducedMotion = useReducedMotion();
  const height = Math.round(width * 0.66);
  const cardHeight = Math.round(width * 1.15);
  const D = prefersReducedMotion ? 0.001 : 1.2;

  const flapVariants = useMemo(
    () => ({
      closed: { rotateX: 0, opacity: 1 },
      open: { rotateX: -180, opacity: 0, transition: { duration: D * 0.6, ease: [0.65, 0, 0.35, 1] as const } }
    }),
    [D]
  );

  const cardVariants = useMemo(
    () => ({
      hidden: { y: 0, scale: 0.6, opacity: 0 },
      visible: {
        y: -cardHeight * 0.45,
        scale: 1,
        opacity: 1,
        transition: { delay: D * 0.4, duration: D * 0.7, ease: [0.22, 1, 0.36, 1] as const }
      }
    }),
    [cardHeight, D]
  );

  const topFoldVariants = useMemo(
    () => ({
      folded: { rotateX: 180 },
      unfolded: { rotateX: 0, transition: { delay: D * 0.7, duration: D * 0.5, ease: 'easeOut' as const } }
    }),
    [D]
  );

  const bottomFoldVariants = useMemo(
    () => ({
      folded: { rotateX: -180 },
      unfolded: { rotateX: 0, transition: { delay: D * 0.85, duration: D * 0.5, ease: 'easeOut' as const } }
    }),
    [D]
  );

  return (
    <div className="relative mx-auto select-none" style={{ width, height: cardHeight + 80, perspective: 1400 }} aria-live="polite">
      <div
        className="absolute left-0 right-0 bottom-0 overflow-hidden rounded-b-md shadow-xl"
        style={{ height, background: `linear-gradient(160deg, ${envelopeColor} 0%, ${shade(envelopeColor, -12)} 100%)` }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 35%)' }} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="fold-card"
            className="absolute left-1/2 bottom-0 origin-bottom rounded-md bg-white shadow-2xl overflow-hidden"
            style={{ width: width - 40, height: cardHeight, x: '-50%', transformStyle: 'preserve-3d' }}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.div
              className="absolute left-0 right-0 top-0"
              style={{ height: cardHeight / 3, background: 'linear-gradient(180deg, #fdfcfa 0%, #f3eef9 100%)', transformOrigin: 'bottom', backfaceVisibility: 'hidden' }}
              variants={topFoldVariants}
              initial="folded"
              animate="unfolded"
            />
            <div className="absolute left-0 right-0" style={{ top: cardHeight / 3, height: cardHeight / 3, background: '#ffffff' }}>
              <div className="w-full h-full p-4 flex items-center justify-center text-center text-neutral-700">{children}</div>
            </div>
            <motion.div
              className="absolute left-0 right-0 bottom-0"
              style={{ height: cardHeight / 3, background: 'linear-gradient(0deg, #fdfcfa 0%, #f3eef9 100%)', transformOrigin: 'top', backfaceVisibility: 'hidden' }}
              variants={bottomFoldVariants}
              initial="folded"
              animate="unfolded"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="absolute left-0 origin-top"
        style={{ bottom: height, width, height: height * 0.55, transformStyle: 'preserve-3d', zIndex: 5 }}
        variants={flapVariants}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
      >
        <svg viewBox={`0 0 ${width} ${height * 0.55}`} className="w-full h-full">
          <polygon points={`0,0 ${width},0 ${width / 2},${height * 0.55}`} fill={shade(envelopeColor, -8)} />
        </svg>
      </motion.div>

      <AnimatePresence>
        {!isOpen && (
          <motion.div
            key="seal"
            className="absolute left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center shadow-md"
            style={{
              top: height - 8,
              width: 44,
              height: 44,
              background: `radial-gradient(circle at 35% 30%, ${shade(sealColor, 18)}, ${sealColor} 60%, ${shade(sealColor, -18)} 100%)`,
              zIndex: 10
            }}
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'backOut' }}
          >
            <span className="text-white text-xs font-serif tracking-widest">D</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
