"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AdminSection, AdminField } from "@/components/admin/admin-section";
import {
  buildToolMeta,
  getExploreBuildTools,
  isRecognizedBuildTool,
  isByoBuildTool,
  BYO_BUILD_TOOL,
  GENERIC_BUILD_TOOL_LABEL,
  RECOMMENDED_BUILD_TOOL,
  SELECTABLE_BUILD_TOOLS,
  type BuildToolMeta,
} from "@/lib/build-tool/labels";

const OTHER_OPTION = "__other__";
const BUILD_TOOL_MAX_LENGTH = 50;

const SELECT_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

/** rel for an outbound tool link - sponsored only for real affiliate links. */
function relFor(meta: BuildToolMeta): string {
  return meta.affiliate
    ? "noopener noreferrer sponsored"
    : "noopener noreferrer";
}

interface EventBuildToolSectionProps {
  eventId: string;
  /**
   * Raw string from `events.build_tool`. May be one of the recognized
   * values, the "byo" sentinel, or any custom organizer-supplied label
   * (saved via the "Other" option).
   */
  initialBuildTool: string;
  /** Whether `settings.build_tool_confirmed_at` is already stamped. */
  initialConfirmed?: boolean;
  isLocked: boolean;
  number?: string;
}

/**
 * Build-tool picker. Lovable-first: one recommended hero card (the default),
 * a bring-your-own dropdown for teams standardized on something else, and a
 * links-only "explore other tools" section for discovery. Determines which
 * tool the block 03 → /plan handoff uses, plus the copy participants see in
 * the Starter Prompt and Section 02 / Section 03 of `/idea`. The source of
 * truth is `events.build_tool` - free-form text since migration 00023, with
 * the recognized set living in `src/lib/build-tool/labels.ts`.
 *
 * The starter prompt is tailored only for Lovable and stays generic for
 * everything else. "Participants choose their own" stores the `byo`
 * sentinel; "Other" lets organizers type a custom tool name (rendered to
 * participants as the generic fallback so tool-specific instructions don't
 * misfire).
 *
 * Build tools are third-party products and are NOT included in the
 * Hacksathon purchase - the helper copy makes that explicit.
 */
