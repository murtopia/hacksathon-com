"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendTestEmails, type SendTestResult } from "./actions";

export function SendTestControls({
  adminEmail,
  activeSlug,
}: {
  adminEmail: string | null;
  activeSlug: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [pendingTarget, setPendingTarget] = useState<"all" | "one" | null>(null);
  const [result, setResult] = useState<SendTestResult | null>(null);

  function run(target: "all" | string, which: "all" | "one") {
    setResult(null);
    setPendingTarget(which);
    startTransition(async () => {
      const res = await sendTestEmails(target);
      setResult(res);
      setPendingTarget(null);
    });
  }

  if (!adminEmail) {
    return (
      <p className="text-xs text-[var(--text-tertiary)]">
        Sign in with an email address to send test emails.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="pill"
          size="pill"
          disabled={isPending}
          onClick={() => run(activeSlug, "one")}
        >
          {isPending && pendingTarget === "one" ? "Sending..." : "Send this to me"}
        </Button>
        <Button
          variant="default"
          size="sm"
          disabled={isPending}
          onClick={() => run("all", "all")}
        >
          {isPending && pendingTarget === "all"
            ? "Sending all..."
            : "Send all test emails to me"}
        </Button>
      </div>

      <p className="text-[11px] text-[var(--text-tertiary)]">
        Delivers to {adminEmail}
      </p>

      {result && (
        <div className="max-w-[320px] space-y-1 text-right text-xs">
          {result.error ? (
            <p className="text-destructive">{result.error}</p>
          ) : (
            <>
              <p className="text-[var(--text-secondary)]">
                Sent {result.sent.length} to {result.recipient}
                {result.errors.length > 0
                  ? `, ${result.errors.length} failed`
                  : "."}
              </p>
              {result.errors.length > 0 && (
                <ul className="space-y-0.5 text-destructive">
                  {result.errors.map((e) => (
                    <li key={e.label}>
                      {e.label}: {e.message}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
