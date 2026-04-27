// Create Supabase Storage Buckets
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
// Run: node scripts/buckets.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey || serviceKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.log('  Find it: Supabase dashboard → Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const buckets = [
  { name: 'dearday-themes', public: true, fileSizeLimit: 1024 * 100 },
  { name: 'dearday-card-assets', public: true, fileSizeLimit: 1024 * 50 }
];

(async () => {
  for (const b of buckets) {
    const { data: existing } = await supabase.storage.getBucket(b.name);
    if (existing) {
      console.log('✓ Already exists:', b.name);
      continue;
    }
    const { error } = await supabase.storage.createBucket(b.name, {
      public: b.public,
      fileSizeLimit: b.fileSizeLimit,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
    });
    if (error) console.error('❌', b.name, error.message);
    else console.log('✅ Created:', b.name);
  }
})();
