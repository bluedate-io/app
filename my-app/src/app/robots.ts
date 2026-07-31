import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/login",
          "/terms-and-conditions",
          "/privacy-policy",
          "/cancellation-and-refund-policy",
        ],
        disallow: ["/home", "/matches", "/profile", "/onboarding", "/admin", "/api/"],
      },
    ],
    sitemap: "https://tryren.in/sitemap.xml",
  };
}
