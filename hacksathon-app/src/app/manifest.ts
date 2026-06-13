import type { MetadataRoute } from "next";

/**
 * PWA / installable web app manifest. Icons are the black-on-white
 * Prompt caret (same mark as the favicon, light finish for home-screen
 * and app contexts).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hacksathon.com",
    short_name: "Hacksathon",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
    theme_color: "#ffffff",
    background_color: "#ffffff",
    display: "standalone",
  };
}
