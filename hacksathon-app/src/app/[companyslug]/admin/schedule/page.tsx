import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  EventScheduleSection,
  type ScheduleBlock,
} from "@/components/admin/sections/event-schedule";
import { resolveSlugContext } from "@/lib/routing/slug-context";

export const metadata: Metadata = {
  title: "Schedule",
};

interface PageProps {
  params: Promise<{ companyslug: string }>;
}

/**
 * Schedule admin - set the scheduled_date + duration for each block.
 *
 * Top-line gives the admin two pieces of signal they don't get
 * anywhere else: how many blocks they've scheduled out of the total,
 * and a one-line consequence of leaving the rest blank. The old empty-
 * state copy ("All times are in your local timezone") was passive
 * orientation; this is active "here's what's left to do, and here's
 * what happens if you don't."
 */
export default async function SlugAdminSchedulePage({ params }: PageProps) {
  const { companyslug } = await params;
  const ctx = await resolveSlugContext(companyslug);
  if (!ctx) notFound();

  const supabase = await createClient();
  const { data: blockRows } = await supabase
    .from("blocks")
    .select(
      "id, block_key, title, subtitle, description, scheduled_date, duration_minutes, sort_order",
    )
    .eq("event_id", ctx.event.id)
    .order("sort_order", { ascending: true })
    .returns<ScheduleBlock[]>();

  const blocks = (blockRows as ScheduleBlock[]) ?? [];
  const scheduledCount = blocks.filter((b) => b.scheduled_date).length;
  const totalCount = blocks.length;
  const allScheduled = totalCount > 0 && scheduledCount === totalCount;
  const noneScheduled = scheduledCount === 0;

  return (
    <div className="space-y-10">
      {totalCount > 0 && (
        <div className="flex max-w-[var(--container-narrow)] items-start gap-3 border-l-2 py-1 pl-4">
          <Calendar
            className="mt-0.5 size-4 shrink-0"
            style={{ color: "var(--text-tertiary)" }}
          />
          <div className="space-y-1">
            <p className="font-mono text-xs font-semibold uppercase tracking-wide tabular-nums text-foreground">
              {scheduledCount} of {totalCount} blocks scheduled
            </p>
            <p
              className="font-serif text-sm italic"
              style={{ color: "var(--text-secondary)" }}
            >
              {allScheduled
                ? "Every block has a start time. Participants' timelines will advance automatically as each window opens."
                : noneScheduled
                  ? "Unscheduled blocks stay Upcoming forever - your participants won't see them advance until you set a start time."
                  : "Unscheduled blocks stay Upcoming forever. Set start times for the rest so participants see the full timeline advance."}
            </p>
          </div>
        </div>
      )}

      <EventScheduleSection
        eventId={ctx.event.id}
        blocks={blocks}
        isLocked={ctx.event.is_locked}
      />
    </div>
  );
}
