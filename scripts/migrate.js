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
  rsvp_allow_oneliner BOOLEAN DEFAULT false,
  rsvp_allow_change BOOLEAN DEFAULT true,

  expiry_date TIMESTAMPTZ,
  plan TEXT DEFAULT 'free',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 카드 상단 이벤트 라벨 사용자 override (마이그레이션 — 기존 테이블에도 추가)
ALTER TABLE dearday_card ADD COLUMN IF NOT EXISTS event_label TEXT;
-- RSVP 옵션 — 기존 테이블에도 추가
ALTER TABLE dearday_card ADD COLUMN IF NOT EXISTS rsvp_allow_oneliner BOOLEAN DEFAULT false;
ALTER TABLE dearday_card ADD COLUMN IF NOT EXISTS rsvp_allow_change BOOLEAN DEFAULT true;

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
ALTER TABLE dearday_recipient ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
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
-- 폰트 3색 + 박스 그라디언트 2색 (DB 우선, 미정의 시 코드 default fallback)
ALTER TABLE dearday_template_config ADD COLUMN IF NOT EXISTS color_main TEXT;
ALTER TABLE dearday_template_config ADD COLUMN IF NOT EXISTS color_sub TEXT;
ALTER TABLE dearday_template_config ADD COLUMN IF NOT EXISTS color_box_text TEXT;
ALTER TABLE dearday_template_config ADD COLUMN IF NOT EXISTS box_bg_top TEXT;
ALTER TABLE dearday_template_config ADD COLUMN IF NOT EXISTS box_bg_bottom TEXT;
ALTER TABLE dearday_template_config ADD COLUMN IF NOT EXISTS color_title_accent TEXT;
ALTER TABLE dearday_template_config ADD COLUMN IF NOT EXISTS rsvp_button_color TEXT;
-- 카드 배치(metrics) override — 배경 이미지에 맞춰 텍스트 시작 위치/카드 크기 조정
ALTER TABLE dearday_template_config ADD COLUMN IF NOT EXISTS card_max_width INT;
ALTER TABLE dearday_template_config ADD COLUMN IF NOT EXISTS card_min_height INT;
ALTER TABLE dearday_template_config ADD COLUMN IF NOT EXISTS content_top INT;
ALTER TABLE dearday_template_config ADD COLUMN IF NOT EXISTS content_side INT;

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

-- 이벤트별 템플릿 제외 (admin이 특정 (event, template) 쌍 숨김)
CREATE TABLE IF NOT EXISTS dearday_template_event_exclude (
  event_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT,
  PRIMARY KEY (event_id, template_id)
);
CREATE INDEX IF NOT EXISTS idx_dearday_template_event_exclude_event
  ON dearday_template_event_exclude(event_id);

-- 이벤트별 템플릿 추가 포함 (admin이 코드의 recommendEvents에 없는 템플릿을 명시 추가)
CREATE TABLE IF NOT EXISTS dearday_template_event_include (
  event_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT,
  PRIMARY KEY (event_id, template_id)
);
CREATE INDEX IF NOT EXISTS idx_dearday_template_event_include_event
  ON dearday_template_event_include(event_id);

