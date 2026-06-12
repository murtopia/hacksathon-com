import Link from "next/link";
import { render } from "@react-email/render";
import { Panel } from "@/components/murtopolis/panel";
import {
  emailPreviews,
  getEmailPreview,
  type EmailGroup,
} from "@/emails/registry";
import { cn } from "@/lib/utils";

export const metadata = { title: "Murtopolis - Emails" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ template?: string; w?: string }>;

const WIDTHS = {
  desktop: 600,
  mobile: 375,
} as const;

type WidthKey = keyof typeof WIDTHS;

const GROUP_ORDER: EmailGroup[] = ["Customer-facing", "Internal"];

function buildHref(template: string, w: WidthKey): string {
  const params = new URLSearchParams({ template });
  if (w !== "desktop") params.set("w", w);
  const qs = params.toString();
  return qs ? `?${qs}` : "?";
}

export default async function MurtopolisEmailsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const active = getEmailPreview(sp.template) ?? emailPreviews[0];
  const width: WidthKey = sp.w === "mobile" ? "mobile" : "desktop";

  const html = await render(active.element);

  return (
    <Panel
      title="Email templates"
      description="Every transactional email we send via Resend, rendered with sample data. Click a template to preview its design."
    >
      <div className="grid gap-8 md:grid-cols-[220px_minmax(0,1fr)]">
        {/* Template list */}
        <nav aria-label="Email templates" className="space-y-6">
          {GROUP_ORDER.map((group) => {
            const entries = emailPreviews.filter((e) => e.group === group);
            if (entries.length === 0) return null;
            return (
              <div key={group} className="space-y-2">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                  {group}
                </p>
                <ul className="space-y-1">
                  {entries.map((entry) => {
                    const isActive = entry.slug === active.slug;
                    return (
                      <li key={entry.slug}>
                        <Link
                          href={buildHref(entry.slug, width)}
                          className={cn(
                            "block rounded-[4px] px-2 py-1.5 text-sm transition-colors duration-150",
                            isActive
                              ? "bg-[var(--gray-50)] font-medium text-foreground"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                          aria-current={isActive ? "true" : undefined}
                        >
                          {entry.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Preview pane */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                Subject
              </p>
              <p className="font-serif text-lg text-foreground">
                {active.subject}
              </p>
            </div>

            {/* Width toggle */}
            <div className="inline-flex overflow-hidden rounded-[4px] border text-xs">
              {(Object.keys(WIDTHS) as WidthKey[]).map((key) => {
                const isActive = key === width;
                return (
                  <Link
                    key={key}
                    href={buildHref(active.slug, key)}
                    className={cn(
                      "px-3 py-1.5 font-mono uppercase tracking-wide transition-colors duration-150",
                      isActive
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-current={isActive ? "true" : undefined}
                  >
                    {key}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center rounded-[4px] border bg-[var(--gray-50)] p-4">
            <iframe
              title={`${active.label} preview`}
              srcDoc={html}
              className="h-[760px] w-full rounded-[2px] border bg-white"
              style={{ maxWidth: WIDTHS[width] }}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}
