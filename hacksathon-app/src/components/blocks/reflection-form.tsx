"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface ReflectionQuestion {
  id: string;
  question_text: string;
  sort_order: number;
  is_required: boolean;
}

export interface ReflectionAnswer {
  questionId: string;
  answer: string;
}

interface ReflectionFormProps {
  eventId: string;
  questions: ReflectionQuestion[];
  initialAnswers: ReflectionAnswer[];
}

const ANSWER_MAX = 1500;
const AUTOSAVE_DELAY_MS = 900;

/**
 * Per-question autosave reflection form.
 *
 * Each question has its own debounced save. We track three states per
 * question: idle / saving / saved. On blur we flush any pending debounce
 * so leaving the page doesn't lose typed input. router.refresh() runs
 * on the first successful save so the parent (which derives mineDone
 * for +02 via hasReflection) picks up the new state on the event home.
 */
export function ReflectionForm({
  eventId,
  questions,
  initialAnswers,
}: ReflectionFormProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Map<string, string>>(
    () => new Map(initialAnswers.map((a) => [a.questionId, a.answer])),
  );
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(
    () => new Set(initialAnswers.filter((a) => a.answer.trim().length > 0).map((a) => a.questionId)),
  );
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [, startTransition] = useTransition();
  const hasNotifiedFirstSave = useRef(initialAnswers.length > 0);

  useEffect(() => {
    return () => {
      for (const t of timers.current.values()) clearTimeout(t);
    };
  }, []);

  function scheduleSave(questionId: string, nextValue: string) {
    const existing = timers.current.get(questionId);
    if (existing) clearTimeout(existing);

    const t = setTimeout(() => {
      void persist(questionId, nextValue);
    }, AUTOSAVE_DELAY_MS);
    timers.current.set(questionId, t);
  }

  async function persist(questionId: string, value: string) {
    setSavingIds((s) => new Set(s).add(questionId));
    try {
      const res = await fetch("/api/reflections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, questionId, answer: value }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Couldn't save your reflection.");
      }
      setSavedIds((s) => new Set(s).add(questionId));
      if (!hasNotifiedFirstSave.current && value.trim().length > 0) {
        hasNotifiedFirstSave.current = true;
        startTransition(() => router.refresh());
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Couldn't save.";
      toast.error(msg);
    } finally {
      setSavingIds((s) => {
        const next = new Set(s);
        next.delete(questionId);
        return next;
      });
    }
  }

  function flushNow(questionId: string) {
    const t = timers.current.get(questionId);
    if (t) {
      clearTimeout(t);
      timers.current.delete(questionId);
      void persist(questionId, answers.get(questionId) ?? "");
    }
  }

  return (
    <div className="space-y-6">
      {questions.map((q) => {
        const value = answers.get(q.id) ?? "";
        const remaining = ANSWER_MAX - value.length;
        const isSaving = savingIds.has(q.id);
        const isSaved = !isSaving && savedIds.has(q.id);
        return (
          <div key={q.id} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <Label htmlFor={`reflection-${q.id}`} className="text-base font-medium">
                {q.question_text}
                {!q.is_required && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    Optional
                  </span>
                )}
              </Label>
              <SaveStatus saving={isSaving} saved={isSaved} hasContent={value.length > 0} />
            </div>
            <Textarea
              id={`reflection-${q.id}`}
              value={value}
              maxLength={ANSWER_MAX}
              rows={4}
              onChange={(e) => {
                const v = e.target.value;
                setAnswers((prev) => {
                  const next = new Map(prev);
                  next.set(q.id, v);
                  return next;
                });
                scheduleSave(q.id, v);
              }}
              onBlur={() => flushNow(q.id)}
              placeholder="Take your time…"
            />
            <div className="flex justify-end">
              <span
                className={cn(
                  "text-xs",
                  remaining < 100 ? "text-amber-600" : "text-muted-foreground",
                )}
              >
                {remaining} characters left
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SaveStatus({
  saving,
  saved,
  hasContent,
}: {
  saving: boolean;
  saved: boolean;
  hasContent: boolean;
}) {
  if (saving) {
    return (
      <span className="text-xs text-muted-foreground">Saving…</span>
    );
  }
  if (saved && hasContent) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Check className="size-3" aria-hidden />
        Saved
      </span>
    );
  }
  return null;
}
