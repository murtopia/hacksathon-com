"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface LockMyIdeaButtonProps {
  eventId: string;
  alreadyLocked: boolean;
}

/**
 * "Lock my idea" - explicit per-participant completion for the Shark
 * Tank block. Idempotent POST to /api/blocks/complete; the unique
 * (event_id, user_id, block_key) constraint prevents duplicates and the
 * route uses upsert so a re-tap during in-flight is harmless.
 *
 * On success the component flips to a disabled "Idea locked." state and
 * router.refresh() picks up the new completion on every server-rendered
 * surface (notably the event-home checklist).
 */
export function LockMyIdeaButton({
  eventId,
  alreadyLocked,
}: LockMyIdeaButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [locked, setLocked] = useState(alreadyLocked);

  function handleClick() {
    if (locked || pending) return;

    startTransition(async () => {
      const res = await fetch("/api/blocks/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, blockKey: "02" }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(
          body?.error ?? "Couldn't lock your idea. Try again in a moment.",
        );
        return;
      }

      setLocked(true);
      toast.success("Shark Tank wrapped. Idea locked.");
      router.refresh();
    });
  }

  if (locked) {
    return (
      <Button variant="outline" disabled className="cursor-default">
        <Check className="mr-2 size-4" aria-hidden />
        Idea locked
      </Button>
    );
  }

  return (
    <Button variant="pill" size="pill" onClick={handleClick} disabled={pending}>
      <Lock aria-hidden />
      {pending ? "Locking…" : "Lock my idea"}
    </Button>
  );
}
