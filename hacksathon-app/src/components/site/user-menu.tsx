"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/ui/user-avatar";
import { pickFirstName } from "@/lib/user/display-name";

interface UserMenuProps {
  fullName: string | null;
  email: string | null | undefined;
  avatarUrl: string | null;
  /**
   * When true, surfaces a "Murtopolis" link to the platform-owner
   * console. Only ever passed for users in the `platform_admins` table,
   * so non-admins never see the entry point.
   */
  isPlatformAdmin?: boolean;
}

/**
 * Top-bar user menu. The avatar + first name pair acts as the menu
 * trigger; the dropdown collects Settings + Sign out so the header
 * chrome can drop its inline nav.
 *
 * No Dashboard item by design - the wordmark in the top-left already
 * routes the user "home" for the current context (`/[slug]` on a
 * member-facing slug page, `/dashboard` on the platform shell).
 *
 * Click to open (Radix default) rather than hover - hover-to-open
 * isn't keyboard-friendly and trips on accidental cursor brushes.
 * The visible chevron next to the first name signals the affordance.
 *
 * The Sign out item posts to the existing `/api/auth/signout` form
 * endpoint. We render that as a `<form>` wrapped around a
 * `DropdownMenuItem asChild`, so the menu item *is* the submit
 * button (keyboard + click both submit naturally).
 */
export function UserMenu({
  fullName,
  email,
  avatarUrl,
  isPlatformAdmin = false,
}: UserMenuProps) {
  const posthog = usePostHog();
  const firstName = pickFirstName(fullName, email ?? null);
  const triggerLabel = firstName ?? "Account";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open account menu"
        className="group/user-menu inline-flex items-center gap-2 self-center rounded-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <UserAvatar
          name={fullName}
          email={email}
          avatarUrl={avatarUrl}
          size="xs"
        />
        <span className="hidden font-mono text-xs uppercase tracking-wide leading-none text-[var(--text-tertiary)] transition-colors group-hover/user-menu:text-foreground sm:inline">
          {triggerLabel}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-3 text-[var(--text-tertiary)] transition-transform group-hover/user-menu:text-foreground group-data-[state=open]/user-menu:rotate-180"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-40">
        {isPlatformAdmin && (
          <DropdownMenuItem asChild>
            <Link
              href="/murtopolis"
              className="font-mono text-xs uppercase tracking-wide"
            >
              Murtopolis
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link
            href="/settings"
            className="font-mono text-xs uppercase tracking-wide"
          >
            Settings
          </Link>
        </DropdownMenuItem>
        <form action="/api/auth/signout" method="post">
          <DropdownMenuItem asChild>
            <button
              type="submit"
              onClick={() => posthog?.reset()}
              className="w-full justify-start font-mono text-xs uppercase tracking-wide"
            >
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
