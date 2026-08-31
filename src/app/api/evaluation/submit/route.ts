// 자동 평가 점수 수신 — GitHub Actions (Unlighthouse + Semgrep)에서 POST
// 보안: EVAL_SUBMIT_SECRET 환경변수 + Bearer 인증

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { computeTotal } from '@/lib/evaluation/weights';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SubmitPayload {
  perfectionist_score: number;
  compliance_score?: number;          // optional — automated엔 없을 수도
  mz_score?: number;
  tech_score: number;
  perfectionist_notes?: string;
  compliance_notes?: string;
  mz_notes?: string;
  tech_notes?: string;
  summary?: string;
  ai_recommendations?: string;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const secret = process.env.EVAL_SUBMIT_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: SubmitPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 자동 평가는 perfectionist + tech만 알 수 있음. 나머지는 직전 평가 값 사용 (없으면 0).
  // 사용자가 manual로 채워야 100% 정확. 그래도 trend는 잡힘.
  let cScore = body.compliance_score;
  let mScore = body.mz_score;
  if (cScore === undefined || mScore === undefined) {
    try {
      const { rows } = await pool.query<{ compliance_score: number; mz_score: number }>(
        'SELECT compliance_score, mz_score FROM dearday_evaluation ORDER BY evaluated_at DESC LIMIT 1'
      );
      if (rows[0]) {
        if (cScore === undefined) cScore = rows[0].compliance_score;
        if (mScore === undefined) mScore = rows[0].mz_score;
      }
    } catch {}
  }
  cScore = cScore ?? 0;
  mScore = mScore ?? 0;

  const total = computeTotal(body.perfectionist_score, cScore, mScore, body.tech_score);

  try {
    await pool.query(
      `INSERT INTO dearday_evaluation
        (evaluated_by, perfectionist_score, compliance_score, mz_score, tech_score, total_score,
         perfectionist_notes, compliance_notes, mz_notes, tech_notes, summary, ai_recommendations)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        'auto:github-actions',
        Math.max(0, Math.min(100, body.perfectionist_score)),
        Math.max(0, Math.min(100, cScore)),
        Math.max(0, Math.min(100, mScore)),
        Math.max(0, Math.min(100, body.tech_score)),
        total,
        body.perfectionist_notes || null,
        body.compliance_notes || null,
        body.mz_notes || null,
        body.tech_notes || null,
        body.summary || null,
        body.ai_recommendations || null
      ]
    );
    return NextResponse.json({ ok: true, total });
  } catch (e: any) {
    console.error('evaluation submit error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
