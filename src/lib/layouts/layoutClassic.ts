import { FONT_STACKS } from '@/lib/font-keys';
import type { LayoutMeta } from './types';

export const LAYOUT_CLASSIC: LayoutMeta = {
  id: 'layout-classic',
  name: 'Classic',
  description: '보라색 수국 · 위→아래 흐름형',
  renderStyle: 'flow',
  aspectRatio: '440/700',
  accent: '#7B5EA7',
  fields: {
    eventLabel: { x: 0, y: 0, w: 100, align: 'center', fontSize: 11, color: '#9B7FCB', letterSpacing: '0.5em', fontWeight: 600, fontFamily: FONT_STACKS.playfair },
    greeting: { x: 0, y: 0, w: 100, align: 'center', fontSize: 16, color: '#7B5EA7', letterSpacing: '0.06em', fontFamily: FONT_STACKS.notoSerif },
    subtitle: { x: 0, y: 0, w: 100, align: 'center', fontSize: 13, color: '#8B7A9E', letterSpacing: '0.3em', fontWeight: 300, fontFamily: FONT_STACKS.notoSerif },
    title:    { x: 0, y: 0, w: 100, align: 'center', fontSize: 24, color: '#7B5EA7', letterSpacing: '0.4em', fontWeight: 500, lineHeight: 1.3, fontFamily: FONT_STACKS.notoSerif },
    date:     { x: 0, y: 0, w: 100, align: 'center', fontSize: 14, color: '#3A2D4F', fontFamily: FONT_STACKS.notoSans },
    place:    { x: 0, y: 0, w: 100, align: 'center', fontSize: 14, color: '#3A2D4F', fontFamily: FONT_STACKS.notoSans },
    body:     { x: 0, y: 0, w: 100, align: 'center', fontSize: 15, color: '#3A2D4F', lineHeight: 2.2, fontFamily: FONT_STACKS.notoSerif },
    extra:    { x: 0, y: 0, w: 100, align: 'center', fontSize: 13, color: '#5A3D7A', fontFamily: FONT_STACKS.notoSans }
  }
};
