"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface EventLogoSectionProps {
  eventId: string;
  initialLogoUrl: string | null;
  isLocked: boolean;
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
  isLocked,
}: EventLogoSectionProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [pending, startTransition] = useTransition();

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
    <Card id="logo">
      <CardHeader>
        <CardTitle className="text-base">Logo</CardTitle>
        <CardDescription>
          Shown on the participant event home, the vanity URL landing page,
          and in invite emails. PNG, JPEG, WebP, or SVG up to 5 MB.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={handleChange}
        />
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border bg-muted">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Event logo"
                className="h-full w-full object-contain"
              />
            ) : (
              <span
                aria-hidden
                className="text-xs font-medium text-muted-foreground"
              >
                No logo
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={pickFile}
              disabled={pending || isLocked}
              variant={logoUrl ? "outline" : "default"}
              size="sm"
            >
              <Upload className="mr-2 size-4" />
              {logoUrl ? "Replace" : "Upload logo"}
            </Button>
            {logoUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={pending || isLocked}
              >
                <Trash2 className="mr-2 size-4" />
                Remove
              </Button>
            )}
            {isLocked && (
              <span className="text-xs text-muted-foreground">
                Event is locked — logo can&apos;t be changed.
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
