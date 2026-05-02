'use client';

import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { EnvelopeProps } from './FoldEnvelope';

const PALETTE = {
  flap:        '#D4ECDB',
  flapShadow:  '#8FBFA1',
  body:        '#BFDDC9',
  bodyDark:    '#76A88C',
  inner:       '#F2FAF5',
  paper:       '#FFFFFF',
  accent:      '#A0CCB1',
  bodyMid:     '#AFD2BD',
  bodyTint:    '#D9EDDF',
  petals:      ['#A8E6CF', '#BDEBD2', '#C8EFD9', '#9CDDC0', '#D7F2E0', '#E6F8EC']
} as const;

interface PetalSpec {
  id: number;
  angle: number;
  distance: number;
  size: number;
  rotate: number;
  duration: number;
  delay: number;
  color: string;
  shape: 'petal' | 'circle' | 'leaf';
}

function generatePetals(count: number): PetalSpec[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    return {
      id: i,
      angle,
      distance: 80 + Math.random() * 140,
      size: 8 + Math.random() * 12,
      rotate: Math.random() * 720 - 360,
      duration: 1.2 + Math.random() * 0.8,
      delay: Math.random() * 0.15,
      color: PALETTE.petals[Math.floor(Math.random() * PALETTE.petals.length)],
      shape: (['petal', 'circle', 'leaf'] as const)[Math.floor(Math.random() * 3)]
    };
  });
}

function Petal({ spec }: { spec: PetalSpec }) {
  const dx = Math.cos(spec.angle) * spec.distance;
  const dy = Math.sin(spec.angle) * spec.distance - Math.random() * 60;
  const radius =
    spec.shape === 'circle' ? '50%' :
    spec.shape === 'petal' ? '50% 0 50% 0' :
    '0 100% 0 100%';
  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.4 }}
      animate={{
        x: [0, dx * 0.6, dx],
        y: [0, dy * 0.6, dy],
        opacity: [0, 1, 0],
        rotate: spec.rotate,
        scale: [0.4, 1, 0.7]
      }}
      transition={{ duration: spec.duration, delay: spec.delay, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: spec.size,
        height: spec.size,
        background: spec.color,
        borderRadius: radius,
        marginLeft: -spec.size / 2,
        marginTop: -spec.size / 2,
        pointerEvents: 'none',
        boxShadow: `0 1px 3px ${spec.color}88`
      }}
    />
  );
}

