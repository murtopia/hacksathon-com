"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ToolbarFilter {
  /** URL search-param name this filter writes to. */
  param: string;
  label: string;
  options: { value: string; label: string }[];
  /** Current value (from the server-parsed searchParams). */
  value: string;
}

interface MurtopolisToolbarProps {
  /** Param name for the free-text search box. Omit to hide search. */
  searchParam?: string;
  searchValue?: string;
  searchPlaceholder?: string;
  filters?: ToolbarFilter[];
}

/**
 * Shared client toolbar for the Murtopolis data tables. Search + filter
 * state lives entirely in the URL so the server pages stay the source of
 * truth (and the views are linkable / refresh-safe). Search is debounced;
 * selects commit immediately. A pending transition keeps the UI
 * responsive while the server re-renders the table.
 */
export function MurtopolisToolbar({
  searchParam,
  searchValue = "",
  searchPlaceholder = "Search…",
  filters = [],
}: MurtopolisToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(searchValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep local input in sync if the URL changes from elsewhere
  // (e.g. back/forward navigation).
  useEffect(() => {
    setSearch(searchValue);
  }, [searchValue]);

  function commit(next: URLSearchParams) {
    const query = next.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  }

  function setParam(param: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      next.set(param, value);
    } else {
      next.delete(param);
    }
    commit(next);
  }

  function onSearchChange(value: string) {
    setSearch(value);
    if (!searchParam) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setParam(searchParam, value.trim());
    }, 250);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {searchParam && (
        <div className="relative w-full max-w-xs">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[var(--text-tertiary)]"
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="pl-8"
          />
        </div>
      )}
      {filters.map((filter) => (
        <div key={filter.param} className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
            {filter.label}
          </span>
          <Select
            value={filter.value || "all"}
            onValueChange={(value) => setParam(filter.param, value)}
          >
            <SelectTrigger size="sm" className="min-w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filter.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
