"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminSection, AdminField } from "@/components/admin/admin-section";
import { isReservedSlug } from "@/lib/routing/reserved-slugs";

interface EventVanityUrlSectionProps {
  eventId: string;
  initialVanitySlug: string | null;
  /** Whether `settings.vanity_confirmed_at` is already stamped. */
  initialConfirmed?: boolean;
  isLocked: boolean;
  number?: string;
}

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;

/**
 * Vanity URL editor - the part of the old Branding & access section
 * that's actually about *where the event lives on the internet*.
 * Lives on the Identity tab alongside Company / Title / Logo.
 *
 * Save handler stamps `event.settings.vanity_confirmed_at` server-side
 * (via the PATCH /api/events/[id] route) so the Hacky Helper can mark
 * "Confirm your vanity URL" done even when the admin re-saves the same
 * value they were created with.
 */
export function EventVanityUrlSection({
  eventId,
  initialVanitySlug,
  initialConfirmed = false,
  isLocked,
  number = "05",
}: EventVanityUrlSectionProps) {
  const router = useRouter();
  const [vanitySlug, setVanitySlug] = useState(initialVanitySlug ?? "");
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const trimmedSlug = vanitySlug.trim().toLowerCase();
  const slugInputError =
    trimmedSlug.length > 0
      ? !SLUG_PATTERN.test(trimmedSlug)
        ? "Use 3–40 lowercase letters, numbers, or hyphens."
        : isReservedSlug(trimmedSlug)
          ? "That URL is reserved."
          : null
      : null;

  const dirty = (initialVanitySlug ?? "") !== trimmedSlug;
  // Let the admin confirm the seeded slug without editing it: enable the
  // action when it's unchanged but not yet confirmed.
  const canSubmit = dirty || !initialConfirmed;

  function handleSave() {
    if (slugInputError) {
      toast.error(slugInputError);
      return;
    }

    const slugChanged = dirty;
    const nextSlug = trimmedSlug.length === 0 ? null : trimmedSlug;

    startTransition(async () => {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vanity_slug: nextSlug,
          // Stamp the milestone so the Helper can flip "Confirm vanity URL"
          // even when the admin just re-saved the seeded slug verbatim.
          settings: { vanity_confirmed_at: new Date().toISOString() },
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Couldn't save vanity URL.");
        return;
      }
      toast.success("Saved.");
      setSavedAt(Date.now());
      // The admin route resolves by the current vanity slug, so after a
      // slug change we must navigate to the new URL - refreshing the old
      // one would 404.
      if (slugChanged && nextSlug) {
        router.push(`/${nextSlug}/admin/identity#vanity`);
      } else {
        router.refresh();
      }
    });
  }

  const liveUrlPreview = trimmedSlug
    ? `hacksathon.com/${trimmedSlug}`
    : "Set a slug to claim a vanity URL.";

  return (
    <AdminSection
      id="vanity"
      number={number}
      title="Vanity URL"
      intent="The address where your event lives. Participants land here when they join, and it's where your public showcase lives once you publish results."
      footer={
        <>
          <Button
            variant="pill"
            size="pill"
            onClick={handleSave}
            disabled={
              !canSubmit || pending || isLocked || Boolean(slugInputError)
            }
          >
            <Save />
            {pending
              ? "Saving…"
              : !dirty && !initialConfirmed
                ? "Confirm vanity URL"
                : "Save changes"}
          </Button>
          {savedAt && !dirty && !pending && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="size-3" />
              Saved
            </span>
          )}
          {isLocked && (
            <span className="font-serif text-xs italic text-muted-foreground">
              Event is locked - vanity URL can&apos;t be changed.
            </span>
          )}
        </>
      }
    >
      <AdminField
        label="Vanity URL"
        htmlFor="vanity-slug"
        hint={slugInputError ? undefined : liveUrlPreview}
        error={slugInputError}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">
            hacksathon.com/
          </span>
          <Input
            id="vanity-slug"
            value={vanitySlug}
            disabled={isLocked || pending}
            onChange={(e) => setVanitySlug(e.target.value)}
            maxLength={40}
            placeholder="your-team"
          />
        </div>
      </AdminField>
    </AdminSection>
  );
}
