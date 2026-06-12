/**
 * Sample-filled previews of the Supabase Auth dashboard email templates that
 * can't be authentically re-triggered for an existing, confirmed user
 * (Confirm signup, Change email).
 *
 * The canonical source of truth for these HTML blocks is
 * `Claude Planning Docs/hacksathon-infra-notes.md` (pasted into the Supabase
 * dashboard). The strings below mirror that HTML verbatim, keeping the
 * `{{ .ConfirmationURL }}` / `{{ .Email }}` placeholders so we substitute
 * realistic sample values when sending a test.
 *
 * These are NOT used by the live auth flow - only by the Murtopolis
 * "send test emails to me" action so the operator can see all four Supabase
 * templates in their inbox.
 */

const FONT_FACE = `<style>
  @font-face { font-family: 'EB Garamond'; font-style: normal; font-weight: 400; font-display: swap; src: url(https://fonts.gstatic.com/s/ebgaramond/v32/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-6_RUAw.ttf) format('truetype'); }
  @font-face { font-family: 'Inter'; font-style: normal; font-weight: 400; font-display: swap; src: url(https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf) format('truetype'); }
  @font-face { font-family: 'Inter'; font-style: normal; font-weight: 600; font-display: swap; src: url(https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf) format('truetype'); }
  @font-face { font-family: 'JetBrains Mono'; font-style: normal; font-weight: 600; font-display: swap; src: url(https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8FqtjPQ.ttf) format('truetype'); }
</style>`;

const BRAND_BAR = `<p style="color:#1A1A1A;font-family:'JetBrains Mono','SF Mono','Fira Code',monospace;font-size:13px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin:0;">Hacksathon.com</p>`;

function shell(inner: string): string {
  return `${FONT_FACE}
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F5F5;margin:0;padding:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table width="520" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:12px;max-width:520px;padding:32px 28px;">
        <tr><td style="padding-bottom:16px;">
          ${BRAND_BAR}
        </td></tr>
${inner}
      </table>
    </td>
  </tr>
</table>`;
}

const CONFIRM_SIGNUP_HTML = shell(`        <tr><td>
          <h1 style="color:#1A1A1A;font-family:'EB Garamond',Georgia,serif;font-size:28px;font-weight:400;line-height:1.1;letter-spacing:-0.02em;margin:0 0 12px 0;">Confirm your email.</h1>
          <p style="color:#1A1A1A;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:16px;line-height:1.55;margin:0 0 12px 0;">Welcome to Hacksathon.com. Confirm your email below to finish setting up your account.</p>
        </td></tr>
        <tr><td style="padding:20px 0;">
          <a href="{{ .ConfirmationURL }}" style="background-color:#1A1A1A;border-radius:8px;color:#ffffff;display:inline-block;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:16px;font-weight:600;padding:12px 22px;text-decoration:none;">Confirm email</a>
        </td></tr>
        <tr><td>
          <p style="color:#525252;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;line-height:1.5;margin:0 0 12px 0;word-break:break-all;">Or paste this link into your browser:<br/><a href="{{ .ConfirmationURL }}" style="color:#1A1A1A;text-decoration:underline;">{{ .ConfirmationURL }}</a></p>
        </td></tr>
        <tr><td style="padding:24px 0;"><hr style="border:none;border-top:1px solid #E8E8E8;margin:0;"/></td></tr>
        <tr><td>
          <p style="color:#A3A3A3;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.5;margin:0 0 6px 0;">This confirmation was sent to {{ .Email }}. If you didn't sign up, you can ignore this email.</p>
          <p style="color:#A3A3A3;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.5;margin:0;">Hacksathon.com</p>
        </td></tr>`);

const CHANGE_EMAIL_HTML = shell(`        <tr><td>
          <h1 style="color:#1A1A1A;font-family:'EB Garamond',Georgia,serif;font-size:28px;font-weight:400;line-height:1.1;letter-spacing:-0.02em;margin:0 0 12px 0;">Confirm your new email.</h1>
          <p style="color:#1A1A1A;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:16px;line-height:1.55;margin:0 0 12px 0;">Confirm the new email address on your Hacksathon.com account by clicking the button below.</p>
        </td></tr>
        <tr><td style="padding:20px 0;">
          <a href="{{ .ConfirmationURL }}" style="background-color:#1A1A1A;border-radius:8px;color:#ffffff;display:inline-block;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:16px;font-weight:600;padding:12px 22px;text-decoration:none;">Confirm new email</a>
        </td></tr>
        <tr><td>
          <p style="color:#525252;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;line-height:1.5;margin:0 0 12px 0;word-break:break-all;">Or paste this link into your browser:<br/><a href="{{ .ConfirmationURL }}" style="color:#1A1A1A;text-decoration:underline;">{{ .ConfirmationURL }}</a></p>
        </td></tr>
        <tr><td style="padding:24px 0;"><hr style="border:none;border-top:1px solid #E8E8E8;margin:0;"/></td></tr>
        <tr><td>
          <p style="color:#A3A3A3;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.5;margin:0 0 6px 0;">If you didn't request this change, sign in and review your account settings - your password may have been compromised.</p>
          <p style="color:#A3A3A3;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.5;margin:0;">Hacksathon.com</p>
        </td></tr>`);

export interface SupabaseAuthSample {
  slug: string;
  label: string;
  subject: string;
  /** Raw HTML body with Supabase placeholders still present. */
  template: string;
}

export const supabaseAuthSamples: SupabaseAuthSample[] = [
  {
    slug: "supabase-confirm-signup",
    label: "Confirm signup (Supabase)",
    subject: "Confirm your email — Hacksathon.com",
    template: CONFIRM_SIGNUP_HTML,
  },
  {
    slug: "supabase-change-email",
    label: "Change email (Supabase)",
    subject: "Confirm your new email — Hacksathon.com",
    template: CHANGE_EMAIL_HTML,
  },
];

/**
 * Fill the Supabase placeholders with realistic sample values so the email
 * renders like the real thing in an inbox. The link is intentionally inert.
 */
export function fillSupabaseSample(
  sample: SupabaseAuthSample,
  recipientEmail: string,
): string {
  const sampleUrl =
    "https://hacksathon.com/callback?code=sample-test-token&type=signup";
  return sample.template
    .replaceAll("{{ .ConfirmationURL }}", sampleUrl)
    .replaceAll("{{ .Email }}", recipientEmail);
}
