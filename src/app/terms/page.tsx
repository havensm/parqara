import { StaticPageShell } from "@/components/marketing/static-page-shell";

export default function TermsPage() {
  return (
    <StaticPageShell
      eyebrow="Terms"
      title="Terms for using Parqara"
      description="These terms describe the basic rules for accessing and using Parqara. They are intended to be straightforward, readable, and aligned with the current product stage. Last updated March 12, 2026."
    >
      <section>
        <h2>Using the service</h2>
        <p>
          Parqara is a software product for planning and managing theme-park trips. By using the service, you agree to use it lawfully, protect your
          account credentials, and provide accurate information when setting up your account or planning a trip.
        </p>
      </section>

      <section>
        <h2>Accounts</h2>
        <ul>
          <li>You are responsible for activity that occurs under your account.</li>
          <li>You should keep your sign-in credentials secure.</li>
          <li>You should not impersonate others or provide false identity information.</li>
          <li>We may suspend or remove accounts involved in abuse, fraud, or misuse of the product.</li>
        </ul>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>You agree not to misuse Parqara. That includes trying to:</p>
        <ul>
          <li>break, probe, or disrupt the service</li>
          <li>access accounts or data that do not belong to you</li>
          <li>use automation to scrape, overload, or reverse engineer the app beyond what law permits</li>
          <li>use the service to violate laws, third-party rights, or park rules</li>
        </ul>
      </section>

      <section>
        <h2>Recommendations and trip decisions</h2>
        <p>
          Parqara provides planning guidance, itinerary suggestions, and AI-assisted recommendations. Those outputs are meant to support decision-making,
          not replace your judgment. Wait times change, attractions close, reservations shift, and park operations can change without notice.
        </p>
        <p>
          You remain responsible for your final plans, purchases, reservations, safety decisions, and on-the-ground choices.
        </p>
      </section>

      <section>
        <h2>Paid plans and billing</h2>
        <p>
          Some features may require a paid subscription. If you choose a paid plan, you agree to the pricing and billing terms shown at checkout when
          those flows are enabled. We may change plans, pricing, or feature availability in the future, but we will present those changes through the
          product or billing flow before they apply to new purchases.
        </p>
      </section>

      <section>
        <h2>Service changes and availability</h2>
        <p>
          Parqara is an evolving product. We may add, remove, improve, or retire features at any time. We do not guarantee uninterrupted availability,
          and we may temporarily limit access for maintenance, security work, or product changes.
        </p>
      </section>

      <section>
        <h2>Termination</h2>
        <p>
          You may stop using the service at any time. We may suspend or terminate access if you violate these terms, create risk for the platform or
          other users, or use the service in a way that is fraudulent, harmful, or unlawful.
        </p>
      </section>

      <section>
        <h2>Disclaimers and liability</h2>
        <p>
          Parqara is provided on an &quot;as is&quot; and &quot;as available&quot; basis to the extent permitted by law. To the extent permitted by law, we disclaim
          warranties of merchantability, fitness for a particular purpose, and non-infringement. We are not responsible for indirect, incidental,
          special, consequential, or punitive damages arising from your use of the service.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          If you have questions about these terms, contact <a href="mailto:parqara.app@gmail.com">parqara.app@gmail.com</a>.
        </p>
      </section>
    </StaticPageShell>
  );
}

