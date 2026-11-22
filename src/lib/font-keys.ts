/**
 * 템플릿에서 고를 수 있는 글꼴 목록 (큐레이션 9종).
 *
 * 왜 키로 관리하나: next/font 는 글꼴을 `__Playfair_Display_9a1b34` 같은 해시 이름으로 등록하므로
 * 'Playfair Display' 같은 문자열 이름으로는 매칭되지 않는다. 대신 layout 에서 등록한 CSS 변수를
 * 키로 참조해야 실제 글꼴이 적용된다.
 *
 * 이 파일은 next/font 를 import 하지 않는 순수 모듈 — 테스트·서버 액션 검증에서도 쓰기 위함.
 */
// 주의: 목록이 늘어도 페이지가 무거워지지 않는다 — 추가 글꼴은 preload: false 라 실제로 쓰는 카드에서만 내려받음
export const FONT_KEYS = [
  'notoSerif',
  'notoSans',
  'gowunBatang',
  'nanumMyeongjo',
  'cormorant',
  'playfair',
  'greatVibes',
  'sacramento',
  'gowunDodum',
  // ── 영문 디스플레이 (Font Squirrel 에서 SIL OFL 확인 — 상업용·웹 임베딩 무료) ──
  'alexBrush',
  'allura',
  'cinzel',
  'josefin',
  'quicksand',
  'abril',
  'amatic',
  // ── 한글 (프로젝트 fonts/ 폴더 제공분 — src/fonts 의 woff2) ──
  // tvN 즐거운이야기는 제외: 라이선스가 글꼴 수정을 금지하는데 웹용 변환(서브셋·woff2)이 수정에 해당
  'gmarket',
  'gangwonModu',
  'gangwonTeunteun',
  'gangwonSaeeum',
  'gangwonHyeonok'
] as const;

export type FontKey = (typeof FONT_KEYS)[number];

/**
 * 글꼴 키 → font-family 스택.
 * 라틴 전용 글꼴(Cormorant, Playfair, 필기체)은 한글 글리프가 없으므로 한글 글꼴을 바로 뒤에 짝지어
 * 한글 제목이 시스템 글꼴로 들쭉날쭉하게 떨어지지 않게 한다.
 */
export const FONT_STACKS: Record<FontKey, string> = {
  notoSerif: 'var(--font-noto-serif), serif',
  notoSans: 'var(--font-noto-sans), sans-serif',
  gowunBatang: 'var(--font-gowun-batang), var(--font-noto-serif), serif',
  nanumMyeongjo: 'var(--font-nanum-myeongjo), var(--font-noto-serif), serif',
  cormorant: 'var(--font-cormorant), var(--font-noto-serif), serif',
  playfair: 'var(--font-playfair), var(--font-noto-serif), serif',
  greatVibes: 'var(--font-great-vibes), var(--font-gowun-batang), cursive',
  sacramento: 'var(--font-sacramento), var(--font-gowun-batang), cursive',
  gowunDodum: 'var(--font-gowun-dodum), var(--font-noto-sans), sans-serif',
  alexBrush: 'var(--font-alex-brush), var(--font-gowun-batang), cursive',
  allura: 'var(--font-allura), var(--font-gowun-batang), cursive',
  cinzel: 'var(--font-cinzel), var(--font-nanum-myeongjo), serif',
  josefin: 'var(--font-josefin), var(--font-gowun-dodum), sans-serif',
  quicksand: 'var(--font-quicksand), var(--font-gowun-dodum), sans-serif',
  abril: 'var(--font-abril), var(--font-nanum-myeongjo), serif',
  amatic: 'var(--font-amatic), var(--font-gangwon-saeeum), cursive',
  gmarket: 'var(--font-gmarket), var(--font-noto-sans), sans-serif',
  gangwonModu: 'var(--font-gangwon-modu), var(--font-noto-sans), sans-serif',
  gangwonTeunteun: 'var(--font-gangwon-teunteun), var(--font-noto-sans), sans-serif',
  gangwonSaeeum: 'var(--font-gangwon-saeeum), var(--font-gowun-dodum), cursive',
  gangwonHyeonok: 'var(--font-gangwon-hyeonok), var(--font-gowun-dodum), cursive'
};

/** 관리자 편집기·문서용 표시 이름 */
export const FONT_LABELS: Record<FontKey, string> = {
  notoSerif: 'Noto Serif KR (기본 명조)',
  notoSans: 'Noto Sans KR (기본 고딕)',
  gowunBatang: '고운바탕 (부드러운 명조)',
  nanumMyeongjo: '나눔명조 (클래식 명조)',
  cormorant: 'Cormorant Garamond (우아한 세리프)',
  playfair: 'Playfair Display (대비 강한 세리프)',
  greatVibes: 'Great Vibes (필기체)',
  sacramento: 'Sacramento (가는 필기체)',
  gowunDodum: '고운돋움 (둥근 고딕)',
  alexBrush: 'Alex Brush (붓 필기체)',
  allura: 'Allura (우아한 필기체)',
  cinzel: 'Cinzel (로마 대문자풍)',
  josefin: 'Josefin Sans (모던 기하학)',
  quicksand: 'Quicksand (둥근 산세리프)',
  abril: 'Abril Fatface (굵은 디스플레이)',
  amatic: 'Amatic SC (손글씨 대문자)',
  gmarket: 'Gmarket Sans (굵은 고딕)',
  gangwonModu: '강원교육모두 Bold (둥근 제목용)',
  gangwonTeunteun: '강원교육튼튼 (굵은 제목용)',
  gangwonSaeeum: '강원교육새음 (손글씨)',
  gangwonHyeonok: '강원교육현옥샘 (손글씨)'
};

/** DB 에 남은 옛 값이나 잘못된 입력을 걸러내기 위한 타입 가드 */
export function isFontKey(v: unknown): v is FontKey {
  return typeof v === 'string' && (FONT_KEYS as readonly string[]).includes(v);
}
