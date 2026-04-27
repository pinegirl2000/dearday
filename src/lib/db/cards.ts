import { pool } from '@/lib/db';
import type { BaseCard } from '@/types/card';

export async function getCardBySlug(slug: string): Promise<BaseCard | null> {
  const { rows } = await pool.query<BaseCard>(
    'SELECT * FROM dearday_card WHERE slug = $1 LIMIT 1',
    [slug]
  );
  return rows[0] || null;
}
