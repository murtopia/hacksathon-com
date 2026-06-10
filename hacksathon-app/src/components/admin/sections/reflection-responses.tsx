"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { AdminSection } from "@/components/admin/admin-section";

export interface ReflectionAnswer {
  participantName: string;
  answer: string;
}

export interface ReflectionQuestionGroup {
  questionId: string;
  questionText: string;
  answers: ReflectionAnswer[];
}

interface ReflectionResponsesProps {
  number?: string;
  groups: ReflectionQuestionGroup[];
  totalAnswers: number;
}

/**
 * Individual reflection answers, grouped by question, for the admin to
 * read every response (not just the AI recap) - handy for pulling
 * quotes for marketing. Each answer has a copy button.
 */
export function ReflectionResponses({
  number = "03",
  groups,
  totalAnswers,
}: ReflectionResponsesProps) {
  return (
    <AdminSection
      id="responses"
      number={number}
      title="Responses"
      intent="Every individual answer, grouped by question. Copy any response to lift a quote for recaps or marketing."
      width="wide"
    >
      {totalAnswers === 0 ? (
        <p className="font-serif text-sm italic text-muted-foreground">
          No reflections submitted yet. Answers will show up here as
          participants respond in Block +02.
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.questionId} className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <h4 className="font-serif text-lg text-foreground">
                  {group.questionText}
                </h4>
                <span
                  className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {group.answers.length}{" "}
                  {group.answers.length === 1 ? "answer" : "answers"}
                </span>
              </div>
              {group.answers.length === 0 ? (
                <p className="font-serif text-sm italic text-muted-foreground">
                  No answers yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {group.answers.map((a, i) => (
                    <AnswerRow key={i} answer={a} />
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminSection>
  );
}

function AnswerRow({ answer }: { answer: ReflectionAnswer }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(answer.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked - silently no-op.
    }
  }

  return (
    <li
      className="group flex items-start gap-3 rounded-md border p-3"
      style={{
        borderColor: "var(--border-color)",
        backgroundColor: "var(--bg-tertiary)",
      }}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="whitespace-pre-wrap text-sm text-foreground">
          {answer.answer}
        </p>
        <p
          className="font-mono text-[10px] uppercase tracking-[0.1em]"
          style={{ color: "var(--text-tertiary)" }}
        >
          {answer.participantName}
        </p>
      </div>
      <button
        type="button"
        onClick={copy}
        title="Copy answer"
        className="shrink-0 rounded-[4px] border p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        style={{ borderColor: "var(--border-color)" }}
      >
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
    </li>
  );
}
