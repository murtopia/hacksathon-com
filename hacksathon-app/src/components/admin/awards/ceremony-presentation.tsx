"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type {
  CeremonyCategory,
  CeremonyPerson,
} from "@/lib/awards/ceremony-data";
import { orderForCeremony } from "@/lib/awards/ceremony-data";

interface CeremonyPresentationProps {
  eventId: string;
  slug: string;
  categories: CeremonyCategory[];
  meta: { eventTitle: string; orgName: string | null; year: number };
  alreadyPublished: boolean;
  /**
   * Preview/dry-run mode. Fills placeholder winners for categories
   * without a real winner so the organizer can rehearse the flow before
   * voting closes, and swaps the finale "Publish results" CTA for a
   * no-op "Exit preview". Nothing is published or persisted.
   */
  preview?: boolean;
}

const SAMPLE_RUNNER_UPS: CeremonyPerson[] = [
  { ideaId: "sample-ru-1", title: "Runner-up Project", ownerName: "Sample Builder", projectUrl: null },
];

/**
 * Fill placeholder winner/runner-ups for any category missing a real
 * winner so a preview shows the full slide flow. Real winners (if any
 * exist) are left untouched.
 */
function withPreviewPlaceholders(
  categories: CeremonyCategory[],
): CeremonyCategory[] {
  return categories.map((c, i) => {
    if (c.winner) return c;
    return {
      ...c,
      winner: {
        ideaId: `sample-winner-${i}`,
        title: "Sample Winning Project",
        ownerName: "Sample Builder",
        projectUrl: null,
      },
      voteCount: 0,
      runnerUps: SAMPLE_RUNNER_UPS,
    } satisfies CeremonyCategory;
  });
}

type Slide =
  | { kind: "title" }
  | { kind: "intro"; cat: CeremonyCategory; index: number; total: number }
  | { kind: "runnerup"; cat: CeremonyCategory; index: number; total: number }
  | {
      kind: "winner";
      cat: CeremonyCategory;
      index: number;
      total: number;
      isLast: boolean;
    }
  | { kind: "finale" };

const DIAMOND = "\u25C6";

/**
 * Full-screen Hacky Awards ceremony presenter.
 *
 * Ported in spirit from the v4 standalone tool but rendered in the
 * project's grayscale design system (no gold). Title → per-category
 * intro / runner-up / winner (with confetti) → finale grid. Best in
 * Show is forced last. Click / space / → advance; ← goes back.
 *
 * Renders as a fixed full-screen overlay so it covers the admin chrome.
 * The browser Full-Screen API is requested from the explicit "Launch"
 * button (a user gesture), satisfying browser policy.
 */
