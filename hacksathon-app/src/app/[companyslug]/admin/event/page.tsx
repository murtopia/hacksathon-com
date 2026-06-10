import { permanentRedirect } from "next/navigation";

interface PageProps {
  params: Promise<{ companyslug: string }>;
}

/**
 * Legacy redirect - the old "Your event" tab was decomposed into
 * Identity (title + welcome + logo + vanity URL) and Integrations
 * (team chat + build tool) under the Hacky Helper admin restructure.
 * The bulk of the old content (and what most bookmarks were aimed at)
 * lives on Identity, so that's where we land.
 */
export default async function SlugAdminEventRedirect({ params }: PageProps) {
  const { companyslug } = await params;
  permanentRedirect(`/${companyslug}/admin/identity`);
}
