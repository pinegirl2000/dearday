'use client';

import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import type { EnvelopeProps } from './FoldEnvelope';
import { COLOR_PALETTES, type EnvelopePalette } from './palettes';

// 꽃잎 파티클 — flap 열릴 때 봉투 안에서 폭발하듯 펼쳐짐
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
      distance: 90 + Math.random() * 180,
      size: 7 + Math.random() * 13,
      rotate: Math.random() * 720 - 360,
      duration: 1.4 + Math.random() * 0.9,
      delay: Math.random() * 0.2,
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
        x: dx,
        y: dy,
        opacity: [0, 1, 1, 0],
        rotate: spec.rotate,
        scale: [0.4, 1, 0.85]
      }}
      transition={{
        duration: spec.duration,
        delay: spec.delay,
        ease: [0.16, 0.7, 0.3, 1] as const,
        opacity: { duration: spec.duration, times: [0, 0.15, 0.7, 1], ease: 'linear' },
        scale: { duration: spec.duration, times: [0, 0.4, 1], ease: 'easeOut' }
      }}
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

// Flip 봉투 — 색상 팔레트 prop을 받는 generic 버전.
// 시퀀스:
//   (1) 우표 + 받는 분 인사말이 한 번에 표시되는 앞면
//   (2) isOpen=true 가 되면 Y축 180° 회전(봉투 뒤집기)
//   (3) 뒤로 돌아간 봉투의 flap이 hinge에서 unfold + 카드 슬라이드 업

interface FlipEnvelopeProps extends EnvelopeProps {
  palette?: EnvelopePalette;
}

// 모듈 레벨 default (palette prop 없을 때 fallback) — midnight
const PALETTE: EnvelopePalette = COLOR_PALETTES.midnight;

const DEFAULT_GREETING = '받는 분께';

