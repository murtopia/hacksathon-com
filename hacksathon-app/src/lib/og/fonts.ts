import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

/**
 * Font loader for `next/og` (satori) share-image rendering.
 *
 * Satori can't read the CSS `--font-eb-garamond` variable, so we ship the
 * actual EB Garamond binaries (weight 400, normal + italic) and hand them
 * to `ImageResponse`. The `new URL(..., import.meta.url)` reference makes
 * Next.js trace + emit the asset into the serverless function, and we read
 * it with `fs` (the Node runtime's `fetch` can't read `file://` URLs).
 *
 * EB Garamond is OFL-licensed; the woff files mirror the @fontsource build.
 */

export interface OgFont {
  name: string;
  data: Buffer;
  weight: 400;
  style: "normal" | "italic";
}

async function load(url: URL): Promise<Buffer> {
  return readFile(fileURLToPath(url));
}

/**
 * Returns the satori `fonts` array: EB Garamond 400 normal + italic. Both
 * share the family name "EB Garamond" so `fontStyle: italic` resolves to
 * the italic file.
 */
export async function loadOgFonts(): Promise<OgFont[]> {
  const [regular, italic] = await Promise.all([
    load(new URL("./fonts/EBGaramond-Regular.woff", import.meta.url)),
    load(new URL("./fonts/EBGaramond-Italic.woff", import.meta.url)),
  ]);

  return [
    { name: "EB Garamond", data: regular, weight: 400, style: "normal" },
    { name: "EB Garamond", data: italic, weight: 400, style: "italic" },
  ];
}
