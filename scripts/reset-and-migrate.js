// DearDay DB Reset + Migration (bg_id + layout_id 분리 버전)
// Run: node scripts/reset-and-migrate.js
// ⚠️ 모든 dearday_* 데이터 삭제 후 재생성

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://postgres.eszjejwugedrohsdemdd:akffjq2!ONC@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const DROP_SQL = `
DROP TABLE IF EXISTS dearday_rsvp CASCADE;
DROP TABLE IF EXISTS dearday_recipient CASCADE;
DROP TABLE IF EXISTS dearday_card_image CASCADE;
DROP TABLE IF EXISTS dearday_card CASCADE;
`;

const CREATE_SQL = `
CREATE TABLE dearday_card (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  owner_token TEXT,
  owner_id UUID,

  event_type TEXT NOT NULL,
  title TEXT NOT NULL,

  theme TEXT DEFAULT 'hydrangea',
  bg_id TEXT DEFAULT 'bg-none',
  layout_id TEXT DEFAULT 'layout-classic',
  envelope_anim TEXT DEFAULT 'flip',
  custom_bg_url TEXT,
  font_family TEXT DEFAULT 'serif',

  body TEXT,
  event_date TIMESTAMPTZ,
  event_place TEXT,
  map_url TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  extra_info TEXT,
  greeting_oneliner TEXT,

  rsvp_enabled BOOLEAN DEFAULT true,
  rsvp_deadline TIMESTAMPTZ,
  rsvp_max_per_card INT DEFAULT 4 CHECK (rsvp_max_per_card BETWEEN 1 AND 5),
  rsvp_collect_names BOOLEAN DEFAULT false,

  expiry_date TIMESTAMPTZ,
  plan TEXT DEFAULT 'free',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dearday_card_image (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES dearday_card(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dearday_recipient (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES dearday_card(id) ON DELETE CASCADE,
  num TEXT NOT NULL,
  name TEXT NOT NULL,
  group_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(card_id, num)
);

CREATE TABLE dearday_rsvp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES dearday_card(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES dearday_recipient(id) ON DELETE CASCADE,
  attend BOOLEAN NOT NULL,
  count INT DEFAULT 1,
  attendee_names TEXT[],
  oneliner TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dearday_card_slug ON dearday_card(slug);
CREATE INDEX idx_dearday_recipient_card ON dearday_recipient(card_id);
CREATE INDEX idx_dearday_rsvp_card ON dearday_rsvp(card_id);
CREATE INDEX idx_dearday_card_image_card ON dearday_card_image(card_id);
`;

(async () => {
  try {
    console.log('⚠️  Dropping all dearday_* tables...');
    await pool.query(DROP_SQL);
    console.log('✅ Dropped');

    console.log('Recreating tables with bg_id + layout_id...');
    await pool.query(CREATE_SQL);
    console.log('✅ Created');

    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema='public' AND table_name LIKE 'dearday_%'
      ORDER BY table_name
    `);
    console.log('\n📋 Tables:');
    tables.rows.forEach(r => console.log('  -', r.table_name));
  } catch (e) {
    console.error('❌ Migration failed:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
