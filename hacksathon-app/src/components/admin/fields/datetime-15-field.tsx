"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface DateTime15FieldProps {
  /** Base id; the date input gets `${id}-date`, the time select `${id}-time`. */
  id: string;
  /** Local datetime string `YYYY-MM-DDTHH:mm`, or "" when unset. */
  value: string;
  disabled?: boolean;
  /** Emits the combined local string `YYYY-MM-DDTHH:mm`, or "" when cleared. */
  onChange: (next: string) => void;
}

/**
 * Date + 15-minute time picker.
 *
 * The native `<input type="datetime-local">` ignores `step` for the
 * minute dropdown - browsers still let you pick any minute. To force a
 * true 15-minute grid we split the control into a native date input and
 * a native `<select>` whose only options are `:00 :15 :30 :45` for
 * every hour. Native widgets keep the keyboard + mobile behavior we'd
 * otherwise have to rebuild.
 *
 * The value contract matches the old datetime-local usage exactly -
 * a local `YYYY-MM-DDTHH:mm` string - so callers don't change their
 * save logic. Picking a date with no time yet defaults to 09:00 so the
 * field never emits a half-set value; clearing the date emits "".
 *
 * Off-grid legacy times (e.g. an event seeded at 9:23) are preserved:
 * if the incoming time isn't on the 15-minute grid it's added as a
 * one-off option so the value still displays until the admin re-picks.
 */
export function DateTime15Field({
  id,
  value,
  disabled = false,
  onChange,
}: DateTime15FieldProps) {
  const { datePart, timePart } = useMemo(() => splitLocal(value), [value]);

  const options = useMemo(() => buildTimeOptions(timePart), [timePart]);

  function emit(nextDate: string, nextTime: string) {
    if (!nextDate) {
      onChange("");
      return;
    }
    onChange(`${nextDate}T${nextTime || "09:00"}`);
  }

  return (
    <div className="flex gap-2">
      <input
        id={`${id}-date`}
        type="date"
        value={datePart}
        disabled={disabled}
        onChange={(e) => emit(e.target.value, timePart)}
        className={fieldClass}
      />
      <select
        id={`${id}-time`}
        value={timePart}
        disabled={disabled || !datePart}
        onChange={(e) => emit(datePart, e.target.value)}
        className={cn(fieldClass, "max-w-[8.5rem] cursor-pointer")}
        aria-label="Time"
      >
        <option value="">-</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const fieldClass =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80";

function splitLocal(value: string): { datePart: string; timePart: string } {
  if (!value || !value.includes("T")) return { datePart: value, timePart: "" };
  const [datePart, rawTime = ""] = value.split("T");
  // Strip seconds if a legacy value carried them (HH:mm:ss → HH:mm).
  const timePart = rawTime.slice(0, 5);
  return { datePart, timePart };
}

interface TimeOption {
  value: string;
  label: string;
}

function buildTimeOptions(currentTime: string): TimeOption[] {
  const opts: TimeOption[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      const value = `${pad(h)}:${pad(m)}`;
      opts.push({ value, label: label12(h, m) });
    }
  }

  // Preserve an off-grid legacy time so the value still shows.
  if (
    currentTime &&
    !opts.some((o) => o.value === currentTime)
  ) {
    const [hStr, mStr] = currentTime.split(":");
    const h = Number(hStr);
    const m = Number(mStr);
    if (Number.isFinite(h) && Number.isFinite(m)) {
      opts.unshift({ value: currentTime, label: `${label12(h, m)} (custom)` });
    }
  }

  return opts;
}

function label12(h: number, m: number): string {
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? "AM" : "PM";
  return `${hour12}:${pad(m)} ${ampm}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
