// Direct PostgreSQL pool (서버사이드 전용)
import { Pool } from 'pg';

declare global {
  var pgPool: Pool | undefined;
}

export const pool =
  global.pgPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5
  });

if (process.env.NODE_ENV !== 'production') global.pgPool = pool;
