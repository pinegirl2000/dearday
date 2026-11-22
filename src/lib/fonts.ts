import {
  Noto_Serif_KR,
  Noto_Sans_KR,
  Gothic_A1,
  Gowun_Batang,
  Gowun_Dodum,
  Nanum_Myeongjo,
  Playfair_Display,
  Great_Vibes,
  Cormorant_Garamond,
  Sacramento,
  Alex_Brush,
  Allura,
  Cinzel,
  Josefin_Sans,
  Quicksand,
  Abril_Fatface,
  Amatic_SC
} from 'next/font/google';
import localFont from 'next/font/local';

/**
 * 앱 전체 글꼴 등록.
 *
 * 모든 글꼴을 `variable` 로 등록하는 이유: next/font 는 글꼴을 해시 이름으로 등록하므로
 * 카드 템플릿이 CSS 변수(font-keys.ts 의 FONT_STACKS)로 참조해야만 실제 글꼴이 적용된다.
 * 한글 전용 글꼴(고운바탕·고운돋움·나눔명조)은 preload: false — 큰 한글 파일을
 * 해당 글꼴을 쓰지 않는 페이지에서까지 미리 받지 않기 위함.
 */
const notoSerif = Noto_Serif_KR({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-noto-serif', display: 'swap' });
const notoSans = Noto_Sans_KR({ subsets: ['latin'], weight: ['300', '400', '500', '700'], variable: '--font-noto-sans', display: 'swap' });
// 봉투 수신자 이름 전용 고딕 — 템플릿 글꼴 목록에는 넣지 않음
const gothicA1 = Gothic_A1({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--font-gothic-a1', display: 'swap' });
const gowunBatang = Gowun_Batang({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-gowun-batang', display: 'swap', preload: false });
const gowunDodum = Gowun_Dodum({ subsets: ['latin'], weight: ['400'], variable: '--font-gowun-dodum', display: 'swap', preload: false });
const nanumMyeongjo = Nanum_Myeongjo({ subsets: ['latin'], weight: ['400', '700', '800'], variable: '--font-nanum-myeongjo', display: 'swap', preload: false });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '500', '600', '700'], style: ['normal', 'italic'], variable: '--font-playfair', display: 'swap' });
const greatVibes = Great_Vibes({ subsets: ['latin'], weight: ['400'], variable: '--font-great-vibes', display: 'swap' });
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-cormorant', display: 'swap' });
const sacramento = Sacramento({ subsets: ['latin'], weight: ['400'], variable: '--font-sacramento', display: 'swap' });

// ── 영문 디스플레이 7종 — 템플릿마다 다른 분위기를 내기 위함. 쓰는 카드에서만 받도록 preload: false ──
const alexBrush = Alex_Brush({ subsets: ['latin'], weight: ['400'], variable: '--font-alex-brush', display: 'swap', preload: false });
const allura = Allura({ subsets: ['latin'], weight: ['400'], variable: '--font-allura', display: 'swap', preload: false });
const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-cinzel', display: 'swap', preload: false });
const josefin = Josefin_Sans({ subsets: ['latin'], weight: ['300', '400', '500', '600'], variable: '--font-josefin', display: 'swap', preload: false });
const quicksand = Quicksand({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-quicksand', display: 'swap', preload: false });
const abril = Abril_Fatface({ subsets: ['latin'], weight: ['400'], variable: '--font-abril', display: 'swap', preload: false });
const amatic = Amatic_SC({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-amatic', display: 'swap', preload: false });

// ── 한글 3종 — Gmarket Sans, 강원교육 4개 서체 (fonts/ 원본을 scripts/convert-fonts.py 로 woff2 변환) ──
// 굵기가 하나뿐인 글꼴은 weight 범위를 '100 900' 으로 선언 — 브라우저가 가짜 굵게(번짐)를 만들지 않도록
const gmarket = localFont({
  src: [
    { path: '../fonts/gmarket-sans-medium.woff2', weight: '500' },
    { path: '../fonts/gmarket-sans-bold.woff2', weight: '700' }
  ],
  variable: '--font-gmarket', display: 'swap', preload: false
});
const gangwonModu = localFont({ src: '../fonts/gangwon-modu-bold.woff2', weight: '100 900', variable: '--font-gangwon-modu', display: 'swap', preload: false });
const gangwonTeunteun = localFont({ src: '../fonts/gangwon-teunteun.woff2', weight: '100 900', variable: '--font-gangwon-teunteun', display: 'swap', preload: false });
const gangwonSaeeum = localFont({ src: '../fonts/gangwon-saeeum.woff2', weight: '100 900', variable: '--font-gangwon-saeeum', display: 'swap', preload: false });
const gangwonHyeonok = localFont({ src: '../fonts/gangwon-hyeonok.woff2', weight: '100 900', variable: '--font-gangwon-hyeonok', display: 'swap', preload: false });

/** <html> 에 붙여 모든 글꼴 CSS 변수를 정의하는 클래스 묶음 */
export const FONT_VARIABLE_CLASSNAMES = [
  notoSerif, notoSans, gothicA1, gowunBatang, gowunDodum, nanumMyeongjo, playfair, greatVibes, cormorant, sacramento,
  alexBrush, allura, cinzel, josefin, quicksand, abril, amatic,
  gmarket, gangwonModu, gangwonTeunteun, gangwonSaeeum, gangwonHyeonok
].map((f) => f.variable).join(' ');
