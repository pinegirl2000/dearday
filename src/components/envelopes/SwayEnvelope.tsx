'use client';

import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useId, useState, useEffect, useRef } from 'react';
import type { EnvelopeProps } from './FoldEnvelope';
import type { EnvelopePalette } from './palettes';

// 살랑살랑(Sway) 봉투 — 색상 팔레트 prop을 받는 generic 버전.
// 닫힌 상태: 뚜껑 살랑이는 idle wiggle. isOpen=true: 뚜껑 열림 + 카드 슬라이드 + 꽃잎 파티클.
interface Props extends EnvelopeProps {
  palette: EnvelopePalette;
}

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

function generatePetals(count: number, colors: readonly string[]): PetalSpec[] {
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
      color: colors[Math.floor(Math.random() * colors.length)],
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

export default function SwayEnvelope({ isOpen, children, width = 320, palette, cardPreview, onComplete }: Props) {
  const prefersReducedMotion = useReducedMotion();
  // visible body = height * 0.82이므로 4:3 visible body = width * 0.75 → height = width * 0.915
  const height = Math.round(width * 0.915);
  const D = prefersReducedMotion ? 0.001 : 1;
  const uid = useId().replace(/:/g, '');
  const gradFront = `flapFront-${uid}`;
  const gradBack = `flapBack-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const [particles, setParticles] = useState<PetalSpec[] | null>(null);
  useEffect(() => {
    if (isOpen && !prefersReducedMotion) {
      setParticles(generatePetals(40, palette.petals));
      const t = setTimeout(() => setParticles(null), 2500);
      return () => clearTimeout(t);
    }
  }, [isOpen, prefersReducedMotion, palette.petals]);

  // cardPreview 모드: flip형처럼 봉투 안에 카드를 보여주고 onComplete로 부모에 morph 신호
  useEffect(() => {
    if (!isOpen || !cardPreview) return;
    // flap 열림(0.6s) + 짧은 감상(1.6s) = 2.2s 후 morph 트리거
    const t = setTimeout(() => onCompleteRef.current?.(), 2200 * D);
    return () => clearTimeout(t);
  }, [isOpen, cardPreview, D]);

  return (
    <div className="relative mx-auto select-none" style={{ width, height: height + 30, perspective: 1400 }} aria-live="polite">
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, zIndex: 30, pointerEvents: 'none' }}>
        <AnimatePresence>
          {particles && particles.map((p) => <Petal key={p.id} spec={p} />)}
        </AnimatePresence>
      </div>

      <div style={{ position: 'absolute', inset: 0 }}>
        {/* body */}
        <div style={{ position: 'absolute', left: 0, top: Math.round(height * 0.18), width, height: Math.round(height * 0.82),
          background: `linear-gradient(155deg, ${palette.bodyTint} 0%, ${palette.body} 35%, ${palette.bodyMid} 70%, ${palette.bodyDark} 100%)`,
          borderRadius: '4px 4px 10px 10px',
          boxShadow: '0 14px 35px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.18)', zIndex: 1 }} />
        {/* inner lining — 안감 (V cut 사이로 노출). 봉투 가장자리까지 채워 본체 색이 띠로 노출되지 않도록 */}
        <div style={{ position: 'absolute', left: 0, top: Math.round(height * 0.18), width, height: Math.round(height * 0.82),
          background: `linear-gradient(155deg, ${palette.goldLight} 0%, ${palette.gold} 50%, ${palette.goldDeep} 100%)`,
          borderRadius: '2px 2px 8px 8px',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.18)',
          zIndex: 2 }} />

        {/* card */}
        <motion.div
          style={{ position: 'absolute', left: Math.round(width * 0.08), top: Math.round(height * 0.30),
            width: width - Math.round(width * 0.08) * 2, height: Math.round(height * 0.68),
            background: palette.paper, borderRadius: 4,
            boxShadow: '0 3px 10px rgba(0,0,0,0.18)', zIndex: 3, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: cardPreview ? 0 : 12, textAlign: 'center' }}
          initial={false}
          animate={cardPreview
            ? { y: 0 }
            : isOpen
              ? { y: -Math.round(height * 0.72), transition: { duration: D * 0.7, delay: D * 0.4, ease: [0.4, 0, 0.2, 1] as const } }
              : { y: 0, transition: { duration: D * 0.5 } }}
        >
          {cardPreview ? cardPreview : (
            <div>
              <div style={{ width: 50, height: 2, background: `linear-gradient(90deg, transparent, ${palette.accent}, transparent)`, margin: '0 auto 10px' }} />
              {children}
              <div style={{ marginTop: 8, color: palette.accent, fontSize: 16 }}>✿</div>
            </div>
          )}
        </motion.div>

        {/* V outer */}
        <div style={{ position: 'absolute', left: 0, top: Math.round(height * 0.18), width, height: Math.round(height * 0.82),
          background: `linear-gradient(165deg, ${palette.bodyTint} 0%, ${palette.body} 30%, ${palette.bodyMid} 65%, ${palette.bodyDark} 100%)`,
          clipPath: 'polygon(0 0, 50% 60%, 100% 0, 100% 100%, 0 100%)',
          borderRadius: '0 0 10px 10px', zIndex: 4, boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.10)' }} />
        {/* V edge accent — 폴딩 라인 highlight (밝은 톤 → 어두운 톤) + shadow 라인을 함께 그려 fold 입체감 */}
        {/* 1) 밝은 highlight 라인 (V 위쪽) — 빛이 닿는 fold 모서리 */}
        <div style={{ position: 'absolute', left: 0, top: Math.round(height * 0.18), width, height: Math.round(height * 0.82),
          background: `linear-gradient(180deg, rgba(255,255,255,0.6) 0%, ${palette.bodyTint} 100%)`,
          clipPath: 'polygon(0 0, 50% 58.9%, 100% 0, 100% 1.1%, 50% 60%, 0 1.1%)',
          opacity: 0.75, zIndex: 5, pointerEvents: 'none' }} />
        {/* 2) 어두운 shadow 라인 (V 아래쪽) — fold 그림자로 깊이감 (palette 색 의존 없이 중성 어두운 톤) */}
        <div style={{ position: 'absolute', left: 0, top: Math.round(height * 0.18), width, height: Math.round(height * 0.82),
          background: 'rgba(0,0,0,0.18)', clipPath: 'polygon(0 0.8%, 50% 60%, 100% 0.8%, 100% 1.8%, 50% 61%, 0 1.8%)',
          opacity: 1, zIndex: 5, pointerEvents: 'none' }} />
        {/* V apex cap — V 끝 부분의 작은 노치를 본체 색으로 채워 매끈하게 */}
        <div style={{ position: 'absolute',
          left: '50%', top: `${Math.round(height * 0.18 + height * 0.82 * 0.6)}px`,
          transform: 'translate(-50%, -50%)',
          width: Math.max(8, Math.round(width * 0.05)),
          height: Math.max(4, Math.round(width * 0.018)),
          background: palette.body,
          borderRadius: '50%',
          zIndex: 5, pointerEvents: 'none' }} />

        {/* 닫힌 Flap — wiggle 애니메이션. isOpen 시 fade out. */}
        <motion.div
          style={{ position: 'absolute', left: 0, top: Math.round(height * 0.18), width, height: Math.round(height * 0.62),
            transformOrigin: 'top center', zIndex: isOpen ? 0 : 6, pointerEvents: 'none' }}
          initial={{ rotateX: 0, opacity: 1 }}
          animate={isOpen
            ? { rotateX: 0, opacity: 0 }
            : prefersReducedMotion ? { rotateX: 0, opacity: 1 } : { rotateX: [0, -45, -8, -55, -5, 0], opacity: 1 }}
          transition={isOpen
            ? { duration: D * 0.45, ease: 'easeOut' }
            : { duration: 5.25, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5, times: [0, 0.18, 0.35, 0.55, 0.75, 1] }}
        >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
              filter: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,0.22))' }}>
            <defs>
              <linearGradient id={gradFront} x1="20%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stopColor={palette.bodyTint} />
                <stop offset="35%" stopColor={palette.body} />
                <stop offset="70%" stopColor={palette.bodyMid} />
                <stop offset="100%" stopColor={palette.bodyDark} />
              </linearGradient>
            </defs>
            <path d="M 0 0 L 100 0 L 56 90 Q 50 100 44 90 Z" fill={`url(#${gradFront})`} />
          </svg>
          {!isOpen && (() => {
            // 실제 봉투(width=380) 기준 28px → 비율 7.37%로 모든 사이즈에 균일하게 적용
            const sealSize = Math.round(width * 0.0737);
            const sealFont = Math.round(width * 0.037);
            return (
              <div style={{ position: 'absolute', left: '50%', top: '88%', width: sealSize, height: sealSize, marginLeft: -sealSize / 2, marginTop: -sealSize / 2,
                borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, ${palette.accent}, ${palette.flapShadow})`,
                boxShadow: '0 2px 5px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: sealFont }}>✿</div>
            );
          })()}
        </motion.div>

        {/* 열린 Flap — flip형과 동일: 위로 향한 삼각형, 가장자리(밝은 코랄) + 안쪽(골드 그라데이션) 분리.
            transformOrigin: bottom — body 윗선 hinge에서 scaleY 펼침. zIndex 2: 카드(z3) 뒤. */}
        <motion.div
          style={{ position: 'absolute', left: 0, top: Math.round(height * 0.18) - Math.round(height * 0.62),
            width, height: Math.round(height * 0.62),
            zIndex: 2, pointerEvents: 'none', transformOrigin: 'bottom center' }}
          initial={{ scaleY: 0 }}
          animate={isOpen
            ? { scaleY: 1, transition: { duration: D * 1.0, delay: D * 0.2, ease: [0.34, 1.1, 0.5, 1] as const } }
            : { scaleY: 0, transition: { duration: D * 0.2 } }}
        >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
              filter: 'drop-shadow(0 -3px 6px rgba(0,0,0,0.22))' }}>
            <defs>
              {/* 가장자리 = 밝은 코랄 (palette.flap) */}
              <linearGradient id={gradBack} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={palette.flap} />
                <stop offset="100%" stopColor={palette.flap} />
              </linearGradient>
              {/* 안쪽 inset = 메탈릭 골드 포일 (사선 그라데이션) */}
              <linearGradient id={`${gradBack}-inner`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={palette.goldHighlight} />
                <stop offset="35%" stopColor={palette.goldLight} />
                <stop offset="60%" stopColor={palette.gold} />
                <stop offset="85%" stopColor={palette.goldDeep} />
                <stop offset="100%" stopColor={palette.goldShadow} />
              </linearGradient>
            </defs>
            {/* 외각 = 밝은 코랄 테두리 */}
            <path d="M 0 100 L 100 100 L 56 10 Q 50 0 44 10 Z" fill={`url(#${gradBack})`} />
            {/* 안쪽 inset = 골드 (테두리 보이도록 약간 inset) */}
            <path d="M 7 96 L 93 96 L 54 17 Q 50 8 46 17 Z" fill={`url(#${gradBack}-inner)`} />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}
