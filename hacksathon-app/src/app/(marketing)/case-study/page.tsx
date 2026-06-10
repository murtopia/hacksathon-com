import { redirect } from "next/navigation";

/**
 * The marketing case study is the live, data-driven Seven2 wrap-up. That
 * wrap-up now lives at the event's vanity root (`/seven2`) - the single
 * canonical public showcase - so redirect straight there. (`/seven2/final`
 * also redirects to the root, so we skip that extra hop.)
 */
export default function CaseStudyPage() {
  redirect("/seven2");
}
