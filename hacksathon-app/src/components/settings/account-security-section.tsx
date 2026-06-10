"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PASSWORD_MIN = 8;

interface AccountSecuritySectionProps {
  email: string;
}

/**
 * Account-security card on /settings.
 *
 * Today: read-only email display + password change. Email change
 * happens through Supabase's built-in confirmation flow but isn't
 * surfaced here yet (the dashboard template is already installed
 * upstream when we wire it).
 *
 * Password change POSTs to `/api/settings/password` which:
 *   1. Verifies the supplied current password (step-up re-auth - a
 *      stolen-cookie attacker can't lock the user out without knowing
 *      the current password).
 *   2. Updates the password against the user's session.
 *   3. Signs out OTHER devices (keeps the current cookie active).
 *   4. Sends a "your password was changed" alert via Resend.
 */
export function AccountSecuritySection({ email }: AccountSecuritySectionProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentInputRef = useRef<HTMLInputElement | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError("Enter your current password.");
      currentInputRef.current?.focus();
      return;
    }
    if (password.length < PASSWORD_MIN) {
      setError(`Password must be at least ${PASSWORD_MIN} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password === currentPassword) {
      setError("Pick a password different from your current one.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, password }),
      });
      const responseBody = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        code?: string;
        otherSessionsRevoked?: boolean;
      } | null;

      if (!res.ok) {
        const code = responseBody?.code;
        if (code === "BAD_CURRENT_PASSWORD") {
          setError("That password is incorrect.");
          setCurrentPassword("");
          // Defer focus until after React commits the disabled→enabled
          // transition on the input so focus actually lands.
          setTimeout(() => currentInputRef.current?.focus(), 0);
          return;
        }
        setError(responseBody?.error ?? "Couldn't update your password.");
        return;
      }

      toast.success(
        responseBody?.otherSessionsRevoked
          ? "Password updated. We've signed out any other devices."
          : "Password updated.",
      );
      setCurrentPassword("");
      setPassword("");
      setConfirm("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Network error during password update.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Account security</CardTitle>
        <CardDescription>Your sign-in email and password.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1">
          <p className="font-mono text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
            Email
          </p>
          <p className="text-sm text-foreground">{email || "-"}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              ref={currentInputRef}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8+ characters"
              minLength={PASSWORD_MIN}
              autoComplete="new-password"
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={PASSWORD_MIN}
              autoComplete="new-password"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <p
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="outline"
            disabled={
              loading ||
              currentPassword.length === 0 ||
              password.length === 0
            }
          >
            {loading ? (
              <>
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                Updating…
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
