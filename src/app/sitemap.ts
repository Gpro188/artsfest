import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://dpro-artsfest.vercel.app';

  // Get all events
  const events = await prisma.event.findMany({
    select: {
      id: true,
      customDomain: true,
      updatedAt: true,
    },
  });

  const eventUrls: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${baseUrl}/fest/${event.id}`,
    lastModified: event.updatedAt,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // Add custom domain URLs dynamically so search engines index them directly
  const customDomainUrls: MetadataRoute.Sitemap = [];
  events.forEach((event) => {
    if (event.customDomain) {
      const d = event.customDomain;
      customDomainUrls.push(
        {
          url: `https://${d}`,
          lastModified: event.updatedAt,
          changeFrequency: 'hourly',
          priority: 1.0,
        },
        {
          url: `https://${d}/results`,
          lastModified: event.updatedAt,
          changeFrequency: 'always',
          priority: 0.9,
        }
      );
    }
  });

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    ...eventUrls,
    ...customDomainUrls,
  ];
}
