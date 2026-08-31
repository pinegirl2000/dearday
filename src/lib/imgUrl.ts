// PNG 경로를 WebP로 자동 변환하는 helper.
// 빌드 시(prebuild) /public/templates/*.png + /public/samples/*.png가 .webp로도 생성됨.
// 코드에선 .png 경로 그대로 사용하고, 렌더 시 imgUrl()로 wrap하면 .webp 서빙.
//
// 예:
//   imgUrl('/templates/template-1-bg.png') → '/templates/template-1-bg.webp'
//   imgUrl('https://supabase.co/foo.jpg') → 'https://supabase.co/foo.jpg' (외부 URL 변환 안 함)
//
// 외부 URL(http로 시작) 또는 .webp인 경우 그대로 반환.
export function imgUrl(src: string | null | undefined): string {
  if (!src) return '';
  // 외부 URL은 그대로
  if (/^https?:\/\//i.test(src)) return src;
  // 이미 webp/jpg/svg면 그대로
  if (!/\.png(\?|$)/i.test(src)) return src;
  return src.replace(/\.png(\?|$)/i, '.webp$1');
}

/** CSS background-image용 — url() 안에 wrap */
export function bgImgUrl(src: string | null | undefined): string {
  if (!src) return 'none';
  return `url('${imgUrl(src)}')`;
}
