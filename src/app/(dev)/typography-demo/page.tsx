import { notFound } from 'next/navigation';
import TemplateCard from '@/app/i/[slug]/_components/TemplateCard';
import { TEMPLATES, getTemplateLayouts } from '@/lib/templates';
import { buildSamplePreviewCard } from '@/lib/templates/sampleData';
import type { LayoutId } from '@/lib/layouts';
import { TYPOGRAPHY_SAMPLE_TITLES } from '@/lib/typography-samples';

/**
 * 개발 전용 — 템플릿별 글꼴·자간·프레임 안전영역 확인 페이지.
 * DB 없이 코드 기본값만으로 그려 템플릿 기본값 큐레이션과 넘침 QA 에 쓴다.
 */
export const metadata = { title: 'Typography QA', robots: { index: false } };

/** 넘침을 확인하기 위한 제목 3종 — 짧은 영문 / 긴 영문 / 한글 */
const SAMPLE_TITLES = Object.values(TYPOGRAPHY_SAMPLE_TITLES);
const ALLOWED_WIDTHS = [375, 440] as const;
const DEFAULT_WIDTH = 440;
/** ?body=long — 본문이 표지 글 영역에 안 들어갈 때 내용 면으로 내려가는지 확인용 */
const LONG_BODY = 'We would love for you to join us for an afternoon of good food, laughter and stories.\nBring your family, bring your appetite, and stay as long as you like.\nDress is casual and children are very welcome.';

interface Props {
  searchParams: { tpl?: string; layout?: string; w?: string; body?: string };
}

export default function TypographyDemoPage({ searchParams }: Props) {
  if (process.env.NODE_ENV === 'production') notFound();

  const width = ALLOWED_WIDTHS.find((w) => String(w) === searchParams.w) ?? DEFAULT_WIDTH;
  const templates = searchParams.tpl ? TEMPLATES.filter((t) => t.id === searchParams.tpl) : TEMPLATES;

  return (
    <main style={{ padding: 24, background: '#f4f1f7', minHeight: '100dvh' }}>
      <h1 style={{ fontSize: 18, marginBottom: 16 }}>Typography QA · 카드 폭 {width}px · 템플릿 {templates.length}개</h1>
      {templates.map((t) => {
        const layouts = getTemplateLayouts(t);
        const layoutId = (layouts.find((l) => l === searchParams.layout) ?? layouts[0]) as LayoutId;
        return (
          <section key={t.id} data-tpl={t.id} style={{ marginBottom: 40 }}>
            <p style={{ fontSize: 13, marginBottom: 8, fontFamily: 'monospace' }}>{t.id} · {layoutId}</p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {SAMPLE_TITLES.map((title) => {
                const sample = buildSamplePreviewCard(t, undefined, layoutId);
                const card = { ...sample, title, body: searchParams.body === 'long' ? LONG_BODY : sample.body };
                return (
                  <div key={title} data-sample={title} style={{ width, flex: 'none' }}>
                    <TemplateCard card={card} />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}
