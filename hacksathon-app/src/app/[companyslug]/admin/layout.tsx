import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { AdminPageHeading } from "@/components/event-nav/admin-page-heading";
import {
  resolveSlugContext,
  resolveSlugViewer,
  slugPath,
} from "@/lib/routing/slug-context";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ companyslug: string }>;
}

/**
 * Admin section layout - admin-only.
 *
 * Auth-gates the entire `/[slug]/admin/*` tree via the `is_event_admin`
 * RPC (the same SECURITY DEFINER helper every admin RLS policy uses).
 * Non-admins 404 so the URL doesn't leak the existence of an admin
 * route. Renders a header, lock badge, and sub-nav shared across every
 * admin page.
 */
export default async function SlugAdminLayout({
  children,
  params,
}: LayoutProps) {
  const { companyslug } = await params;
  const ctx = await resolveSlugContext(companyslug);
  if (!ctx) notFound();

  const viewer = await resolveSlugViewer(companyslug);
  if (!viewer)
    redirect(`/login?next=${encodeURIComponent(slugPath(ctx.slug, "admin"))}`);
  if (!viewer.isAdmin) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href={slugPath(ctx.slug)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to {ctx.event.title}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <AdminPageHeading slug={ctx.slug} />
          {ctx.event.is_locked && (
            <span
              className="inline-flex items-center gap-1 rounded-[4px] border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                color: "var(--text-tertiary)",
                borderColor: "var(--border-color)",
              }}
            >
              <Lock className="size-3" />
              Locked
            </span>
          )}
        </div>
        <p className="lead">
          Run the back-of-house for {ctx.event.title}. The Hacky Helper tab
          keeps your next step in view.
        </p>
      </div>

      <div>{children}</div>
    </div>
  );
}
