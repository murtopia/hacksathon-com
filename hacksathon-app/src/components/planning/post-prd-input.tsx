"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface PostPrdInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

/**
 * The post-Blueprint refinement textarea. Visually it lives directly
 * below the live continuation thread (the section labeled "Refining
 * your Blueprint") so the AI's reply lands above the input rather than
 * far up the page. The framing copy and "Update my Blueprint" link
 * used to live here too - both moved out: the framing is now the
 * section header in PlanningFlow, and the Update action is the smart
 * UpdateCTA component just below this input.
 */
export function PostPrdInput({ onSend, disabled }: PostPrdInputProps) {
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
        placeholder="Keep talking - describe a change, ask a question, or refine."
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
