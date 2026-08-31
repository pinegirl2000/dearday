'use client';

import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useId, useState, useEffect, useRef } from 'react';
import type { EnvelopeProps } from './FoldEnvelope';
import type { EnvelopePalette } from './palettes';

// Ribbon Envelope — 봉투 중앙에 우아한 보(bow)가 정지된 채 놓여 있다가,
// 클릭하면 오른쪽 끝이 당겨져 매듭이 풀리고 봉투 뚜껑이 열림.
export type RibbonVariant = 1 | 2 | 3;
interface Props extends EnvelopeProps {
  palette: EnvelopePalette;
  variant?: RibbonVariant; // 1: 기본 핑크, 2/3: 다른 디자인
}

// 리본 이미지 경로 — 팔레트별로 미리 tint된 PNG 사용 (scripts/generate-ribbon-tints.js로 생성)
// 36개 파일: ribbon-bow{N}-{paletteId}.png (3 variants × 12 palettes)
function ribbonSrc(paletteId: string, variant: number): string {
  const base = variant === 1 ? 'ribbon-bow' : `ribbon-bow${variant}`;
  return `/envelope/${base}-${paletteId}.png`;
}
const RIBBON_FILTER = 'drop-shadow(0 3px 6px rgba(0,0,0,0.2))';

// variant별 리본 이미지 배치 — 이미지마다 보(bow) 중심/비율이 달라서 개별 보정
// left/top: flap 컨테이너 기준 %. width: flap 폭 대비 %.
// clipTopBow/clipBottomTails: 리본을 1) 보(상단) 2) 좌 꼬리 3) 우 꼬리 3분할할 때의 경계선(%)
const RIBBON_LAYOUT: Record<1 | 2 | 3, { left: string; top: string; width: string; topClipBottom: number; tailsClipTop: number }> = {
  1: { left: '42%', top: '68%', width: '95%', topClipBottom: 70, tailsClipTop: 28 },
  2: { left: '50%', top: 'calc(30% - 40px)', width: '120%', topClipBottom: 60, tailsClipTop: 40 },
  3: { left: '50%', top: 'calc(58% - 140px)', width: '120%', topClipBottom: 55, tailsClipTop: 45 }
};

interface PetalSpec { id: number; angle: number; distance: number; size: number; rotate: number; duration: number; delay: number; color: string; }

function generatePetals(count: number, colors: readonly string[]): PetalSpec[] {
  return Array.from({ length: count }, (_, i) => {
    // 윗쪽 아치형(π ~ 2π) — 화면 좌표계에서 sin<0 = 위쪽
    // 가장자리에 살짝의 무작위 jitter로 자연스러운 산포
    const t = i / Math.max(count - 1, 1);
    const angle = Math.PI + t * Math.PI + (Math.random() - 0.5) * 0.25;
    return {
      id: i, angle,
      distance: 110 + Math.random() * 200,
      size: 8 + Math.random() * 14,
      rotate: Math.random() * 720 - 360,
      duration: 1.6 + Math.random() * 1.0,
      delay: Math.random() * 0.35,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
  });
}

function Petal({ spec }: { spec: PetalSpec }) {
  const dx = Math.cos(spec.angle) * spec.distance;
  // 아치형 강화: 위쪽으로 추가 부양 + 끝부분에 약간의 낙하감
  const dyArc = Math.sin(spec.angle) * spec.distance;
  const lift = -60 - Math.random() * 80;
  const fall = 20 + Math.random() * 30;
  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.3 }}
      animate={{
        x: [0, dx * 0.55, dx, dx * 1.05],
        y: [0, dyArc * 0.55 + lift * 0.5, dyArc + lift, dyArc + lift + fall],
        opacity: [0, 1, 1, 0],
        rotate: spec.rotate,
        scale: [0.3, 1.1, 1, 0.7]
      }}
      transition={{ duration: spec.duration, delay: spec.delay, ease: [0.22, 0.8, 0.3, 1] as const, times: [0, 0.3, 0.7, 1] }}
      style={{
        position: 'absolute', left: '50%', top: '50%',
        width: spec.size, height: spec.size,
        background: spec.color, borderRadius: '50% 0 50% 0',
        marginLeft: -spec.size / 2, marginTop: -spec.size / 2,
        pointerEvents: 'none',
        boxShadow: `0 0 8px ${spec.color}cc, 0 1px 3px ${spec.color}88`,
        filter: 'brightness(1.15) saturate(1.1)'
      }}
    />
  );
}

