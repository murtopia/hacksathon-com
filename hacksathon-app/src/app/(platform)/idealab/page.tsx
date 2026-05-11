import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "IdeaLab",
};

/**
 * Soft entry point for IdeaLab. Resolves to the right destination based
 * on how many events the user belongs to:
 *   - 0 events → /events/new (bootstrap)
 *   - 1 event  → /events/[id]/idealab (canonical gallery)
 *   - 2+ events → simple picker rendered inline
 *
 * Multi-event picker is intentionally low-fidelity for M2; M3 will
 * fold this into block-aware event navigation.
 */
export default async function IdealabRedirectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Load every event the user is an active member of, joined through
  // organization_members. We need the event title + created_at to
  // render the picker, so we go through the events table directly and
  // let RLS narrow it to events the user can see.
  const { data: events } = await supabase
    .from("events")
    .select("id, title, status, created_at, organizations(name)")
    .order("created_at", { ascending: false });

  if (!events || events.length === 0) {
    redirect("/events/new");
  }

  if (events.length === 1) {
    redirect(`/events/${events[0].id}/idealab`);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">IdeaLab</h1>
        <p className="text-muted-foreground mt-1">
          Pick the event whose IdeaLab you want to open.
        </p>
      </div>

      <div className="space-y-3">
        {events.map((event) => {
          const orgRel = event.organizations as
            | { name: string }
            | { name: string }[]
            | null;
          const orgName = Array.isArray(orgRel)
            ? orgRel[0]?.name
            : orgRel?.name;
          return (
            <Card key={event.id}>
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription>
                  {orgName ?? "Your team"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href={`/events/${event.id}/idealab`}>Open IdeaLab</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
