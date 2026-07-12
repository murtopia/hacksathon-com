"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminSection } from "@/components/admin/admin-section";

interface EventLogoSectionProps {
  eventId: string;
  initialLogoUrl: string | null;
  /** Company/event name used for the no-logo initial preview. */
  fallbackName?: string;
  isLocked: boolean;
  number?: string;
}

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Single-file logo uploader. Surfaces the current logo, a Replace
 * button (which opens the file picker), and a Remove button.
 *
 * Validation mirrors the API: PNG / JPEG / WebP / SVG, 5 MB cap. Errors
 * surface as toasts so the form stays clean.
 */
export function EventLogoSection({
  eventId,
  initialLogoUrl,
  fallbackName,
  isLocked,
  number = "02",
}: EventLogoSectionProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [pending, startTransition] = useTransition();

  const fallbackInitial = (fallbackName ?? "").trim().slice(0, 1).toUpperCase();

  function pickFile() {
    if (isLocked || pending) return;
    inputRef.current?.click();
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_BYTES) {
      toast.error("Logo must be under 5 MB.");
      return;
    }

    startTransition(async () => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/events/${eventId}/logo`, {
        method: "POST",
        body: form,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Couldn't upload logo.");
        return;
      }
      setLogoUrl(body.logo_url ?? null);
      toast.success("Logo updated.");
      router.refresh();
    });
  }

  function handleRemove() {
    if (!logoUrl || isLocked) return;
    if (!window.confirm("Remove the logo?")) return;

    startTransition(async () => {
      const res = await fetch(`/api/events/${eventId}/logo`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Couldn't remove logo.");
        return;
      }
      setLogoUrl(null);
      toast.success("Logo removed.");
      router.refresh();
    });
  }

  return (
    <AdminSection
      id="logo"
      number={number}
      title="Logo"
      intent="Shown on the participant event home, the vanity URL landing page, and join screens. Horizontal or square both work, just keep it under about 4:1 and at least 256px tall. PNG, JPEG, WebP, or SVG up to 5 MB. No logo? Participants see the first letter of your company name."
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex items-center gap-4">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="Event logo"
            className="h-16 w-auto max-w-[256px] object-contain"
          />
        ) : (
          // Empty state keeps the frame: a floating letter or "No logo"
          // label with nothing around it reads broken.
          <div className="flex h-16 w-auto min-w-[64px] items-center justify-center rounded-md border bg-muted px-4">
            {fallbackInitial ? (
              <span
                aria-hidden
                className="text-2xl font-semibold text-muted-foreground"
              >
                {fallbackInitial}
              </span>
            ) : (
              <span
                aria-hidden
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
              >
                No logo
              </span>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={pickFile}
            disabled={pending || isLocked}
            variant="pill"
            size="pill"
          >
            <Upload />
            {logoUrl ? "Replace" : "Upload logo"}
          </Button>
          {logoUrl && (
            <Button
              type="button"
              variant="pill"
              size="pill"
              onClick={handleRemove}
              disabled={pending || isLocked}
            >
              <Trash2 />
              Remove
            </Button>
          )}
          {isLocked && (
            <span className="font-serif text-xs italic text-muted-foreground">
              Event is locked - logo can&apos;t be changed.
            </span>
          )}
        </div>
      </div>
    </AdminSection>
  );
}
