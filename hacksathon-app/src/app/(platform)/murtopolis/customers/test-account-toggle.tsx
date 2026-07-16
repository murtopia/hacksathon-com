"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { setOrgInternal } from "@/app/(platform)/murtopolis/customers/actions";

/**
 * Marks the org as a platform test account (is_internal). Hidden from
 * metrics and health digests; reachable under Customers → Billing → Test.
 */
export function TestAccountToggle({
  orgId,
  isInternal,
}: {
  orgId: string;
  isInternal: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-start justify-between gap-4 sm:col-span-2">
      <div className="space-y-1">
        <p className="mono-label" style={{ color: "var(--text-tertiary)" }}>
          Test account
        </p>
        <p className="text-sm text-muted-foreground">
          Hidden from metrics and health alerts. Find it again under Billing →
          Test.
        </p>
      </div>
      <Switch
        checked={isInternal}
        disabled={pending}
        onCheckedChange={(checked) => {
          startTransition(async () => {
            await setOrgInternal(orgId, checked);
          });
        }}
        aria-label="Mark as test account"
      />
    </div>
  );
}
