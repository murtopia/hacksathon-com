import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Events",
};

/**
 * Events index — every Hacks-a-Thon the current user is a member of.
 * RLS already filters non-member events at the SELECT layer, so this
 * is just a list-or-empty-state render.
 */
export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/events");

  const { data: events } = await supabase
    .from("events")
    .select(
      "id, title, status, created_at, vanity_slug, organizations(name, logo_url)",
    )
    .order("created_at", { ascending: false });

  const list = events ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground mt-1">
            Manage your Hacks-a-Thons.
          </p>
        </div>
        <Button asChild>
          <Link href="/events/new">Create Event</Link>
        </Button>
      </div>

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium">No events yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first Hacks-a-Thon to get started.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/events/new">Create your first Hacks-a-Thon</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((event) => {
            const orgRel = event.organizations as
              | { name: string; logo_url: string | null }
              | { name: string; logo_url: string | null }[]
              | null;
            const org = Array.isArray(orgRel) ? orgRel[0] : orgRel;
            return (
              <li key={event.id}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    {org?.name && (
                      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        {org.name}
                      </p>
                    )}
                    <CardTitle className="line-clamp-2 text-xl">
                      {event.title}
                    </CardTitle>
                    <CardDescription className="capitalize">
                      {(event.status as string | null) ?? "draft"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline">
                      <Link href={`/events/${event.id}`}>
                        Open event
                        <ArrowRight />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
