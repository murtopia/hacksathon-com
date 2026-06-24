"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, CalendarPlus, Check, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminField } from "@/components/admin/admin-section";
import { DateTime15Field } from "@/components/admin/fields/datetime-15-field";
import { cn } from "@/lib/utils";

export interface ScheduleBlock {
  id: string;
  block_key: string;
  title: string;
  subtitle: string | null;
  /** Long-form description from the migration 00024 seed - shown as the intent line on each row. */
  description: string | null;
  scheduled_date: string | null;
  duration_minutes: number | null;
  sort_order: number;
}

interface EventScheduleSectionProps {
  eventId: string;
  /** Event vanity slug - used to build the admin .ics export links. */
  slug: string;
  blocks: ScheduleBlock[];
  isLocked: boolean;
}

/**
 * Schedule editor in the participant editorial timeline frame: a left
 * rail with a circle connector per block, mono block key + serif title,
 * the tool-agnostic intent line from `blocks.description`, then an
 * inline form group with `Start` (datetime-local) and `Duration` (min)
 * inputs plus a per-row Save button.
 *
 * Why no central save button? Each row writes to PATCH /api/blocks/[id]
 * independently, which means partial saves never strand the form in a
 * "your branding got blown away when you only meant to bump the start
 * time" state. The whole-form button is per-row instead - Save shows up
 * as soon as that row is dirty.
 *
 * datetime-local note: we store ISO strings (with timezone) on the
 * server but the native input wants `YYYY-MM-DDTHH:mm` in local time.
 * The conversion is lossy by one minute (the input strips seconds) but
 * that matches organizer intent - nobody schedules a block at 9:30:42.
 */
export function EventScheduleSection({
  eventId: _eventId,
  slug,
  blocks,
  isLocked,
}: EventScheduleSectionProps) {
  void _eventId;
  const sorted = useMemo(
    () => [...blocks].sort((a, b) => a.sort_order - b.sort_order),
    [blocks],
  );
  const scheduledCount = sorted.filter((b) => b.scheduled_date).length;

  if (sorted.length === 0) {
    return (
      <div className="rounded-[4px] border border-dashed p-8 text-center">
        <p className="font-serif text-sm italic text-muted-foreground">
          No blocks yet. Create your event from the dashboard and the default
          blocks will appear here - unscheduled blocks stay Upcoming forever
          until you set a start time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {scheduledCount > 0 && (
        <div className="flex justify-end">
          <Button asChild variant="pill" size="pill">
            <a href={`/${slug}/schedule.ics`}>
              <CalendarPlus />
              Add whole schedule to calendar
            </a>
          </Button>
        </div>
      )}
      <ol
        className={cn(
          "relative pl-16",
          "before:pointer-events-none before:absolute before:left-[18px] before:top-1 before:bottom-1 before:w-px before:bg-border",
          "sm:pl-16",
          "max-sm:pl-10 max-sm:before:left-[10px]",
        )}
      >
        {sorted.map((block) => (
          <BlockRow
            key={block.id}
            block={block}
            slug={slug}
            isLocked={isLocked}
          />
        ))}
      </ol>
      <p
        className="font-mono text-[10px] uppercase tracking-[0.1em]"
        style={{ color: "var(--text-tertiary)" }}
      >
        <Calendar className="-mt-0.5 mr-1.5 inline size-3" />
        All times are in your browser&apos;s local timezone.
      </p>
    </div>
  );
}

function BlockRow({
  block,
  slug,
  isLocked,
}: {
  block: ScheduleBlock;
  slug: string;
  isLocked: boolean;
}) {
  const router = useRouter();
  const [scheduledLocal, setScheduledLocal] = useState(
    isoToLocalInput(block.scheduled_date),
  );
  const [duration, setDuration] = useState<string>(
    block.duration_minutes != null ? String(block.duration_minutes) : "",
  );
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const initialLocal = isoToLocalInput(block.scheduled_date);
  const initialDuration =
    block.duration_minutes != null ? String(block.duration_minutes) : "";

  const dirty =
    scheduledLocal !== initialLocal || duration !== initialDuration;
  const isScheduled = Boolean(block.scheduled_date);

  function handleSave() {
    const parsedDuration = duration.trim() === "" ? null : Number(duration);
    if (parsedDuration !== null) {
      if (
        !Number.isFinite(parsedDuration) ||
        parsedDuration < 15 ||
        parsedDuration > 720
      ) {
        toast.error("Duration must be between 15 and 720 minutes.");
        return;
      }
    }

    const isoScheduled =
      scheduledLocal.trim() === ""
        ? null
        : new Date(scheduledLocal).toISOString();

    startTransition(async () => {
      const res = await fetch(`/api/blocks/${block.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduled_date: isoScheduled,
          duration_minutes: parsedDuration,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Couldn't save block.");
        return;
      }
      toast.success(`Saved ${block.title}.`);
      setSavedAt(Date.now());
      router.refresh();
    });
  }

  return (
    <li className="relative mb-10 last:mb-0">
      <span
        aria-hidden
        className={cn(
          "absolute top-[6px] size-[13px] rounded-full border-2 border-foreground bg-background transition-colors",
          "-left-[52px] max-sm:-left-[34px] max-sm:size-[11px]",
          isScheduled && "bg-foreground",
        )}
      />
      <header className="flex flex-wrap items-baseline gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-1">
        <span className="min-w-12 font-mono text-sm font-bold uppercase tracking-wide tabular-nums text-foreground">
          {block.block_key}
        </span>
        <h4 className="font-serif text-xl leading-snug text-foreground">
          {block.title}
        </h4>
      </header>
      {(block.description || block.subtitle) && (
        <p className="mt-1 max-w-[640px] font-serif text-sm italic text-muted-foreground/80">
          {block.description ?? block.subtitle}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <AdminField
          label="Start"
          htmlFor={`block-${block.id}-date`}
          className="w-[18.5rem] max-w-full"
        >
          <DateTime15Field
            id={`block-${block.id}`}
            value={scheduledLocal}
            disabled={isLocked || pending}
            onChange={setScheduledLocal}
          />
        </AdminField>
        <AdminField
          label="Duration (min)"
          htmlFor={`block-${block.id}-duration`}
          className="w-[7rem]"
        >
          <Input
            id={`block-${block.id}-duration`}
            type="number"
            min={15}
            max={720}
            step={15}
            value={duration}
            disabled={isLocked || pending}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="30"
          />
        </AdminField>
        <div className="flex items-center gap-2 pb-[2px]">
          {savedAt && !dirty && !pending && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="size-3" />
              Saved
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={!dirty || pending || isLocked}
          >
            <Save className="mr-1.5 size-3" />
            Save
          </Button>
          {isScheduled && (
            <Button asChild size="sm" variant="ghost">
              <a
                href={`/${slug}/schedule.ics?block=${encodeURIComponent(
                  block.block_key,
                )}`}
                title="Add this block to your calendar"
              >
                <CalendarPlus className="mr-1.5 size-3" />
                Add to calendar
              </a>
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}
