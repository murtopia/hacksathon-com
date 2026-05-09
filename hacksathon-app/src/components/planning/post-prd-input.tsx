"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface PostPrdInputProps {
  onSend: (message: string) => void;
  onUpdatePrd: () => void;
  disabled?: boolean;
  updating?: boolean;
  showUpdateButton: boolean;
}

export function PostPrdInput({
  onSend,
  onUpdatePrd,
  disabled,
  updating,
  showUpdateButton,
}: PostPrdInputProps) {
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
    <div className="space-y-3">
      <p
        className="font-serif text-sm italic"
        style={{ color: "var(--text-secondary)" }}
      >
        Have a change to your Blueprint? Describe it here — the current
        Blueprint stays loaded as context.
      </p>

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What's changed?"
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

      {showUpdateButton && (
        <button
          type="button"
          onClick={onUpdatePrd}
          disabled={disabled || updating}
          className="mono-label w-full text-center py-2 transition-colors hover:text-[var(--text-primary)] disabled:opacity-50"
        >
          {updating ? "Updating your Blueprint…" : "Update my Blueprint →"}
        </button>
      )}
    </div>
  );
}
