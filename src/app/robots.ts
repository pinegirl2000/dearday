import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dearday.sg';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        // 개인 초대장 페이지 / 관리 페이지는 인덱싱 제외
        disallow: ['/i/', '/cards/', '/admin/', '/api/']
      }
    ],
    sitemap: `${BASE_URL}/sitemap.xml`
  };
}
