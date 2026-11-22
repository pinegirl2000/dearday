'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { planFit, type FitMeasure, type FitResult } from '@/lib/fit-plan';
import type { ResolvedRoleStyle } from '@/lib/typography';

/** 웹폰트를 기다리며 제목을 숨겨 두는 최대 시간(ms) — 이보다 늦으면 대체 글꼴 기준으로 먼저 보여줌 */
const FONT_WAIT_MS = 300;

// 서버 렌더에서는 useLayoutEffect 경고가 나므로 브라우저에서만 layout effect 사용
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

// React 18 타입에 아직 없는 text-wrap — 줄바꿈 시 두 줄 길이를 고르게 맞추기 위함
const BALANCE_STYLE = { textWrap: 'balance' } as unknown as CSSProperties;
const PRETTY_STYLE = { textWrap: 'pretty' } as unknown as CSSProperties;

const sameFit = (a: FitResult, b: FitResult) => a.size === b.size && a.spacing === b.spacing && a.wrap === b.wrap;

interface FitTextProps {
  as?: 'h1' | 'div';
  /** 측정에 쓰는 원문 (children 이 편집용 래퍼여도 실제 글자는 이것) */
  text: string;
  style: ResolvedRoleStyle;
  color: string;
  align?: 'left' | 'center' | 'right';
  /** false 면 크기·자간 축소 없이 줄바꿈 규칙만 적용 (본문용) */
  shrinkToFit?: boolean;
  children?: ReactNode;
  className?: string;
  /** 바깥 여백 등 배치용 스타일 */
  extraStyle?: CSSProperties;
}

/**
 * 컨테이너 폭 안에 글자가 들어가도록 자간 → 크기 → 줄바꿈 순으로 맞추는 텍스트.
 * 배경 프레임·세로선 밖으로 제목이 나가는 것을 사용자 입력과 무관하게 막기 위함.
 */
export function FitText({
  as = 'div', text, style, color, align = 'center', shrinkToFit = true, children, className, extraStyle
}: FitTextProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const base: FitResult = { size: style.size, spacing: style.spacing, wrap: false };
  const [fit, setFit] = useState<FitResult>(base);
  const [ready, setReady] = useState(!shrinkToFit);
  const centered = align === 'center';
  // style 객체는 렌더마다 새로 만들어지므로 원시값으로 의존성을 잡아 effect 무한 반복을 막음
  const { size, minSize, spacing, minSpacing, fontFamily, weight, uppercase } = style;

  /** 숨긴 probe span 으로 실제 렌더 폭 측정 — offsetWidth 는 transform(축소 썸네일)의 영향을 받지 않음 */
  const compute = useCallback((): FitResult | null => {
    const box = boxRef.current;
    const probe = probeRef.current;
    if (!box || !probe) return null;
    const widthOf = (s: string, size: number, spacing: number) => {
      probe.textContent = s;
      probe.style.fontSize = `${size}px`;
      probe.style.letterSpacing = `${spacing}em`;
      // 가운데 정렬은 왼쪽에 자간만큼 보정 여백을 주므로 그만큼 폭을 더 차지함
      return probe.offsetWidth + (centered ? spacing * size : 0);
    };
    const measure: FitMeasure = {
      widestLine: (size, spacing) => Math.max(0, ...text.split('\n').map((l) => widthOf(l, size, spacing))),
      longestWord: (size, spacing) => Math.max(0, ...text.split(/\s+/).map((w) => widthOf(w, size, spacing)))
    };
    return planFit(text, box.clientWidth, { size, minSize, spacing, minSpacing }, measure);
    // 글꼴·굵기·대문자도 측정 폭을 바꾸므로 의존성에 포함 (관리자가 글꼴만 바꿔도 다시 맞춤)
  }, [text, size, minSize, spacing, minSpacing, centered, fontFamily, weight, uppercase]);

  useIsoLayoutEffect(() => {
    if (!shrinkToFit) { setFit((cur) => (sameFit(cur, { size, spacing, wrap: false }) ? cur : { size, spacing, wrap: false })); setReady(true); return; }
    let cancelled = false;
    const apply = (next: FitResult | null, shrinkOnly: boolean) => {
      if (cancelled || !next) return;
      // 웹폰트 도착 후 재측정은 줄이는 방향만 — 보이는 제목이 커졌다 작아졌다 하지 않게
      setFit((cur) => {
        if (sameFit(cur, next)) return cur; // 같은 결과면 상태를 바꾸지 않아 재렌더 반복 방지
        return shrinkOnly && next.size >= cur.size && next.spacing >= cur.spacing ? cur : next;
      });
    };
    apply(compute(), false);

    const fonts = typeof document !== 'undefined' ? document.fonts : undefined;
    if (!fonts || fonts.status === 'loaded') {
      setReady(true);
    } else {
      const timeout = new Promise<void>((r) => setTimeout(r, FONT_WAIT_MS));
      Promise.race([fonts.ready.then(() => undefined), timeout]).then(() => {
        apply(compute(), false);
        if (!cancelled) setReady(true);
      });
      fonts.ready.then(() => apply(compute(), true));
    }

    // 화면 회전·컨테이너 폭 변화는 사용자 동작이므로 키우는 방향도 허용
    const box = boxRef.current;
    const ro = box ? new ResizeObserver(() => apply(compute(), false)) : null;
    if (box && ro) ro.observe(box);
    return () => { cancelled = true; ro?.disconnect(); };
  }, [compute, shrinkToFit, size, spacing]);

  const Tag = as;
  const textStyle: CSSProperties = {
    margin: 0,
    fontFamily: style.fontFamily,
    fontWeight: style.weight,
    lineHeight: style.lineHeight,
    color,
    fontSize: fit.size,
    letterSpacing: `${fit.spacing}em`,
    textTransform: style.uppercase ? 'uppercase' : undefined,
    textAlign: align,
    // 마지막 글자 뒤에 붙는 자간 때문에 가운데 정렬이 왼쪽으로 쏠리는 것 보정
    paddingLeft: centered && fit.spacing > 0 ? `${fit.spacing}em` : undefined,
    whiteSpace: 'pre-wrap',
    // 한국어는 음절 중간에서 끊지 않음
    wordBreak: 'keep-all',
    // 제목류는 단어 중간 끊김 금지(축소로 해결), 본문은 긴 URL 등이 넘치지 않도록 단어 끊기 허용
    overflowWrap: shrinkToFit ? 'normal' : 'break-word',
    visibility: ready ? 'visible' : 'hidden',
    ...(fit.wrap ? BALANCE_STYLE : null),
    // 본문은 마지막 줄에 단어 하나만 덩그러니 남지 않게
    ...(!shrinkToFit ? PRETTY_STYLE : null)
  };

  return (
    <div ref={boxRef} className={className} style={{ position: 'relative', width: '100%', ...extraStyle }}>
      <Tag style={textStyle}>{children ?? text}</Tag>
      {shrinkToFit && (
        <span
          ref={probeRef}
          aria-hidden
          style={{
            position: 'absolute', left: 0, top: 0, visibility: 'hidden', pointerEvents: 'none', whiteSpace: 'pre',
            fontFamily: style.fontFamily, fontWeight: style.weight, textTransform: style.uppercase ? 'uppercase' : undefined
          }}
        />
      )}
    </div>
  );
}
