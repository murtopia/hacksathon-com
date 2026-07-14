"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createShortLink, deleteShortLink } from "./actions";

/**
 * Create form for the Links tab: choose a slug, paste a destination.
 * Mirrors the emails tab's client-controls pattern (useTransition around
 * a server action, inline error text).
 */
export function CreateLinkForm() {
  const [slug, setSlug] = useState("");
  const [destination, setDestination] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createShortLink(slug, destination);
      if (!res.ok) {
        setError(res.error ?? "Something went wrong.");
        return;
      }
      setSlug("");
      setDestination("");
    });
  }

  return (
    <div className="space-y-2 rounded-[4px] border p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1 sm:w-[280px]">
          <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
            hacksathon.com/go/
          </span>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="spring-webinar"
            className="h-9 font-mono text-xs"
            disabled={isPending}
          />
        </div>
        <Input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Destination: /seven2?utm_source=... or https://..."
          className="h-9 flex-1 font-mono text-xs"
          disabled={isPending}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <Button
          size="sm"
          onClick={submit}
          disabled={isPending || !slug.trim() || !destination.trim()}
        >
          {isPending ? "Creating..." : "Create link"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/** Per-row delete with a lightweight two-click confirm. */
export function DeleteLinkButton({ id, slug }: { id: string; slug: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteShortLink(id);
      if (!res.ok) setError(res.error ?? "Delete failed.");
      setConfirming(false);
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <Button
        variant={confirming ? "destructive" : "pill"}
        size="pill"
        disabled={isPending}
        onClick={run}
        onBlur={() => setConfirming(false)}
        aria-label={`Delete /go/${slug}`}
      >
        {isPending ? "Deleting..." : confirming ? "Confirm delete" : "Delete"}
      </Button>
    </div>
  );
}

/** Copy-to-clipboard for the full short URL. */
export function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="pill"
      size="pill"
      onClick={async () => {
        await navigator.clipboard.writeText(
          `https://hacksathon.com/go/${slug}`,
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}
