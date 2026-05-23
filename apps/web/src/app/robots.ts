import type { MetadataRoute } from "next";

const SITE_URL = "https://sintonia.party";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Dynamic share targets — these spawn one URL per room code
          // and have zero SEO value (and would dilute the canonical
          // pages with thin / duplicate content).
          "/join/",
          // .well-known is for OS verifiers, not search engines.
          "/.well-known/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
