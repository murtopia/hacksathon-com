import Link from "next/link";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminSection } from "@/components/admin/admin-section";
import { loadCeremonyData } from "@/lib/awards/ceremony-data";
import { PreCeremonyReviewEditor } from "@/components/admin/sections/pre-ceremony-review-editor";

interface PreCeremonyReviewProps {
  eventId: string;
  slug: string;
  number?: string;
}

/**
 * Pre-ceremony review - shown in the awards admin once voting is closed
 * (revealed) but results aren't published yet. Surfaces the computed
 * winners + runner-ups + vote counts, flags zero-vote/tied categories,
 * lets the organizer override any winner, and launches the full-screen
 * ceremony.
 */
export async function PreCeremonyReview({
  eventId,
  slug,
  number = "03",
}: PreCeremonyReviewProps) {
  const { categories, ideas } = await loadCeremonyData(eventId);

  const flagged = categories.filter(
    (c) => c.flags.zeroVotes || c.flags.tie,
  ).length;

  return (
    <AdminSection
      id="ceremony-review"
      number={number}
      title="Pre-ceremony review"
      intent={
        flagged > 0
          ? `Review the winners before you go live. ${flagged} ${flagged === 1 ? "category needs" : "categories need"} a look.`
          : "Confirm or override the winners, then launch the full-screen ceremony."
      }
      footer={
        <Button asChild variant="pill" size="pill">
          <Link href={`/${slug}/admin/awards/ceremony`}>
            <Play />
            Launch ceremony
          </Link>
        </Button>
      }
    >
      <PreCeremonyReviewEditor
        eventId={eventId}
        categories={categories}
        ideas={ideas}
      />
    </AdminSection>
  );
}