export default function EnvelopeMint({ isOpen, children, width = 320 }: EnvelopeProps) {
  const prefersReducedMotion = useReducedMotion();
  const height = Math.round(width * 0.7);
  const D = prefersReducedMotion ? 0.001 : 1;

  const [particles, setParticles] = useState<PetalSpec[] | null>(null);
  useEffect(() => {
    if (isOpen && !prefersReducedMotion) {
      setParticles(generatePetals(40));
      const t = setTimeout(() => setParticles(null), 2500);
      return () => clearTimeout(t);
    }
  }, [isOpen, prefersReducedMotion]);

  return (
    <div className="relative mx-auto select-none" style={{ width, height: height + 30, perspective: 1400 }} aria-live="polite">
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, zIndex: 30, pointerEvents: 'none' }}>
        <AnimatePresence>
          {particles && particles.map((p) => <Petal key={p.id} spec={p} />)}
        </AnimatePresence>
      </div>

      <div style={{ position: 'absolute', inset: 0 }}>
        <div style={{ position: 'absolute', left: 0, top: Math.round(height * 0.18), width, height: Math.round(height * 0.82),
          background: `linear-gradient(155deg, ${PALETTE.bodyTint} 0%, ${PALETTE.body} 35%, ${PALETTE.bodyMid} 70%, ${PALETTE.bodyDark} 100%)`,
          borderRadius: '4px 4px 10px 10px',
          boxShadow: '0 14px 35px rgba(60,110,80,0.28), inset 0 1px 0 rgba(255,255,255,0.22)', zIndex: 1 }} />
        <div style={{ position: 'absolute', left: 4, top: Math.round(height * 0.18) + 4, width: width - 8, height: Math.round(height * 0.82) - 8,
          background: PALETTE.inner, borderRadius: '2px 2px 8px 8px', zIndex: 2 }} />

        <motion.div
          style={{ position: 'absolute', left: Math.round(width * 0.08), top: Math.round(height * 0.30),
            width: width - Math.round(width * 0.08) * 2, height: Math.round(height * 0.68),
            background: PALETTE.paper, borderRadius: 4,
            boxShadow: '0 3px 10px rgba(60,110,80,0.22)', zIndex: 3, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, textAlign: 'center' }}
          initial={false}
          animate={isOpen
            ? { y: -Math.round(height * 0.72), transition: { duration: D * 0.7, delay: D * 0.4, ease: [0.4, 0, 0.2, 1] as const } }
            : { y: 0, transition: { duration: D * 0.5 } }}
        >
          <div>
            <div style={{ width: 50, height: 2, background: `linear-gradient(90deg, transparent, ${PALETTE.accent}, transparent)`, margin: '0 auto 10px' }} />
            {children}
            <div style={{ marginTop: 8, color: PALETTE.accent, fontSize: 16 }}>✿</div>
          </div>
        </motion.div>

        <div style={{ position: 'absolute', left: 0, top: Math.round(height * 0.18), width, height: Math.round(height * 0.82),
          background: `linear-gradient(165deg, ${PALETTE.bodyTint} 0%, ${PALETTE.body} 30%, ${PALETTE.bodyMid} 65%, ${PALETTE.bodyDark} 100%)`,
          clipPath: 'polygon(0 0, 50% 60%, 100% 0, 100% 100%, 0 100%)',
          borderRadius: '0 0 10px 10px', zIndex: 4, boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.14)' }} />
        <div style={{ position: 'absolute', left: 0, top: Math.round(height * 0.18), width, height: Math.round(height * 0.82),
          background: PALETTE.accent, clipPath: 'polygon(0 0, 50% 59%, 100% 0, 100% 1.5%, 50% 60.5%, 0 1.5%)',
          opacity: 0.4, zIndex: 5, pointerEvents: 'none' }} />

        <motion.div
          style={{ position: 'absolute', left: 0, top: Math.round(height * 0.18), width, height: Math.round(height * 0.62),
            transformOrigin: 'top center', transformStyle: 'preserve-3d', zIndex: isOpen ? 0 : 6 }}
          initial={{ rotateX: 0 }}
          animate={isOpen ? { rotateX: 180 } : prefersReducedMotion ? { rotateX: 0 } : { rotateX: [0, -45, -8, -55, -5, 0] }}
          transition={isOpen
            ? { duration: D * 0.6, ease: [0.4, 0, 0.2, 1] as const }
            : { duration: 5.25, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5, times: [0, 0.18, 0.35, 0.55, 0.75, 1] }}
        >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', backfaceVisibility: 'hidden',
              filter: 'drop-shadow(0 4px 6px rgba(60,110,80,0.28))' }}>
            <defs>
              <linearGradient id="flapFrontMint" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={PALETTE.flap} />
                <stop offset="100%" stopColor={PALETTE.flapShadow} />
              </linearGradient>
            </defs>
            <path d="M 0 0 L 100 0 L 56 90 Q 50 100 44 90 Z" fill="url(#flapFrontMint)" />
          </svg>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}>
            <defs>
              <linearGradient id="flapBackMint" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={PALETTE.inner} />
                <stop offset="100%" stopColor="#E0F1E5" />
              </linearGradient>
            </defs>
            <path d="M 0 0 L 100 0 L 56 90 Q 50 100 44 90 Z" fill="url(#flapBackMint)" />
          </svg>
          {!isOpen && (
            <div style={{ position: 'absolute', left: '50%', top: '60%', width: 28, height: 28, marginLeft: -14, marginTop: -14,
              borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, ${PALETTE.accent}, ${PALETTE.flapShadow})`,
              boxShadow: '0 2px 5px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14 }}>✿</div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
