"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface UserInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

/**
 * Plain conversational input - textarea + Send. The Blueprint flow no
 * longer has a per-step advance gate; the persistent "Generate my Blueprint"
 * CTA lives in PlanningFlow alongside this input.
 */
export function UserInput({ onSend, disabled }: UserInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled]);

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
        variant="pill"
        size="pill"
        disabled={!value.trim() || disabled}
        className="w-full"
      >
        Send
      </Button>
    </form>
  );
}