export default function EnvelopeBlackGold({
  isOpen, children, width = 320, recipientGreeting, cardPreview, onComplete,
  palette: paletteProp
}: FlipEnvelopeProps) {
  const palette = paletteProp || PALETTE;
  const prefersReducedMotion = useReducedMotion();
  // height는 outer container 높이. body(visible) = height * 0.82이므로
  // visible body가 4:3 (= width * 0.75)이 되려면 height = width * 0.75 / 0.82 ≈ width * 0.915
  const height = Math.round(width * 0.915);
  const D = prefersReducedMotion ? 0.001 : 1;

  const greeting = (recipientGreeting && recipientGreeting.trim()) || DEFAULT_GREETING;

  // 시퀀스 phase
  // 'front'   : 앞면(우표 + 타이핑)
  // 'flipping': Y축 180° 회전 중
  // 'opening' : 뒷면 보이며 flap 열림 + 카드(흰 종이) 슬라이드 업
  const [phase, setPhase] = useState<'front' | 'flipping' | 'opening'>('front');

  // onComplete를 ref로 보관 → 부모 re-render로 ref가 바뀌어도 useEffect 재실행하지 않게
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // 꽃잎 파티클 — flap 열림 시점에 50개 폭발
  const [particles, setParticles] = useState<PetalSpec[] | null>(null);

  // isOpen=true → Y회전 → flap 열림 + 카드 슬라이드 업 → 3초 감상 → onComplete
  useEffect(() => {
    if (!isOpen) return;
    setPhase('flipping');
    const t1 = setTimeout(() => {
      setPhase('opening');
      // flap이 막 열리기 시작하는 순간(delay 0.4s 직전) 꽃잎 폭발
      if (!prefersReducedMotion) {
        setTimeout(() => {
          setParticles(generatePetals(50, palette.petals));
          setTimeout(() => setParticles(null), 2800);
        }, 400 * D);
      }
    }, 1300 * D);
    // opening: flap rise 완료(2.0s) + 0.5s 감상 = 2.5s
    const t2 = setTimeout(() => onCompleteRef.current?.(), (1300 + 2000 + 500) * D);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isOpen, D, prefersReducedMotion, palette.petals]);

  // 회전각: front=0, flipping=180, opening=180
  const rotateY = phase === 'front' ? 0 : 180;

  return (
    <div
      className="relative mx-auto select-none"
      style={{ width, height: height + 30, perspective: 1600 }}
      aria-live="polite"
    >
      {/* 꽃잎 파티클 burst — 봉투 중앙에서 사방으로 펼쳐짐 (z 위에 떠 있도록 zIndex 높게) */}
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, zIndex: 30, pointerEvents: 'none' }}>
        <AnimatePresence>
          {particles && particles.map((p) => <Petal key={p.id} spec={p} />)}
        </AnimatePresence>
      </div>

      {/* Y축 회전 컨테이너 — 앞면(0°) / 뒷면(180°) 전환 */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          transformStyle: 'preserve-3d'
        }}
        initial={false}
        animate={{ rotateY }}
        transition={{ duration: 1.3 * D, ease: [0.45, 0, 0.2, 1] as const }}
      >
        {/* === FRONT (우표 + 받는 분) === */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          <FrontFace width={width} height={height} greeting={greeting} palette={palette} />
        </div>

        {/* === BACK (기존 봉투 + flap 열림) === */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          <BackFace
            width={width}
            height={height}
            opening={phase === 'opening'}
            prefersReducedMotion={!!prefersReducedMotion}
            cardPreview={cardPreview}
            palette={palette}
            D={D}
          >
            {children}
          </BackFace>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================
// FRONT — 우표 + 받는 분 인사말
// ============================================================
function FrontFace({
  width,
  height,
  greeting,
  palette
}: {
  width: number;
  height: number;
  greeting: string;
  palette: EnvelopePalette;
}) {
  const PALETTE = palette;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: Math.round(height * 0.18),
        width,
        height: Math.round(height * 0.82),
        background: `linear-gradient(155deg, ${PALETTE.bodyTint} 0%, ${PALETTE.body} 35%, ${PALETTE.bodyMid} 70%, ${PALETTE.bodyDark} 100%)`,
        borderRadius: '4px 4px 10px 10px',
        boxShadow: '0 14px 35px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
        overflow: 'hidden'
      }}
    >
      {/* 골드 테두리 — 입체감 있는 engraved/embossed 라인 (위 highlight + 아래 shadow) */}
      <div
        style={{
          position: 'absolute',
          inset: 8,
          border: `1px solid ${PALETTE.gold}40`,
          borderRadius: 6,
          boxShadow:
            // 안쪽 4면 입체감 — 좌상단 빛 / 우하단 그림자
            'inset 0 1px 0 rgba(255,255,255,0.20),' +     // 안쪽 위 highlight
            'inset 1px 0 0 rgba(255,255,255,0.18),' +     // 안쪽 왼쪽 highlight
            'inset -1px 0 0 rgba(0,0,0,0.25),' +          // 안쪽 오른쪽 shadow
            'inset 0 -1px 0 rgba(0,0,0,0.30),' +          // 안쪽 아래 shadow
            // 바깥 4면 미세한 라인
            '0 1px 0 rgba(255,255,255,0.10),' +           // 위
            '1px 0 0 rgba(255,255,255,0.08),' +           // 왼쪽
            '-1px 0 0 rgba(0,0,0,0.15),' +                // 오른쪽
            '0 -1px 1px rgba(0,0,0,0.20)',                // 아래
          pointerEvents: 'none'
        }}
      />
      {/* 우표 (우상단) — 봉투 width에 비례 */}
      <Stamp
        top={Math.round(width * 0.037)}
        right={Math.round(width * 0.037)}
        size={Math.round(width * 0.121)}
        palette={palette}
      />
      {/* 받는 분 이름 — 봉투 가운데 */}
      {greeting && (
        <div
          style={{
            position: 'absolute',
            left: '8%',
            right: '8%',
            top: '50%',
            transform: 'translateY(-50%)',
            textAlign: 'center',
            color: PALETTE.ink,
            fontFamily: "'Cormorant Garamond', 'Playfair Display', 'Noto Serif KR', serif",
            fontSize: Math.max(14, Math.round(width * 0.064)),
            fontWeight: 500,
            fontVariant: 'small-caps',
            letterSpacing: '0.12em',
            textShadow: '0 1px 2px rgba(0,0,0,0.35)',
            pointerEvents: 'none'
          }}
        >
          {greeting}
        </div>
      )}
    </div>
  );
}

