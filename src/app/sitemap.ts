import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const ROUTES = [
  { path: "/", priority: 1 },
  { path: "/layanan", priority: 0.8 },
  { path: "/reservasi", priority: 0.9 },
  { path: "/kebijakan-privasi", priority: 0.3 },
  { path: "/syarat-ketentuan", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority,
  }));
}
