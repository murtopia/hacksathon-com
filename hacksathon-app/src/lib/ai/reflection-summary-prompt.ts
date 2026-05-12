/**
 * Prompts for the AI-generated reflection summary surfaced on the admin
 * panel. The summary is a 250–400-word celebratory recap composed from
 * every participant's reflection answers. It runs once when the
 * organizer hits "Generate" and again on every "Regenerate". Approved
 * drafts surface to participants via the (deferred) public results page
 * — for M4 the recap stays internal to the organizer.
 */

interface ReflectionEntry {
  question: string;
  participantName: string;
  answer: string;
}

export function buildReflectionSummarySystemPrompt(args: {
  eventTitle: string;
  orgName: string;
}): string {
  return `You are writing a short, warm post-event recap for a company Hacks-a-Thon called "${args.eventTitle}" hosted by ${args.orgName}.

Your reader is the organizer, who will share this with their team. The voice should sound like a teammate who paid attention all week — warm, observational, casually celebratory. Not corporate. Not effusive. Not a list.

Tasks:
- Read every participant's reflection answers below.
- Find the shared threads — what surprised people, what they're proud of, what they learned, what they're taking forward.
- Quote 2–4 short, anonymized phrases (paraphrase if needed). Never name names unless the participant included their own name inside their answer.
- Call out the energy or pattern that defined the event — the thing that, if you were retelling this hackathon at a dinner party, you'd open with.
- Close with one line that lands. Not a summary. Not a CTA. Just a beat.

Format:
- Markdown. Light headings allowed (max 2 H2s) but optional.
- 250–400 words. Don't pad.
- No bullet lists unless they really earn it. Prose by default.
- Never address the reader as "you, the organizer." Speak about the team.

Do not invent details. If a thread isn't actually in the responses, don't pretend it is.`;
}

export function buildReflectionSummaryUserPrompt(
  entries: ReflectionEntry[],
): string {
  if (entries.length === 0) {
    return "No reflection responses were submitted. Write a brief, honest one-paragraph note acknowledging this — warm but truthful — instead of a recap.";
  }

  const grouped = new Map<string, ReflectionEntry[]>();
  for (const entry of entries) {
    const bucket = grouped.get(entry.question) ?? [];
    bucket.push(entry);
    grouped.set(entry.question, bucket);
  }

  const sections: string[] = [];
  for (const [question, list] of grouped) {
    const lines = list
      .map((e) => `- (${e.participantName}) ${e.answer.trim()}`)
      .join("\n");
    sections.push(`## ${question}\n${lines}`);
  }

  return `Here are the reflection answers, grouped by question:\n\n${sections.join("\n\n")}`;
}

export type { ReflectionEntry };