export function EventBuildToolSection({
  eventId,
  initialBuildTool,
  initialConfirmed = false,
  isLocked,
  number = "04",
}: EventBuildToolSectionProps) {
  const router = useRouter();
  const initialIsRecognized = isRecognizedBuildTool(initialBuildTool);
  const initialIsByo = isByoBuildTool(initialBuildTool);
  const initLower = initialBuildTool.toLowerCase().trim();
  const [selection, setSelection] = useState<string>(() => {
    if (initialIsRecognized) return initLower;
    if (initialIsByo) return BYO_BUILD_TOOL;
    return OTHER_OPTION;
  });
  const [customName, setCustomName] = useState<string>(() =>
    initialIsRecognized || initialIsByo ? "" : initialBuildTool,
  );
  const [pending, startTransition] = useTransition();

  // Dropdown holds the selectable tools other than the recommended default.
  // If the saved value is a recognized-but-not-selectable tool (e.g. cursor),
  // surface it as an extra option so the current value stays representable.
  const baseDropdown: string[] = SELECTABLE_BUILD_TOOLS.filter(
    (value) => value !== RECOMMENDED_BUILD_TOOL,
  );
  const dropdownTools: string[] =
    initialIsRecognized &&
    initLower !== RECOMMENDED_BUILD_TOOL &&
    !baseDropdown.includes(initLower)
      ? [...baseDropdown, initLower]
      : baseDropdown;

  const explore = getExploreBuildTools();
  const lovableMeta = buildToolMeta(RECOMMENDED_BUILD_TOOL);
  const isLovableSelected = selection === RECOMMENDED_BUILD_TOOL;

  const effectiveValue =
    selection === OTHER_OPTION ? customName.trim() : selection;
  const dirty = effectiveValue !== initialBuildTool.trim();
  // Let the admin confirm the default tool without changing it: enable the
  // action when it's unchanged but not yet confirmed.
  const canSubmit = dirty || !initialConfirmed;
  const customEmpty =
    selection === OTHER_OPTION && customName.trim().length === 0;
  const customTooLong =
    selection === OTHER_OPTION &&
    customName.trim().length > BUILD_TOOL_MAX_LENGTH;

  function handleSave() {
    if (customEmpty || customTooLong) return;
    startTransition(async () => {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          build_tool: effectiveValue,
          // Stamp the "I reviewed this" milestone so the Helper can flip
          // "Confirm your build tool" done even when the admin accepts the
          // default (Lovable).
          settings: { build_tool_confirmed_at: new Date().toISOString() },
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Couldn't update build tool.");
        return;
      }
      toast.success("Build tool updated.");
      router.refresh();
    });
  }

  function selectValue(value: string) {
    if (isLocked || pending) return;
    setSelection(value);
  }

  // The dropdown's empty option means "use the recommended default".
  const dropdownValue = isLovableSelected ? "" : selection;

  const selectedMeta =
    selection !== OTHER_OPTION && selection !== BYO_BUILD_TOOL
      ? buildToolMeta(selection)
      : null;

  const pointerNote =
    selection === BYO_BUILD_TOOL
      ? "Participants will choose their own tool"
      : selection === OTHER_OPTION
        ? "Participants will be pointed at the tool you name"
        : selectedMeta?.homepageUrl
          ? `Participants will be pointed at ${selectedMeta.homepageUrl.replace(/^https?:\/\//, "")}`
          : undefined;

  const dropdownHelper = isLovableSelected
    ? "Pick the default your team will use, or let participants choose their own. The starter prompt is tailored automatically for Lovable, and stays generic for other tools."
    : "Heads up: the starter prompt stays generic for tools other than Lovable.";

  return (
    <AdminSection
      id="build-tool"
      number={number}
      title="Build tool"
      intent="The tool your team will use during the Hacks-a-Thon. Drives the Blueprint handoff and the starter prompt copy."
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <span className="font-serif text-xs italic text-muted-foreground">
            {pointerNote}
          </span>
          <div className="flex items-center gap-3">
            <Button
              variant="pill"
              size="pill"
              onClick={handleSave}
              disabled={
                !canSubmit ||
                pending ||
                isLocked ||
                customEmpty ||
                customTooLong
              }
            >
              <Save />
              {pending
                ? "Saving…"
                : !dirty && !initialConfirmed
                  ? "Confirm build tool"
                  : "Save build tool"}
            </Button>
            {isLocked && (
              <span className="font-serif text-xs italic text-muted-foreground">
                Event is locked - build tool can&apos;t be changed.
              </span>
            )}
          </div>
        </div>
      }
    >
      <p className="max-w-[640px] text-sm text-muted-foreground">
        Build tools are third-party products and{" "}
        <span className="font-medium text-foreground">
          aren&apos;t included in your Hacks-a-Thon
        </span>
        . We recommend Lovable, the tool our pilot teams used to ship live apps.
        If your company already uses something else, bring your own below.
      </p>

      <div className="space-y-2">
        <p className="mono-label">Recommended default</p>
        <LovableHeroCard
          selected={isLovableSelected}
          disabled={isLocked || pending}
          onSelect={() => selectValue(RECOMMENDED_BUILD_TOOL)}
          meta={lovableMeta}
        />
      </div>

      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="font-serif text-xs italic text-muted-foreground">
          or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <AdminField
        label="Bring your own"
        htmlFor="build-tool-select"
        hint={dropdownHelper}
      >
        <select
          id="build-tool-select"
          value={dropdownValue}
          onChange={(e) => {
            const value = e.target.value;
            selectValue(value === "" ? RECOMMENDED_BUILD_TOOL : value);
          }}
          disabled={isLocked || pending}
          className={cn(SELECT_CLASS, "sm:w-[320px]")}
        >
          <option value="">Select a tool your team already uses…</option>
          {dropdownTools.map((value) => (
            <option key={value} value={value}>
              {buildToolMeta(value).label}
            </option>
          ))}
          <option value={BYO_BUILD_TOOL}>Participants choose their own</option>
          <option value={OTHER_OPTION}>Other…</option>
        </select>
      </AdminField>

      {selection === OTHER_OPTION && (
        <AdminField
          label="Tool name"
          htmlFor="build-tool-custom"
          hint={
            <>
              We&apos;ll refer to it as &ldquo;{GENERIC_BUILD_TOOL_LABEL}&rdquo;
              in participant copy until it&apos;s a recognized tool.
            </>
          }
          error={
            customTooLong
              ? `Keep the name under ${BUILD_TOOL_MAX_LENGTH} characters.`
              : null
          }
        >
          <Input
            id="build-tool-custom"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Name the tool participants will use"
            maxLength={BUILD_TOOL_MAX_LENGTH + 5}
            disabled={isLocked || pending}
            className="w-full sm:w-[320px]"
          />
        </AdminField>
      )}

      <details className="group rounded-md border border-border">
        <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
          Explore other build tools
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-4 border-t border-border px-3 py-3">
          {explore.builders.length > 0 && (
            <ExploreGroup
              label="App builders for non-coders"
              tools={explore.builders}
            />
          )}
          {explore.owned.length > 0 && (
            <ExploreGroup
              label="You may already have these"
              tools={explore.owned}
            />
          )}
        </div>
      </details>
    </AdminSection>
  );
}

interface LovableHeroCardProps {
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  meta: BuildToolMeta;
}

/**
 * The recommended-default hero card. Acts as a radio option (click or
 * Enter/Space selects it); the nested "Learn more" anchor stops propagation
 * so following it doesn't change the selection.
 */
function LovableHeroCard({
  selected,
  disabled,
  onSelect,
  meta,
}: LovableHeroCardProps) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "group relative flex items-center gap-3 rounded-md border p-3 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:border-foreground/40",
        selected ? "border-foreground ring-1 ring-foreground" : "border-border",
      )}
    >
      {meta.logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={meta.logo} alt="" className="size-10 shrink-0" />
      )}
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {meta.label}
          </span>
          <span className="rounded-full border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            Recommended
          </span>
        </span>
        {meta.blurb && (
          <span className="block text-xs text-muted-foreground">
            {meta.blurb}
          </span>
        )}
      </span>
      {meta.affiliateUrl && (
        <a
          href={meta.affiliateUrl}
          target="_blank"
          rel={relFor(meta)}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Learn more
          <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  );
}

function ExploreGroup({
  label,
  tools,
}: {
  label: string;
  tools: BuildToolMeta[];
}) {
  return (
    <div className="space-y-1.5">
      <p className="mono-label">{label}</p>
      <div className="space-y-0.5">
        {tools.map((meta) => (
          <ExploreRow key={meta.value} meta={meta} />
        ))}
      </div>
    </div>
  );
}

function ExploreRow({ meta }: { meta: BuildToolMeta }) {
  return (
    <a
      href={meta.affiliateUrl ?? meta.homepageUrl ?? "#"}
      target="_blank"
      rel={relFor(meta)}
      className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/60"
    >
      {meta.logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={meta.logo} alt="" className="size-6 shrink-0" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-foreground">{meta.label}</span>
        {meta.blurb && (
          <span className="block truncate text-xs text-muted-foreground">
            {meta.blurb}
          </span>
        )}
      </span>
      <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
    </a>
  );
}
