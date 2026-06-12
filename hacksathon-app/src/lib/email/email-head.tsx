import { Font, Head } from "@react-email/components";

/**
 * Drop-in replacement for <Head /> in every email template.
 * Loads EB Garamond (headings), Inter (body), and JetBrains Mono
 * (brand bar) via @font-face so emails match the website's
 * three-typeface design system. Clients that don't support web fonts
 * fall back to Georgia / Verdana / monospace silently.
 */
export function EmailHead() {
  return (
    <Head>
      {/* EB Garamond - headings, weight 400 normal */}
      <Font
        fontFamily="EB Garamond"
        fallbackFontFamily="Georgia"
        webFont={{
          url: "https://fonts.gstatic.com/s/ebgaramond/v32/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-6_RUAw.ttf",
          format: "truetype",
        }}
        fontWeight={400}
        fontStyle="normal"
      />
      {/* EB Garamond - italic variant used in some subheadings */}
      <Font
        fontFamily="EB Garamond"
        fallbackFontFamily="Georgia"
        webFont={{
          url: "https://fonts.gstatic.com/s/ebgaramond/v32/SlGFmQSNjdsmc35JDF1K5GRwUjcdlttVFm-rI7e8QI96.ttf",
          format: "truetype",
        }}
        fontWeight={400}
        fontStyle="italic"
      />
      {/* Inter - body text, weight 400 */}
      <Font
        fontFamily="Inter"
        fallbackFontFamily="Verdana"
        webFont={{
          url: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf",
          format: "truetype",
        }}
        fontWeight={400}
        fontStyle="normal"
      />
      {/* Inter - semibold for buttons and emphasis */}
      <Font
        fontFamily="Inter"
        fallbackFontFamily="Verdana"
        webFont={{
          url: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf",
          format: "truetype",
        }}
        fontWeight={600}
        fontStyle="normal"
      />
      {/* JetBrains Mono - brand bar label */}
      <Font
        fontFamily="JetBrains Mono"
        fallbackFontFamily="monospace"
        webFont={{
          url: "https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8FqtjPQ.ttf",
          format: "truetype",
        }}
        fontWeight={600}
        fontStyle="normal"
      />
    </Head>
  );
}