export function CeremonyPresentation({
  eventId,
  slug,
  categories,
  meta,
  alreadyPublished,
  preview = false,
}: CeremonyPresentationProps) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [pos, setPos] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(alreadyPublished);

  // Only categories with an actual winner appear in the ceremony. In
  // preview we fill placeholder winners first so every category shows.
  const ceremonyCategories = useMemo(() => {
    const ordered = orderForCeremony(categories);
    const withWinners = preview ? withPreviewPlaceholders(ordered) : ordered;
    return withWinners.filter((c) => c.winner !== null);
  }, [categories, preview]);

  const slides = useMemo<Slide[]>(() => {
    const list: Slide[] = [{ kind: "title" }];
    const total = ceremonyCategories.length;
    ceremonyCategories.forEach((cat, i) => {
      list.push({ kind: "intro", cat, index: i, total });
      list.push({ kind: "runnerup", cat, index: i, total });
      list.push({
        kind: "winner",
        cat,
        index: i,
        total,
        isLast: i === total - 1,
      });
    });
    list.push({ kind: "finale" });
    return list;
  }, [ceremonyCategories]);

  const fireConfetti = useCallback((bursts = 1) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    runConfetti(canvas, bursts);
  }, []);

  const advance = useCallback(() => {
    setPos((p) => Math.min(p + 1, slides.length - 1));
  }, [slides.length]);

  const back = useCallback(() => {
    setPos((p) => Math.max(p - 1, 0));
  }, []);

  // Fire confetti when landing on a winner slide or the finale.
  useEffect(() => {
    if (!started) return;
    const slide = slides[pos];
    if (!slide) return;
    if (slide.kind === "winner") {
      fireConfetti(1);
    } else if (slide.kind === "finale") {
      fireConfetti(1);
      const t = setTimeout(() => fireConfetti(1), 1800);
      return () => clearTimeout(t);
    }
  }, [pos, started, slides, fireConfetti]);

  // Keyboard navigation.
  useEffect(() => {
    if (!started) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        advance();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, advance, back]);

  async function launch() {
    try {
      await rootRef.current?.requestFullscreen?.();
    } catch {
      // Fullscreen can be denied - the overlay still covers the screen.
    }
    setStarted(true);
    setPos(0);
  }

  async function exit() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // ignore
    }
    router.push(`/${slug}/admin/awards`);
  }

  async function publish() {
    setPublishing(true);
    const res = await fetch(`/api/events/${eventId}/admin/voting/publish`, {
      method: "POST",
    });
    setPublishing(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error ?? "Couldn't publish results.");
      return;
    }
    setPublished(true);
    toast.success("Results published.");
  }

  const slide = slides[pos];
  const showChrome =
    started && slide && slide.kind !== "title" && slide.kind !== "finale";

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[200] overflow-hidden"
      style={{ backgroundColor: "var(--bg-secondary, #f4f4f5)" }}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      {!started ? (
        <StartScreen
          meta={meta}
          count={ceremonyCategories.length}
          onLaunch={launch}
          onExit={exit}
          preview={preview}
        />
      ) : (
        slide?.kind === "finale" ? (
          <div className="absolute inset-0 flex items-center justify-center px-8 py-16 text-center">
            <FinaleView
              categories={ceremonyCategories}
              meta={meta}
              slug={slug}
              preview={preview}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={advance}
            className="absolute inset-0 flex h-full w-full cursor-pointer items-center justify-center px-8 py-16 text-center"
            aria-label="Advance"
          >
            <SlideView slide={slide} meta={meta} />
          </button>
        )
      )}

      {started && slide?.kind === "finale" && (
        <div className="absolute inset-x-0 bottom-10 z-[210] flex flex-col items-center gap-3">
          {preview ? (
            <p
              className="font-mono text-[11px] uppercase tracking-[0.15em]"
              style={{ color: "var(--text-tertiary, #88877e)" }}
            >
              Preview - nothing published
            </p>
          ) : !published ? (
            <button
              type="button"
              onClick={publish}
              disabled={publishing}
              className="rounded-md px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "var(--black, #111110)" }}
            >
              {publishing ? "Publishing…" : "Publish results"}
            </button>
          ) : (
            <p
              className="font-mono text-[11px] uppercase tracking-[0.15em]"
              style={{ color: "var(--text-tertiary, #88877e)" }}
            >
              Results published
            </p>
          )}
          <button
            type="button"
            onClick={exit}
            className="font-mono text-[11px] uppercase tracking-[0.15em] underline-offset-4 hover:underline"
            style={{ color: "var(--text-tertiary, #88877e)" }}
          >
            {preview ? "Exit preview" : "Exit ceremony"}
          </button>
        </div>
      )}

      {showChrome && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              back();
            }}
            className="absolute bottom-8 left-8 z-[210] font-mono text-[11px] uppercase tracking-[0.15em] opacity-70 hover:opacity-100"
            style={{ color: "var(--text-secondary, #555)" }}
          >
            ← Back
          </button>
          <div className="absolute inset-x-0 bottom-9 z-[205] flex items-center justify-center gap-2">
            {ceremonyCategories.map((c, i) => {
              const current = "index" in slide ? slide.index : -1;
              const active = i === current;
              const past = i < current;
              return (
                <span
                  key={c.categoryId}
                  className="rounded-full transition-all"
                  style={{
                    width: active ? 10 : 7,
                    height: active ? 10 : 7,
                    backgroundColor: active
                      ? "var(--black, #111110)"
                      : past
                        ? "var(--gray-400, #b5b4ad)"
                        : "var(--gray-300, #d8d6cf)",
                  }}
                />
              );
            })}
          </div>
          <span
            className="absolute bottom-8 right-8 z-[210] animate-pulse font-mono text-[11px] uppercase tracking-[0.15em] opacity-70"
            style={{ color: "var(--text-secondary, #555)" }}
          >
            Click to advance →
          </span>
        </>
      )}
    </div>
  );
}

