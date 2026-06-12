/**
 * Canonical design tokens for all Hacksathon email templates.
 *
 * Values align to the website's design system (hacksathon-design-system.md):
 *   --black: #1A1A1A  |  --text-secondary: #525252  |  --text-tertiary: #A3A3A3
 *   --gray-50: #F5F5F5  |  --border-color: #E8E8E8
 *   Typefaces: EB Garamond (headings) / Inter (body) / JetBrains Mono (brand bar)
 *
 * Import these in templates instead of declaring local style objects.
 * The EmailHead component in email-head.tsx loads the web fonts via @font-face.
 */

// -----------------------------------------------------------------------
// Layout
// -----------------------------------------------------------------------

export const body: React.CSSProperties = {
  backgroundColor: "#F5F5F5",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  margin: 0,
  padding: 0,
};

export const container: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: 12,
  margin: "32px auto",
  maxWidth: 520,
  padding: "32px 28px",
};

// -----------------------------------------------------------------------
// Brand bar
// -----------------------------------------------------------------------

export const brandSection: React.CSSProperties = {
  paddingBottom: 16,
};

export const brandText: React.CSSProperties = {
  color: "#1A1A1A",
  fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.1em",
  margin: 0,
  textTransform: "uppercase",
};

// -----------------------------------------------------------------------
// Typography - customer-facing templates
// -----------------------------------------------------------------------

export const heading: React.CSSProperties = {
  color: "#1A1A1A",
  fontFamily: "'EB Garamond', Georgia, serif",
  fontSize: 28,
  fontWeight: 400,
  letterSpacing: "-0.02em",
  lineHeight: 1.1,
  margin: "0 0 12px 0",
};

export const paragraph: React.CSSProperties = {
  color: "#1A1A1A",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  fontSize: 16,
  lineHeight: 1.55,
  margin: "0 0 12px 0",
};

export const smallParagraph: React.CSSProperties = {
  color: "#525252",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  fontSize: 13,
  lineHeight: 1.5,
  margin: "0 0 12px 0",
  wordBreak: "break-all",
};

// -----------------------------------------------------------------------
// Typography - internal templates (purchase-notification, support-message)
// Intentionally smaller / quieter than customer-facing; data-dense layout.
// -----------------------------------------------------------------------

export const internalHeading: React.CSSProperties = {
  color: "#1A1A1A",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  fontSize: 22,
  fontWeight: 600,
  lineHeight: 1.25,
  margin: "0 0 16px 0",
};

export const meta: React.CSSProperties = {
  color: "#1A1A1A",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  fontSize: 15,
  lineHeight: 1.5,
  margin: "0 0 6px 0",
};

// -----------------------------------------------------------------------
// CTA
// -----------------------------------------------------------------------

export const ctaSection: React.CSSProperties = {
  margin: "20px 0",
};

export const button: React.CSSProperties = {
  backgroundColor: "#1A1A1A",
  borderRadius: 8,
  color: "#FFFFFF",
  display: "inline-block",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  fontSize: 16,
  fontWeight: 600,
  padding: "12px 22px",
  textDecoration: "none",
};

// -----------------------------------------------------------------------
// Dividers + links + footer
// -----------------------------------------------------------------------

export const hr: React.CSSProperties = {
  borderColor: "#E8E8E8",
  margin: "24px 0",
};

export const link: React.CSSProperties = {
  color: "#1A1A1A",
  textDecoration: "underline",
};

export const linkText: React.CSSProperties = {
  color: "#1A1A1A",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  fontWeight: 600,
  textDecoration: "underline",
};

export const footer: React.CSSProperties = {
  color: "#A3A3A3",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  fontSize: 12,
  lineHeight: 1.5,
  margin: "0 0 6px 0",
};

// -----------------------------------------------------------------------
// Specialised one-off styles (used in specific templates only)
// -----------------------------------------------------------------------

/** purchase-welcome: order summary table section */
export const summarySection: React.CSSProperties = {
  border: "1px solid #E8E8E8",
  borderRadius: 8,
  margin: "8px 0 4px 0",
  padding: "16px 18px",
};

export const summaryTitle: React.CSSProperties = {
  color: "#A3A3A3",
  fontFamily:
    "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  margin: "0 0 10px 0",
  textTransform: "uppercase",
};

export const summaryRow: React.CSSProperties = {
  marginBottom: 6,
};

export const summaryLabel: React.CSSProperties = {
  color: "#525252",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  fontSize: 14,
  lineHeight: 1.5,
  verticalAlign: "top",
  width: "40%",
};

export const summaryValue: React.CSSProperties = {
  color: "#1A1A1A",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  fontSize: 14,
  fontWeight: 600,
  lineHeight: 1.5,
  textAlign: "right",
};

/** support-message: verbatim user message body */
export const messageText: React.CSSProperties = {
  color: "#1A1A1A",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  fontSize: 16,
  lineHeight: 1.6,
  margin: 0,
  whiteSpace: "pre-wrap",
};
