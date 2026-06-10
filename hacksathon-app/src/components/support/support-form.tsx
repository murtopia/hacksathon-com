"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TOPICS = [
  "Running an event",
  "Pricing & billing",
  "Technical issue",
  "Partnership",
  "Something else",
];

interface SuccessState {
  name: string;
}

/**
 * The public support form.
 *
 * Four fields - name, email, topic, message - POSTed to /api/support,
 * which emails the support inbox with reply-to set to the submitter.
 * Swaps to an in-place thank-you on success, mirroring the waitlist
 * form's UX.
 */
export function SupportForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<string>("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          topic: topic || "General",
          message: message.trim(),
        }),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        setError(body?.error ?? "Couldn't send your message.");
        return;
      }

      setSuccess({ name: name.trim() });
    });
  }

  if (success) {
    return <SuccessPanel state={success} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="support-name">Name</Label>
        <Input
          id="support-name"
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
        <Label htmlFor="support-email">Email</Label>
        <Input
          id="support-email"
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
        <Label htmlFor="support-topic">Topic</Label>
        <Select value={topic} onValueChange={setTopic} disabled={pending}>
          <SelectTrigger id="support-topic" className="w-full">
            <SelectValue placeholder="What's this about?" />
          </SelectTrigger>
          <SelectContent>
            {TOPICS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="support-message">Message</Label>
        <Textarea
          id="support-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help?"
          rows={5}
          maxLength={5000}
          required
          disabled={pending}
        />
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        type="submit"
        variant="pill"
        size="pill"
        className="w-full"
        disabled={pending}
      >
        {pending ? "Sending…" : "Send message"}
      </Button>

      <p className="form-hint text-center">
        We&apos;ll reply to the email address you provide.
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
        <h2 className="text-2xl tracking-tight">
          Thanks, {firstName}.
        </h2>
        <p className="text-sm text-muted-foreground">
          Your message is on its way to our team. We&apos;ll get back to you at
          the email you provided, usually within one business day.
        </p>
      </div>
    </div>
  );
}
