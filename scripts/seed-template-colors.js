// 코드(templates.ts)에 정의된 colorMain/colorSub/infoBox를 DB에 seed.
// 이미 DB에 값이 있으면 덮어쓰지 않음 (NULL 컬럼만 업데이트).

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// templates.ts와 동일 — TS 파일 직접 import 안 되므로 색상만 추출해서 인라인.
const TEMPLATE_COLORS = [
  { id: 'tpl-lavender-classic',     main: '#7B5EA7', sub: '#FFFFFF' },
  { id: 'tpl-cream-classic',        main: '#8C6F4A', sub: '#FFFFFF' },
  { id: 'tpl-watercolor-purple',    main: '#7B5EA7', sub: '#5A3D7A' },
  { id: 'tpl-watercolor-purple-soft', main: '#7B5EA7', sub: '#EFE7F8' },
  { id: 'tpl-watercolor-green',     main: '#476956', sub: '#D4E0CC' },
  { id: 'tpl-beige-warm',           main: '#6E5A3D', sub: '#F0E5CD' },
  { id: 'tpl-mint-fresh',           main: '#476956', sub: '#E8F0E5' },
  { id: 'tpl-coral-bright',         main: '#8E5A4D', sub: '#FCEAE2' },
  { id: 'tpl-vintage-gold',         main: '#A07C2C', sub: '#F4E9CC' },
  { id: 'tpl-teddy-pink',           main: '#8E5A4D', sub: '#E89AA0' },
  { id: 'tpl-teddy-blue',           main: '#5A8AB8', sub: '#85A8C9' },
  { id: 'tpl-pink-ribbon-arch',     main: '#A65A6F', sub: '#E89AA0' },
  { id: 'tpl-pink-ribbon-mono',     main: '#A65A6F', sub: '#E89AA0' },
  { id: 'tpl-eucalyptus-gold',      main: '#A07C2C', sub: '#D4E0CC' },
  { id: 'tpl-bear-blue-sky',        main: '#5A8AB8', sub: '#9CC0DD' },
  { id: 'tpl-party-balloons-cake',  main: '#E8588F', sub: '#FCE4EE' },
  { id: 'tpl-pink-castle',          main: '#D67BA8', sub: '#FCE8EE' },
  { id: 'tpl-sage-teddy',           main: '#6F9B7A', sub: '#E8F1E5' },
  { id: 'tpl-pressed-flowers',      main: '#B89456', sub: '#7A5E2E' },
  { id: 'tpl-pastel-cake-bunting',  main: '#5BA8C9', sub: '#E8F4F8' },
  { id: 'tpl-rose-gold-balloons',   main: '#C97766', sub: '#FCE5DD' },
  { id: 'tpl-gold-splatter',        main: '#A07C2C', sub: '#F5EFE0' },
  // Black Gold Gala — 5색 모두 정의 (infoBox 포함)
  {
    id: 'tpl-black-gold-gala',
    main: '#D4A943',
    sub: '#2A2218',
    boxText: '#F5E29A',
    boxTop: 'rgba(40,30,20,0.55)',
    boxBottom: 'rgba(20,15,10,0.65)'
  }
];

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let inserted = 0, updated = 0;
  for (const t of TEMPLATE_COLORS) {
    const r = await pool.query(
      `INSERT INTO dearday_template_config
        (template_id, allowed_layouts, color_main, color_sub, color_box_text, box_bg_top, box_bg_bottom, updated_at, updated_by)
       VALUES ($1, '{}', $2, $3, $4, $5, $6, NOW(), 'seed-script')
       ON CONFLICT (template_id) DO UPDATE SET
         color_main      = COALESCE(dearday_template_config.color_main, EXCLUDED.color_main),
         color_sub       = COALESCE(dearday_template_config.color_sub, EXCLUDED.color_sub),
         color_box_text  = COALESCE(dearday_template_config.color_box_text, EXCLUDED.color_box_text),
         box_bg_top      = COALESCE(dearday_template_config.box_bg_top, EXCLUDED.box_bg_top),
         box_bg_bottom   = COALESCE(dearday_template_config.box_bg_bottom, EXCLUDED.box_bg_bottom),
         updated_at      = NOW(),
         updated_by      = 'seed-script'
       RETURNING (xmax = 0) AS inserted`,
      [
        t.id,
        t.main || null,
        t.sub || null,
        t.boxText || null,
        t.boxTop || null,
        t.boxBottom || null
      ]
    );
    if (r.rows[0]?.inserted) inserted++; else updated++;
  }
  console.log(`✅ Seeded ${TEMPLATE_COLORS.length} templates: ${inserted} new rows, ${updated} updated`);
  console.log('   (기존 NULL 컬럼만 채움 — 이미 admin에서 저장한 값은 보존)');
  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
