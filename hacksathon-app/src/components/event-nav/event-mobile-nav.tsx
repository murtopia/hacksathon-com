"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { getEventNavItems } from "@/components/event-nav/sections";
import { cn } from "@/lib/utils";

interface EventMobileNavProps {
  slug: string;
  isAdmin: boolean;
  eventName: string;
}

/**
 * Mobile-only nav for member-facing slug pages. The desktop
 * `ParticipantNav` bar is hidden below `md`; this hamburger opens a
 * slide-out Sheet with the same event sections (plus the admin link)
 * so navigation never disappears on phones. The Sheet header doubles as
 * the event-name label, which the top bar drops on mobile to save room.
 */
export function EventMobileNav({ slug, isAdmin, eventName }: EventMobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const base = `/${slug}`;
  const items = getEventNavItems(slug, isAdmin);

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
        <nav aria-label="Event sections" className="flex flex-col px-2">
          {items.map((item) => {
            const isActive = item.match(pathname, base);
            return (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "rounded-md px-2 py-2.5 text-base transition-colors hover:bg-muted hover:text-foreground",
                    isActive
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              </SheetClose>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
