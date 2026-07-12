import Link from "next/link";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { EventSecondaryNav } from "@/components/event-nav/event-secondary-nav";
import { EventMobileNav } from "@/components/event-nav/event-mobile-nav";
import { PostHogIdentify } from "@/components/analytics/posthog-identify";
import { PromptCaret } from "@/components/site/prompt-caret";
import { SiteFooter } from "@/components/site/site-footer";
import { UserMenu } from "@/components/site/user-menu";
import { isPlatformAdmin } from "@/lib/server/platform-admin-guard";
import { resolveSlugContext, resolveSlugViewer } from "@/lib/routing/slug-context";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ companyslug: string }>;
}

/**
 * Slug-scoped layout.
 *
 * Three render modes, picked at layout time:
 *
 *   1. Anonymous visitor on a public-showcase event, or anonymous
 *      visitor on a private event hitting `/[slug]` directly: render
 *      children with no chrome. The page itself renders a clean
 *      full-page experience (showcase / teaser / soft-entry sign-in).
 *
 *   2. Anonymous visitor hitting a subroute they can't see (e.g.
 *      `/[slug]/admin`): same as #1 - pages handle their own
 *      redirect-to-`/[slug]` so users land on the sign-in flow.
 *
 *   3. Signed-in member: render the platform top bar + the
 *      participant nav so they can move between sections.
 *
 * Resolution is cached via React `cache()` so this layout's slug lookup
 * is shared with the child page's lookup - one DB round trip per request.
 */
export default async function SlugLayout({ children, params }: LayoutProps) {
  const { companyslug } = await params;
  const ctx = await resolveSlugContext(companyslug);
  if (!ctx) notFound();

  const viewer = await resolveSlugViewer(companyslug);
  const isMember = Boolean(viewer?.isMember || viewer?.isAdmin);

  if (!isMember) {
    // Anonymous (or signed-in non-member) - let the page own the chrome.
    return <>{children}</>;
  }

  const platformAdmin = await isPlatformAdmin();
  const contextLogoUrl = ctx.event.logo_url ?? ctx.org?.logo_url ?? null;

  return (
    <div className="min-h-screen flex flex-col">
      {viewer?.user.id ? (
        <PostHogIdentify userId={viewer.user.id} email={viewer.user.email} />
      ) : null}
      <div className="sticky top-0 z-50">
      <header className="w-full border-b bg-background">
        <div className="mx-auto flex w-full max-w-[var(--container-default)] items-baseline justify-between px-4 py-[18px]">
          <div className="flex items-baseline gap-6">
            <Link href={`/${ctx.slug}`} className="inline-flex items-center gap-1">
              <PromptCaret className="h-3.5 w-auto text-foreground" />
              <span className="font-serif text-xl leading-none text-foreground">
                Hacksathon.com
              </span>
            </Link>
            <div className="hidden items-baseline gap-6 md:flex">
              <Separator orientation="vertical" className="h-6 self-center" />
              <Link
                href={`/${ctx.slug}`}
                className="inline-flex items-center gap-2 self-center font-serif text-base leading-none text-muted-foreground transition-colors hover:text-foreground"
              >
                {contextLogoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={contextLogoUrl}
                    alt=""
                    aria-hidden
                    className="h-6 w-auto max-w-[120px] object-contain"
                  />
                )}
                {ctx.org?.name ?? ctx.event.title}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <UserMenu
              fullName={viewer?.user.fullName ?? null}
              email={viewer?.user.email}
              avatarUrl={viewer?.user.avatarUrl ?? null}
              isPlatformAdmin={platformAdmin}
            />
            <EventMobileNav
              slug={ctx.slug}
              isAdmin={Boolean(viewer?.isAdmin)}
              eventName={ctx.org?.name ?? ctx.event.title}
            />
          </div>
        </div>
      </header>
      <EventSecondaryNav slug={ctx.slug} isAdmin={Boolean(viewer?.isAdmin)} />
      </div>
      <main className="mx-auto w-full max-w-[var(--container-default)] flex-1 px-4 py-8">{children}</main>
      <SiteFooter />
    </div>
  );
}
