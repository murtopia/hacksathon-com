import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/site/user-menu";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/server/platform-admin-guard";

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
 *   - Signed in: the account menu + a primary `Dashboard` button.
 *     `/dashboard` is a smart stop-over that routes a participant to
 *     their event, an organizer to setup, and a no-event user to the
 *     buy empty-state - so signed-in participants never land on the
 *     purchase form.
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

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle<{ full_name: string | null; avatar_url: string | null }>();
    profile = data ?? null;
    platformAdmin = await isPlatformAdmin();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-[var(--container-default)] items-center justify-between px-4">
        <Link href="/" className="inline-flex items-center">
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
              <Button variant="pill" size="pill" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button variant="pill" size="pill" asChild>
                <Link href="/checkout">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