function StartScreen({
  meta,
  count,
  onLaunch,
  onExit,
  preview,
}: {
  meta: CeremonyPresentationProps["meta"];
  count: number;
  onLaunch: () => void;
  onExit: () => void;
  preview: boolean;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8 text-center">
      {preview && (
        <span
          className="rounded-[4px] border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{
            borderColor: "var(--text-tertiary, #88877e)",
            color: "var(--text-tertiary, #88877e)",
          }}
        >
          Preview
        </span>
      )}
      <p
        className="font-mono text-[11px] uppercase tracking-[0.25em]"
        style={{ color: "var(--text-tertiary, #88877e)" }}
      >
        {meta.orgName ? `${meta.orgName} Hacks-a-Thon` : "Hacks-a-Thon"} ·{" "}
        {meta.year}
      </p>
      <Diamond />
      <h1 className="font-serif text-5xl tracking-tight sm:text-6xl">
        The Hacky Awards
      </h1>
      <p
        className="max-w-md font-serif text-lg italic"
        style={{ color: "var(--text-secondary, #555)" }}
      >
        {preview
          ? `Rehearsal run with ${count} sample ${count === 1 ? "award" : "awards"}. Nothing is published.`
          : count > 0
            ? `Share your screen, then launch. ${count} ${count === 1 ? "award" : "awards"} to reveal.`
            : "No categories have a winner to reveal yet."}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={onLaunch}
          disabled={count === 0}
          className="rounded-md px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--black, #111110)" }}
        >
          Launch ceremony
        </button>
        <button
          type="button"
          onClick={onExit}
          className="font-mono text-[11px] uppercase tracking-[0.15em] underline-offset-4 hover:underline"
          style={{ color: "var(--text-tertiary, #88877e)" }}
        >
          Back to admin
        </button>
      </div>
    </div>
  );
}

