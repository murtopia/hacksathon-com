"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Check, Edit, Eye, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AdminSection } from "@/components/admin/admin-section";

interface ReflectionSummaryPanelProps {
  eventId: string;
  summary: string | null;
  generatedAt: string | null;
  approvedAt: string | null;
  reflectionResponseCount: number;
  number?: string;
}

/**
 * Three-mode summary panel:
 *
 *   none      → "Generate" CTA, with response-count hint.
 *   draft     → markdown preview + Edit / Approve / Regenerate actions.
 *   approved  → preview + solid-fill "Approved" badge + Regenerate
 *               (which clears approval).
 */
export function ReflectionSummaryPanel({
  eventId,
  summary,
  generatedAt,
  approvedAt,
  reflectionResponseCount,
  number = "01",
}: ReflectionSummaryPanelProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(summary ?? "");
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [pending, startTransition] = useTransition();

  function generate() {
    if (
      summary &&
      !window.confirm(
        "Regenerate the summary? Your current draft will be replaced.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await fetch(
        `/api/events/${eventId}/admin/reflections/summary`,
        { method: "POST" },
      );
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Couldn't generate the summary.");
        return;
      }
      setDraft(body?.summary ?? "");
      setMode("preview");
      toast.success("Summary generated.");
      router.refresh();
    });
  }

  function saveEdit() {
    startTransition(async () => {
      const res = await fetch(
        `/api/events/${eventId}/admin/reflections/summary`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ summary: draft }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Couldn't save your edits.");
        return;
      }
      toast.success("Edits saved.");
      setMode("preview");
      router.refresh();
    });
  }

  function approve() {
    startTransition(async () => {
      const res = await fetch(
        `/api/events/${eventId}/admin/reflections/summary/approve`,
        { method: "POST" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Couldn't approve the summary.");
        return;
      }
      toast.success("Summary approved.");
      router.refresh();
    });
  }

  if (!summary) {
    return (
      <AdminSection
        id="recap"
        number={number}
        title="AI recap"
        intent="Synthesize every participant's reflection answers into a warm 250–400-word recap. Edit before sharing."
        footer={
          <Button
            variant="pill"
            size="pill"
            onClick={generate}
            disabled={pending || reflectionResponseCount === 0}
            title={
              reflectionResponseCount === 0
                ? "Wait until at least one participant has answered a reflection question."
                : undefined
            }
          >
            <FileText />
            {pending ? "Generating…" : "Generate summary"}
          </Button>
        }
      >
        <p className="font-serif text-sm italic text-muted-foreground">
          {reflectionResponseCount === 0
            ? "No reflections submitted yet. Encourage your team to drop a few thoughts in Block +02 first."
            : `${reflectionResponseCount} reflection ${reflectionResponseCount === 1 ? "answer" : "answers"} ready to summarize.`}
        </p>
      </AdminSection>
    );
  }

  const titleBadge = approvedAt ? (
    <span
      className="ml-3 inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] align-middle"
      style={{
        backgroundColor: "var(--black)",
        color: "var(--white)",
      }}
    >
      <Check className="size-3" />
      Approved
    </span>
  ) : null;

  return (
    <AdminSection
      id="recap"
      number={number}
      title="AI recap"
      intent={generatedAt ? `Generated ${formatStamp(generatedAt)}` : "Draft"}
      footer={
        mode === "edit" ? (
          <>
            <Button onClick={saveEdit} disabled={pending} variant="pill" size="pill">
              <Check />
              {pending ? "Saving…" : "Save edits"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft(summary);
                setMode("preview");
              }}
              disabled={pending}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMode("edit")}
              disabled={pending}
            >
              <Edit className="mr-2 size-4" />
              Edit
            </Button>
            {!approvedAt && (
              <Button onClick={approve} disabled={pending} variant="pill" size="pill">
                <Eye />
                {pending ? "Approving…" : "Approve"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={generate}
              disabled={pending}
            >
              <FileText className="mr-2 size-4" />
              Regenerate
            </Button>
          </>
        )
      }
    >
      {titleBadge && <div>{titleBadge}</div>}
      {mode === "edit" ? (
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={16}
          className="font-mono text-sm"
        />
      ) : (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      )}
    </AdminSection>
  );
}

function formatStamp(isoString: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}