-- 커스텀 이벤트 (admin이 추가) — 코드의 EVENT_TYPES 외 추가 이벤트 (deprecated, dearday_event로 마이그레이션)
CREATE TABLE IF NOT EXISTS dearday_event_custom (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🎉',
  sort_order INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- 통합 이벤트 테이블 — 코드 default 6개 + 커스텀 모두 DB 관리
CREATE TABLE IF NOT EXISTS dearday_event (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🎉',
  sort_order INT DEFAULT 100,
  is_default BOOLEAN DEFAULT false,
  card_type TEXT DEFAULT 'invitation' CHECK (card_type IN ('invitation', 'thankcard', 'congrats')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
-- 마이그레이션: 기존 테이블에도 컬럼 추가
ALTER TABLE dearday_event ADD COLUMN IF NOT EXISTS card_type TEXT DEFAULT 'invitation';
-- congrats 추가 — 기존 CHECK 제약 갱신
ALTER TABLE dearday_event DROP CONSTRAINT IF EXISTS dearday_event_card_type_check;
ALTER TABLE dearday_event ADD CONSTRAINT dearday_event_card_type_check CHECK (card_type IN ('invitation', 'thankcard', 'congrats'));
-- 코드 default + Singapore 문화 기반 확장 시드
INSERT INTO dearday_event (id, label, emoji, sort_order, is_default, card_type) VALUES
  -- Invitation (date/place + RSVP)
  ('birthday',          'Birthday Party',    '🎂',  20, true,  'invitation'),
  ('baby-full-month',   'Baby Full Month',   '👶',  22, true,  'invitation'),
  ('first-birthday',    '1st Birthday',      '🍰',  24, true,  'invitation'),
  ('housewarming',      'Housewarming',      '🏡',  26, true,  'invitation'),
  ('engagement',        'Engagement',        '💍',  28, true,  'invitation'),
  ('baptism',           'Baptism',           '🕊️',  30, true,  'invitation'),
  ('meeting',           'Gathering',         '🤝',  40, true,  'invitation'),
  ('opening',           'Opening',           '🎉',  50, true,  'invitation'),
  ('etc',               'Other',             '✉️',  60, true,  'invitation'),
  -- Thank / Congrats (message-focused, no date/place)
  ('mothers-day',       'Mother''s Day',     '💝', 110, true,  'thankcard'),
  ('fathers-day',       'Father''s Day',     '💙', 112, true,  'thankcard'),
  ('teachers-day',      'Teacher''s Day',    '🌸', 114, true,  'thankcard'),
  ('thank-you',         'Thank you',         '🙏', 116, true,  'thankcard'),
  ('get-well',          'Get well',          '🌷', 118, true,  'thankcard'),
  ('sorry',             'Sorry',             '🤍', 120, true,  'thankcard'),
  ('graduation',        'Graduation',        '🎓', 130, true,  'congrats'),
  ('promotion',         'New Job · Promo',   '🎯', 132, true,  'congrats'),
  -- Anniversary / Holiday (Singapore 문화)
  ('wedding-anniversary', 'Wedding Anniv.',  '💑', 210, true,  'congrats'),
  ('cny',                 'Chinese New Year','🧧', 212, true,  'congrats'),
  ('hari-raya',           'Hari Raya',       '🌙', 214, true,  'congrats'),
  ('deepavali',           'Deepavali',       '🪔', 216, true,  'congrats'),
  ('mid-autumn',          'Mid-Autumn',      '🥮', 218, true,  'congrats'),
  ('christmas',           'Christmas',       '🎄', 220, true,  'congrats'),
  ('national-day',        'National Day SG', '🇸🇬', 222, true,  'congrats'),
  ('valentines',          'Valentine''s',    '❤️', 224, true,  'congrats')
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  emoji = EXCLUDED.emoji,
  card_type = EXCLUDED.card_type,
  sort_order = EXCLUDED.sort_order;
-- 기존 커스텀 데이터 마이그레이션
INSERT INTO dearday_event (id, label, emoji, sort_order, is_default, created_at, created_by)
SELECT id, label, emoji, sort_order, false, created_at, created_by FROM dearday_event_custom
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 결제 / 유료 plan (Stripe 통합 — 베타에선 비활성)
-- ============================================
-- Single Card $2.99 = 1 slot, 1 recipient unique link, 박제 후 새 구매 필요.
-- slots는 사용 전엔 회수 가능, 사용(발송) 후엔 lock.
CREATE TABLE IF NOT EXISTS dearday_payment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT,
  stripe_session_id TEXT UNIQUE,           -- Stripe Checkout Session ID
  stripe_payment_intent TEXT,
  amount_cents INT NOT NULL,                -- $2.99 = 299
  currency TEXT NOT NULL DEFAULT 'sgd',
  plan_type TEXT NOT NULL,                  -- 'single' | 'pack5' | 'holiday_pass' | 'annual_pass'
  status TEXT NOT NULL DEFAULT 'pending',   -- 'pending' | 'paid' | 'failed' | 'refunded'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_dearday_payment_user ON dearday_payment(user_id);
CREATE INDEX IF NOT EXISTS idx_dearday_payment_status ON dearday_payment(status);

-- 사용자가 보유한 발송 slot — Single Card 결제 시 1 slot 생성
CREATE TABLE IF NOT EXISTS dearday_send_slot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  payment_id UUID REFERENCES dearday_payment(id) ON DELETE CASCADE,
  card_id UUID REFERENCES dearday_card(id) ON DELETE SET NULL,    -- 사용된 카드 (NULL이면 미사용)
  recipient_id UUID REFERENCES dearday_recipient(id) ON DELETE SET NULL, -- 사용된 수신자
  status TEXT NOT NULL DEFAULT 'unused',  -- 'unused' | 'reserved' | 'sent' | 'locked'
                                           -- unused: 미사용 / reserved: 카드+수신자 할당됨, 회수 가능
                                           -- sent: 발송 완료, 미열람이면 회수 가능 (B안)
                                           -- locked: 수신자 열람 → 박제, 회수 불가
  reserved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,                  -- 무제한이면 NULL, holiday_pass는 30일
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dearday_slot_user ON dearday_send_slot(user_id);
CREATE INDEX IF NOT EXISTS idx_dearday_slot_status ON dearday_send_slot(status);
CREATE INDEX IF NOT EXISTS idx_dearday_slot_card ON dearday_send_slot(card_id);

-- 카드에 결제 상태 추가 — 무료/유료 구분
ALTER TABLE dearday_card ADD COLUMN IF NOT EXISTS paid_status TEXT DEFAULT 'free';
-- 'free': 무료 카드 (베타) / 'paid': slot 사용된 카드

-- 사용량 카운터 (silent — UI 노출 X). 향후 유료 한도 결정용 데이터 수집.
ALTER TABLE dearday_user ADD COLUMN IF NOT EXISTS cards_created_count INT DEFAULT 0;
ALTER TABLE dearday_card ADD COLUMN IF NOT EXISTS recipients_added_count INT DEFAULT 0;

-- 기념일 reminder (self-reminder, recipient 데이터 없음)
-- 사용자가 본인 데이터로 본인에게만 알림. 명시적 opt-in.
CREATE TABLE IF NOT EXISTS dearday_reminder (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  person_name TEXT NOT NULL,                          -- "Mom" / "Sarah" 등
  occasion TEXT NOT NULL,                             -- birthday | mothers-day | fathers-day | anniversary | other
  occasion_label TEXT,                                -- custom label (occasion='other'일 때)
  event_month INT NOT NULL CHECK (event_month BETWEEN 1 AND 12),
  event_day INT NOT NULL CHECK (event_day BETWEEN 1 AND 31),
  notify_days_before INT NOT NULL DEFAULT 7,          -- D-N
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT false,        -- PWA push
  last_notified_year INT,                             -- 중복 방지 (연도)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dearday_reminder_user ON dearday_reminder(user_id);
CREATE INDEX IF NOT EXISTS idx_dearday_reminder_date ON dearday_reminder(event_month, event_day);

-- 평가 로그 — 4 에이전트 점수 + 종합 점수, 시간 누적
CREATE TABLE IF NOT EXISTS dearday_evaluation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluated_at TIMESTAMPTZ DEFAULT NOW(),
  evaluated_by TEXT,                                  -- admin email
  perfectionist_score INT NOT NULL,                   -- 0-100
  compliance_score INT NOT NULL,
  mz_score INT NOT NULL,
  tech_score INT NOT NULL,
  total_score INT NOT NULL,                            -- 평균 (또는 가중치)
  perfectionist_notes TEXT,
  compliance_notes TEXT,
  mz_notes TEXT,
  tech_notes TEXT,
  summary TEXT,                                        -- 종합 요약
  ai_recommendations TEXT                              -- 100점으로 가기 위한 다음 step
);
CREATE INDEX IF NOT EXISTS idx_dearday_eval_date ON dearday_evaluation(evaluated_at DESC);

-- 사용자 알림 동의 — 가입 시 default 같이 들어감
ALTER TABLE dearday_user ADD COLUMN IF NOT EXISTS reminder_email_opt_in BOOLEAN DEFAULT false;
ALTER TABLE dearday_user ADD COLUMN IF NOT EXISTS reminder_push_subscription JSONB;
ALTER TABLE dearday_user ADD COLUMN IF NOT EXISTS preferred_locale TEXT DEFAULT 'en';  -- 'en' | 'ko' (이메일 등 발송 시 사용)

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