function Stamp({ top, right, size = 46, palette }: { top: number; right: number; size?: number; palette: EnvelopePalette }) {
  const PALETTE = palette;
  // 실제 봉투(width=380) 기준 46×56 → 비율 유지
  const stampW = size;
  const stampH = Math.round(size * 56 / 46);
  const inset = Math.max(2, Math.round(size * 4 / 46));
  const monoFont = Math.max(10, Math.round(size * 22 / 46));
  return (
    <div
      style={{
        position: 'absolute',
        top,
        right,
        width: stampW,
        height: stampH,
        background: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        // 우표 톱니무늬 (외곽 흰색)
        clipPath:
          'polygon(0 5%, 5% 0, 10% 5%, 15% 0, 20% 5%, 25% 0, 30% 5%, 35% 0, 40% 5%, 45% 0, 50% 5%, 55% 0, 60% 5%, 65% 0, 70% 5%, 75% 0, 80% 5%, 85% 0, 90% 5%, 95% 0, 100% 5%, 95% 10%, 100% 15%, 95% 20%, 100% 25%, 95% 30%, 100% 35%, 95% 40%, 100% 45%, 95% 50%, 100% 55%, 95% 60%, 100% 65%, 95% 70%, 100% 75%, 95% 80%, 100% 85%, 95% 90%, 100% 95%, 95% 100%, 90% 95%, 85% 100%, 80% 95%, 75% 100%, 70% 95%, 65% 100%, 60% 95%, 55% 100%, 50% 95%, 45% 100%, 40% 95%, 35% 100%, 30% 95%, 25% 100%, 20% 95%, 15% 100%, 10% 95%, 5% 100%, 0 95%, 5% 90%, 0 85%, 5% 80%, 0 75%, 5% 70%, 0 65%, 5% 60%, 0 55%, 5% 50%, 0 45%, 5% 40%, 0 35%, 5% 30%, 0 25%, 5% 20%, 0 15%, 5% 10%)'
      }}
    >
      {/* 안쪽 — DearDay 필기체 로고 2줄 (봉투 이름과 동일한 ink 색상) */}
      <div style={{
        position: 'absolute', inset,
        background: PALETTE.flap,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: PALETTE.ink,
        fontFamily: "'Great Vibes', 'Sacramento', 'Allura', cursive",
        fontSize: Math.max(8, Math.round(size * 0.26)),
        fontWeight: 400,
        letterSpacing: '0',
        lineHeight: 0.95,
        textAlign: 'center'
      }}>
        <div>Dear</div>
        <div>Day</div>
      </div>
    </div>
  );
}

