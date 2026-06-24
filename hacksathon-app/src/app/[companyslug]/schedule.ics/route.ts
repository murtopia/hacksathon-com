import { createClient } from "@/lib/supabase/server";
import {
  resolveSlugContext,
  resolveSlugViewer,
} from "@/lib/routing/slug-context";
import { buildIcsCalendar, icsFilename, type IcsEvent } from "@/lib/calendar/ics";

interface ScheduleBlockRow {
  id: string;
  block_key: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  scheduled_date: string | null;
  duration_minutes: number | null;
  sort_order: number;
}

const DEFAULT_DURATION_MIN = 30;

/**
 * Admin-only calendar export for the event schedule.
 *
 * - `GET /{slug}/schedule.ics`           → every scheduled block.
 * - `GET /{slug}/schedule.ics?block=KEY` → just that one block.
 *
 * Admin-gated (this is an organizer convenience, not a participant
 * feature) and only includes blocks that actually have a start time -
 * an unscheduled block has nothing to put on a calendar.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ companyslug: string }> },
) {
  const { companyslug } = await params;
  const ctx = await resolveSlugContext(companyslug);
  if (!ctx) {
    return new Response("Not found", { status: 404 });
  }

  const viewer = await resolveSlugViewer(companyslug);
  if (!viewer?.isAdmin) {
    return new Response("Not found", { status: 404 });
  }

  const blockKey = new URL(req.url).searchParams.get("block");

  const supabase = await createClient();
  let query = supabase
    .from("blocks")
    .select(
      "id, block_key, title, subtitle, description, scheduled_date, duration_minutes, sort_order",
    )
    .eq("event_id", ctx.event.id)
    .not("scheduled_date", "is", null)
    .order("sort_order", { ascending: true });

  if (blockKey) {
    query = query.eq("block_key", blockKey);
  }

  const { data: blockRows } = await query.returns<ScheduleBlockRow[]>();
  const blocks = (blockRows ?? []).filter((b) => b.scheduled_date);

  if (blocks.length === 0) {
    return new Response(
      blockKey
        ? "That block isn't scheduled yet."
        : "No blocks are scheduled yet.",
      { status: 404 },
    );
  }

  const events: IcsEvent[] = blocks.map((block) => {
    const start = new Date(block.scheduled_date as string);
    const durationMin =
      block.duration_minutes && block.duration_minutes > 0
        ? block.duration_minutes
        : DEFAULT_DURATION_MIN;
    const end = new Date(start.getTime() + durationMin * 60_000);
    return {
      uid: `${ctx.event.id}-${block.id}@hacksathon.com`,
      start,
      end,
      summary: `${ctx.event.title}: ${block.title}`,
      description: block.description ?? block.subtitle ?? null,
    };
  });

  const ics = buildIcsCalendar(events);
  const filename = icsFilename(
    blockKey ? `${ctx.slug}-${blocks[0].block_key}` : `${ctx.slug}-schedule`,
  );

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
