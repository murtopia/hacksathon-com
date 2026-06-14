"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getAdminNavItems, getEventNavItems } from "@/components/event-nav/sections";
import { cn } from "@/lib/utils";

interface EventMobileNavProps {
  slug: string;
  isAdmin: boolean;
  eventName: string;
}

/**
 * Mobile-only nav for member-facing slug pages. The desktop secondary
 * nav bars are hidden below `md`; this hamburger opens a slide-out Sheet
 * so navigation never disappears on phones.
 *
 * Context-aware: inside `/[slug]/admin` it lists the admin sections
 * (00-06) plus a "Back to event" link, so the back office has a single
 * mobile menu instead of stacking the event hamburger and a separate
 * admin dropdown. Everywhere else it lists the event sections.
 */
export function EventMobileNav({ slug, isAdmin, eventName }: EventMobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const inAdmin = isAdmin && pathname.startsWith(`/${slug}/admin`);
  const items = inAdmin ? getAdminNavItems(slug) : getEventNavItems(slug, isAdmin);

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
          <SheetTitle className="font-serif">{eventName}</SheetTitle>
        </SheetHeader>
        <nav
          aria-label={inAdmin ? "Admin sections" : "Event sections"}
          className="flex flex-col px-2"
        >
          {items.map((item) => {
            const isActive = item.isActive(pathname);
            return (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2 py-2.5 text-base transition-colors hover:bg-muted hover:text-foreground",
                    isActive
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {item.number && (
                    <span
                      aria-hidden
                      className="font-mono text-sm tabular-nums text-foreground"
                    >
                      {item.number}
                    </span>
                  )}
                  <span>{item.label}</span>
                </Link>
              </SheetClose>
            );
          })}
        </nav>
        {inAdmin && (
          <div className="mt-3 border-t px-2 pt-3">
            <SheetClose asChild>
              <Link
                href={`/${slug}`}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-2.5 text-base text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
                <span>Back to event</span>
              </Link>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
