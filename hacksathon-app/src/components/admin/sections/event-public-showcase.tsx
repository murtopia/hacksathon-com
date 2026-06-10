"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { AdminSection } from "@/components/admin/admin-section";

interface EventPublicShowcaseSectionProps {
  eventId: string;
  initialPublicShowcase: boolean;
  vanitySlug: string | null;
  votingStatus: "closed" | "open" | "revealed";
  isLocked: boolean;
  number?: string;
}

/**
 * Public showcase toggle - relocated from the old "Branding & access"
 * tab to live where the decision actually belongs: alongside voting +
 * award categories, since it only matters after winners are revealed.
 *
 * Off (default): the vanity URL stays private. Anonymous visitors are
 * bounced to a sign-in page.
 *
 * On: once winners are revealed, anyone at hacksathon.com/{vanity_slug}
 * sees the full public showcase - hero, winners, every idea, AI recap.
 * Before reveal, anonymous visitors see the "coming soon" teaser.
 *
 * Saves through PATCH /api/events/[id] with `public_showcase` plus the
 * `showcase_decision_at` settings stamp, so the Helper can mark the
 * step done regardless of which way the admin toggled.
 */
export function EventPublicShowcaseSection({
  eventId,
  initialPublicShowcase,
  vanitySlug,
  votingStatus,
  isLocked,
  number = "01",
}: EventPublicShowcaseSectionProps) {
  const router = useRouter();
  const [publicShowcase, setPublicShowcase] = useState(initialPublicShowcase);
  const [pending, startTransition] = useTransition();

  function persist(nextValue: boolean) {
    setPublicShowcase(nextValue);
    startTransition(async () => {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public_showcase: nextValue,
          settings: { showcase_decision_at: new Date().toISOString() },
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Couldn't save showcase setting.");
        setPublicShowcase(!nextValue);
        return;
      }
      toast.success(nextValue ? "Public showcase on." : "Public showcase off.");
      router.refresh();
    });
  }

  const slugDisplay = vanitySlug ? vanitySlug : "your-vanity-slug";
  const previewHref = vanitySlug ? `/${vanitySlug}/final` : null;

  return (
    <AdminSection
      id="showcase"
      number={number}
      title="Public showcase"
      intent="Whether anonymous visitors can see your event after winners are revealed."
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <label
            htmlFor="showcase-public"
            className="mono-label block"
            style={{ color: "var(--text-tertiary)" }}
          >
            Show this event publicly
          </label>
          <p
            className="font-mono text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            hacksathon.com/{slugDisplay}
          </p>
        </div>
        <Switch
          id="showcase-public"
          checked={publicShowcase}
          disabled={isLocked || pending}
          onCheckedChange={persist}
        />
      </div>

      <div
        className="rounded-md border p-3"
        style={{
          borderColor: "var(--border-color)",
          backgroundColor: "var(--background)",
        }}
      >
        <p
          className="mono-label mb-1"
          style={{ color: "var(--text-tertiary)" }}
        >
          When ON
        </p>
        <p
          className="font-serif text-sm italic"
          style={{ color: "var(--text-secondary)" }}
        >
          {votingStatus === "revealed"
            ? `Anyone visiting hacksathon.com/${slugDisplay} sees your public showcase right now - winners, every idea, your AI recap, and the block timeline. One scrollable page, no sign-in required.`
            : `Once you reveal winners, anyone visiting hacksathon.com/${slugDisplay} will see your public showcase - winners, every idea, your AI recap, and the block timeline. One scrollable page, no sign-in required. Before reveal they see a "coming soon" teaser.`}
        </p>
        <p
          className="mono-label mt-3 mb-1"
          style={{ color: "var(--text-tertiary)" }}
        >
          When OFF
        </p>
        <p
          className="font-serif text-sm italic"
          style={{ color: "var(--text-secondary)" }}
        >
          Anonymous visitors at hacksathon.com/{slugDisplay} see a sign-in
          page only. Your event stays private to invited participants.
        </p>
      </div>

      {previewHref && (
        <Link
          href={previewHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:underline"
        >
          Preview as a visitor
          <ExternalLink className="size-3" />
        </Link>
      )}
    </AdminSection>
  );
}
