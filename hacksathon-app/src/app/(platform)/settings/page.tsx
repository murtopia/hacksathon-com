import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileSection } from "@/components/settings/profile-section";
import { AccountSecuritySection } from "@/components/settings/account-security-section";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle<{ full_name: string | null; avatar_url: string | null }>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your profile and account settings.
        </p>
      </div>

      <ProfileSection
        userId={user.id}
        fullName={profile?.full_name ?? null}
        email={user.email ?? ""}
        avatarUrl={profile?.avatar_url ?? null}
      />

      <AccountSecuritySection email={user.email ?? ""} />
    </div>
  );
}
