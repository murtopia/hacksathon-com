import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PromptCaret } from "@/components/site/prompt-caret";
import { MobileNav } from "@/components/site/mobile-nav";
import { UserMenu } from "@/components/site/user-menu";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/server/platform-admin-guard";
import { resolvePrimaryEventForUser } from "@/lib/routing/primary-event";

const navLinkClass =
  "text-muted-foreground hover:text-foreground transition-colors";

/**
 * The single, shared marketing/site header used across the (marketing)
 * route group and the public `/[companyslug]/final` wrap-up pages.
 *
 * Persistent and auth-aware:
 *   - Signed out: `Log in` + a primary `Get Started` button into the
 *     purchase-first buy flow (`/checkout`, which bounces anon users
 *     through signup and back).
 *   - Signed in with an event: the account menu + role-aware buttons.
 *     Admins get `Admin` (into the back office) and `Event` (their event
 *     home); participants get a single `Event` button.
 *   - Signed in with no event (e.g. a platform admin with no membership,
 *     or a brand-new user): the account menu + a `Dashboard` button.
 *     `/dashboard` is a smart stop-over that routes to the buy
 *     empty-state, so signed-in users never land on the purchase form.
 *
 * No company/context name here by design; this is the Hacksathon.com
 * chrome, identical on every surface it appears.
 */
export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { full_name: string | null; avatar_url: string | null } | null =
    null;
  let platformAdmin = false;
  let primaryEvent: Awaited<
    ReturnType<typeof resolvePrimaryEventForUser>
  > | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle<{ full_name: string | null; avatar_url: string | null }>();
    profile = data ?? null;
    platformAdmin = await isPlatformAdmin();
    primaryEvent = await resolvePrimaryEventForUser(user.id);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-[var(--container-default)] items-center justify-between px-4">
        <Link href="/" className="inline-flex items-center gap-1">
          <PromptCaret className="h-3.5 w-auto text-foreground" />
          <span className="font-serif text-xl text-foreground">
            Hacksathon.com
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/pricing" className={navLinkClass}>
            Pricing
          </Link>
          <Link href="/seven2/final" className={navLinkClass}>
            Case Study
          </Link>
          <Link href="/showcase" className={navLinkClass}>
            Showcase
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <UserMenu
                fullName={profile?.full_name ?? null}
                email={user.email}
                avatarUrl={profile?.avatar_url ?? null}
                isPlatformAdmin={platformAdmin}
              />
              {primaryEvent ? (
                <>
                  {primaryEvent.isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hidden md:inline-flex"
                      asChild
                    >
                      <Link href={`/${primaryEvent.slug}/admin`}>Admin</Link>
                    </Button>
                  )}
                  <Button
                    variant="pill"
                    size="pill"
                    className="hidden md:inline-flex"
                    asChild
                  >
                    <Link href={`/${primaryEvent.slug}`}>Event</Link>
                  </Button>
                </>
              ) : (
                <Button
                  variant="pill"
                  size="pill"
                  className="hidden md:inline-flex"
                  asChild
                >
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="hidden md:inline-flex" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button variant="pill" size="pill" className="hidden md:inline-flex" asChild>
                <Link href="/checkout">Get Started</Link>
              </Button>
            </>
          )}
          <MobileNav
            isAuthed={Boolean(user)}
            eventSlug={primaryEvent?.slug ?? null}
            isEventAdmin={Boolean(primaryEvent?.isAdmin)}
          />
        </div>
      </div>
    </header>
  );
}
