"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Plus, Save, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AdminSection, AdminField } from "@/components/admin/admin-section";
import {
  RECOGNIZED_BUILD_TOOLS,
  buildToolMeta,
  isRecognizedBuildTool,
  isByoBuildTool,
  BYO_BUILD_TOOL,
  GENERIC_BUILD_TOOL_LABEL,
} from "@/lib/build-tool/labels";

const OTHER_OPTION = "__other__";
const BUILD_TOOL_MAX_LENGTH = 50;

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
 * Build-tool picker. Determines which tool the block 03 → /plan handoff
 * uses, plus the copy participants see in the Starter Prompt and
 * Section 02 / Section 03 of `/idea`. The source of truth is
 * `events.build_tool` - free-form text since migration 00023, with the
 * recognized set living in `src/lib/build-tool/labels.ts`.
 *
 * Tools are presented as a selectable logo grid. Each recognized tool
 * links out (placeholder affiliate URL) so the admin can learn more.
 * "Participants choose their own" stores the `byo` sentinel; "Other"
 * lets organizers type a custom tool name (rendered to participants as
 * the generic fallback so tool-specific instructions don't misfire).
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
  const [selection, setSelection] = useState<string>(() => {
    if (initialIsRecognized) return initialBuildTool.toLowerCase().trim();
    if (initialIsByo) return BYO_BUILD_TOOL;
    return OTHER_OPTION;
  });
  const [customName, setCustomName] = useState<string>(() =>
    initialIsRecognized || initialIsByo ? "" : initialBuildTool,
  );
  const [pending, startTransition] = useTransition();

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

  const selectedMeta =
    selection !== OTHER_OPTION && selection !== BYO_BUILD_TOOL
      ? buildToolMeta(selection)
      : null;

  const hint =
    selection === BYO_BUILD_TOOL
      ? "Participants pick whatever tool they like - nothing is enforced."
      : selection === OTHER_OPTION
        ? `We'll refer to it as "${GENERIC_BUILD_TOOL_LABEL}" in participant copy until it's a recognized tool.`
        : selectedMeta?.homepageUrl
          ? `Participants will be pointed at ${selectedMeta.homepageUrl.replace(/^https?:\/\//, "")}.`
          : undefined;

  return (
    <AdminSection
      id="build-tool"
      number={number}
      title="Build tool"
      intent="The tool your team will use during the Hacks-a-Thon. Drives the Blueprint handoff and the starter prompt copy."
      footer={
        <>
          <Button
            variant="pill"
            size="pill"
            onClick={handleSave}
            disabled={
              !canSubmit || pending || isLocked || customEmpty || customTooLong
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
        </>
      }
    >
      <p className="max-w-[640px] text-sm text-muted-foreground">
        Build tools are third-party products and{" "}
        <span className="font-medium text-foreground">
          aren&apos;t included in your Hacks-a-Thon
        </span>
        . Some may already be part of your company&apos;s plan, or your team
        may prefer to bring their own. Pick a default below, or let
        participants choose.
      </p>

      <AdminField label="Build tool" htmlFor="build-tool-grid" hint={hint}>
        <div
          id="build-tool-grid"
          role="radiogroup"
          aria-label="Build tool"
          className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        >
          {RECOGNIZED_BUILD_TOOLS.map((value) => {
            const meta = buildToolMeta(value);
            const selected = selection === value;
            return (
              <ToolCard
                key={value}
                selected={selected}
                disabled={isLocked || pending}
                onSelect={() => selectValue(value)}
                logo={meta.logo}
                label={meta.label}
                learnMoreUrl={meta.affiliateUrl}
              />
            );
          })}

          <ToolCard
            selected={selection === BYO_BUILD_TOOL}
            disabled={isLocked || pending}
            onSelect={() => selectValue(BYO_BUILD_TOOL)}
            icon={<Users className="size-5" />}
            label="Participants choose"
            sublabel="Bring your own"
          />

          <ToolCard
            selected={selection === OTHER_OPTION}
            disabled={isLocked || pending}
            onSelect={() => selectValue(OTHER_OPTION)}
            icon={<Plus className="size-5" />}
            label="Other…"
            sublabel="Name a tool"
          />
        </div>
      </AdminField>

      {selection === OTHER_OPTION && (
        <AdminField
          label="Tool name"
          htmlFor="build-tool-custom"
          hint={
            <>
              We&apos;ll refer to it as &ldquo;{GENERIC_BUILD_TOOL_LABEL}&rdquo;
              in participant copy until it&apos;s added to our recognized list
              ({RECOGNIZED_BUILD_TOOLS.join(", ")}).
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
            placeholder="e.g. Claude Code, ChatGPT Projects"
            maxLength={BUILD_TOOL_MAX_LENGTH + 5}
            disabled={isLocked || pending}
            className="w-full sm:w-[280px]"
          />
        </AdminField>
      )}
    </AdminSection>
  );
}

interface ToolCardProps {
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  label: string;
  sublabel?: string;
  logo?: string | null;
  icon?: React.ReactNode;
  learnMoreUrl?: string | null;
}

/**
 * One selectable build-tool card. Acts as a radio option (click or
 * Enter/Space selects it); the optional "Learn more" link is a nested
 * anchor that stops propagation so following it doesn't change the
 * selection.
 */
function ToolCard({
  selected,
  disabled,
  onSelect,
  label,
  sublabel,
  logo,
  icon,
  learnMoreUrl,
}: ToolCardProps) {
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
        "group relative flex flex-col items-center gap-2 rounded-md border px-3 py-4 text-center transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:border-foreground/40",
        selected
          ? "border-foreground ring-1 ring-foreground"
          : "border-border",
      )}
    >
      <span className="flex size-9 items-center justify-center text-muted-foreground">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="size-9" />
        ) : (
          icon
        )}
      </span>
      <span className="space-y-0.5">
        <span className="block text-sm font-medium leading-tight text-foreground">
          {label}
        </span>
        {sublabel && (
          <span className="block text-[11px] leading-tight text-muted-foreground">
            {sublabel}
          </span>
        )}
      </span>
      {learnMoreUrl && (
        <a
          href={learnMoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Learn more
          <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  );
}
