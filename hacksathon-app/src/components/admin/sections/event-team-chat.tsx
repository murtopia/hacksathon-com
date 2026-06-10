"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminSection, AdminField } from "@/components/admin/admin-section";

interface EventTeamChatSectionProps {
  eventId: string;
  initialTeamChatUrl: string | null;
  isLocked: boolean;
  number?: string;
}

/**
 * Team chat URL editor - Slack channel, Discord invite, Teams link.
 * Stored under `events.settings.slack_url` (legacy key name from when
 * Slack was the only option; the UI is platform-agnostic now).
 *
 * Surfaces on the participant event home and inside Build Sessions
 * 2/3 when set. The team-chat "card" on those surfaces hides itself
 * when this is null.
 */
export function EventTeamChatSection({
  eventId,
  initialTeamChatUrl,
  isLocked,
  number = "01",
}: EventTeamChatSectionProps) {
  const router = useRouter();
  const [url, setUrl] = useState(initialTeamChatUrl ?? "");
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const dirty = (initialTeamChatUrl ?? "") !== url.trim();

  function handleSave() {
    startTransition(async () => {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: { slack_url: url.trim() || null },
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Couldn't save team chat URL.");
        return;
      }
      toast.success("Saved.");
      setSavedAt(Date.now());
      router.refresh();
    });
  }

  return (
    <AdminSection
      id="chat"
      number={number}
      title="Team chat"
      intent="Where participants will chat during the event. Surfaces on the event home and inside Build Sessions when set."
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
        </>
      }
    >
      <AdminField
        label="Team chat URL"
        htmlFor="chat-url"
        hint="Optional. Paste a Slack channel, Discord invite, or Teams link."
      >
        <Input
          id="chat-url"
          type="url"
          value={url}
          disabled={isLocked || pending}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-team.slack.com/archives/…"
        />
      </AdminField>
    </AdminSection>
  );
}
