// 팔레트별 리본 이미지 생성 — sharp의 tint()로 원본 핑크 PNG를 12가지 색상으로 변환.
// 결과: public/envelope/ribbon-bow{N}-{paletteId}.png (3 variants × 12 palettes = 36 files)
//
// 원본 PNG가 이미 핑크 톤이라 tint()만 적용하면 색이 합쳐져 칙칙해짐.
// → grayscale로 먼저 변환 후 tint() 하면 luminance 보존하면서 깨끗한 단색이 나옴.
// PNG 직접 출력. WebP는 별도 convert-png-to-webp 스크립트가 처리.

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// 흰색-shading 베이스 소스 (사용자가 직접 제작) → 모든 팔레트 색상으로 multiply 블렌딩
// variant 1/2는 더 이상 사용 안 함 (UI에서 variant 3만 노출). 출력 파일명은 RibbonEnvelope의 ribbonSrc()와 일치.
const SOURCE_FILES = [
  { source: 'ribbon.png', outBase: 'ribbon-bow3' }
];

// 각 팔레트의 accent — color swatch의 우하단(accent) 톤과 동기화
// (SinglePageWizard.tsx의 COLORS_TOP swatch 두 번째 인자 = swatch 아래쪽 색)
const PALETTE_ACCENTS = {
  ivory:     '#F5C2D0',  // pastel pink — ivory 페어
  pearl:     '#F5F0E2',  // cream
  lavender:  '#F5EBD8',  // cream — lavender 페어
  champagne: '#F5F0E2',  // cream
  sage:      '#E8E4D8',  // pearl/cream
  blush:     '#F5EBD8',  // cream — blush 페어
  rose:      '#F5EBD8',  // cream
  powder:    '#F5C8D2',  // pastel pink — powder 페어
  midnight:  '#F0CB58',  // bright gold (환한 골드)
  cobalt:    '#F5F0E2',  // cream
  aubergine: '#FF9CC9',  // 연한 hot pink — aubergine 페어
  onyx:      '#F5EBD8'   // cream — Tiffany Cream 페어
};

const PUBLIC_ENV = path.join(__dirname, '..', 'public', 'envelope');

(async () => {
  console.log('[ribbon-tints] generating...');
  let created = 0;
  for (const { source, outBase } of SOURCE_FILES) {
    const sourcePath = path.join(PUBLIC_ENV, source);
    if (!fs.existsSync(sourcePath)) {
      console.log(`  skip ${source} — not found`);
      continue;
    }
    const meta = await sharp(sourcePath).metadata();
    const W = meta.width, H = meta.height;
    // alpha 채널만 따로 보관 (multiply composite가 투명 영역을 단색으로 덮어버리는 것 방지)
    const alphaBuf = await sharp(sourcePath).ensureAlpha().extractChannel('alpha').raw().toBuffer();
    for (const [paletteId, hex] of Object.entries(PALETTE_ACCENTS)) {
      const outPath = path.join(PUBLIC_ENV, `${outBase}-${paletteId}.png`);
      try {
        // 흰색 베이스 × 단색 multiply → 음영 그대로 보존된 순수 단색 리본.
        // alpha 채널은 multiply로 망가지므로 RGB만 만든 뒤 원본 alpha 재결합.
        const solid = Buffer.from(`<svg width="${W}" height="${H}"><rect width="100%" height="100%" fill="${hex}"/></svg>`);
        const rgbBuf = await sharp(sourcePath)
          .removeAlpha()
          .composite([{ input: solid, blend: 'multiply' }])
          .raw()
          .toBuffer();
        await sharp(rgbBuf, { raw: { width: W, height: H, channels: 3 } })
          .joinChannel(alphaBuf, { raw: { width: W, height: H, channels: 1 } })
          .png()
          .toFile(outPath);
        created++;
        console.log(`  ✓ ${outBase}-${paletteId}.png`);
      } catch (e) {
        console.error(`  ✗ ${outBase}-${paletteId}: ${e.message}`);
      }
    }
  }
  console.log(`[ribbon-tints] done — ${created} files created`);
})().catch((e) => { console.error(e); process.exit(1); });