function SlideView({
  slide,
  meta,
}: {
  slide: Slide;
  meta: CeremonyPresentationProps["meta"];
}) {
  if (slide.kind === "title") {
    return (
      <div className="flex flex-col items-center gap-6">
        <p
          className="font-mono text-[11px] uppercase tracking-[0.25em]"
          style={{ color: "var(--text-tertiary, #88877e)" }}
        >
          {meta.orgName ? `${meta.orgName} Hacks-a-Thon` : "Hacks-a-Thon"} ·{" "}
          {meta.year}
        </p>
        <Diamond />
        <h1 className="font-serif text-6xl tracking-tight sm:text-7xl">
          The Hacky Awards
        </h1>
        <p
          className="font-serif text-xl italic"
          style={{ color: "var(--text-secondary, #555)" }}
        >
          Celebrating the builders
        </p>
      </div>
    );
  }

  if (slide.kind === "intro") {
    const { cat, index, total } = slide;
    const ruCount = cat.runnerUps.length;
    return (
      <div className="flex flex-col items-center gap-5">
        <p
          className="font-mono text-[11px] uppercase tracking-[0.25em]"
          style={{ color: "var(--text-tertiary, #88877e)" }}
        >
          Award {pad(index + 1)} of {pad(total)}
        </p>
        <Diamond />
        <h2 className="font-serif text-5xl tracking-tight sm:text-6xl">
          {cat.name}
        </h2>
        {cat.description && (
          <p
            className="max-w-xl font-serif text-xl italic"
            style={{ color: "var(--text-secondary, #555)" }}
          >
            {cat.description}
          </p>
        )}
        <p
          className="mt-4 animate-pulse font-mono text-[11px] uppercase tracking-[0.2em]"
          style={{ color: "var(--text-tertiary, #88877e)" }}
        >
          Click to reveal the {ruCount > 1 ? "runner-ups" : "runner-up"}
        </p>
      </div>
    );
  }

  if (slide.kind === "runnerup") {
    const { cat } = slide;
    const ru = cat.runnerUps;
    const label =
      ru.length === 0
        ? "Runner-up"
        : ru.length === 1
          ? "Runner-up"
          : `Runner-ups (${ru.length}-way tie)`;
    return (
      <div className="flex flex-col items-center gap-5">
        <Crumb name={cat.name} />
        <p
          className="font-mono text-[11px] uppercase tracking-[0.25em]"
          style={{ color: "var(--text-tertiary, #88877e)" }}
        >
          {label}
        </p>
        <div
          className="h-px w-24"
          style={{ backgroundColor: "var(--gray-400, #d8d6cf)" }}
        />
        {ru.length === 0 ? (
          <p
            className="font-serif text-3xl italic"
            style={{ color: "var(--text-tertiary, #88877e)" }}
          >
            No runner-up
          </p>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {ru.map((r) => (
              <p key={r.ideaId} className="font-serif text-4xl sm:text-5xl">
                {r.title ?? r.ownerName ?? "-"}
                {r.title && r.ownerName && (
                  <span
                    className="text-2xl"
                    style={{ color: "var(--text-tertiary, #88877e)" }}
                  >
                    {" "}
                    · {r.ownerName}
                  </span>
                )}
              </p>
            ))}
          </div>
        )}
        <p
          className="mt-4 animate-pulse font-mono text-[11px] uppercase tracking-[0.2em]"
          style={{ color: "var(--text-tertiary, #88877e)" }}
        >
          Click to reveal the winner
        </p>
      </div>
    );
  }

  if (slide.kind === "winner") {
    const { cat, isLast } = slide;
    const w = cat.winner;
    return (
      <div className="flex flex-col items-center gap-5">
        <Crumb name={cat.name} />
        <p
          className="font-serif text-2xl italic"
          style={{ color: "var(--text-secondary, #555)" }}
        >
          And the winner is…
        </p>
        <Diamond />
        <h2 className="font-serif text-6xl tracking-tight sm:text-8xl">
          {w?.title ?? w?.ownerName ?? "Winner"}
        </h2>
        {w?.ownerName && w?.title && (
          <p
            className="font-serif text-2xl italic"
            style={{ color: "var(--text-secondary, #555)" }}
          >
            {w.ownerName}
          </p>
        )}
        <p
          className="mt-4 animate-pulse font-mono text-[11px] uppercase tracking-[0.2em]"
          style={{ color: "var(--text-tertiary, #88877e)" }}
        >
          {isLast ? "Click to see the full recap" : "Click for the next award"}
        </p>
      </div>
    );
  }

  return null;
}

