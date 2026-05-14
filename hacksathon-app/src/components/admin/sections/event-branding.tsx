"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Save } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { isReservedSlug } from "@/lib/routing/reserved-slugs";

interface EventBrandingSectionProps {
  eventId: string;
  initialVanitySlug: string | null;
  initialPublicShowcase: boolean;
  initialSlackUrl: string | null;
  isLocked: boolean;
}

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;

/**
 * Branding + access controls:
 *
 *   - Vanity slug → hacksathon.com/{slug}. Reserved-slug list is checked
 *     client-side for an instant error before we hit the API.
 *   - Public showcase toggle. When on, the event row is select-able
 *     without org membership (per the existing events_select RLS). The
 *     vanity URL also flips from "soft entry" to "public results."
 *   - Team chat URL stored under settings.slack_url. The event home
 *     and Build Session 2/3 surfaces hide their "Team chat" cards when
 *     this is unset.
 */
export function EventBrandingSection({
  eventId,
  initialVanitySlug,
  initialPublicShowcase,
  initialSlackUrl,
  isLocked,
}: EventBrandingSectionProps) {
  const router = useRouter();
  const [vanitySlug, setVanitySlug] = useState(initialVanitySlug ?? "");
  const [publicShowcase, setPublicShowcase] = useState(initialPublicShowcase);
  const [slackUrl, setSlackUrl] = useState(initialSlackUrl ?? "");
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

  const dirty =
    (initialVanitySlug ?? "") !== trimmedSlug ||
    initialPublicShowcase !== publicShowcase ||
    (initialSlackUrl ?? "") !== slackUrl.trim();

  function handleSave() {
    if (slugInputError) {
      toast.error(slugInputError);
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vanity_slug: trimmedSlug.length === 0 ? null : trimmedSlug,
          public_showcase: publicShowcase,
          settings: { slack_url: slackUrl.trim() || null },
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Couldn't save branding.");
        return;
      }
      toast.success("Saved.");
      setSavedAt(Date.now());
      router.refresh();
    });
  }

  const liveUrlPreview = trimmedSlug
    ? `hacksathon.com/${trimmedSlug}`
    : "Set a slug to claim a vanity URL.";

  return (
    <Card id="branding">
      <CardHeader>
        <CardTitle className="text-base">Branding &amp; access</CardTitle>
        <CardDescription>
          Your vanity URL, public showcase visibility, and team chat link.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="branding-slug">Vanity URL</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              hacksathon.com/
            </span>
            <Input
              id="branding-slug"
              value={vanitySlug}
              disabled={isLocked || pending}
              onChange={(e) => setVanitySlug(e.target.value)}
              maxLength={40}
              placeholder="your-team"
            />
          </div>
          <p
            className={`text-xs ${slugInputError ? "text-destructive" : "text-muted-foreground"}`}
          >
            {slugInputError ?? liveUrlPreview}
          </p>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="branding-public">Public showcase</Label>
            <p className="text-xs text-muted-foreground">
              When on, anyone can view your vanity URL after you reveal
              winners. Off keeps everything to invited participants only.
            </p>
          </div>
          <Switch
            id="branding-public"
            checked={publicShowcase}
            disabled={isLocked || pending}
            onCheckedChange={setPublicShowcase}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="branding-slack">Team chat URL (optional)</Label>
          <Input
            id="branding-slack"
            type="url"
            value={slackUrl}
            disabled={isLocked || pending}
            onChange={(e) => setSlackUrl(e.target.value)}
            placeholder="https://your-team.slack.com/archives/…"
          />
          <p className="text-xs text-muted-foreground">
            Paste a Slack channel, Discord invite, or Teams link. We&apos;ll
            surface it on the event home and inside Build Sessions.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={!dirty || pending || isLocked || Boolean(slugInputError)}
        >
          <Save className="mr-2 size-4" />
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {savedAt && !dirty && !pending && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Check className="size-3" />
            Saved
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
