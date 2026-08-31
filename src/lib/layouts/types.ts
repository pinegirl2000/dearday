// 레이아웃: 텍스트 위치/스타일 정의 (배경과 독립)

import type { ThemeMeta } from '@/lib/theme';

export type LayoutId =
  | 'layout-classic'
  | 'thank_classic'
  | 'thank_minimal'
  | 'thank_polaroid'
  | 'layout-3'
  | 'layout-4'
  | 'layout-5'
  | 'layout-6'
  | 'layout-7'
  | 'layout-topcenter'
  | 'layout-rightbottom'
  | 'layout-center';

/** thank-card 전용 layout인지 (id가 'thank_'로 시작) */
export function isThankLayout(layoutId: string | null | undefined): boolean {
  return !!layoutId && layoutId.startsWith('thank_');
}

/** 상단 사진(top photo)을 사용하는 layout인지 — minimal은 텍스트만이라 사진 없음 */
export function layoutHasPhoto(layoutId: string | null | undefined): boolean {
  return layoutId === 'thank_classic' || layoutId === 'thank_polaroid';
}

export interface TextField {
  /** 0-100% (left/top) */
  x: number;
  y: number;
  /** 0-100% (width) */
  w: number;
  align: 'left' | 'center' | 'right';
  fontSize: number;
  fontWeight?: number;
  fontFamily?: string;
  color: string;
  letterSpacing?: string;
  lineHeight?: number;
}

/**
 * - 'absolute': 카드 영역에 fields(x/y/w%)로 텍스트 절대배치
 * - 'flow':     위→아래 순차 섹션. ClassicTemplateCard 등 별도 컴포넌트로 렌더링
 */
export type RenderStyle = 'absolute' | 'flow';

export interface LayoutMeta {
  id: LayoutId;
  name: string;
  description: string;
  /** layout 미리보기용 스크린샷 (참고용, 옵션) */
  previewUrl?: string;
  renderStyle: RenderStyle;
  /** absolute 전용: 카드 비율 */
  aspectRatio: string;
  /** primary color for buttons/accents */
  accent: string;
  fields: {
    greeting?: TextField;
    title: TextField;
    subtitle?: TextField;
    date?: TextField;
    place?: TextField;
    contact?: TextField;
    body?: TextField;
    extra?: TextField;
    /**
     * 이벤트별 자동 라벨 ("WEDDING" / "BAPTISM" 등). 정의되어 있으면
     * card.event_type에 매칭되는 단어를 자동 표시. 사용자 입력 X.
     * 'flow' 렌더링에서는 title 위에 작은 장식 라인으로 표시.
     */
    eventLabel?: TextField;
  };
}

export function templateToTheme(t: LayoutMeta): Partial<ThemeMeta> {
  return {
    colors: {
      bg: '#ffffff',
      bgCard: '#ffffff',
      primary: t.accent,
      accent: t.accent + '66',
      deep: t.fields.title.color,
      ink: t.fields.body?.color || '#333',
      muted: t.fields.subtitle?.color || '#888'
    },
    fontFamily: t.fields.title.fontFamily || "'Noto Serif KR', serif"
  } as Partial<ThemeMeta>;
}

/**
 * 텍스트 안의 "$NAME"을 받는 사람 이름으로 치환.
 * recipientName이 없으면 "$NAME"을 빈 문자열로 제거.
 * 카드 본문, 부제목, 기타 안내 등 모든 텍스트 필드에 사용.
 */
export function applyName(text?: string | null, recipientName?: string | null): string {
  if (!text) return '';
  const name = (recipientName && recipientName.trim()) ? recipientName.trim() : '';
  return text.replace(/\$NAME/g, name);
}

/**
 * 받는 분 인사말을 만든다.
 * template과 recipientName 둘 다 있어야 표시. 한쪽이라도 비면 빈 문자열.
 */
export function formatGreeting(recipientName?: string | null, template?: string | null): string {
  if (!recipientName || !recipientName.trim()) return '';
  if (!template || !template.trim()) return '';
  return template.trim().replace(/\$NAME/g, recipientName.trim());
}

/**
 * 봉투/공유 subtitle용 "To 〇〇〇집사님" 형태로 감싼다.
 * 빈 문자열이면 그대로 빈 문자열, 이미 To로 시작하면 중복 붙이지 않음.
 */
export function toGreeting(greeting?: string | null): string {
  const text = (greeting || '').trim();
  if (!text) return '';
  if (/^to\s/i.test(text)) return text;
  return `To ${text}`;
}
