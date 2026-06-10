"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminSection, AdminField } from "@/components/admin/admin-section";
import { CharCounter } from "@/components/idealab/char-counter";

interface EventTitleSectionProps {
  eventId: string;
  initialTitle: string;
  isLocked: boolean;
  number?: string;
}

const TITLE_MAX = 120;

/**
 * Event title editor. Sibling of `EventWelcomeSection` - together they
 * replace the older combined `EventBasicsSection`, giving the Identity
 * tab cleaner anchors (`#basics` here, `#welcome` next door) for Hacky
 * Helper deep links.
 */
export function EventTitleSection({
  eventId,
  initialTitle,
  isLocked,
  number = "02",
}: EventTitleSectionProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const dirty = title !== initialTitle;

  function handleSave() {
    startTransition(async () => {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Couldn't save event title.");
        return;
      }
      toast.success("Saved.");
      setSavedAt(Date.now());
      router.refresh();
    });
  }

  return (
    <AdminSection
      id="basics"
      number={number}
      title="Event title"
      intent="The headline participants see across every screen and email."
      footer={
        <>
          <Button variant="pill" size="pill" onClick={handleSave} disabled={!dirty || pending || isLocked}>
            <Save />
            {pending ? "Saving…" : "Save changes"}
          </Button>
          {savedAt && !dirty && !pending && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="size-3" />
              Saved
            </span>
          )}
          {isLocked && (
            <span className="font-serif text-xs italic text-muted-foreground">
              Event is locked - title can&apos;t be changed.
            </span>
          )}
        </>
      }
    >
      <AdminField label="Event title" htmlFor="basics-title">
        <Input
          id="basics-title"
          value={title}
          disabled={isLocked || pending}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={TITLE_MAX}
          placeholder="Spring Hacks-a-Thon"
        />
        <CharCounter value={title} max={TITLE_MAX} />
      </AdminField>
    </AdminSection>
  );
}
