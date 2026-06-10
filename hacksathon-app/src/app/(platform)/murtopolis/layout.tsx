import { notFound } from "next/navigation";
import { MurtopolisSubnav } from "@/components/murtopolis/murtopolis-subnav";
import { isPlatformAdmin } from "@/lib/server/platform-admin-guard";

/**
 * Murtopolis - the platform-owner console.
 *
 * Auth-gates the entire `/murtopolis/*` tree on membership of the
 * `platform_admins` table via the `is_platform_admin` SECURITY DEFINER
 * RPC. Non-admins 404 (rather than 403) so the route's existence never
 * leaks - the same convention the per-event admin layout uses. The
 * outer `(platform)` layout already redirects signed-out users to
 * `/login`, so by the time we're here we always have a user.
 */
export default async function MurtopolisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const allowed = await isPlatformAdmin();
  if (!allowed) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Platform owner
          </span>
        </div>
        <h1 className="font-serif text-3xl leading-tight text-foreground">
          Murtopolis
        </h1>
        <p className="lead">
          The back-of-house for Hacksathon.com - who is signing up, who is
          paying, and every signal worth tracking as the platform grows.
        </p>
      </div>

      <MurtopolisSubnav />

      <div>{children}</div>
    </div>
  );
}
