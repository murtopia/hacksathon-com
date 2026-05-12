"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Check, Edit, Eye, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface ReflectionSummaryPanelProps {
  eventId: string;
  summary: string | null;
  generatedAt: string | null;
  approvedAt: string | null;
  reflectionResponseCount: number;
}

/**
 * Three-mode summary panel:
 *
 *   none      → "Generate" CTA, with response-count hint.
 *   draft     → markdown preview + Edit / Approve / Regenerate actions.
 *   approved  → preview + small "Approved" badge + Regenerate (which
 *               clears approval).
 */
export function ReflectionSummaryPanel({
  eventId,
  summary,
  generatedAt,
  approvedAt,
  reflectionResponseCount,
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
      <Card>
        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
          <div
            aria-hidden
            className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted"
          >
            <Sparkles className="size-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">Reflection summary</CardTitle>
            <CardDescription>
              Synthesize every participant&apos;s reflection answers into a
              warm 250–400-word recap. Edit before sharing.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {reflectionResponseCount === 0
              ? "No reflections submitted yet. Encourage your team to drop a few thoughts in Block +02 first."
              : `${reflectionResponseCount} reflection ${reflectionResponseCount === 1 ? "answer" : "answers"} ready to summarize.`}
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={generate} disabled={pending}>
            <Sparkles className="mr-2 size-4" />
            {pending ? "Generating…" : "Generate summary"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <div
          aria-hidden
          className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted"
        >
          <Sparkles className="size-5" />
        </div>
        <div className="flex-1">
          <CardTitle className="flex items-center gap-2 text-base">
            Reflection summary
            {approvedAt && (
              <span className="inline-flex items-center gap-1 rounded-full border border-green-300 bg-green-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-green-800 dark:border-green-700 dark:bg-green-950/40 dark:text-green-300">
                <Check className="size-3" />
                Approved
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {generatedAt
              ? `Generated ${formatStamp(generatedAt)}`
              : "Draft"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
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
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {mode === "edit" ? (
          <>
            <Button onClick={saveEdit} disabled={pending} size="sm">
              <Check className="mr-2 size-4" />
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
              <Button onClick={approve} disabled={pending} size="sm">
                <Eye className="mr-2 size-4" />
                {pending ? "Approving…" : "Approve"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={generate}
              disabled={pending}
            >
              <Sparkles className="mr-2 size-4" />
              Regenerate
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
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
