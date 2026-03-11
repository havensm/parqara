import { StaticPageShell } from "@/components/marketing/static-page-shell";

export default function PrivacyPage() {
  return (
    <StaticPageShell
      eyebrow="Privacy"
      title="A simple privacy overview for Parqara."
      description="This page is a high-level summary of how the product is intended to handle account and trip-planning data."
    >
      <p>
        Parqara stores account information and trip-planning inputs so users can save progress, return later, and continue building an itinerary.
      </p>
      <p>
        When AI assistance is enabled, planning-related prompts may be sent through the OpenAI API to generate recommendations or guidance connected to
        the user&apos;s trip workflow.
      </p>
      <p>
        Sensitive implementation details, retention windows, and formal compliance language should be finalized before public launch. This page should
        be treated as a product placeholder until a full privacy policy is published.
      </p>
    </StaticPageShell>
  );
}
