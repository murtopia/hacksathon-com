import { permanentRedirect } from "next/navigation";

interface PageProps {
  params: Promise<{ companyslug: string }>;
}

/**
 * Legacy redirect - the old "Company settings" tab was decomposed into
 * Identity (company name) + Team (participants + roster) under the
 * Hacky Helper admin restructure. The team-management UX is the bulk of
 * what used to live here, so this is where bookmarks land.
 */
export default async function SlugAdminOrgRedirect({ params }: PageProps) {
  const { companyslug } = await params;
  permanentRedirect(`/${companyslug}/admin/team`);
}
