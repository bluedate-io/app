import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: "/login", priority: 1 },
    { path: "/terms-and-conditions", priority: 0.7 },
    { path: "/privacy-policy", priority: 0.7 },
    { path: "/cancellation-and-refund-policy", priority: 0.7 },
  ];

  return pages.map(({ path, priority }) => ({
    url: `https://tryren.in${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority,
  }));
}
