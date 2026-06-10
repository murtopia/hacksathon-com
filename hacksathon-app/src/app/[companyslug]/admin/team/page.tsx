import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailConfigured } from "@/lib/email/resend";
import {
  ParticipantsPanel,
  type InvitationRow,
  type PendingJoinRequest,
  type RosterMember,
} from "@/components/admin/sections/participants-panel";
import {
  resolveSlugContext,
  resolveSlugViewer,
} from "@/lib/routing/slug-context";
import { buildJoinUrl } from "@/lib/join/tokens";

export const metadata: Metadata = {
  title: "Team",
};

interface PageProps {
  params: Promise<{ companyslug: string }>;
}

interface MemberJoinRow {
  user_id: string;
  role: string;
  status: string;
  profiles:
    | {
        id: string;
        email: string;
        full_name: string | null;
        last_active_at: string | null;
      }
    | {
        id: string;
        email: string;
        full_name: string | null;
        last_active_at: string | null;
      }[]
    | null;
}

interface PendingMemberRow {
  user_id: string;
  invited_at: string;
  profiles:
    | { id: string; email: string; full_name: string | null }
    | { id: string; email: string; full_name: string | null }[]
    | null;
}

/**
 * Team admin - invitations, join link, pending approvals, and the
 * active roster. Replaces the old "Company settings" tab; company name
 * moved to the Identity tab where it belongs alongside the rest of the
 * event identity.
 *
 * Roster lookup uses the admin client to sidestep the
 * organization_members SELECT policy, which only returns the caller's
 * own row (see migration 00008_fix_rls_recursion for context).
 */
export default async function SlugAdminTeamPage({ params }: PageProps) {
  const { companyslug } = await params;
  const ctx = await resolveSlugContext(companyslug);
  if (!ctx) notFound();
  const viewer = await resolveSlugViewer(companyslug);
  if (!viewer) notFound();

  const supabase = await createClient();
  const admin = createAdminClient();

  const [
    { data: memberRows },
    { data: invitationRows },
    { data: pendingRows },
    { data: eventRow },
  ] = await Promise.all([
    admin
      .from("organization_members")
      .select(
        "user_id, role, status, profiles!inner(id, email, full_name, last_active_at)",
      )
      .eq("organization_id", ctx.event.organization_id)
      .eq("status", "active"),
    supabase
      .from("event_invitations")
      .select("id, email, status, invited_at, accepted_at, expires_at")
      .eq("event_id", ctx.event.id)
      .order("invited_at", { ascending: false })
      .returns<InvitationRow[]>(),
    admin
      .from("organization_members")
      .select("user_id, invited_at, profiles!inner(id, email, full_name)")
      .eq("organization_id", ctx.event.organization_id)
      .eq("status", "pending")
      .order("invited_at", { ascending: true }),
    admin
      .from("events")
      .select("join_token")
      .eq("id", ctx.event.id)
      .maybeSingle<{ join_token: string | null }>(),
  ]);

  const roster: RosterMember[] = (
    (memberRows as MemberJoinRow[] | null) ?? []
  ).map((m) => {
    const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return {
      user_id: m.user_id,
      email: p?.email ?? "",
      full_name: p?.full_name ?? null,
      role: m.role,
      is_self: m.user_id === viewer.user.id,
      last_active_at: p?.last_active_at ?? null,
    };
  });

  const pendingRequests: PendingJoinRequest[] = (
    (pendingRows as PendingMemberRow[] | null) ?? []
  ).map((m) => {
    const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return {
      user_id: m.user_id,
      email: p?.email ?? "",
      full_name: p?.full_name ?? null,
      requested_at: m.invited_at,
    };
  });

  const joinUrl = eventRow?.join_token
    ? buildJoinUrl(eventRow.join_token)
    : null;

  return (
    <div className="space-y-10">
      <ParticipantsPanel
        number="01"
        eventId={ctx.event.id}
        roster={roster}
        invitations={(invitationRows as InvitationRow[]) ?? []}
        emailConfigured={emailConfigured()}
        joinUrl={joinUrl}
        pendingRequests={pendingRequests}
      />
    </div>
  );
}
