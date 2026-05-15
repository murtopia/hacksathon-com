import { ImageResponse } from "next/og";

/**
 * 180×180 PNG generated at build time for the iOS Safari home-screen
 * icon (`<link rel="apple-touch-icon">`). iOS adds its own rounded
 * corner mask when the icon is added to the home screen, so the
 * source is a flat black square with a white H — same geometry as
 * `icon.svg`, scaled up.
 */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#000000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="180"
          height="180"
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 7 L12 7 L12 14 L20 14 L20 7 L24 7 L24 25 L20 25 L20 18 L12 18 L12 25 L8 25 Z"
            fill="#ffffff"
          />
        </svg>
      </div>
    ),
    size,
  );
}
