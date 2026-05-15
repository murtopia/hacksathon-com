"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TeamSize = "1-5" | "6-15" | "16-50" | "51-200" | "200+";

const TEAM_SIZES: { value: TeamSize; label: string }[] = [
  { value: "1-5", label: "Just me / 1–5" },
  { value: "6-15", label: "6–15" },
  { value: "16-50", label: "16–50" },
  { value: "51-200", label: "51–200" },
  { value: "200+", label: "200+" },
];

interface SuccessState {
  alreadyOnList: boolean;
  name: string;
}

/**
 * The waitlist signup form.
 *
 * One screen, four fields. On submit we POST to /api/waitlist and
 * swap the form for an in-place thank-you. Re-submits of the same
 * email come back with `alreadyOnList: true`, which we surface as a
 * softer "you're already on the list" message so the user knows their
 * earlier signup landed.
 */
export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [teamSize, setTeamSize] = useState<TeamSize | "">("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!teamSize) {
      setError("Pick a team size.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          company: company.trim(),
          teamSize,
        }),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        setError(body?.error ?? "Couldn't add you to the waitlist.");
        return;
      }

      setSuccess({
        alreadyOnList: Boolean(body?.alreadyOnList),
        name: name.trim(),
      });
    });
  }

  if (success) {
    return <SuccessPanel state={success} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="waitlist-email">Email</Label>
        <Input
          id="waitlist-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          disabled={pending}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="waitlist-name">Name</Label>
        <Input
          id="waitlist-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoComplete="name"
          maxLength={120}
          required
          disabled={pending}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="waitlist-company">Company</Label>
        <Input
          id="waitlist-company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Acme Co."
          autoComplete="organization"
          maxLength={120}
          required
          disabled={pending}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="waitlist-team-size">Team size</Label>
        <Select
          value={teamSize}
          onValueChange={(v) => setTeamSize(v as TeamSize)}
          disabled={pending}
        >
          <SelectTrigger id="waitlist-team-size" className="w-full">
            <SelectValue placeholder="How big is your team?" />
          </SelectTrigger>
          <SelectContent>
            {TEAM_SIZES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={pending}
      >
        {pending ? "Adding you…" : "Join the Waitlist"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        We&apos;ll only email you about Hacksathon.com.{" "}
        <Link
          href="/case-study"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          See the Seven2 case study
        </Link>
        .
      </p>
    </form>
  );
}

function SuccessPanel({ state }: { state: SuccessState }) {
  const firstName = state.name.split(/\s+/)[0] || state.name;

  return (
    <div className="space-y-5 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
        <Check className="size-6" aria-hidden />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          {state.alreadyOnList
            ? `You're already on the list, ${firstName}.`
            : `You're in, ${firstName}.`}
        </h2>
        <p className="text-sm text-muted-foreground">
          {state.alreadyOnList
            ? "We've got your details and you'll hear from us as soon as Hacksathon.com is ready."
            : "Thanks for raising your hand. We just sent you a confirmation email and will be in touch as soon as Hacksathon.com is ready for your team."}
        </p>
      </div>

      <ShareButton />

      <p className="pt-2 text-xs text-muted-foreground">
        Want a flavor of what this looks like in practice?{" "}
        <Link
          href="/case-study"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          Read the Seven2 case study
        </Link>
        .
      </p>
    </div>
  );
}

function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/waitlist`
        : "https://hacksathon.com/waitlist";

    // Prefer native share when available (mobile), fall back to clipboard.
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: "Hacksathon.com",
          text: "Run a structured, AI-powered Hacks-a-Thon at your company.",
          url,
        });
        return;
      } catch {
        // User cancelled — fall through to clipboard copy.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Couldn't copy the link automatically.");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleShare}
      className="mx-auto"
    >
      {copied ? (
        <>
          <Copy className="mr-2 size-4" aria-hidden />
          Link copied
        </>
      ) : (
        <>
          <Share2 className="mr-2 size-4" aria-hidden />
          Tell a friend
        </>
      )}
    </Button>
  );
}