export default function RibbonEnvelope({ isOpen, children, width = 320, palette, cardPreview, onComplete, variant = 3 }: Props) {
  const src = ribbonSrc(palette.id, variant);
  const prefersReducedMotion = useReducedMotion();
  const height = Math.round(width * 0.915);
  const D = prefersReducedMotion ? 0.001 : 1;
  const uid = useId().replace(/:/g, '');

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const [particles, setParticles] = useState<PetalSpec[] | null>(null);
  useEffect(() => {
    if (isOpen && !prefersReducedMotion) {
      const t = setTimeout(() => {
        setParticles(generatePetals(26, palette.petals));
        const t2 = setTimeout(() => setParticles(null), 2200);
        return () => clearTimeout(t2);
      }, 2400); // flap 절반 이상 열린 후
      return () => clearTimeout(t);
    }
  }, [isOpen, prefersReducedMotion, palette.petals]);

  useEffect(() => {
    if (!isOpen || !cardPreview) return;
    // 리본 풀림(1.3s) + flap 열림(0.7s) + 감상(1.0s) = 약 3.0s
    const t = setTimeout(() => onCompleteRef.current?.(), 4500 * D);
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
        <div style={{
          position: 'absolute', left: 0, top: Math.round(height * 0.18), width, height: Math.round(height * 0.82),
          background: `linear-gradient(155deg, ${palette.bodyTint} 0%, ${palette.body} 35%, ${palette.bodyMid} 70%, ${palette.bodyDark} 100%)`,
          borderRadius: '4px 4px 10px 10px',
          boxShadow: '0 14px 35px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.18)', zIndex: 1
        }} />
        {/* inner lining */}
        <div style={{
          position: 'absolute', left: 0, top: Math.round(height * 0.18), width, height: Math.round(height * 0.82),
          background: `linear-gradient(155deg, ${palette.goldLight} 0%, ${palette.gold} 50%, ${palette.goldDeep} 100%)`,
          borderRadius: '2px 2px 8px 8px',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.18)', zIndex: 2
        }} />

        {/* card */}
        <motion.div
          style={{
            position: 'absolute', left: Math.round(width * 0.08), top: Math.round(height * 0.30),
            width: width - Math.round(width * 0.08) * 2, height: Math.round(height * 0.68),
            background: palette.paper, borderRadius: 4,
            boxShadow: '0 3px 10px rgba(0,0,0,0.18)', zIndex: 3, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: cardPreview ? 0 : 12, textAlign: 'center'
          }}
          initial={false}
          animate={cardPreview
            ? { y: 0 }
            : isOpen
              ? { y: -Math.round(height * 0.72), transition: { duration: D * 0.9, delay: D * 3.0, ease: [0.4, 0, 0.2, 1] as const } }
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
        <div style={{
          position: 'absolute', left: 0, top: Math.round(height * 0.18), width, height: Math.round(height * 0.82),
          background: `linear-gradient(165deg, ${palette.bodyTint} 0%, ${palette.body} 30%, ${palette.bodyMid} 65%, ${palette.bodyDark} 100%)`,
          clipPath: 'polygon(0 0, 50% 60%, 100% 0, 100% 100%, 0 100%)',
          borderRadius: '0 0 10px 10px', zIndex: 4
        }} />

        {/* ============ Flap — 단일 요소, 앞면(보라+리본) / 뒷면(골드 안감) 두 face.
            rotateX 0→-180으로 hinge에서 통째로 젖혀짐. 리본은 앞면의 자식이라 같이 회전,
            90° 넘어가면 backface-hidden으로 자연스럽게 안 보이고 안감(뒷면)이 드러남. ============ */}
        <motion.div
          style={{
            position: 'absolute', left: 0, top: Math.round(height * 0.18), width, height: Math.round(height * 0.62),
            transformOrigin: 'top center', transformStyle: 'preserve-3d',
            zIndex: 5, pointerEvents: 'none', overflow: 'visible'
          }}
          initial={{ rotateX: 0 }}
          animate={isOpen
            ? { rotateX: -180, transition: { duration: D * 2.4, delay: D * 0.1, ease: [0.25, 0.1, 0.25, 1] as const } }
            : { rotateX: 0, transition: { duration: D * 0.3 } }}
        >
          {/* 앞면 (보라 외피 + 리본) */}
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' } as React.CSSProperties}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', filter: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,0.22))' }}>
              <defs>
                <linearGradient id={`flapFront-${uid}`} x1="20%" y1="0%" x2="80%" y2="100%">
                  <stop offset="0%" stopColor={palette.bodyTint} />
                  <stop offset="35%" stopColor={palette.body} />
                  <stop offset="70%" stopColor={palette.bodyMid} />
                  <stop offset="100%" stopColor={palette.bodyDark} />
                </linearGradient>
              </defs>
              <path d="M 0 0 L 100 0 L 56 90 Q 50 100 44 90 Z" fill={`url(#flapFront-${uid})`} />
            </svg>
            {/* 리본 — 앞면의 자식이라 같이 회전, 90° 넘으면 backface-hidden으로 자동 숨김.
                variant별로 보(bow) 중심/비율이 달라 RIBBON_LAYOUT에서 조정. */}
            {(() => {
              const L = RIBBON_LAYOUT[(variant as 1 | 2 | 3) ?? 1];
              const baseStyle = { position: 'absolute' as const, left: L.left, top: L.top, transform: 'translateX(-50%)', width: L.width, height: 'auto', filter: RIBBON_FILTER, zIndex: 1 };
              return (
                <>
                  <img src={src} alt="" draggable={false}
                    style={{ ...baseStyle, clipPath: `inset(0 0 ${L.topClipBottom}% 0)` }} />
                  <img src={src} alt="" draggable={false}
                    style={{ ...baseStyle, clipPath: `polygon(0 ${L.tailsClipTop}%, 50% ${L.tailsClipTop}%, 50% 100%, 0 100%)` }} />
                  <img src={src} alt="" draggable={false}
                    style={{ ...baseStyle, clipPath: `polygon(50% ${L.tailsClipTop}%, 100% ${L.tailsClipTop}%, 100% 100%, 50% 100%)` }} />
                </>
              );
            })()}
          </div>
          {/* 뒷면 (골드 안감) — rotateX(180)으로 뒤집어 두면, flap이 -180까지 회전했을 때 정면으로 보임 */}
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateX(180deg)' } as React.CSSProperties}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', filter: 'drop-shadow(0 -3px 6px rgba(0,0,0,0.22))' }}>
              <defs>
                <linearGradient id={`flapBack-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={palette.flap} />
                  <stop offset="100%" stopColor={palette.flap} />
                </linearGradient>
                <linearGradient id={`flapBackInner-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={palette.goldHighlight} />
                  <stop offset="35%" stopColor={palette.goldLight} />
                  <stop offset="60%" stopColor={palette.gold} />
                  <stop offset="85%" stopColor={palette.goldDeep} />
                  <stop offset="100%" stopColor={palette.goldShadow} />
                </linearGradient>
              </defs>
              <path d="M 0 100 L 100 100 L 56 10 Q 50 0 44 10 Z" fill={`url(#flapBack-${uid})`} />
              <path d="M 7 96 L 93 96 L 54 17 Q 50 8 46 17 Z" fill={`url(#flapBackInner-${uid})`} />
            </svg>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
