import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://floatingnotes.app',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    // We can add dynamic routes here later for public notes
  ]
}
