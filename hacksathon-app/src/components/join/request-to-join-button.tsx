"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface RequestToJoinButtonProps {
  token: string;
}

/**
 * Client-side action for /join/[token]. POSTs the token, shows a toast,
 * and refreshes the server component so the page can swap into its
 * "already pending" branch on success.
 *
 * On `already_active` we redirect straight to the event home.
 */
export function RequestToJoinButton({ token }: RequestToJoinButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  function handleClick() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/join/${encodeURIComponent(token)}`, {
          method: "POST",
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          toast.error(body?.error ?? "Couldn't submit your request.");
          return;
        }

        if (body?.status === "already_active") {
          toast.success("You're already on the roster. Heading there now.");
          if (typeof body?.redirect === "string" && body.redirect) {
            router.push(body.redirect);
          } else {
            router.push("/dashboard");
          }
          return;
        }

        setSubmitted(true);
        toast.success("Request sent. An organizer will let you in soon.");
        router.refresh();
      } catch {
        toast.error("Network hiccup - try again in a moment.");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="pill"
      size="pill"
      className="w-full"
      onClick={handleClick}
      disabled={pending || submitted}
    >
      {pending ? "Sending…" : submitted ? "Request sent" : "Request to join"}
    </Button>
  );
}
