import { StaticPageShell } from "@/components/marketing/static-page-shell";

export default function TermsPage() {
  return (
    <StaticPageShell
      eyebrow="Terms"
      title="Basic terms page for the current Parqara build."
      description="This page provides a lightweight placeholder until formal launch terms are finalized."
    >
      <p>
        Parqara is currently presented as an early product experience. Features, recommendations, and availability may change as the product evolves.
      </p>
      <p>
        Trip recommendations are intended to help users plan more effectively, but final travel decisions, reservations, and safety considerations stay
        with the user.
      </p>
      <p>
        A production launch should replace this page with formal terms covering acceptable use, subscription details, liability language, and account
        responsibilities.
      </p>
    </StaticPageShell>
  );
}
