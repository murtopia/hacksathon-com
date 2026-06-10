/**
 * Live character counter rendered under text inputs. Used by both the
 * IdeaLab submit form and the owner-edit form on the detail page.
 *
 * The actual limit is enforced by `maxLength` on the underlying input,
 * so the user can't exceed `max`. The counter is purely surfaced UX -
 * it switches to destructive coloring once you're right at the cap so
 * the limit is visible without ever being violated.
 */
interface CharCounterProps {
  value: string;
  max: number;
}

export function CharCounter({ value, max }: CharCounterProps) {
  const len = value.length;
  const atCap = len >= max;
  return (
    <p
      className={`mt-1 text-right text-[length:var(--form-hint-size)] ${
        atCap ? "text-destructive" : "form-hint"
      }`}
      aria-live="polite"
    >
      {len}/{max} characters
    </p>
  );
}
