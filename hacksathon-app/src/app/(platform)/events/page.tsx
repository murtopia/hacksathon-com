import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Events",
};

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground mt-1">
            Manage your hackathon events.
          </p>
        </div>
        <Button asChild>
          <Link href="/events/new">Create Event</Link>
        </Button>
      </div>
      <div className="rounded-lg border border-dashed p-12 text-center">
        <h3 className="text-lg font-medium">No events yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first hackathon event to get started.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/events/new">Create Your First Event</Link>
        </Button>
      </div>
    </div>
  );
}