// ============================================================
// BACK — 기존 봉투 + flap 열림 + shimmer
// ============================================================
function BackFace({
  width,
  height,
  opening,
  prefersReducedMotion,
  children,
  cardPreview,
  palette,
  D
}: {
  width: number;
  height: number;
  opening: boolean;
  prefersReducedMotion: boolean;
  children?: React.ReactNode;
  cardPreview?: React.ReactNode;
  palette: EnvelopePalette;
  D: number;
}) {
  const PALETTE = palette;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* 봉투 본체 — 그레이 블루 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: Math.round(height * 0.18),
          width,
          height: Math.round(height * 0.82),
          background: `linear-gradient(155deg, ${PALETTE.bodyTint} 0%, ${PALETTE.body} 35%, ${PALETTE.bodyMid} 70%, ${PALETTE.bodyDark} 100%)`,
          borderRadius: '4px 4px 10px 10px',
          boxShadow: '0 14px 35px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
          zIndex: 1
        }}
      />
      {/* 봉투 안쪽 — 골드 포일 + 메탈릭 sheen 다중 그라데이션 (반짝거리는 느낌) */}
      <div
        style={{
          position: 'absolute',
          left: 4,
          top: Math.round(height * 0.18) + 4,
          width: width - 8,
          height: Math.round(height * 0.82) - 8,
          background: `
            radial-gradient(circle at 30% 18%, rgba(255,255,255,0.55) 0%, transparent 40%),
            radial-gradient(circle at 75% 85%, rgba(58,42,6,0.30) 0%, transparent 50%),
            linear-gradient(155deg, ${PALETTE.goldHighlight} 0%, ${PALETTE.goldLight} 22%, ${PALETTE.gold} 50%, ${PALETTE.goldDeep} 78%, ${PALETTE.goldShadow} 100%)
          `,
          borderRadius: '2px 2px 8px 8px',
          boxShadow: 'inset 0 0 30px rgba(122,92,18,0.25), inset 0 2px 0 rgba(255,246,216,0.5)',
          zIndex: 2
        }}
      />

      {/* V자 외피 — 카드 영역을 V triangle 모양으로 carve out */}
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
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.05)'
        }}
      />
      {/* V자 윗부분 라인 (V 외곽) — 밝은 코랄 (palette 색의 light tone) */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: Math.round(height * 0.18),
          width,
          height: Math.round(height * 0.82),
          background: PALETTE.flap,
          clipPath: 'polygon(0 0, 50% 59%, 100% 0, 100% 1.5%, 50% 60.5%, 0 1.5%)',
          opacity: 0.7,
          zIndex: 5,
          pointerEvents: 'none'
        }}
      />
      {/* 봉투 접은 선들 — 종이가 접혀 입체감 생기는 fold lines.
          (1) 좌·우 사이드 fold (수직, body 안쪽으로 살짝 들어옴)
          (2) 좌·우 하단 corner에서 V apex로 올라가는 대각 fold (bottom flap)
          (3) hinge 라인 위 미세한 그림자 */}
      <svg
        viewBox={`0 0 ${width} ${Math.round(height * 0.82)}`}
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          left: 0,
          top: Math.round(height * 0.18),
          width,
          height: Math.round(height * 0.82),
          zIndex: 5,
          pointerEvents: 'none',
          // body 외피와 동일 polygon으로 clip — V-cut 안쪽으로 fold 라인 새지 않게
          clipPath: 'polygon(0 0, 50% 60%, 100% 0, 100% 100%, 0 100%)'
        }}
      >
        <defs>
          <linearGradient id="bgFoldShade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
          </linearGradient>
          <linearGradient id="bgFoldDark" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.0)" />
            <stop offset="50%" stopColor="rgba(0,0,0,0.28)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.0)" />
          </linearGradient>
        </defs>
        {/* 좌·우 사이드 fold — 매우 옅게 */}
        <line x1={4} y1={0} x2={4} y2="100%" stroke="rgba(0,0,0,0.08)" strokeWidth="0.6" />
        <line x1={width - 4} y1={0} x2={width - 4} y2="100%" stroke="rgba(0,0,0,0.08)" strokeWidth="0.6" />
        <line x1={6} y1={0} x2={6} y2="100%" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        <line x1={width - 6} y1={0} x2={width - 6} y2="100%" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

        {/* 하단 bottom flap fold — 매우 옅은 입체감 */}
        <line
          x1={2}
          y1={`${Math.round(height * 0.82) - 2}`}
          x2={width / 2}
          y2={`${Math.round(height * 0.82) * 0.5}`}
          stroke="rgba(0,0,0,0.10)"
          strokeWidth="0.7"
        />
        <line
          x1={width - 2}
          y1={`${Math.round(height * 0.82) - 2}`}
          x2={width / 2}
          y2={`${Math.round(height * 0.82) * 0.5}`}
          stroke="rgba(0,0,0,0.10)"
          strokeWidth="0.7"
        />
        <line
          x1={4}
          y1={`${Math.round(height * 0.82) - 4}`}
          x2={width / 2 + 2}
          y2={`${Math.round(height * 0.82) * 0.5 + 2}`}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.5"
        />
        <line
          x1={width - 4}
          y1={`${Math.round(height * 0.82) - 4}`}
          x2={width / 2 - 2}
          y2={`${Math.round(height * 0.82) * 0.5 + 2}`}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.5"
        />

        {/* 가운데 vertical seam — 거의 안 보이도록 */}
        <line
          x1={width / 2}
          y1={`${Math.round(height * 0.82) * 0.5}`}
          x2={width / 2}
          y2={`${Math.round(height * 0.82) - 2}`}
          stroke="rgba(0,0,0,0.06)"
          strokeWidth="0.3"
          strokeDasharray="2 3"
        />
      </svg>

      {/* === 닫힌 flap (그레이블루, 아래로 향한 삼각형) — z6: 카드 위.
            opacity 페이드 대신 scaleY로 hinge(top edge)로 접혀 들어가게 → 투명해지는 순간 없이 깔끔히 사라짐 */}
      <motion.div
        style={{
          position: 'absolute',
          left: 0,
          top: Math.round(height * 0.18),
          width,
          height: Math.round(height * 0.62),
          zIndex: 6,
          pointerEvents: 'none',
          transformOrigin: 'top center',
          opacity: 1
        }}
        initial={{ scaleY: 1 }}
        animate={
          opening
            ? { scaleY: 0, transition: { duration: D * 0.55, ease: [0.55, 0, 0.7, 0.4] as const } }
            : { scaleY: 1, transition: { duration: D * 0.35 } }
        }
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            filter: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,0.28))'
          }}
        >
          <defs>
            {/* 닫힌 flap 그라데이션 — 본체와 자연스럽게 이어지는 밝은 톤 (bodyTint→bodyMid→flap)
                기존 flap→flapShadow는 V apex 부근이 너무 어두워졌음 */}
            <linearGradient id="bgFlapFront" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={PALETTE.bodyTint} />
              <stop offset="60%" stopColor={PALETTE.bodyMid} />
              <stop offset="100%" stopColor={PALETTE.flap} />
            </linearGradient>
          </defs>
          <path d="M 0 0 L 100 0 L 56 90 Q 50 100 44 90 Z" fill="url(#bgFlapFront)" />
        </svg>
      </motion.div>

      {/* === 열린 flap (그레이블루 가장자리 + 골드 안감, 위로 향한 삼각형) — z2: 카드(z3) 뒤로 깔림.
            transformOrigin이 bottom(=body 윗선의 hinge)이라 scaleY가 커질수록 위로 펼쳐짐 → 실제 flap이 열리는 모양 */}
      <motion.div
        style={{
          position: 'absolute',
          left: 0,
          top: Math.round(height * 0.18) - Math.round(height * 0.62),
          width,
          height: Math.round(height * 0.62),
          zIndex: 2,
          pointerEvents: 'none',
          transformOrigin: 'bottom center',
          opacity: 1
        }}
        initial={{ scaleY: 0 }}
        animate={
          opening
            ? { scaleY: 1, transition: { duration: D * 1.6, delay: D * 0.4, ease: [0.34, 1.1, 0.5, 1] as const } }
            : { scaleY: 0, transition: { duration: D * 0.3 } }
        }
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            filter: 'drop-shadow(0 -4px 8px rgba(0,0,0,0.35))'
          }}
        >
          <defs>
            {/* open flap 전체 = 솔리드 밝은 코랄 (그라데이션 없음) */}
            <linearGradient id="bgFlapBack" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={PALETTE.flap} />
              <stop offset="100%" stopColor={PALETTE.flap} />
            </linearGradient>
            {/* 메탈릭 sheen — 좌상단에서 빛 반사 */}
            <radialGradient id="bgFlapSheen" cx="32%" cy="22%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
              <stop offset="35%" stopColor="#FFF6D8" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>
            {/* 우하단 어두운 음영으로 깊이감 */}
            <radialGradient id="bgFlapDarken" cx="78%" cy="88%" r="55%">
              <stop offset="0%" stopColor="#3A2A06" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#3A2A06" stopOpacity="0" />
            </radialGradient>
            {/* inner inset = 메탈릭 골드 포일 (사선 그라데이션, 좌상단 밝음 → 우하단 어둠) */}
            <linearGradient id="bgFlapEdge" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={PALETTE.goldHighlight} />
              <stop offset="35%" stopColor={PALETTE.goldLight} />
              <stop offset="60%" stopColor={PALETTE.gold} />
              <stop offset="85%" stopColor={PALETTE.goldDeep} />
              <stop offset="100%" stopColor={PALETTE.goldShadow} />
            </linearGradient>
          </defs>
          {/* 외각: 골드 베이스 + sheen + darken (3중 레이어로 metallic 포일 느낌) */}
          <path d="M 0 100 L 100 100 L 56 10 Q 50 0 44 10 Z" fill="url(#bgFlapBack)" />
          <path d="M 0 100 L 100 100 L 56 10 Q 50 0 44 10 Z" fill="url(#bgFlapSheen)" />
          <path d="M 0 100 L 100 100 L 56 10 Q 50 0 44 10 Z" fill="url(#bgFlapDarken)" />
          {/* 안쪽 inset = 그레이블루 */}
          <path d="M 7 96 L 93 96 L 54 17 Q 50 8 46 17 Z" fill="url(#bgFlapEdge)" />
        </svg>
      </motion.div>
      {/* === 카드 슬롯 — body 영역 안에 정확히 들어감 (envelope 18% 아래부터 100%까지).
            카드는 회전된 TemplateCard, 슬롯 dim에 비균등 scale로 fit (가로 100%, 세로 body의 90%).
            opening 시 슬라이드 없음 — 카드가 봉투 밖으로 절대 나오지 않음. */}
      <motion.div
        style={{
          position: 'absolute',
          left: 0,
          top: Math.round(height * 0.18 + height * 0.041),
          width: width,
          height: Math.round(height * 0.82 * 0.9),
          background: cardPreview ? 'transparent' : PALETTE.paper,
          borderRadius: 4,
          boxShadow: '0 3px 10px rgba(0,0,0,0.35)',
          // 카드는 envelope body/flap 뒤에 위치 (z 3) — 닫힌 봉투에선 flap이 가리고, 열려도 V cut 사이로 살짝 보임
          zIndex: 3,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: cardPreview ? 0 : 12,
          textAlign: 'center'
        }}
        initial={false}
        animate={{ opacity: 1, y: 0 }}
      >
        {cardPreview ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            {cardPreview}
          </div>
        ) : (
          <div>
            <div style={{ width: 50, height: 2, background: `linear-gradient(90deg, transparent, ${PALETTE.gold}, transparent)`, margin: '0 auto 10px' }} />
            {children}
            <div style={{ marginTop: 8, color: PALETTE.gold, fontSize: 16 }}>✦</div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
