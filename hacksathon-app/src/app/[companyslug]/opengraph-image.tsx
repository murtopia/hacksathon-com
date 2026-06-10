import { ImageResponse } from "next/og";
import { loadOgFonts } from "@/lib/og/fonts";
import {
  OG_SIZE,
  OG_CONTENT_TYPE,
  ShareImage,
  resolveLogo,
} from "@/lib/og/share-image";
import { resolveSlugContext } from "@/lib/routing/slug-context";

/**
 * Dynamic per-event OG / Twitter image (1200×630). Overrides the site-wide
 * default for every `/[companyslug]/*` route.
 *
 * Shows the event title as the headline, the company (or event) logo with a
 * first-initial fallback, the brand tagline, and a subtle Hacksathon.com
 * signature - no per-event URL. Reads through the admin-backed, cached
 * `resolveSlugContext` so anonymous shares resolve fine. If the slug can't
 * be resolved, falls back to the static brand image.
 */

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Event share image - Hacksathon.com";

const TAGLINE = "We\u2019re all just hacks. And that\u2019s kind of the point.";
const FALLBACK_HEADLINE = "Run a world-class Hacks-a-Thon at your company";

interface ImageProps {
  params: Promise<{ companyslug: string }>;
}

export default async function OpengraphImage({ params }: ImageProps) {
  const { companyslug } = await params;
  const [fonts, ctx] = await Promise.all([
    loadOgFonts(),
    resolveSlugContext(companyslug),
  ]);

  // Slug didn't resolve → reuse the static brand image.
  if (!ctx) {
    return new ImageResponse(
      <ShareImage headline={FALLBACK_HEADLINE} tagline={TAGLINE} showWordmark />,
      { ...size, fonts },
    );
  }

  const { event, org } = ctx;
  const logo = await resolveLogo(event.logo_url ?? org?.logo_url);
  const fallbackName = (org?.name ?? event.title).trim();
  const initial = fallbackName.charAt(0).toUpperCase() || "H";

  return new ImageResponse(
    (
      <ShareImage
        headline={event.title}
        tagline={TAGLINE}
        logo={{
          src: logo?.src,
          width: logo?.width,
          height: logo?.height,
          initial,
        }}
      />
    ),
    { ...size, fonts },
  );
}
