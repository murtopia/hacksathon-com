"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminSection, AdminField } from "@/components/admin/admin-section";
import { CharCounter } from "@/components/idealab/char-counter";

interface OrgBasicsSectionProps {
  orgId: string;
  initialName: string;
  number?: string;
}

const NAME_MAX = 80;

/**
 * Edit the organization's display name. The internal workspace slug is
 * intentionally hidden from the admin - the vanity URL on the Identity
 * tab is the canonical user-facing slug; the workspace slug is just an
 * internal identifier and isn't editable.
 */
export function OrgBasicsSection({
  orgId,
  initialName,
  number = "01",
}: OrgBasicsSectionProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const dirty = name.trim() !== initialName.trim();

  function handleSave() {
    startTransition(async () => {
      const res = await fetch(`/api/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Couldn't save your company name.");
        return;
      }
      toast.success("Saved.");
      setSavedAt(Date.now());
      router.refresh();
    });
  }

  return (
    <AdminSection
      id="org-basics"
      number={number}
      title="Company"
      intent="Your company or team name. Participants see it in invitations, page titles, and the public showcase header."
      footer={
        <>
          <Button variant="pill" size="pill" onClick={handleSave} disabled={!dirty || pending}>
            <Save />
            {pending ? "Saving…" : "Save changes"}
          </Button>
          {savedAt && !dirty && !pending && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="size-3" />
              Saved
            </span>
          )}
        </>
      }
    >
      <AdminField label="Company name" htmlFor="org-name">
        <Input
          id="org-name"
          value={name}
          disabled={pending}
          onChange={(e) => setName(e.target.value)}
          maxLength={NAME_MAX}
          placeholder="Acme, Inc."
        />
        <CharCounter value={name} max={NAME_MAX} />
      </AdminField>
    </AdminSection>
  );
}
