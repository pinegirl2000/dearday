// DearDay DB Migration Script
// Run: node scripts/migrate.js
// 우선순위: process.env.DATABASE_URL > .env.local > 하드코드 fallback

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// .env.local 자동 로드 (env에 DATABASE_URL 없을 때)
function loadEnvLocal() {
  if (process.env.DATABASE_URL) return;
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnvLocal();

const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://postgres.eszjejwugedrohsdemdd:akffjq2!ONC@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const SQL = `
-- Users (NextAuth Google OAuth)
CREATE TABLE IF NOT EXISTS dearday_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  email TEXT,
  name TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_id)
);

-- Cards (이벤트 한 건)
CREATE TABLE IF NOT EXISTS dearday_card (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  user_id UUID,
  owner_token TEXT,

  event_type TEXT NOT NULL,
  title TEXT NOT NULL,

  theme TEXT DEFAULT 'hydrangea',
  bg_id TEXT DEFAULT 'bg-none',
  layout_id TEXT DEFAULT 'layout-classic',
  envelope_anim TEXT DEFAULT 'fold',
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
  recipient_template TEXT,

  rsvp_enabled BOOLEAN DEFAULT true,
  rsvp_deadline TIMESTAMPTZ,
  rsvp_max_per_card INT DEFAULT 4 CHECK (rsvp_max_per_card BETWEEN 1 AND 5),
  rsvp_collect_names BOOLEAN DEFAULT false,

  expiry_date TIMESTAMPTZ,
  plan TEXT DEFAULT 'free',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 카드 상단 이벤트 라벨 사용자 override (마이그레이션 — 기존 테이블에도 추가)
ALTER TABLE dearday_card ADD COLUMN IF NOT EXISTS event_label TEXT;

-- 이벤트 타입별 sample data — 사용자가 detail 진입 시 선택 가능 (admin 관리 가능)
CREATE TABLE IF NOT EXISTS dearday_sample_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,             -- 'wedding', 'birthday', 'baptism', 'meeting', 'opening', 'etc'
  label TEXT NOT NULL,                  -- admin/user UI에 노출되는 sample 이름 (예: "1st Birthday", "Sweet 16")
  title TEXT,
  greeting_oneliner TEXT,               -- subtitle
  body TEXT,
  event_place TEXT,
  map_url TEXT,                         -- address
  contact_name TEXT,                    -- host name
  contact_phone TEXT,                   -- host contact
  extra_info TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dearday_sample_event ON dearday_sample_data(event_type, sort_order);

-- Card 첨부 이미지
CREATE TABLE IF NOT EXISTS dearday_card_image (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES dearday_card(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 수신자 (paid 전용)
CREATE TABLE IF NOT EXISTS dearday_recipient (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES dearday_card(id) ON DELETE CASCADE,
  num TEXT NOT NULL,
  name TEXT NOT NULL,
  group_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(card_id, num)
);

-- email 발송 관련 컬럼 (마이그레이션 — 기존 테이블에도 추가)
ALTER TABLE dearday_recipient ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE dearday_recipient ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'link';
ALTER TABLE dearday_recipient ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE dearday_recipient ADD COLUMN IF NOT EXISTS sent_status TEXT DEFAULT 'pending';
-- delivery_method: 'link' (링크만) | 'email' (이메일 발송)
-- sent_status: 'pending' | 'sent' | 'failed'

-- RSVP 응답
CREATE TABLE IF NOT EXISTS dearday_rsvp (
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

-- 템플릿 설정 override (admin이 코드 default를 덮어쓰기)
CREATE TABLE IF NOT EXISTS dearday_template_config (
  template_id TEXT PRIMARY KEY,
  allowed_layouts TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

-- 이벤트별 템플릿 노출 순서 (admin drag&drop으로 지정)
CREATE TABLE IF NOT EXISTS dearday_template_event_order (
  event_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT,
  PRIMARY KEY (event_id, template_id)
);
CREATE INDEX IF NOT EXISTS idx_dearday_template_event_order_event
  ON dearday_template_event_order(event_id, sort_order);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dearday_card_slug ON dearday_card(slug);
CREATE INDEX IF NOT EXISTS idx_dearday_card_user ON dearday_card(user_id);
CREATE INDEX IF NOT EXISTS idx_dearday_recipient_card ON dearday_recipient(card_id);
CREATE INDEX IF NOT EXISTS idx_dearday_rsvp_card ON dearday_rsvp(card_id);
CREATE INDEX IF NOT EXISTS idx_dearday_card_image_card ON dearday_card_image(card_id);
`;

(async () => {
  try {
    console.log('Connecting to Supabase...');
    await pool.query(SQL);
    console.log('✅ DearDay tables created successfully');

    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema='public' AND table_name LIKE 'dearday_%'
      ORDER BY table_name
    `);
    console.log('\n📋 Created tables:');
    tables.rows.forEach(r => console.log('  -', r.table_name));
  } catch (e) {
    console.error('❌ Migration failed:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
