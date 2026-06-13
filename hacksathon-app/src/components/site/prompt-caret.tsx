/**
 * The Hacksathon.com brand mark: a serif "Prompt caret" (a solid
 * right-pointing chevron, `>`). Rendered as a bare inline glyph with
 * `fill="currentColor"` so it inherits the surrounding text color and
 * adapts to light/dark automatically. The same geometry is used for
 * the favicon and app icons; this is the no-background lockup form for
 * pairing with the wordmark in the header and footer.
 */
export function PromptCaret({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-hidden
      focusable={false}
      className={className}
    >
      <g transform="rotate(90 50 50)">
        <path
          d="M50 25 L73 64 Q75 67 77 70 L64 70 Q63 67 61 65 L50 46 L39 65 Q37 67 36 70 L23 70 Q25 67 27 64 Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}
