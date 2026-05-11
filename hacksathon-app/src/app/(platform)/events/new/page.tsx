import { Metadata } from "next";
import { createMinimalEvent } from "./actions";
import { NewEventForm } from "./new-event-form";

export const metadata: Metadata = {
  title: "Create Event",
};

/**
 * Minimal event create form — intentionally a stub to unblock IdeaLab
 * testing in M2. The full organizer wizard (timeline blocks, awards,
 * reflection questions, branding, payment) lands in M6 and will
 * replace this entire page.
 */
export default function NewEventPage() {
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Event</h1>
        <p className="text-muted-foreground mt-1">
          A two-field setup to get you into the IdeaLab. The full event
          configuration (timeline, awards, branding) is on its way.
        </p>
      </div>

      <NewEventForm action={createMinimalEvent} />
    </div>
  );
}
