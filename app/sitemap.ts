import type { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://paysasuchan.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/faq', '/terms-and-conditions', '/terms-of-use', '/privacy-policy'].map((p) => ({
    url: base + p,
    lastModified: new Date('2026-09-30'),
  }));
}
