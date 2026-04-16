"use client";

interface AIMessageProps {
  content: string;
  isStreaming?: boolean;
}

export function AIMessage({ content, isStreaming }: AIMessageProps) {
  return (
    <div
      className="rounded-sm p-5 border-l-2"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderLeftColor: "var(--border-strong)",
      }}
    >
      <div
        className="font-serif text-[20px] leading-relaxed whitespace-pre-wrap"
        style={{ color: "var(--text-primary)" }}
      >
        {content}
        {isStreaming && (
          <span
            className="inline-block w-[6px] h-[20px] ml-0.5 align-text-bottom animate-pulse"
            style={{ backgroundColor: "var(--text-tertiary)" }}
          />
        )}
      </div>
    </div>
  );
}
