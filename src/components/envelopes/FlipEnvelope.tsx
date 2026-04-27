'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';
import type { EnvelopeProps } from './FoldEnvelope';
import { shade } from './utils';

export default function FlipEnvelope({
  isOpen,
  envelopeColor = '#7B5EA7',
  sealColor = '#C9A0DC',
  children,
  width = 380
}: EnvelopeProps) {
  const prefersReducedMotion = useReducedMotion();
  const height = Math.round(width * 1.05);
  const D = prefersReducedMotion ? 0.001 : 1.1;

  const containerVariants = useMemo(
    () => ({
      closed: { rotateY: 0, transition: { duration: D, ease: [0.65, 0, 0.35, 1] as const } },
      open: { rotateY: 180, transition: { duration: D, ease: [0.65, 0, 0.35, 1] as const } }
    }),
    [D]
  );

  const faceStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    borderRadius: 12,
    overflow: 'hidden'
  };

  return (
    <div className="relative mx-auto select-none" style={{ width, height, perspective: 1600 }} aria-live="polite">
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        variants={containerVariants}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
      >
        <div
          style={{
            ...faceStyle,
            background: `linear-gradient(160deg, ${envelopeColor} 0%, ${shade(envelopeColor, -18)} 100%)`,
            boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
          }}
        >
          <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full">
            <polygon points={`0,0 ${width},0 ${width / 2},${height * 0.42}`} fill={shade(envelopeColor, -10)} />
            <polygon points={`0,${height} ${width},${height} ${width / 2},${height * 0.58}`} fill={shade(envelopeColor, -6)} opacity="0.5" />
          </svg>
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center shadow-md"
            style={{
              top: height * 0.36,
              width: 56,
              height: 56,
              background: `radial-gradient(circle at 35% 30%, ${shade(sealColor, 22)}, ${sealColor} 60%, ${shade(sealColor, -22)} 100%)`
            }}
          >
            <span className="text-white text-sm font-serif tracking-widest">DD</span>
          </div>
          <div className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-xs tracking-[0.4em]">DEAR DAY</div>
        </div>

        <div
          style={{
            ...faceStyle,
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(180deg, #ffffff 0%, #f6efff 100%)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.18)'
          }}
        >
          <div className="w-full h-full p-6 flex items-center justify-center text-center text-neutral-700">{children}</div>
        </div>
      </motion.div>
    </div>
  );
}
