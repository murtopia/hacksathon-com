import { redirect } from "next/navigation";

/**
 * Terms of Service lives in the combined "Privacy & Terms" page. `/terms`
 * is a clean alias (used for the Google OAuth consent screen's terms-of-
 * service field) that jumps straight to the Terms of Use section.
 */
export default function TermsPage() {
  redirect("/privacy#terms");
}
