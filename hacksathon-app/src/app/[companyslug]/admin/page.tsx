import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HackyHelper } from "@/components/admin/sections/hacky-helper";
import { loadHelperContext } from "@/lib/helper/loader";
import { resolveSlugContext } from "@/lib/routing/slug-context";

export const metadata: Metadata = {
  title: "Hacky Helper",
};

interface PageProps {
  params: Promise<{ companyslug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Admin home - the Hacky Helper, full stop. The Helper is the single
 * "what's next" surface and walks the whole journey; the deep section
 * work lives on the numbered sub-nav tabs. Voting controls live on
 * Hacky Awards; the reflection summary panel lives on Reflections.
 *
 * Authorization is handled by the admin layout (admin-only); this
 * page just renders.
 */
export default async function SlugAdminHomePage({
  params,
  searchParams,
}: PageProps) {
  const { companyslug } = await params;
  const sp = await searchParams;
  const ctx = await resolveSlugContext(companyslug);
  if (!ctx) notFound();

  const helperContext = await loadHelperContext(ctx);
  const helperCollapsed = sp.helper === "collapsed";

  return (
    <div className="space-y-10">
      <HackyHelper
        ctx={helperContext}
        slug={ctx.slug}
        collapsed={helperCollapsed}
      />

      {ctx.event.is_locked && (
        <p className="text-xs text-muted-foreground">
          This event is currently locked. Ideas, briefs, and planning sessions
          are read-only. Reflections remain open so participants can finish
          writing.
        </p>
      )}
    </div>
  );
}
