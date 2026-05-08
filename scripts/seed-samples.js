// Sample data 초기 시드 — 이벤트 타입별 다수 sample 입력
// 실행: node scripts/seed-samples.js

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

function loadEnvLocal() {
  if (process.env.DATABASE_URL) return;
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = val;
  }
}
loadEnvLocal();

const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://postgres.eszjejwugedrohsdemdd:akffjq2!ONC@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const SAMPLES = [
  // ===== Wedding =====
  {
    event_type: 'wedding', label: 'Classic Together',
    title: 'Daniel ♥ Olivia', greeting_oneliner: 'Together with our families',
    body: 'We invite you to share in\nthe joy of our wedding day.',
    event_place: 'The Grand Ballroom, Marina Hotel',
    map_url: 'https://maps.google.com',
    contact_name: '— From Daniel & Olivia —', contact_phone: '+65-1234-5678',
    extra_info: 'Reception to follow', sort_order: 1
  },
  {
    event_type: 'wedding', label: 'Romantic Garden',
    title: 'Sarah & James', greeting_oneliner: 'Two hearts, one journey',
    body: 'Join us for an intimate garden ceremony\nas we say "I do".',
    event_place: 'The Botanic Garden Pavilion',
    contact_name: '— Sarah & James —', contact_phone: '+65-9999-1234',
    extra_info: 'Garden party reception · semi-formal attire', sort_order: 2
  },
  {
    event_type: 'wedding', label: 'Modern Minimal',
    title: 'L & M', greeting_oneliner: 'Forever begins here',
    body: 'Please join us as we celebrate\nour marriage and the start of our new life together.',
    event_place: 'Skyline Rooftop, 45F',
    contact_name: '— Lena & Marcus —', contact_phone: '+65-8888-2222',
    sort_order: 3
  },

  // ===== Birthday — 중성적·현대적 이름 (Avery, Riley, Quinn, Sage 등) =====
  {
    event_type: 'birthday', label: '1st Birthday',
    title: "Avery's 1st Birthday", greeting_oneliner: 'A precious first year',
    body: "Come share laughter, joy, and cake as we celebrate Avery's special day.",
    event_place: 'The Lounge Function Room',
    contact_name: '— Jane Doe —', contact_phone: '+65-2222-3333',
    extra_info: 'Smart casual · finger food provided', sort_order: 1
  },
  {
    event_type: 'birthday', label: 'Birthday Party',
    title: "Riley's Birthday Party", greeting_oneliner: 'Cheers to another year!',
    body: "Join us for an afternoon of fun, games, and cake\nto celebrate Riley's birthday.",
    event_place: 'Sunshine Cafe, Garden Terrace',
    contact_name: '— Jane Doe —', contact_phone: '+65-3333-4444',
    extra_info: 'Kid-friendly · please RSVP by next week', sort_order: 2
  },
  {
    event_type: 'birthday', label: 'Sweet 16',
    title: "Quinn's Sweet 16", greeting_oneliner: 'Sixteen and shining',
    body: "It's a milestone worth celebrating!\nCome dance, eat, and make memories with Quinn.",
    event_place: 'The White Room',
    contact_name: '— Jane Doe —', contact_phone: '+65-4444-5555',
    extra_info: 'Dress code: chic & sparkly', sort_order: 3
  },
  {
    event_type: 'birthday', label: 'Milestone Birthday',
    title: "Sage turns 60", greeting_oneliner: 'Six decades of joy',
    body: "Help us celebrate Sage as they mark\nthis special milestone with family and friends.",
    event_place: 'Garden Pavilion, Marina Bay',
    contact_name: '— Jane Doe —', contact_phone: '+65-5555-6666',
    sort_order: 4
  },

  // ===== Baptism =====
  {
    event_type: 'baptism', label: 'Holy Baptism',
    title: "Avery's Baptism Day", greeting_oneliner: 'A blessed first step',
    body: "Please join us as we celebrate\nAvery's baptism in the Lord.",
    event_place: 'Grace Church, Main Sanctuary',
    contact_name: '— Jane Doe —', contact_phone: '+65-9999-1111',
    extra_info: 'Reception with light refreshments to follow', sort_order: 1
  },
  {
    event_type: 'baptism', label: 'Christening',
    title: "Noah's Christening", greeting_oneliner: 'Welcomed in faith',
    body: "Please join us for the christening of our beloved son\nNoah and the celebration that follows.",
    event_place: 'St. Andrew Cathedral',
    contact_name: '— Jane Doe —', contact_phone: '+65-7777-8888',
    sort_order: 2
  },

  // ===== Meeting (Gathering) =====
  {
    event_type: 'meeting', label: 'Spring Gathering',
    title: 'Spring Gathering', greeting_oneliner: 'See you again',
    body: "It has been too long.\nLet's gather and catch up.",
    event_place: 'Hangang Park, Open Lawn',
    contact_name: '— Jane Doe —', contact_phone: '+65-3333-4444',
    extra_info: 'Bring a dish to share', sort_order: 1
  },
  {
    event_type: 'meeting', label: 'Reunion',
    title: 'Class of 2010 Reunion', greeting_oneliner: 'Memories worth reviving',
    body: "Can you believe it's been over a decade?\nLet's reconnect and create new memories.",
    event_place: 'The Old School House Cafe',
    contact_name: '— Jane Doe —', contact_phone: '+65-6666-7777',
    sort_order: 2
  },
  {
    event_type: 'meeting', label: 'Family Day',
    title: 'Family Day Picnic', greeting_oneliner: 'A day for the family',
    body: "Pack your blanket and join us for\nan afternoon of food, games, and laughter.",
    event_place: 'East Coast Park, Area E2',
    contact_name: '— Jane Doe —', contact_phone: '+65-2222-1111',
    extra_info: 'BYO drinks · games provided', sort_order: 3
  },

  // ===== Opening =====
  {
    event_type: 'opening', label: 'Grand Opening',
    title: 'Round Cafe · Grand Opening', greeting_oneliner: 'A new beginning',
    body: "We're excited to open our doors\nand share this moment with you.",
    event_place: 'Round Cafe, 1 Orchard Lane',
    contact_name: '— The Round Cafe Team —', contact_phone: '+65-7777-8888',
    extra_info: 'Complimentary drinks for guests', sort_order: 1
  },
  {
    event_type: 'opening', label: 'Studio Launch',
    title: 'Studio Mira · Open House', greeting_oneliner: 'Step inside',
    body: "Come see our brand-new creative space\nand celebrate with us.",
    event_place: 'Studio Mira, 22 Arts Lane',
    contact_name: '— The Mira Team —', contact_phone: '+65-1111-2222',
    sort_order: 2
  },

  // ===== Etc =====
  {
    event_type: 'etc', label: 'Special Day',
    title: 'A Special Day', greeting_oneliner: 'A precious moment',
    body: "We'd love for you to share\nthis special moment with us.",
    event_place: 'Sample Venue, City',
    contact_name: '— From the Host —', contact_phone: '+65-1000-2000',
    sort_order: 1
  },
  {
    event_type: 'etc', label: 'Housewarming',
    title: 'Our New Home — Open House', greeting_oneliner: 'Come share our joy',
    body: "We've moved!\nPlease drop by, meet our home, and share a meal with us.",
    event_place: '88 Orchid Lane, #12-34',
    contact_name: '— Tom & Lisa —', contact_phone: '+65-9876-5432',
    extra_info: 'Casual · please come hungry', sort_order: 2
  }
];

(async () => {
  try {
    console.log('Connecting to Supabase...');
    // 기존 sample 모두 삭제 후 재삽입 (idempotent seed)
    await pool.query('DELETE FROM dearday_sample_data');
    console.log('Cleared existing samples.');

    for (const s of SAMPLES) {
      await pool.query(
        `INSERT INTO dearday_sample_data
         (event_type, label, title, greeting_oneliner, body, event_place, map_url, contact_name, contact_phone, extra_info, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [s.event_type, s.label, s.title || null, s.greeting_oneliner || null, s.body || null,
         s.event_place || null, s.map_url || null, s.contact_name || null, s.contact_phone || null,
         s.extra_info || null, s.sort_order || 0]
      );
    }
    console.log(`✅ Inserted ${SAMPLES.length} samples`);

    const { rows } = await pool.query(
      `SELECT event_type, COUNT(*) AS cnt FROM dearday_sample_data GROUP BY event_type ORDER BY event_type`
    );
    console.log('\n📋 Samples per event:');
    rows.forEach(r => console.log(`  - ${r.event_type}: ${r.cnt}`));
  } catch (e) {
    console.error('❌ Seed failed:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
