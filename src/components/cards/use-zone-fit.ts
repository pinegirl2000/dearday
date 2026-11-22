'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { planZone, ZONE_INITIAL, type ZonePlan } from '@/lib/zone-plan';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** 이 폭(px) 이상 달라져야 '화면이 바뀌었다'고 보고 처음부터 다시 맞춤 */
const WIDTH_RESET_THRESHOLD = 20;

const samePlan = (a: ZonePlan, b: ZonePlan) =>
  a.bodyBelow === b.bodyBelow && a.subtitleBelow === b.subtitleBelow && a.headBelow === b.headBelow && a.titleSize === b.titleSize;

interface Options {
  enabled: boolean;
  /** 글 내용·스타일이 바뀌면 달라지는 키 — 바뀌면 처음(전부 표지)부터 다시 맞춤. 글을 줄였을 때 본문이 표지로 돌아오게 하기 위함 */
  resetKey: string;
  baseTitleSize: number;
  minTitleSize: number;
  gap: number;
}

/**
 * 표지 글 영역에 제목부를 세로로 맞추는 훅.
 * 영역과 각 조각(라벨·부제·제목·본문)의 실제 높이를 재서 planZone 에 넘기고, 결과(무엇을 내용 면으로 내릴지)를 돌려준다.
 * 내려간 조각도 영역 안에 숨긴 채로 남겨 계속 재므로, 결과가 왔다 갔다 하지 않는다.
 */
export function useZoneFit({ enabled, resetKey, baseTitleSize, minTitleSize, gap }: Options) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [plan, setPlan] = useState<ZonePlan>({ ...ZONE_INITIAL, titleSize: baseTitleSize });
  const planRef = useRef(plan);
  planRef.current = plan;
  const lastWidth = useRef(0);
  // 첫 측정 완료 여부 — 그 전에는 호출부가 영역을 숨겨 "겹쳐 보였다가 내려가는" 첫 화면을 막는다
  const [measured, setMeasured] = useState(false);
  // ?zones 가 붙으면 영역 테두리를 표시(영역 값 보정용). 서버 렌더와 어긋나지 않게 마운트 후에 읽음
  const [debug, setDebug] = useState(false);
  useEffect(() => { setDebug(new URLSearchParams(window.location.search).has('zones')); }, []);

  const apply = useCallback((next: ZonePlan) => {
    if (!samePlan(planRef.current, next)) { planRef.current = next; setPlan(next); }
  }, []);

  const measure = useCallback(() => {
    const zone = zoneRef.current;
    if (!enabled || !zone) return;
    const h = (r: React.RefObject<HTMLDivElement>) => r.current?.offsetHeight ?? 0;
    if (zone.clientHeight > 0) setMeasured(true);
    apply(planZone({
      zoneH: zone.clientHeight,
      labelH: h(labelRef), subtitleH: h(subtitleRef), titleH: h(titleRef), bodyH: h(bodyRef),
      gap, titleSize: planRef.current.titleSize, minTitleSize
    }));
  }, [enabled, gap, minTitleSize, apply]);

  // 내용이 바뀌면 처음 상태에서 다시 시작
  useIsoLayoutEffect(() => {
    apply({ ...ZONE_INITIAL, titleSize: baseTitleSize });
  }, [resetKey, baseTitleSize, apply]);

  // 렌더가 끝날 때마다 측정 — 제목 크기를 한 단계 줄인 뒤에는 높이를 다시 재야 하므로
  useIsoLayoutEffect(() => { measure(); });

  // 글꼴 로드·가로 맞춤(FitText)·화면 회전으로 높이가 바뀌는 경우
  useEffect(() => {
    if (!enabled) return;
    // 첫 관찰 콜백을 '폭 변화'로 착각해 맞춘 결과를 되돌리지 않도록 현재 폭을 먼저 기록
    lastWidth.current = zoneRef.current?.clientWidth ?? 0;
    const ro = new ResizeObserver(() => {
      const w = zoneRef.current?.clientWidth ?? 0;
      // 폭이 크게 바뀌면(회전·창 크기) 줄였던 제목을 되돌릴 기회를 주기 위해 처음부터.
      // 작은 변화(스크롤바가 생겼다 사라지는 정도)는 무시 — 본문이 오르내리며 진동하는 것 방지
      if (Math.abs(w - lastWidth.current) >= WIDTH_RESET_THRESHOLD) { lastWidth.current = w; apply({ ...ZONE_INITIAL, titleSize: baseTitleSize }); }
      measure();
    });
    for (const r of [zoneRef, labelRef, subtitleRef, titleRef, bodyRef]) { if (r.current) ro.observe(r.current); }
    return () => ro.disconnect();
  }, [enabled, measure, apply, baseTitleSize]);

  // 웹폰트가 늦게 도착하면 글 높이가 달라진다 — 대체 글꼴 기준으로 내려갔던 본문이 돌아올 수 있게 한 번 더 처음부터
  useEffect(() => {
    if (!enabled || typeof document === 'undefined' || !document.fonts) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      apply({ ...ZONE_INITIAL, titleSize: baseTitleSize });
      measure();
    });
    return () => { cancelled = true; };
  }, [enabled, apply, measure, baseTitleSize]);

  return { plan, debug, measured, refs: { zoneRef, labelRef, subtitleRef, titleRef, bodyRef } };
}
