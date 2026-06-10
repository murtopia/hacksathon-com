"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

// Pulled out so both the submit branch and the post-USER_EXISTS link
// agree on what "this is a join-link signup" means.
const JOIN_PATH_PATTERN = /^\/join\/([^/?#]+)/;

export function AuthForm({
  mode,
  next,
}: {
  mode: "login" | "signup";
  /**
   * Optional destination override. When the form is embedded outside the
   * `/login` and `/signup` routes (e.g. on an event landing page) there's
   * no `?next=` in the URL, so callers pass it explicitly.
   */
  next?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(next ?? searchParams.get("next"));
  const joinToken = extractJoinToken(nextPath);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    if (mode === "signup") {
      // Join-link signups route through our custom endpoint so the
      // confirmation email is branded (sent via Resend) and we skip
      // Supabase's built-in email rate limit. Generic signups
      // (no /join/{token} in next=) still go through supabase.auth.signUp
      // - the dashboard SMTP config covers branding for that path.
      if (joinToken) {
        try {
          const res = await fetch("/api/signup-via-join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: joinToken,
              email,
              password,
              fullName,
            }),
          });
          const responseBody = (await res
            .json()
            .catch(() => null)) as
            | {
                ok?: boolean;
                error?: string;
                code?: string;
                emailDelivered?: boolean;
                emailSkipped?: boolean;
              }
            | null;

          setLoading(false);

          if (!res.ok) {
            if (responseBody?.code === "USER_EXISTS") {
              const loginHref = `/login?next=${encodeURIComponent(
                nextPath ?? `/join/${joinToken}`,
              )}`;
              setError(
                "Looks like you already have an account. Redirecting you to log in…",
              );
              router.push(loginHref);
              return;
            }
            setError(responseBody?.error ?? "Couldn't start your signup.");
            return;
          }

          posthog.capture(AnalyticsEvent.SignupCompleted, { method: "join_link" });
          setConfirmationSent(true);
          return;
        } catch (err) {
          setLoading(false);
          setError(
            err instanceof Error ? err.message : "Network error during signup.",
          );
          return;
        }
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
          data: { full_name: fullName || undefined },
        },
      });

      setLoading(false);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (signUpData.user) {
        posthog.identify(signUpData.user.id, email ? { email } : undefined);
      }
      posthog.capture(AnalyticsEvent.SignupCompleted, { method: "email" });
      setConfirmationSent(true);
    } else {
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      setLoading(false);

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          setError("Invalid email or password.");
        } else if (signInError.message.includes("Email not confirmed")) {
          setError("Please confirm your email address before logging in.");
        } else {
          setError(signInError.message);
        }
        return;
      }

      if (signInData.user) {
        posthog.identify(signInData.user.id, email ? { email } : undefined);
      }

      router.push(nextPath ?? "/dashboard");
      router.refresh();
    }
  }

  if (confirmationSent) {
    return (
      <div className="text-center space-y-2">
        <p className="text-sm font-medium">Check your email</p>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to <strong>{email}</strong>
        </p>
        <p className="text-sm text-muted-foreground">
          Click the link in your email to activate your account.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmationSent(false)}
          className="mt-4"
        >
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GoogleSignInButton next={nextPath} />

      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
          or
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Jane Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {mode === "login" && (
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <Input
            id="password"
            type="password"
            placeholder={mode === "signup" ? "8+ characters" : ""}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={8}
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <Button type="submit" variant="pill" size="pill" className="w-full" disabled={loading}>
          {loading
            ? mode === "signup"
              ? "Creating account..."
              : "Logging in..."
            : mode === "signup"
              ? "Create account"
              : "Log in"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <Link
              href={nextPath ? `/signup?next=${encodeURIComponent(nextPath)}` : "/signup"}
              className="underline hover:text-foreground"
            >
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"}
              className="underline hover:text-foreground"
            >
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

/**
 * Sanitize the `next` query param so it only ever sends users to a
 * relative path inside this site. Strips anything that could be used as
 * an open-redirect.
 */
function safeNextPath(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

/**
 * If the visitor arrived via a `?next=/join/{token}` hand-off, pull the
 * token out so the signup branch can route through the branded
 * `/api/signup-via-join` endpoint. Returns null for any other `next`
 * destination.
 */
function extractJoinToken(value: string | null): string | null {
  if (!value) return null;
  const m = value.match(JOIN_PATH_PATTERN);
  if (!m) return null;
  try {
    const decoded = decodeURIComponent(m[1]);
    return decoded || null;
  } catch {
    return null;
  }
}
