import type { ReactElement } from "react";

/**
 * Shared layout + helpers for the generated OG / Twitter share images
 * (`next/og`). One grayscale system, two callers: the static site-wide
 * marketing image and the dynamic per-event image.
 *
 * Strictly grayscale, EB Garamond headline at weight 400 - mirrors the
 * live design system (see globals.css). All text uses the bundled
 * EB Garamond family loaded in `./fonts`. Sizes are tuned to read well
 * when scaled down into a chat/link preview.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const COLORS = {
  bg: "#FFFFFF",
  ink: "#1A1A1A",
  gray: "#525252",
  faint: "#A3A3A3",
  border: "#E8E8E8",
};

export interface ResolvedLogo {
  /** base64 data URI satori can embed inline. */
  src: string;
  /** intrinsic pixel dimensions, used to size the contain slot. */
  width: number;
  height: number;
}

/**
 * Read the intrinsic pixel dimensions straight out of an encoded image
 * buffer. Satori (the engine behind `next/og`) does not derive an
 * `<img>` width from a height-only style, so we pass explicit width +
 * height; that needs the real aspect ratio. Covers the raster formats we
 * accept (png / jpeg / webp / gif); returns null for anything we can't
 * parse so the caller falls back to the initial box.
 */
function imageSize(
  buf: Buffer,
  type: string,
): { width: number; height: number } | null {
  try {
    if (/png/i.test(type)) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    if (/gif/i.test(type)) {
      return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
    }
    if (/jpe?g/i.test(type)) {
      let off = 2;
      while (off + 9 < buf.length) {
        if (buf[off] !== 0xff) {
          off++;
          continue;
        }
        const marker = buf[off + 1];
        const isSof =
          marker >= 0xc0 &&
          marker <= 0xcf &&
          marker !== 0xc4 &&
          marker !== 0xc8 &&
          marker !== 0xcc;
        if (isSof) {
          return {
            height: buf.readUInt16BE(off + 5),
            width: buf.readUInt16BE(off + 7),
          };
        }
        off += 2 + buf.readUInt16BE(off + 2);
      }
      return null;
    }
    if (/webp/i.test(type)) {
      const fmt = buf.toString("ascii", 12, 16);
      if (fmt === "VP8 ") {
        return {
          width: buf.readUInt16LE(26) & 0x3fff,
          height: buf.readUInt16LE(28) & 0x3fff,
        };
      }
      if (fmt === "VP8L") {
        const bits = buf.readUInt32LE(21);
        return {
          width: (bits & 0x3fff) + 1,
          height: ((bits >> 14) & 0x3fff) + 1,
        };
      }
      if (fmt === "VP8X") {
        return {
          width: buf.readUIntLE(24, 3) + 1,
          height: buf.readUIntLE(27, 3) + 1,
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch a logo URL and return a base64 data URI (plus intrinsic size)
 * satori can embed. Only raster formats are embedded; SVG / unknown /
 * failures / unreadable dimensions return null so the caller falls back
 * to the first-initial box (the app's own logo fallback behavior).
 */
export async function resolveLogo(
  url: string | null | undefined,
): Promise<ResolvedLogo | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!/^image\/(png|jpe?g|webp|gif)/i.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const dims = imageSize(buf, type);
    if (!dims || !dims.width || !dims.height) return null;
    return {
      src: `data:${type};base64,${buf.toString("base64")}`,
      width: dims.width,
      height: dims.height,
    };
  } catch {
    return null;
  }
}

function HMark({ size = 112 }: { size?: number }): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        width: size,
        height: size,
        background: COLORS.ink,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 32 32">
        <path
          d="M8 7 L12 7 L12 14 L20 14 L20 7 L24 7 L24 25 L20 25 L20 18 L12 18 L12 25 L8 25 Z"
          fill="#FFFFFF"
        />
      </svg>
    </div>
  );
}

interface ShareImageProps {
  headline: string;
  tagline: string;
  /**
   * Per-event logo: a resolved data URI (`src`) with intrinsic
   * `width`/`height`, or a fallback `initial`.
   */
  logo?: {
    src?: string | null;
    width?: number | null;
    height?: number | null;
    initial?: string | null;
  } | null;
  /** Marketing: show the H mark + "Hacksathon.com" wordmark, top-left. */
  showWordmark?: boolean;
}

// The logo sits in a height-bounded, width-flexible "contain" slot: fixed
// height, width grows with the artwork up to ~3.4:1, so square marks stay a
// square chip and horizontal marks read wide. Mirrors the in-app logo slots.
const LOGO_H = 130;
const LOGO_MAX_W = 440;

export function ShareImage({
  headline,
  tagline,
  logo,
  showWordmark,
}: ShareImageProps): ReactElement {
  const hasLogo = Boolean(logo?.src);
  const hasInitial = !hasLogo && Boolean(logo?.initial);

  const aspect =
    logo?.width && logo?.height ? logo.width / logo.height : 1;
  const logoWidth = Math.round(
    Math.max(LOGO_H, Math.min(LOGO_MAX_W, LOGO_H * aspect)),
  );

  // Marketing headline is long (wraps to multiple lines), so it stays a hair
  // smaller; per-event titles are short and can run bigger and bolder.
  const headlineSize = showWordmark ? 81 : 96;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: COLORS.bg,
        fontFamily: "EB Garamond",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        {showWordmark ? (
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <HMark size={112} />
            <span style={{ fontSize: 64, color: COLORS.ink }}>
              Hacksathon.com
            </span>
          </div>
        ) : null}
        {hasLogo ? (
          <div
            style={{
              display: "flex",
              height: 170,
              padding: 20,
              borderRadius: 20,
              border: `1px solid ${COLORS.border}`,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo!.src as string}
              width={logoWidth}
              height={LOGO_H}
              style={{ objectFit: "contain" }}
              alt=""
            />
          </div>
        ) : null}
        {hasInitial ? (
          <div
            style={{
              display: "flex",
              width: 170,
              height: 170,
              borderRadius: 20,
              border: `1px solid ${COLORS.border}`,
              alignItems: "center",
              justifyContent: "center",
              fontSize: 96,
              color: COLORS.gray,
            }}
          >
            {logo!.initial}
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: headlineSize,
            lineHeight: 1,
            letterSpacing: -1.5,
            color: COLORS.ink,
            maxWidth: 1040,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontStyle: "italic",
            fontSize: 52,
            color: COLORS.gray,
            marginTop: 28,
            maxWidth: 1040,
          }}
        >
          {tagline}
        </div>
      </div>
    </div>
  );
}
