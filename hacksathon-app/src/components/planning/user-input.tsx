"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { isLastStep } from "@/lib/planning/steps";

interface UserInputProps {
  currentStep: number;
  onSend: (message: string) => void;
  onAdvance: () => void;
  disabled?: boolean;
  hasAnsweredCurrentStep: boolean;
}

export function UserInput({
  currentStep,
  onSend,
  onAdvance,
  disabled,
  hasAnsweredCurrentStep,
}: UserInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastStep = isLastStep(currentStep);

  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled, currentStep]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your response..."
          disabled={disabled}
          className="min-h-[80px] resize-y font-sans text-[15px]"
          style={{
            backgroundColor: "var(--white)",
            borderColor: "var(--border-default)",
            color: "var(--text-primary)",
          }}
        />
        <Button
          type="submit"
          disabled={!value.trim() || disabled}
          className="w-full"
        >
          Send
        </Button>
      </form>

      {hasAnsweredCurrentStep && (
        <button
          type="button"
          onClick={onAdvance}
          disabled={disabled}
          className="mono-label w-full text-center py-2 transition-colors hover:text-[var(--text-primary)] disabled:opacity-50"
        >
          {lastStep ? "Generate my Project Brief →" : `Ready for Step ${currentStep + 1} →`}
        </button>
      )}
    </div>
  );
}
