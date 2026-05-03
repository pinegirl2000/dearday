import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog/posts';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dearday.sg';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ['', '/about', '/blog', '/privacy', '/terms', '/contact', '/cards/new'];
  const now = new Date().toISOString();

  const posts = getAllPosts().map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: p.publishedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7
  }));

  return [
    ...staticRoutes.map((path) => ({
      url: `${BASE_URL}${path}`,
      lastModified: now,
      changeFrequency: path === '/blog' ? ('weekly' as const) : ('monthly' as const),
      priority: path === '' ? 1 : 0.8
    })),
    ...posts
  ];
}
