import Link from 'next/link';
import { imgUrl } from '@/lib/imgUrl';
import { getBackground } from '@/lib/backgrounds';
import { BACKGROUND_ZONES } from '@/lib/background-zones';
import { FONT_STACKS } from '@/lib/font-keys';

/**
 * 랜딩 첫 화면의 카드 부채 — 실제 템플릿 표지 세 장을 겹쳐 펼친다.
 * 글자만 있는 첫 화면보다 "무엇을 만들 수 있는지"를 바로 보여 주기 위함.
 * 카드 안 글자는 배경의 글 영역(zone)에 놓아 실제 초대장과 같은 자리에 보이게 한다.
 */
interface HeroCard {
  bgId: string;
  /** 누르면 이 행사로 카드 만들기 시작 */
  occasion: string;
  label: string;
  title: string;
  line: string;
  titleFont: string;
  /** 제목 크기 — 카드 폭 대비(cqw). 글꼴마다 보이는 크기가 달라 따로 지정 */
  titleSize: number;
  color: string;
  /** 부채에서의 위치 */
  slot: 'left' | 'center' | 'right';
}

const CARDS: HeroCard[] = [
  { bgId: 'bg-img-7', occasion: 'baby-full-month', label: "You're invited", title: "Noah's Full Month", line: 'Come meet our little one', titleFont: FONT_STACKS.quicksand, titleSize: 8.6, color: '#5B8DB8', slot: 'left' },
  { bgId: 'bg-img-21', occasion: 'meeting', label: 'Save the date', title: 'Spring Gathering', line: "It's been too long", titleFont: FONT_STACKS.cormorant, titleSize: 10.5, color: '#8A5FB0', slot: 'right' },
  { bgId: 'bg-img-8', occasion: 'first-birthday', label: "You're invited", title: 'Emma turns one', line: 'Join us for cake', titleFont: FONT_STACKS.alexBrush, titleSize: 11.5, color: '#A8576B', slot: 'center' }
];

export default function HeroCards() {
  return (
    <div className="hero-fan" aria-label="Sample invitations">
      {CARDS.map((c) => {
        const bg = getBackground(c.bgId);
        const zone = BACKGROUND_ZONES[c.bgId];
        return (
          <Link
            key={c.bgId}
            href={`/cards/new?type=${c.occasion}`}
            className={`hero-fan-card hero-fan-${c.slot}`}
            style={{ aspectRatio: String(zone.aspect) }}
            aria-label={`${c.title} — start a card like this`}
          >
            <img src={imgUrl(bg.imageUrl)} alt="" className="absolute inset-0 w-full h-full object-fill" draggable={false} />
            <span
              className="absolute flex flex-col items-center justify-center text-center"
              style={{ left: `${zone.zone.x}%`, top: `${zone.zone.y}%`, width: `${zone.zone.w}%`, height: `${zone.zone.h}%`, color: c.color, gap: '1.6cqw' }}
            >
              <span style={{ fontFamily: FONT_STACKS.josefin, fontSize: '3.4cqw', letterSpacing: '0.32em', textTransform: 'uppercase' }}>{c.label}</span>
              <span style={{ fontFamily: c.titleFont, fontSize: `${c.titleSize}cqw`, lineHeight: 1.1 }}>{c.title}</span>
              <span style={{ fontFamily: FONT_STACKS.cormorant, fontSize: '5cqw', fontWeight: 500 }}>{c.line}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
