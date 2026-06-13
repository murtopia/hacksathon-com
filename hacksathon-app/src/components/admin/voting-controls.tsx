"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Lock, Megaphone, Play, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminSection } from "@/components/admin/admin-section";
import { NotifyTeamButton } from "@/components/admin/notify-team-button";

const TITLE = "Hacky Awards";

interface VotingControlsProps {
  eventId: string;
  slug: string;
  votingStatus: "closed" | "open" | "revealed";
  resultsPublished: boolean;
  voteCount: number;
  ideaCount: number;
  number?: string;
}

/**
 * Admin voting controls - the action-oriented state machine.
 *
 *   closed    → "Open voting".
 *   open      → "Reveal the winners" - close voting & tally privately
 *               (locks the event; nothing public yet).
 *   revealed  → "Run the ceremony" - launch the full-screen presenter,
 *               then "Publish results" to reveal to everyone.
 *   published → "Winners published" - done.
 *
 * `resultsPublished` distinguishes revealed-but-private from
 * revealed-and-public (there's no separate voting_status for it; it's
 * keyed on events.results_published_at).
 */
export function VotingControls({
  eventId,
  slug,
  votingStatus,
  resultsPublished,
  voteCount,
  ideaCount,
  number = "01",
}: VotingControlsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState(votingStatus);
  const [optimisticPublished, setOptimisticPublished] =
    useState(resultsPublished);

  function openVoting() {
    if (ideaCount === 0) {
      if (
        !window.confirm("There are no ideas submitted yet. Open voting anyway?")
      ) {
        return;
      }
    }
    startTransition(async () => {
      const prior = optimisticStatus;
      setOptimisticStatus("open");
      const res = await fetch(`/api/events/${eventId}/admin/voting/open`, {
        method: "POST",
      });
      if (!res.ok) {
        setOptimisticStatus(prior);
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Couldn't open voting.");
        return;
      }
      toast.success("Voting is open. Participants can vote now.");
      router.refresh();
    });
  }

  function closeVoting() {
    startTransition(async () => {
      const prior = optimisticStatus;
      setOptimisticStatus("closed");
      const res = await fetch(`/api/events/${eventId}/admin/voting/close`, {
        method: "POST",
      });
      if (!res.ok) {
        setOptimisticStatus(prior);
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Couldn't pause voting.");
        return;
      }
      toast.success("Voting paused. Participants can't vote until you reopen.");
      router.refresh();
    });
  }

  function closeAndReview() {
    if (
      !window.confirm(
        "Close voting and tally the winners? This locks the event - ideas, briefs, and sessions become read-only. Winners stay private until you publish after the ceremony.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const prior = optimisticStatus;
      setOptimisticStatus("revealed");
      const res = await fetch(`/api/events/${eventId}/admin/voting/reveal`, {
        method: "POST",
      });
      if (!res.ok) {
        setOptimisticStatus(prior);
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Couldn't close voting.");
        return;
      }
      toast.success("Voting closed. Review the winners below, then run the ceremony.");
      router.refresh();
    });
  }

  function publish() {
    if (
      !window.confirm(
        "Publish results? Winners become visible to all participants and the public showcase. Run the ceremony first if you haven't.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const prior = optimisticPublished;
      setOptimisticPublished(true);
      const res = await fetch(`/api/events/${eventId}/admin/voting/publish`, {
        method: "POST",
      });
      if (!res.ok) {
        setOptimisticPublished(prior);
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Couldn't publish results.");
        return;
      }
      toast.success("Results published. Participants can see the winners now.");
      router.refresh();
    });
  }

  if (optimisticStatus === "closed" || optimisticStatus === "open") {
    const isOpen = optimisticStatus === "open";
    return (
      <AdminSection
        id="voting"
        number={number}
        title={TITLE}
        intent="Toggle voting Closed or Open. When you're ready to wrap, close voting and review to tally the winners privately."
        footer={
          isOpen ? (
            <Button variant="pill" size="pill" onClick={closeAndReview} disabled={pending}>
              <Lock />
              {pending ? "Closing…" : "Close voting & review"}
            </Button>
          ) : undefined
        }
      >
        <VotingToggle
          isOpen={isOpen}
          pending={pending}
          onOpen={openVoting}
          onClose={closeVoting}
          eventId={eventId}
        />
        <StatusNote>
          {isOpen
            ? `${voteCount} ${voteCount === 1 ? "vote" : "votes"} cast so far. "Close voting & review" locks ideas, briefs, and sessions and tallies the winners privately - you run the ceremony first, then publish.`
            : ideaCount > 0
              ? `Voting is closed. ${ideaCount} ${ideaCount === 1 ? "idea" : "ideas"} ready to vote on - open voting when the showcase wraps.`
              : "Voting is closed. No ideas have been submitted yet."}
        </StatusNote>
      </AdminSection>
    );
  }

  // revealed
  if (!optimisticPublished) {
    return (
      <AdminSection
        id="voting"
        number={number}
        title={TITLE}
        intent="Winners are tallied and private. Review them below, present the full-screen ceremony on your shared screen, then publish."
        footer={
          <>
            <Button asChild variant="pill" size="pill">
              <Link href={`/${slug}/admin/awards/ceremony`}>
                <Play />
                Launch ceremony
              </Link>
            </Button>
            <Button variant="outline" onClick={publish} disabled={pending}>
              <Send className="mr-2 size-4" />
              {pending ? "Publishing…" : "Publish results"}
            </Button>
          </>
        }
      >
        <StatusNote>
          Launch the ceremony to reveal winners live on your screen-share.
          When it&apos;s over, publish so participants see the results on
          their own devices.
        </StatusNote>
      </AdminSection>
    );
  }

  return (
    <AdminSection
      id="voting"
      number={number}
      title={TITLE}
      intent="Winners published - results are live for participants and the public showcase. You can replay the ceremony any time."
      footer={
        <Button asChild variant="outline">
          <Link href={`/${slug}/admin/awards/ceremony`}>
            <Play className="mr-2 size-4" />
            Replay ceremony
          </Link>
        </Button>
      }
    >
      <StatusNote>The awards have been announced and published.</StatusNote>
    </AdminSection>
  );
}

