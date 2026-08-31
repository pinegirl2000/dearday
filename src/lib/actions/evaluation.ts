'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { pool } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { computeTotal } from '@/lib/evaluation/weights';

export interface Evaluation {
  id: string;
  evaluated_at: string;
  evaluated_by: string | null;
  perfectionist_score: number;
  compliance_score: number;
  mz_score: number;
  tech_score: number;
  total_score: number;
  perfectionist_notes: string | null;
  compliance_notes: string | null;
  mz_notes: string | null;
  tech_notes: string | null;
  summary: string | null;
  ai_recommendations: string | null;
}

async function requireAdmin(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!isAdminEmail(email)) return null;
  return email || null;
}

export async function listEvaluations(limit: number = 30): Promise<Evaluation[]> {
  const email = await requireAdmin();
  if (!email) return [];
  const { rows } = await pool.query<Evaluation>(
    'SELECT * FROM dearday_evaluation ORDER BY evaluated_at DESC LIMIT $1',
    [limit]
  );
  return rows;
}

export async function createEvaluation(input: {
  perfectionist_score: number;
  compliance_score: number;
  mz_score: number;
  tech_score: number;
  perfectionist_notes?: string;
  compliance_notes?: string;
  mz_notes?: string;
  tech_notes?: string;
  summary?: string;
  ai_recommendations?: string;
  source?: 'manual' | 'automated';
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const email = await requireAdmin();
  if (!email) return { ok: false, error: 'Admin only' };

  const total = computeTotal(
    input.perfectionist_score, input.compliance_score, input.mz_score, input.tech_score
  );

  try {
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO dearday_evaluation
        (evaluated_by, perfectionist_score, compliance_score, mz_score, tech_score, total_score,
         perfectionist_notes, compliance_notes, mz_notes, tech_notes, summary, ai_recommendations)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        input.source === 'automated' ? `auto:${email || 'cron'}` : email,
        Math.max(0, Math.min(100, input.perfectionist_score)),
        Math.max(0, Math.min(100, input.compliance_score)),
        Math.max(0, Math.min(100, input.mz_score)),
        Math.max(0, Math.min(100, input.tech_score)),
        total,
        input.perfectionist_notes || null,
        input.compliance_notes || null,
        input.mz_notes || null,
        input.tech_notes || null,
        input.summary || null,
        input.ai_recommendations || null
      ]
    );
    revalidatePath('/admin/evaluation');
    return { ok: true, id: rows[0].id };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function deleteEvaluation(id: string): Promise<{ ok: boolean; error?: string }> {
  const email = await requireAdmin();
  if (!email) return { ok: false, error: 'Admin only' };
  try {
    await pool.query('DELETE FROM dearday_evaluation WHERE id=$1', [id]);
    revalidatePath('/admin/evaluation');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** 최신 평가 1개 + 직전 평가 (변화량 표시용) */
export async function getLatestEvaluations(): Promise<{ latest: Evaluation | null; previous: Evaluation | null }> {
  const email = await requireAdmin();
  if (!email) return { latest: null, previous: null };
  const { rows } = await pool.query<Evaluation>(
    'SELECT * FROM dearday_evaluation ORDER BY evaluated_at DESC LIMIT 2'
  );
  return { latest: rows[0] || null, previous: rows[1] || null };
}
