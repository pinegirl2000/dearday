import { describe, expect, it } from 'vitest';
import { FONT_STACKS } from './font-keys';
import { infoBoxWidthPercent, layoutFieldToRoleStyle, resolveContentSide, resolveRoleStyle, typographyForLayout } from './typography';

describe('resolveRoleStyle', () => {
  it('db overrides single property only', () => {
    const r = resolveRoleStyle('title', {
      db: { title: { spacing: 0.1 } },
      template: { title: { font: 'cormorant', size: 34 } }
    });
    expect(r.fontFamily).toBe(FONT_STACKS.cormorant);
    expect(r.size).toBe(34);
    expect(r.spacing).toBe(0.1);
  });

  it('defaults match current rendering', () => {
    const r = resolveRoleStyle('title', {});
    expect(r).toMatchObject({ size: 24, spacing: 0.4, weight: 500, lineHeight: 1.3, fontFamily: FONT_STACKS.notoSerif });
  });

  it('derived minimums', () => {
    const r = resolveRoleStyle('title', { template: { title: { size: 34, spacing: 0.18 } } });
    expect(r.minSize).toBe(24);
    expect(r.minSpacing).toBe(0.04);
  });

  it('unknown font key in db falls back', () => {
    const r = resolveRoleStyle('title', {
      db: { title: { font: 'comicSans' as never } },
      template: { title: { font: 'playfair' } }
    });
    expect(r.fontFamily).toBe(FONT_STACKS.playfair);
  });
});

describe('layout font fallback', () => {
  it('layout font family used when no db/template font', () => {
    const r = resolveRoleStyle('title', { layoutFontFamily: 'LAYOUT_STACK' });
    expect(r.fontFamily).toBe('LAYOUT_STACK');
  });

  it('template font beats layout font family', () => {
    const r = resolveRoleStyle('title', { template: { title: { font: 'playfair' } }, layoutFontFamily: 'LAYOUT_STACK' });
    expect(r.fontFamily).toBe(FONT_STACKS.playfair);
  });
});

describe('layoutFieldToRoleStyle', () => {
  it('layout field converts em string', () => {
    expect(layoutFieldToRoleStyle({ fontSize: 11, letterSpacing: '0.5em' })).toMatchObject({ size: 11, spacing: 0.5 });
  });
});

describe('resolveContentSide', () => {
  it('content side precedence', () => {
    expect(resolveContentSide(null, 70)).toBe(70);
    expect(resolveContentSide(40, 70)).toBe(40);
    expect(resolveContentSide(undefined, undefined)).toBe(20);
  });
});

describe('infoBoxWidthPercent', () => {
  it('keeps previous width when no content side is set', () => {
    // 기존: 320/440 = 72.727% (패딩 20px 컨테이너 기준)
    expect(infoBoxWidthPercent(320, 440, null, undefined)).toBe('72.727%');
  });

  it('template content side does not shrink the box', () => {
    // 템플릿 기본 여백 56px 이어도 박스는 카드 대비 기존과 같은 실제 폭(291px)을 유지
    const pct = parseFloat(infoBoxWidthPercent(320, 440, null, 56));
    expect((pct / 100) * (440 - 56 * 2)).toBeCloseTo(320 * (400 / 440), 0);
  });

  it('db content side keeps legacy behaviour and never exceeds container', () => {
    expect(infoBoxWidthPercent(320, 440, 60, 76)).toBe('72.727%');
    expect(infoBoxWidthPercent(320, 440, null, 120)).toBe('100%');
  });
});

describe('typographyForLayout', () => {
  const tpl = { layout_id: 'layout-classic', typography: { title: { font: 'cormorant' as const, size: 34 } } };
  const db = { title: { spacing: 0.1 } };

  it('applies template and db values on the template own layout', () => {
    expect(typographyForLayout(tpl, 'layout-classic', db)).toEqual({ template: tpl.typography, db });
  });

  it('other layout keeps its own look', () => {
    // layout-3·thank_classic 등 다른 레이아웃에서는 classic 기준 큐레이션 값이 그 레이아웃 고유 모양을 덮으면 안 됨
    expect(typographyForLayout(tpl, 'layout-3', db)).toEqual({ template: undefined, db: undefined });
    const r = resolveRoleStyle('title', { ...typographyForLayout(tpl, 'layout-3', db), layout: { size: 22 }, layoutFontFamily: 'LAYOUT' });
    expect(r).toMatchObject({ size: 22, fontFamily: 'LAYOUT' });
  });
});
