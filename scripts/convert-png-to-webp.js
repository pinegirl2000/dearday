// PNG → WebP 자동 변환 — Vercel 빌드 시 prebuild로 자동 실행
// quality 90으로 변환 (시각 차이 거의 없음, 사이즈 ~95% 감소)
// 원본 PNG는 유지 (개발용 + 호환성). WebP만 추가 생성.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const TARGET_DIRS = [
  path.join(__dirname, '..', 'public', 'templates'),
  path.join(__dirname, '..', 'public', 'samples'),
  path.join(__dirname, '..', 'public', 'envelope')
];

const QUALITY = 90;

async function convertDir(dir) {
  if (!fs.existsSync(dir)) return { skipped: true };
  const files = fs.readdirSync(dir).filter((f) => /\.png$/i.test(f));
  let converted = 0;
  let skipped = 0;
  let savedKB = 0;

  for (const file of files) {
    const pngPath = path.join(dir, file);
    const webpPath = pngPath.replace(/\.png$/i, '.webp');
    const pngStat = fs.statSync(pngPath);

    // WebP가 이미 있고 더 새것이면 skip
    if (fs.existsSync(webpPath)) {
      const webpStat = fs.statSync(webpPath);
      if (webpStat.mtimeMs >= pngStat.mtimeMs) {
        skipped++;
        continue;
      }
    }

    try {
      const buf = await sharp(pngPath).webp({ quality: QUALITY }).toBuffer();
      fs.writeFileSync(webpPath, buf);
      const sizeBefore = pngStat.size;
      const sizeAfter = buf.length;
      savedKB += (sizeBefore - sizeAfter) / 1024;
      converted++;
      const pct = Math.round((1 - sizeAfter / sizeBefore) * 100);
      console.log(`  ✓ ${file} → ${(sizeBefore / 1024).toFixed(0)}KB → ${(sizeAfter / 1024).toFixed(0)}KB (-${pct}%)`);
    } catch (e) {
      console.error(`  ✗ ${file}: ${e.message}`);
    }
  }

  return { dir, converted, skipped, total: files.length, savedKB: Math.round(savedKB) };
}

(async () => {
  console.log('[png→webp] Starting conversion (quality=' + QUALITY + ')...');
  let totalConverted = 0;
  let totalSkipped = 0;
  let totalSavedKB = 0;
  for (const dir of TARGET_DIRS) {
    const result = await convertDir(dir);
    if (result.skipped) {
      console.log(`[png→webp] ${dir} — directory not found, skipped`);
      continue;
    }
    console.log(`[png→webp] ${path.basename(dir)}/ — converted ${result.converted}, up-to-date ${result.skipped} (saved ${result.savedKB}KB)`);
    totalConverted += result.converted;
    totalSkipped += result.skipped;
    totalSavedKB += result.savedKB;
  }
  console.log(`[png→webp] Done — ${totalConverted} converted, ${totalSkipped} up-to-date, ${totalSavedKB}KB total saved`);
})().catch((e) => {
  console.error('[png→webp] failed:', e);
  process.exit(1);
});
