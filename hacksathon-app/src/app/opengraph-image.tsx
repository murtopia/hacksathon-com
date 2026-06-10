import { ImageResponse } from "next/og";
import { loadOgFonts } from "@/lib/og/fonts";
import { OG_SIZE, OG_CONTENT_TYPE, ShareImage } from "@/lib/og/share-image";

/**
 * Site-wide default OG / Twitter image (1200×630). Applies to every route
 * that doesn't supply its own - i.e. all the marketing/public pages. Event
 * routes override this via `[companyslug]/opengraph-image.tsx`.
 *
 * Canonical homepage copy, EB Garamond, strict grayscale.
 */

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt =
  "Hacksathon.com - Run a world-class Hacks-a-Thon at your company";

const HEADLINE = "Run a world-class Hacks-a-Thon at your company";
const TAGLINE = "We\u2019re all just hacks. And that\u2019s kind of the point.";

export default async function OpengraphImage() {
  const fonts = await loadOgFonts();

  return new ImageResponse(
    <ShareImage headline={HEADLINE} tagline={TAGLINE} showWordmark />,
    { ...size, fonts },
  );
}
