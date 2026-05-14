"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Check, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ScheduleBlock {
  id: string;
  block_key: string;
  title: string;
  subtitle: string | null;
  scheduled_date: string | null;
  duration_minutes: number | null;
  sort_order: number;
}

interface EventScheduleSectionProps {
  eventId: string;
  blocks: ScheduleBlock[];
  isLocked: boolean;
}

/**
 * Schedule editor: one row per block with a datetime-local picker and a
 * minutes input.
 *
 * Why no central save button? Each row writes to PATCH /api/blocks/[id]
 * independently, which means partial saves never strand the form in a
 * "your branding got blown away when you only meant to bump the start
 * time" state. The whole-form button is per-row instead — Save shows up
 * as soon as that row is dirty.
 *
 * datetime-local note: we store ISO strings (with timezone) on the
 * server but the native input wants `YYYY-MM-DDTHH:mm` in local time.
 * The conversion is lossy by one minute (the input strips seconds) but
 * that matches organizer intent — nobody schedules a block at 9:30:42.
 */
export function EventScheduleSection({
  eventId: _eventId,
  blocks,
  isLocked,
}: EventScheduleSectionProps) {
  void _eventId;
  // Sorted view: stable per render so re-renders don't shuffle rows.
  const sorted = useMemo(
    () => [...blocks].sort((a, b) => a.sort_order - b.sort_order),
    [blocks],
  );

  return (
    <Card id="schedule">
      <CardHeader>
        <CardTitle className="text-base">Schedule</CardTitle>
        <CardDescription>
          Optional start times and durations for every block. Times power the
          participant timeline and the &ldquo;up next&rdquo; hero — leaving them
          blank just means &ldquo;whenever you get there.&rdquo;
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.map((block) => (
          <BlockRow key={block.id} block={block} isLocked={isLocked} />
        ))}
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No blocks yet. Create your event from the dashboard and the 10
            default blocks will appear here.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          <Calendar className="-mt-0.5 mr-1.5 inline size-3" />
          All times are in your browser&apos;s local timezone.
        </p>
      </CardFooter>
    </Card>
  );
}

function BlockRow({
  block,
  isLocked,
}: {
  block: ScheduleBlock;
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

  function handleSave() {
    const parsedDuration = duration.trim() === "" ? null : Number(duration);
    if (parsedDuration !== null) {
      if (!Number.isFinite(parsedDuration) || parsedDuration < 5 || parsedDuration > 720) {
        toast.error("Duration must be between 5 and 720 minutes.");
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
    <div className="rounded-md border bg-card p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            <span className="mr-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {block.block_key}
            </span>
            {block.title}
          </p>
          {block.subtitle && (
            <p className="truncate text-xs text-muted-foreground">
              {block.subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr]">
        <div className="space-y-1">
          <Label htmlFor={`block-${block.id}-date`} className="text-xs">
            Start
          </Label>
          <Input
            id={`block-${block.id}-date`}
            type="datetime-local"
            value={scheduledLocal}
            disabled={isLocked || pending}
            onChange={(e) => setScheduledLocal(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`block-${block.id}-duration`} className="text-xs">
            Duration (min)
          </Label>
          <Input
            id={`block-${block.id}-duration`}
            type="number"
            min={5}
            max={720}
            step={5}
            value={duration}
            disabled={isLocked || pending}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="30"
          />
        </div>
      </div>
    </div>
  );
}

function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // Build YYYY-MM-DDTHH:mm in local time.
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}
