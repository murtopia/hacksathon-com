"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/the-program", label: "The Program" },
  { href: "/built-for", label: "Built For" },
  { href: "/pricing", label: "Pricing" },
  { href: "/resources", label: "Resources" },
];

interface MobileNavProps {
  isAuthed: boolean;
  /** Vanity slug of the user's primary event, when they have one. */
  eventSlug?: string | null;
  /** Whether the user admins their primary event. */
  isEventAdmin?: boolean;
}

/**
 * Mobile-only nav for the marketing/showcase header. The desktop header
 * hides its section links below `md`; this hamburger opens a slide-out
 * Sheet that surfaces those links plus the auth CTAs so navigation never
 * disappears on phones. Rendered with `md:hidden`; the desktop nav and
 * CTA buttons take over at `md` and up.
 *
 * Signed-in links mirror the desktop buttons: an admin gets `Admin` +
 * `Event`, a participant gets `Event`, and a no-event user keeps the
 * `Dashboard` stop-over.
 */
export function MobileNav({
  isAuthed,
  eventSlug = null,
  isEventAdmin = false,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);

  const authLinks = eventSlug
    ? [
        ...(isEventAdmin
          ? [{ href: `/${eventSlug}/admin`, label: "Admin" }]
          : []),
        { href: `/${eventSlug}`, label: "Event" },
      ]
    : [{ href: "/dashboard", label: "Dashboard" }];

  const links = isAuthed ? [...navLinks, ...authLinks] : navLinks;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 gap-0">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col px-2">
          {links.map((link) => (
            <SheetClose asChild key={link.href}>
              <Link
                href={link.href}
                className="rounded-md px-2 py-2.5 text-base text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
        {!isAuthed && (
          <div className="mt-3 flex flex-col gap-2 border-t px-4 pt-4">
            <SheetClose asChild>
              <Button variant="outline" size="lg" className="w-full" asChild>
                <Link href="/login">Log in</Link>
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button variant="pill" size="pill" className="w-full" asChild>
                <Link href="/checkout">Get Started</Link>
              </Button>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
