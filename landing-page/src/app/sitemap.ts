import { MetadataRoute } from "next";
import { siteConfig, DOCS_NAVIGATION } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/docs"].map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  const docsRoutes = DOCS_NAVIGATION.map((item) => ({
    url: `${siteConfig.url}/docs/${item.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...routes, ...docsRoutes];
}
