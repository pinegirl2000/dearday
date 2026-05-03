import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';
import { getAllPosts } from '@/lib/blog/posts';

export const metadata = {
  title: 'Blog · DearDay',
  description: 'Wedding, birthday, and gathering invitation guides, etiquette tips, and wording examples from the DearDay team.'
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-serif text-hydrangea-700 mb-2">Blog</h1>
          <p className="text-sm text-hydrangea-500">
            Guides, etiquette, and wording examples for digital invitations.
          </p>
        </header>

        <ul className="space-y-4">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/blog/${p.slug}`}
                className="block rounded-2xl border border-hydrangea-100 bg-white p-5 hover:border-hydrangea-300 active:scale-[0.99] transition"
              >
                <div className="flex items-center gap-2 mb-1">
                  <time className="text-[11px] text-hydrangea-400">{fmt(p.publishedAt)}</time>
                  {p.tags.slice(0, 2).map((t) => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-hydrangea-50 text-hydrangea-500">
                      {t}
                    </span>
                  ))}
                </div>
                <h2 className="text-base font-semibold text-hydrangea-700 mb-1">{p.title}</h2>
                <p className="text-sm text-hydrangea-500 line-clamp-2">{p.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </PageContainer>
  );
}
