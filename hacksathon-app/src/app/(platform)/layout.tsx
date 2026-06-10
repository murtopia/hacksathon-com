import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/server/platform-admin-guard";
import { PostHogIdentify } from "@/components/analytics/posthog-identify";
import { SiteFooter } from "@/components/site/site-footer";
import { UserMenu } from "@/components/site/user-menu";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle<{ full_name: string | null; avatar_url: string | null }>();

  const platformAdmin = await isPlatformAdmin();

  return (
    <div className="min-h-screen flex flex-col">
      <PostHogIdentify userId={user.id} email={user.email} />
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="mx-auto flex w-full max-w-[var(--container-default)] items-baseline justify-between px-4 py-[18px]">
          <div className="flex items-baseline gap-6">
            <Link href="/dashboard" className="flex items-baseline gap-2">
              <span className="font-serif text-xl leading-none text-foreground">
                Hacksathon.com
              </span>
            </Link>
          </div>
          <UserMenu
            fullName={profile?.full_name ?? null}
            email={user.email}
            avatarUrl={profile?.avatar_url ?? null}
            isPlatformAdmin={platformAdmin}
          />
        </div>
      </header>
      <main className="mx-auto w-full max-w-[var(--container-default)] flex-1 px-4 py-8">{children}</main>
      <SiteFooter />
    </div>
  );
}
