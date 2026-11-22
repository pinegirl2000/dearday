import { FONT_STACKS } from '@/lib/font-keys';
import type { LayoutMeta } from './types';

/**
 * Thank-Polaroid — 살짝 기울어진 폴라로이드 사진 + washi tape 장식.
 * 사진을 강조하는 personal 톤. Mother's Day 어머니 사진, 졸업 사진 등에 잘 어울림.
 */
export const LAYOUT_THANK_POLAROID: LayoutMeta = {
  id: 'thank_polaroid',
  name: 'Thank · Polaroid',
  description: '기울어진 사진 + washi tape — 따뜻한 personal 무드',
  renderStyle: 'flow',
  aspectRatio: '440/700',
  accent: '#C97796',
  fields: {
    subtitle: { x: 0, y: 0, w: 100, align: 'center', fontSize: 12, color: '#C97796', letterSpacing: '0.2em', fontWeight: 400, fontFamily: FONT_STACKS.cormorant },
    title:    { x: 0, y: 0, w: 100, align: 'center', fontSize: 42, color: '#8B6075', letterSpacing: '0.01em', fontWeight: 400, lineHeight: 1.1, fontFamily: FONT_STACKS.sacramento },
    body:     { x: 0, y: 0, w: 100, align: 'center', fontSize: 14, color: '#5A3D4F', lineHeight: 2.0, fontFamily: FONT_STACKS.notoSerif }
    // 날짜 / 장소 / 연락처 — Thank-Polaroid에서는 사용 안 함
  }
};
