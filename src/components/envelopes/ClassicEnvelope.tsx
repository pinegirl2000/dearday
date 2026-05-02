'use client';

import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';
import type { EnvelopeProps } from './FoldEnvelope';

/**
 * ClassicEnvelope — 보라 클래식
 * - 닫힌 상태: 살짝 흔들리는 호흡(breathing) 애니메이션
 * - 클릭(isOpen=true): 봉투 뚜껑이 열리고 편지지가 솟아오름 + 꽃잎 파티클 분사
 */
const PALETTE = {
  flap:        '#D8C5EC',  // 뚜껑 (연한 라벤더)
  flapShadow:  '#BEA5D9',  // 뚜껑 안쪽 그림자
  body:        '#C8B0E2',  // 본체 연보라
  bodyDark:    '#A990CC',  // 본체 그림자
  inner:       '#FBF7FF',  // 내부 안감 (편지지 배경)
  paper:       '#FFFFFF',
  accent:      '#E0C8EE',
  bodyMid:     '#D2B8E5',  // 본체 중간 (그라데이션용)
  bodyTint:    '#E0C8EE',  // 본체 하이라이트 (살짝 핑크 톤)
  petals:      ['#F4A8A8', '#F8B5B5', '#FFC4C4', '#E89898', '#FCD0D0', '#FFEDED']
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

export default function ClassicEnvelope({
  isOpen,
  children,
  width = 320
}: EnvelopeProps) {
  const prefersReducedMotion = useReducedMotion();
  const height = Math.round(width * 0.7);
  const D = prefersReducedMotion ? 0.001 : 1;

  // 클릭 시 1회만 파티클 발생
  const [particles, setParticles] = useState<PetalSpec[] | null>(null);
  useEffect(() => {
    if (isOpen && !prefersReducedMotion) {
      setParticles(generatePetals(40));
      const t = setTimeout(() => setParticles(null), 2500);
      return () => clearTimeout(t);
    }
  }, [isOpen, prefersReducedMotion]);

  // (deprecated) breathing memo는 더 이상 사용하지 않음 — 아래 motion.div에서 직접 처리

  return (
    <div
      className="relative mx-auto select-none"
      style={{ width, height: height + 30, perspective: 1400 }}
      aria-live="polite"
    >
      {/* 파티클 컨테이너 (z-index 최상위) */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 0,
          height: 0,
          zIndex: 30,
          pointerEvents: 'none'
        }}
      >
        <AnimatePresence>
          {particles && particles.map((p) => <Petal key={p.id} spec={p} />)}
        </AnimatePresence>
      </div>

      <div style={{ position: 'absolute', inset: 0 }}>
        {/* 봉투 본체 (뒷판 + 내부 안감) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: Math.round(height * 0.18),
            width,
            height: Math.round(height * 0.82),
            background: `linear-gradient(155deg, ${PALETTE.bodyTint} 0%, ${PALETTE.body} 35%, ${PALETTE.bodyMid} 70%, ${PALETTE.bodyDark} 100%)`,
            borderRadius: '4px 4px 10px 10px',
            boxShadow: '0 14px 35px rgba(70,50,110,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
            zIndex: 1
          }}
        />
        {/* 내부 안감 (열렸을 때 살짝 보임) */}
        <div
          style={{
            position: 'absolute',
            left: 4,
            top: Math.round(height * 0.18) + 4,
            width: width - 8,
            height: Math.round(height * 0.82) - 8,
            background: PALETTE.inner,
            borderRadius: '2px 2px 8px 8px',
            zIndex: 2
          }}
        />

        {/* 편지지 — 위로 슬라이드 */}
        <motion.div
          style={{
            position: 'absolute',
            left: Math.round(width * 0.08),
            top: Math.round(height * 0.30),
            width: width - Math.round(width * 0.08) * 2,
            height: Math.round(height * 0.68),
            background: PALETTE.paper,
            borderRadius: 4,
            boxShadow: '0 3px 10px rgba(70,50,110,0.25)',
            zIndex: 3,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 12,
            textAlign: 'center'
          }}
          initial={false}
          animate={
            isOpen
              ? { y: -Math.round(height * 0.72), transition: { duration: D * 0.7, delay: D * 0.4, ease: [0.4, 0, 0.2, 1] as const } }
              : { y: 0, transition: { duration: D * 0.5 } }
          }
        >
          <div>
            <div
              style={{
                width: 50,
                height: 2,
                background: `linear-gradient(90deg, transparent, ${PALETTE.accent}, transparent)`,
                margin: '0 auto 10px'
              }}
            />
            {children}
            <div style={{ marginTop: 8, color: PALETTE.accent, fontSize: 16 }}>✿</div>
          </div>
        </motion.div>

        {/* 앞면 V (편지지 가리는 앞쪽) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: Math.round(height * 0.18),
            width,
            height: Math.round(height * 0.82),
            background: `linear-gradient(165deg, ${PALETTE.bodyTint} 0%, ${PALETTE.body} 30%, ${PALETTE.bodyMid} 65%, ${PALETTE.bodyDark} 100%)`,
            clipPath: 'polygon(0 0, 50% 60%, 100% 0, 100% 100%, 0 100%)',
            borderRadius: '0 0 10px 10px',
            zIndex: 4,
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.12)'
          }}
        />
        {/* V자 가장자리 라인 (입체감) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: Math.round(height * 0.18),
            width,
            height: Math.round(height * 0.82),
            background: PALETTE.accent,
            clipPath: 'polygon(0 0, 50% 59%, 100% 0, 100% 1.5%, 50% 60.5%, 0 1.5%)',
            opacity: 0.4,
            zIndex: 5,
            pointerEvents: 'none'
          }}
        />

        {/* 봉투 뚜껑 — 닫힘 시 살짝 들썩이는 호흡, 열림 시 위로 펼쳐짐 */}
        <motion.div
          style={{
            position: 'absolute',
            left: 0,
            top: Math.round(height * 0.18),
            width,
            height: Math.round(height * 0.62),
            transformOrigin: 'top center',
            transformStyle: 'preserve-3d',
            zIndex: isOpen ? 0 : 6
          }}
          initial={{ rotateX: 0 }}
          animate={
            isOpen
              ? { rotateX: 180 }
              : prefersReducedMotion
              ? { rotateX: 0 }
              : { rotateX: [0, -45, -8, -55, -5, 0] }
          }
          transition={
            isOpen
              ? { duration: D * 0.6, ease: [0.4, 0, 0.2, 1] as const }
              : { duration: 5.25, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5, times: [0, 0.18, 0.35, 0.55, 0.75, 1] }
          }
        >
          {/* 앞면 (외부) — SVG로 끝부분을 둥글게 */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              filter: 'drop-shadow(0 4px 6px rgba(60,40,90,0.3))'
            }}
          >
            <defs>
              <linearGradient id="flapFront" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={PALETTE.flap} />
                <stop offset="100%" stopColor={PALETTE.flapShadow} />
              </linearGradient>
            </defs>
            {/* 모서리(밑쪽 V 끝)를 둥글게 처리한 path */}
            <path
              d="M 0 0 L 100 0 L 56 90 Q 50 100 44 90 Z"
              fill="url(#flapFront)"
            />
          </svg>
          {/* 뒷면 (내부 안감 색, 열렸을 때 보임) */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              transform: 'rotateX(180deg)'
            }}
          >
            <defs>
              <linearGradient id="flapBack" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={PALETTE.inner} />
                <stop offset="100%" stopColor="#EDE3F5" />
              </linearGradient>
            </defs>
            <path
              d="M 0 0 L 100 0 L 56 90 Q 50 100 44 90 Z"
              fill="url(#flapBack)"
            />
          </svg>
          {/* 봉인 (꽃 모양 씰) — 닫혀있을 때만 표시 */}
          {!isOpen && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '60%',
                width: 28,
                height: 28,
                marginLeft: -14,
                marginTop: -14,
                borderRadius: '50%',
                background: `radial-gradient(circle at 35% 30%, ${PALETTE.accent}, ${PALETTE.flapShadow})`,
                boxShadow: '0 2px 5px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 14
              }}
            >
              ✿
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
