import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { getAllPosts, getPostBySlug } from '@/lib/blog/posts';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: 'Not found · DearDay' };
  return {
    title: `${post.title} · DearDay`,
    description: post.description,
    openGraph: { title: post.title, description: post.description, type: 'article' }
  };
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** 아주 단순한 markdown 렌더러 — h2/##, list, paragraph, blockquote 정도만 지원 */
function renderBody(body: string): React.ReactNode {
  const lines = body.split('\n');
  const blocks: React.ReactNode[] = [];
  let buf: string[] = [];
  let mode: 'p' | 'ul' | 'ol' | 'quote' | null = null;

  const flush = () => {
    if (!buf.length) return;
    const key = `b-${blocks.length}`;
    if (mode === 'ul') {
      blocks.push(
        <ul key={key} className="list-disc pl-5 space-y-1 my-3 text-sm text-hydrangea-700">
          {buf.map((l, i) => <li key={i}>{inline(l.replace(/^- /, ''))}</li>)}
        </ul>
      );
    } else if (mode === 'ol') {
      blocks.push(
        <ol key={key} className="list-decimal pl-5 space-y-1 my-3 text-sm text-hydrangea-700">
          {buf.map((l, i) => <li key={i}>{inline(l.replace(/^\d+\.\s*/, ''))}</li>)}
        </ol>
      );
    } else if (mode === 'quote') {
      blocks.push(
        <blockquote key={key} className="border-l-4 border-hydrangea-200 pl-4 my-4 text-sm text-hydrangea-600 italic whitespace-pre-line">
          {buf.map((l) => l.replace(/^> ?/, '')).join('\n')}
        </blockquote>
      );
    } else {
      blocks.push(<p key={key} className="my-3 text-sm text-hydrangea-700 leading-relaxed">{inline(buf.join(' '))}</p>);
    }
    buf = [];
    mode = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith('## ')) {
      flush();
      blocks.push(
        <h2 key={`h2-${blocks.length}`} className="text-lg font-semibold text-hydrangea-700 mt-6 mb-2">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      flush();
      blocks.push(
        <h3 key={`h3-${blocks.length}`} className="text-base font-semibold text-hydrangea-700 mt-5 mb-2">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith('- ')) {
      if (mode !== 'ul') flush();
      mode = 'ul';
      buf.push(line);
    } else if (/^\d+\.\s/.test(line)) {
      if (mode !== 'ol') flush();
      mode = 'ol';
      buf.push(line);
    } else if (line.startsWith('> ')) {
      if (mode !== 'quote') flush();
      mode = 'quote';
      buf.push(line);
    } else if (line.trim() === '') {
      flush();
    } else {
      if (mode !== 'p') flush();
      mode = 'p';
      buf.push(line);
    }
  }
  flush();
  return blocks;
}

/** **bold**, [link](url) 처리 */
function inline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let i = 0;
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > i) parts.push(text.slice(i, m.index));
    if (m[1]) parts.push(<strong key={m.index} className="font-semibold">{m[1]}</strong>);
    else if (m[2] && m[3]) {
      const isInternal = m[3].startsWith('/');
      parts.push(
        isInternal
          ? <Link key={m.index} href={m[3]} className="text-hydrangea-500 underline">{m[2]}</Link>
          : <a key={m.index} href={m[3]} target="_blank" rel="noreferrer" className="text-hydrangea-500 underline">{m[2]}</a>
      );
    }
    i = m.index + m[0].length;
  }
  if (i < text.length) parts.push(text.slice(i));
  return parts;
}

export default function BlogPostPage({ params }: Props) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <PageContainer>
      <article className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/blog" className="text-xs text-hydrangea-400 hover:text-hydrangea-700 inline-block mb-4">← All posts</Link>
        <header className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <time className="text-[11px] text-hydrangea-400">{fmt(post.publishedAt)}</time>
            {post.tags.map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-hydrangea-50 text-hydrangea-500">
                {t}
              </span>
            ))}
          </div>
          <h1 className="text-2xl font-serif text-hydrangea-700 mb-2">{post.title}</h1>
          <p className="text-sm text-hydrangea-500">{post.description}</p>
        </header>

        <div>{renderBody(post.body)}</div>

        <footer className="mt-10 pt-6 border-t border-hydrangea-100/60 text-xs text-hydrangea-400">
          Written by {post.author} · DearDay
        </footer>
      </article>
    </PageContainer>
  );
}
