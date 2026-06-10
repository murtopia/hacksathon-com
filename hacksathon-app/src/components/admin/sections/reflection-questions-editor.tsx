"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AdminSection, AdminField } from "@/components/admin/admin-section";

export interface ReflectionQuestionRow {
  id: string;
  question_text: string;
  is_required: boolean;
  sort_order: number;
}

interface ReflectionQuestionsEditorProps {
  eventId: string;
  questions: ReflectionQuestionRow[];
  number?: string;
}

/**
 * Manage the reflection questions shown in the +02 block.
 *
 * Same edit-in-place pattern as award categories. Required toggle lives
 * on each row - the AI summary route just feeds whatever answers exist,
 * so "required" is a UX hint rather than a hard constraint.
 *
 * Note: reflection questions stay editable even after the event is
 * locked, because organizers sometimes add follow-up prompts when
 * synthesizing the recap.
 */
export function ReflectionQuestionsEditor({
  eventId,
  questions,
  number = "02",
}: ReflectionQuestionsEditorProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <AdminSection
      id="questions"
      number={number}
      title="Reflection questions"
      intent="Prompts participants answer in the Reflections block. The AI recap synthesizes their answers into the summary above."
    >
      {questions.length === 0 && !adding && (
        <p className="font-serif text-sm italic text-muted-foreground">
          No questions yet. Add one below.
        </p>
      )}

      {questions.map((q) =>
        editingId === q.id ? (
          <QuestionEditForm
            key={q.id}
            question={q}
            onCancel={() => setEditingId(null)}
            onSaved={() => {
              setEditingId(null);
              router.refresh();
            }}
          />
        ) : (
          <QuestionReadRow
            key={q.id}
            question={q}
            onEdit={() => setEditingId(q.id)}
            onDeleted={() => router.refresh()}
          />
        ),
      )}

      {adding ? (
        <QuestionNewForm
          eventId={eventId}
          onCancel={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            router.refresh();
          }}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAdding(true)}
        >
          <Plus className="mr-2 size-4" />
          Add question
        </Button>
      )}
    </AdminSection>
  );
}

function QuestionReadRow({
  question,
  onEdit,
  onDeleted,
}: {
  question: ReflectionQuestionRow;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (
      !window.confirm(
        "Delete this question? Any answers participants have already given will be removed.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/reflection-questions/${question.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Couldn't delete question.");
        return;
      }
      toast.success("Question removed.");
      onDeleted();
    });
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-md border bg-card p-3">
      <div className="min-w-0">
        <p className="text-sm">{question.question_text}</p>
        {!question.is_required && (
          <p className="mt-0.5 font-serif text-xs italic text-muted-foreground">
            Optional
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          disabled={pending}
        >
          <Pencil className="size-3.5" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={pending}
        >
          <Trash2 className="size-3.5" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  );
}

function QuestionEditForm({
  question,
  onCancel,
  onSaved,
}: {
  question: ReflectionQuestionRow;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [text, setText] = useState(question.question_text);
  const [required, setRequired] = useState(question.is_required);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    if (text.trim().length < 4) {
      toast.error("Question must be at least 4 characters.");
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/reflection-questions/${question.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: text.trim(),
          isRequired: required,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Couldn't save question.");
        return;
      }
      toast.success("Question updated.");
      onSaved();
    });
  }

  return (
    <div
      className="space-y-3 rounded-md border p-3"
      style={{ backgroundColor: "var(--bg-tertiary)" }}
    >
      <AdminField label="Question" htmlFor={`q-${question.id}-text`}>
        <Input
          id={`q-${question.id}-text`}
          value={text}
          maxLength={280}
          disabled={pending}
          onChange={(e) => setText(e.target.value)}
        />
      </AdminField>
      <div className="flex items-center justify-between">
        <label
          htmlFor={`q-${question.id}-required`}
          className="mono-label"
          style={{ color: "var(--text-tertiary)" }}
        >
          Required
        </label>
        <Switch
          id={`q-${question.id}-required`}
          checked={required}
          disabled={pending}
          onCheckedChange={setRequired}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="pill" size="pill" onClick={handleSave} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={pending}
        >
          <X className="mr-1.5 size-3" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

function QuestionNewForm({
  eventId,
  onCancel,
  onSaved,
}: {
  eventId: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [text, setText] = useState("");
  const [required, setRequired] = useState(true);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    if (text.trim().length < 4) {
      toast.error("Question must be at least 4 characters.");
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/reflection-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          questionText: text.trim(),
          isRequired: required,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Couldn't add question.");
        return;
      }
      toast.success("Question added.");
      onSaved();
    });
  }

  return (
    <div
      className="space-y-3 rounded-md border p-3"
      style={{ backgroundColor: "var(--bg-tertiary)" }}
    >
      <AdminField label="Question" htmlFor="q-new-text">
        <Input
          id="q-new-text"
          value={text}
          maxLength={280}
          autoFocus
          disabled={pending}
          onChange={(e) => setText(e.target.value)}
          placeholder="What surprised you?"
        />
      </AdminField>
      <div className="flex items-center justify-between">
        <label
          htmlFor="q-new-required"
          className="mono-label"
          style={{ color: "var(--text-tertiary)" }}
        >
          Required
        </label>
        <Switch
          id="q-new-required"
          checked={required}
          disabled={pending}
          onCheckedChange={setRequired}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="pill" size="pill" onClick={handleSave} disabled={pending}>
          {pending ? "Adding…" : "Add question"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={pending}
        >
          <X className="mr-1.5 size-3" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
