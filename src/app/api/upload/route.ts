import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { customAlphabet } from 'nanoid';

const nano = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 16);

const MAX_BG = 500 * 1024;        // 500KB
const MAX_ATTACH = 100 * 1024;    // 100KB
const MAX_THANK = 20 * 1024;      // 20KB — thank/congrats 상단 원형 포토
const ALLOWED = ['image/webp', 'image/jpeg', 'image/png'];

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const kind = form.get('kind') as string | null; // 'background' | 'attachment'
    const cardId = form.get('cardId') as string | null;

    if (!file || !kind) return NextResponse.json({ error: '파일/종류 누락' }, { status: 400 });
    if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: '지원 이미지 형식이 아닙니다 (JPG/PNG/WebP)' }, { status: 400 });

    const max = kind === 'background' ? MAX_BG : kind === 'thankPhoto' ? MAX_THANK : MAX_ATTACH;
    if (file.size > max) {
      return NextResponse.json({ error: `파일이 너무 큽니다 (최대 ${max / 1024}KB)` }, { status: 413 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const ext = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg';
    const folder = cardId || 'temp';
    const filename = `${folder}/${kind}-${nano()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from('dearday-card-assets')
      .upload(filename, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: pub } = supabase.storage.from('dearday-card-assets').getPublicUrl(filename);

    return NextResponse.json({ ok: true, url: pub.publicUrl, path: filename });
  } catch (e: any) {
    console.error('upload route error:', e);
    return NextResponse.json({ error: e.message || '업로드 실패' }, { status: 500 });
  }
}
