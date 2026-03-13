import { StaticPageShell } from "@/components/marketing/static-page-shell";

export default function PrivacyPage() {
  return (
    <StaticPageShell
      eyebrow="Privacy"
      title="How Parqara handles your information"
      description="This privacy page explains, in plain language, what information Parqara collects, why we use it, and the services involved in operating the product. Last updated March 12, 2026."
    >
      <section>
        <h2>Information we collect</h2>
        <ul>
          <li><strong>Account information:</strong> name, email address, sign-in method, and basic profile settings.</li>
          <li><strong>Trip planning information:</strong> park selection, visit dates, party size, kids&apos; ages, ride preferences, dining preferences, and itinerary updates.</li>
          <li><strong>Usage information:</strong> limited operational data needed to keep the app running, debug problems, and improve the product experience.</li>
          <li><strong>Support communications:</strong> anything you send to us by email or through support conversations.</li>
        </ul>
      </section>

      <section>
        <h2>How we use the information</h2>
        <ul>
          <li>to create and maintain your account</li>
          <li>to save your trips and let you return to them later</li>
          <li>to generate itinerary suggestions and planning guidance</li>
          <li>to support collaboration features when you share a trip</li>
          <li>to respond to support requests, security issues, or abuse reports</li>
        </ul>
      </section>

      <section>
        <h2>Third-party services involved in the product</h2>
        <p>Parqara relies on external providers to operate parts of the service. Depending on how you use the product, that may include:</p>
        <ul>
          <li><strong>AWS:</strong> application hosting, infrastructure, and database services.</li>
          <li><strong>Google:</strong> sign-in if you choose Google login.</li>
          <li><strong>OpenAI:</strong> AI-generated planning assistance and related recommendation flows.</li>
          <li><strong>Postmark:</strong> transactional email such as sign-in or account emails, when enabled.</li>
          <li><strong>Stripe:</strong> subscription billing and payment processing, if you choose a paid plan.</li>
        </ul>
        <p>Those providers process data according to their own terms and privacy policies.</p>
      </section>

      <section>
        <h2>How we share information</h2>
        <p>We do not sell your personal information. We may share information only in limited situations, such as:</p>
        <ul>
          <li>with service providers helping us run Parqara</li>
          <li>with collaborators you explicitly invite into a trip workspace</li>
          <li>when required by law, legal process, or to protect users and the service</li>
        </ul>
      </section>

      <section>
        <h2>Data retention and security</h2>
        <p>
          We keep information for as long as it is reasonably necessary to operate the service, maintain accounts, resolve disputes, and comply with
          legal obligations. We use reasonable administrative and technical safeguards, but no system can promise absolute security.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <ul>
          <li>You can update some account information inside the app.</li>
          <li>You can contact us if you want help deleting your account or associated trip data.</li>
          <li>You can choose not to use optional sign-in or paid features.</li>
        </ul>
      </section>

      <section>
        <h2>Questions</h2>
        <p>
          If you have privacy questions or want to request account-related help, email <a href="mailto:parqara.app@gmail.com">parqara.app@gmail.com</a>.
        </p>
      </section>
    </StaticPageShell>
  );
}