function FinaleView({
  categories,
  meta,
  slug,
  preview,
}: {
  categories: CeremonyCategory[];
  meta: CeremonyPresentationProps["meta"];
  slug: string;
  preview: boolean;
}) {
  const cols =
    categories.length <= 4 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className="flex max-h-full w-full max-w-5xl flex-col items-center gap-7 overflow-y-auto">
      <div className="flex flex-col items-center gap-3">
        <p
          className="font-mono text-[11px] uppercase tracking-[0.25em]"
          style={{ color: "var(--text-tertiary, #88877e)" }}
        >
          {meta.orgName ? `${meta.orgName} Hacks-a-Thon` : "Hacks-a-Thon"} ·{" "}
          {meta.year}
        </p>
        <h2 className="font-serif text-4xl tracking-tight sm:text-5xl">
          Congratulations to all our Hacky Award winners
        </h2>
      </div>
      <div className={`grid w-full grid-cols-1 gap-4 ${cols}`}>
        {categories.map((cat) => (
          <div
            key={cat.categoryId}
            className="rounded-md border p-4 text-left"
            style={{
              borderColor: "var(--gray-300, #d8d6cf)",
              backgroundColor: "var(--bg-primary, #fff)",
            }}
          >
            <p
              className="font-mono text-[10px] uppercase tracking-[0.15em]"
              style={{ color: "var(--text-tertiary, #88877e)" }}
            >
              {cat.name}
            </p>
            <p className="mt-1 font-serif text-xl">
              {cat.winner?.title ?? cat.winner?.ownerName ?? "-"}
            </p>
            {cat.winner?.ownerName && cat.winner?.title && (
              <p
                className="font-serif text-sm italic"
                style={{ color: "var(--text-secondary, #555)" }}
              >
                {cat.winner.ownerName}
              </p>
            )}
            {preview ? (
              <a
                href={`/${slug}/awards/card/preview?preview=1&label=${encodeURIComponent(cat.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] underline-offset-4 hover:underline"
                style={{ color: "var(--text-tertiary, #88877e)" }}
              >
                <Download className="size-3" />
                Preview card
              </a>
            ) : (
              cat.awardId && (
                <a
                  href={`/${slug}/awards/card/${cat.awardId}`}
                  download={`hacky-award-${cat.categoryId}.png`}
                  className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] underline-offset-4 hover:underline"
                  style={{ color: "var(--text-tertiary, #88877e)" }}
                >
                  <Download className="size-3" />
                  Download card
                </a>
              )
            )}
          </div>
        ))}
      </div>
      {/* Spacer so the bottom publish controls don't overlap the grid. */}
      <div className="h-20 shrink-0" />
    </div>
  );
}

function Crumb({ name }: { name: string }) {
  return (
    <p
      className="font-mono text-[11px] uppercase tracking-[0.25em]"
      style={{ color: "var(--text-tertiary, #88877e)" }}
    >
      {DIAMOND} {name} {DIAMOND}
    </p>
  );
}

function Diamond() {
  return (
    <span
      aria-hidden
      className="ceremony-float text-3xl"
      style={{ color: "var(--text-secondary, #555)" }}
    >
      {DIAMOND}
    </span>
  );
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Lightweight grayscale confetti burst. 180 particles, project palette
 * (ink → grays), gravity + drift, fades out over ~2.4s.
 */
function runConfetti(canvas: HTMLCanvasElement, bursts: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const W = window.innerWidth;
  const H = window.innerHeight;

  const grays = ["#111110", "#3f3f46", "#71717a", "#a1a1aa", "#d4d4d8"];
  type P = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rot: number;
    vr: number;
    size: number;
    color: string;
    life: number;
  };
  const particles: P[] = [];
  const count = 180 * bursts;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: W / 2 + (Math.random() - 0.5) * W * 0.4,
      y: H * 0.42 + (Math.random() - 0.5) * 60,
      vx: (Math.random() - 0.5) * 9,
      vy: Math.random() * -11 - 3,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 7 + 4,
      color: grays[Math.floor(Math.random() * grays.length)],
      life: 1,
    });
  }

  let raf = 0;
  const start = performance.now();
  function frame(now: number) {
    const elapsed = now - start;
    ctx!.clearRect(0, 0, W, H);
    let alive = false;
    for (const p of particles) {
      p.vy += 0.28;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life = Math.max(0, 1 - elapsed / 2400);
      if (p.life > 0 && p.y < H + 40) alive = true;
      ctx!.save();
      ctx!.globalAlpha = p.life;
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rot);
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
      ctx!.restore();
    }
    if (alive) {
      raf = requestAnimationFrame(frame);
    } else {
      ctx!.clearRect(0, 0, W, H);
      cancelAnimationFrame(raf);
    }
  }
  raf = requestAnimationFrame(frame);
}
