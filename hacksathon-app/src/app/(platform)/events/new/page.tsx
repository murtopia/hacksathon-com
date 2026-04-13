import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Event",
};

export default function NewEventPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Event</h1>
        <p className="text-muted-foreground mt-1">
          Set up a new hackathon for your team.
        </p>
      </div>
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Event creation wizard coming soon. This will include event details,
          timeline block configuration, award categories, and reflection
          questions — all pre-populated from the proven Hacks-a-Thon playbook.
        </p>
      </div>
    </div>
  );
}
