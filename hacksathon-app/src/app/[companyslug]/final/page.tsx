import { permanentRedirect } from "next/navigation";

interface PageProps {
  params: Promise<{ companyslug: string }>;
}

/**
 * `/[slug]/final` is retired. The vanity root (`/[slug]`) is now the
 * single canonical public showcase once results are published, so any
 * old `/final` link redirects there. The root owns the gating and
 * rendering (showcase for everyone, dashboard for members pre-reveal,
 * teaser / sign-in otherwise).
 */
export default async function FinalShowcaseRedirect({ params }: PageProps) {
  const { companyslug } = await params;
  permanentRedirect(`/${companyslug}`);
}
