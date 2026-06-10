/**
 * Canonical PostHog event names. Centralized so client + server capture
 * sites agree on the exact strings (and TypeScript catches typos), and so
 * the Murtopolis console / PostHog insights have one source of truth.
 */
export const AnalyticsEvent = {
  /** Account created (generic email/password or branded join-link signup). */
  SignupCompleted: "signup_completed",
  /** Organizer clicked "Continue to payment" and a Checkout Session opened. */
  CheckoutStarted: "checkout_started",
  /** Stripe checkout settled and an event was provisioned (paid or comped). */
  PurchaseCompleted: "purchase_completed",
  /** A participant joined an event via a join link. */
  ParticipantJoined: "participant_joined",
  /** A participant submitted their IdeaLab entry. */
  IdeaSubmitted: "idea_submitted",
  /** A participant cast (or changed) an award vote. */
  VoteCast: "vote_cast",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];
