"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AcceptInviteFormProps {
  token: string;
  email: string;
  eventTitle: string;
}

/**
 * The set-password / accept-invite form rendered by /accept-invite/[token].
 *
 * Three branches on submit:
 *
 *   1. Happy path: POST /api/accept-invite with { token, password, fullName }.
 *      On success, sign the user in via supabase.auth.signInWithPassword,
 *      then router.push to the event home.
 *   2. Existing-account path: API returns 409 USER_EXISTS. We surface a
 *      "Looks like you already have an account" UI with a sign-in link
 *      that preserves the invite token so the next page accepts it
 *      automatically after sign-in.
 *   3. Error: surface the message inline.
 */
export function AcceptInviteForm({
  token,
  email,
  eventTitle,
}: AcceptInviteFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setShowSignInPrompt(false);

    if (fullName.trim().length < 1) {
      setError("Please tell us what to call you.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, fullName }),
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      if (res.status === 409 && body?.code === "USER_EXISTS") {
        setShowSignInPrompt(true);
        setLoading(false);
        return;
      }
      setError(body?.error ?? "Couldn't accept your invite.");
      setLoading(false);
      return;
    }

    // Sign in immediately so the next page render is authenticated.
    const supabase = createClient();
    const { error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(
        "Account created, but we couldn't sign you in automatically. Try signing in manually.",
      );
      setLoading(false);
      return;
    }

    router.push(`/events/${body.eventId}`);
  }

  if (showSignInPrompt) {
    const signInHref = `/login?next=${encodeURIComponent(
      `/accept-invite/${token}`,
    )}`;
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Looks like you already have a Hacksathon.com account for{" "}
          <span className="font-medium text-foreground">{email}</span>. Sign in
          and we&apos;ll automatically add you to {eventTitle}.
        </p>
        <Button asChild className="w-full">
          <Link href={signInHref}>Sign in to accept</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="invite-email">Email</Label>
        <Input
          id="invite-email"
          type="email"
          value={email}
          disabled
          autoComplete="email"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="invite-name">What should we call you?</Label>
        <Input
          id="invite-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
          autoComplete="name"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="invite-password">Choose a password</Label>
        <Input
          id="invite-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          autoComplete="new-password"
          required
        />
        <p className="text-xs text-muted-foreground">
          At least 8 characters. Use whatever your password manager generates.
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Accepting…" : "Accept and start"}
      </Button>
    </form>
  );
}

/**
 * Already-signed-in one-click accept. POSTs the token to /api/accept-invite
 * without a password and redirects to the event home on success.
 */
export function AcceptInviteSignedInButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const res = await fetch("/api/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Couldn't accept the invite.");
        return;
      }
      router.push(`/events/${body.eventId}`);
    });
  }

  return (
    <Button onClick={handleClick} disabled={pending} className="w-full">
      {pending ? "Joining…" : "Yes, join this event"}
    </Button>
  );
}
