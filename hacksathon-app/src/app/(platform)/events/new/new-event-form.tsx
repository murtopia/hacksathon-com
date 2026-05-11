"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NewEventFormProps {
  action: (formData: FormData) => Promise<{ error: string } | never>;
}

export function NewEventForm({ action }: NewEventFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await action(formData);
      // The action redirects on success; reaching here means it
      // returned an error string instead.
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="orgName">Organization name</Label>
        <Input
          id="orgName"
          name="orgName"
          placeholder="e.g. Acme Co."
          required
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          The team or company running the hackathon.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="eventTitle">Event title</Label>
        <Input
          id="eventTitle"
          name="eventTitle"
          placeholder="e.g. Acme Hackathon 2026"
          required
          disabled={isPending}
        />
      </div>

      {error && (
        <div
          className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating…" : "Create event"}
      </Button>
    </form>
  );
}
