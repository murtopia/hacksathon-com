import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type UserAvatarSize = "xs" | "sm" | "md" | "lg";

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: UserAvatarSize;
  className?: string;
}

const SIZE_CLASSES: Record<UserAvatarSize, string> = {
  xs: "size-6",
  sm: "size-8",
  md: "size-10",
  lg: "size-14",
};

const FALLBACK_TEXT_CLASSES: Record<UserAvatarSize, string> = {
  xs: "text-[10px]",
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
};

/**
 * App-wide avatar primitive. Renders the user's uploaded image when
 * present, else a typographic monogram (first initial of name → email
 * local-part → "?") on the muted swatch.
 *
 * The fallback uses EB Garamond so it reads as a continuation of the
 * design system's serif treatment for hero typography (matches the
 * monogram fallback used on gallery hero images and showcase logo
 * placeholders).
 */
export function UserAvatar({
  name,
  email,
  avatarUrl,
  size = "sm",
  className,
}: UserAvatarProps) {
  const monogram = pickInitial(name, email);
  const alt = name?.trim() || email || "Profile";

  return (
    <Avatar className={cn(SIZE_CLASSES[size], className)}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={alt} /> : null}
      <AvatarFallback
        className={cn("font-serif text-foreground", FALLBACK_TEXT_CLASSES[size])}
      >
        {monogram}
      </AvatarFallback>
    </Avatar>
  );
}

function pickInitial(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  const trimmedName = name?.trim();
  if (trimmedName) {
    const first = trimmedName[0];
    if (first) return first.toUpperCase();
  }
  const local = email?.split("@")[0]?.trim();
  if (local && local.length > 0) return local[0]!.toUpperCase();
  return "?";
}
