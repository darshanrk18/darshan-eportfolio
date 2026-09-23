import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/data/profile'
import { projectSlugs } from '@/lib/data/projects'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: siteUrl, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${siteUrl}/cv`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    ...projectSlugs.map((slug) => ({
      url: `${siteUrl}/work/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