/**
 * Clickable Closed | Open segmented control for the reversible pair.
 * The forward-only "Close voting & review" (lock + tally) stays a
 * distinct button in the section footer.
 */
function VotingToggle({
  isOpen,
  pending,
  onOpen,
  onClose,
  eventId,
}: {
  isOpen: boolean;
  pending: boolean;
  onOpen: () => void;
  onClose: () => void;
  eventId: string;
}) {
  const items: {
    key: "closed" | "open";
    label: string;
    Icon: typeof Megaphone;
    active: boolean;
    onClick: () => void;
  }[] = [
    {
      key: "closed",
      label: "Closed",
      Icon: Lock,
      active: !isOpen,
      onClick: onClose,
    },
    {
      key: "open",
      label: "Open",
      Icon: Megaphone,
      active: isOpen,
      onClick: onOpen,
    },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map(({ key, label, Icon, active, onClick }) => (
        <button
          key={key}
          type="button"
          disabled={pending || active}
          onClick={() => {
            if (!active) onClick();
          }}
          className="inline-flex items-center gap-1.5 rounded-[4px] border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors disabled:cursor-default"
          style={{
            backgroundColor: active ? "var(--black)" : "var(--bg-tertiary)",
            color: active ? "var(--white)" : "var(--text-secondary)",
            borderColor: active ? "var(--black)" : "var(--border-color)",
            opacity: pending && !active ? 0.5 : 1,
          }}
        >
          {active ? <Check className="size-3" /> : <Icon className="size-3" />}
          {label}
        </button>
      ))}
      <NotifyTeamButton eventId={eventId} kind="idealab" disabled={isOpen} />
      <NotifyTeamButton eventId={eventId} kind="voting" disabled={!isOpen} />
    </div>
  );
}

function StatusNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-md border p-3"
      style={{
        borderColor: "var(--border-color)",
        backgroundColor: "var(--bg-tertiary)",
      }}
    >
      <p
        className="font-serif text-sm italic"
        style={{ color: "var(--text-secondary)" }}
      >
        {children}
      </p>
    </div>
  );
}
