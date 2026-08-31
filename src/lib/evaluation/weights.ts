// 평가 가중치 + 점수 계산 — server actions와 분리 (sync 함수 export 가능)

export const EVAL_WEIGHTS = {
  perfectionist: 0.25,    // Unlighthouse — UX/Perf/A11y
  compliance:    0.25,    // PDPA / 개인정보 — manual (또는 LLM)
  mz:            0.25,    // 트렌드 — manual (또는 LLM)
  tech:          0.25     // Semgrep — 코드/보안
} as const;

export function computeTotal(p: number, c: number, m: number, t: number): number {
  return Math.round(
    p * EVAL_WEIGHTS.perfectionist +
    c * EVAL_WEIGHTS.compliance +
    m * EVAL_WEIGHTS.mz +
    t * EVAL_WEIGHTS.tech
  );
}
