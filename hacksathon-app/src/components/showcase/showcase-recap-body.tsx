"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Progressive-disclosure body for the recap. The first paragraph leads;
 * the remaining paragraphs stay collapsed behind a "Read more" toggle so
 * the case-study hero opens with a digestible amount of text.
 */
export function ShowcaseRecapBody({ paragraphs }: { paragraphs: string[] }) {
  const [expanded, setExpanded] = useState(false);

  if (paragraphs.length === 0) return null;

  const [lead, ...rest] = paragraphs;

  return (
    <div className="space-y-5">
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="font-serif text-[17px] leading-relaxed text-[var(--text-secondary)]">
              {children}
            </p>
          ),
        }}
      >
        {lead}
      </ReactMarkdown>

      {rest.length > 0 && (
        <>
          {expanded &&
            rest.map((para, i) => (
              <ReactMarkdown
                key={i}
                components={{
                  p: ({ children }) => (
                    <p className="font-serif text-[17px] leading-relaxed text-[var(--text-secondary)]">
                      {children}
                    </p>
                  ),
                }}
              >
                {para}
              </ReactMarkdown>
            ))}

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="group inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-foreground transition-colors hover:text-foreground/70"
          >
            {expanded ? "Show less" : "Read more"}
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform",
                expanded && "rotate-180",
              )}
              aria-hidden
            />
          </button>
        </>
      )}
    </div>
  );
}
