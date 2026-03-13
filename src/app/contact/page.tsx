import { StaticPageShell } from "@/components/marketing/static-page-shell";

export default function ContactPage() {
  return (
    <StaticPageShell
      eyebrow="Contact"
      title="Contact Parqara"
      description="The fastest way to reach us right now is by email. Use the address below for support, feedback, partnerships, or launch questions."
    >
      <section>
        <h2>Email</h2>
        <p>
          Reach us at <a href="mailto:parqara.app@gmail.com">parqara.app@gmail.com</a>.
        </p>
        <p>
          That inbox is the main contact point for Parqara while we finish setting up the broader support and operations stack.
        </p>
      </section>

      <section>
        <h2>What to send us</h2>
        <ul>
          <li><strong>Support:</strong> Tell us what you were trying to do, what page you were on, and what went wrong.</li>
          <li><strong>Product feedback:</strong> Share the type of park trip you were planning and what felt missing, confusing, or slow.</li>
          <li><strong>Partnerships:</strong> Include your company, audience, and what kind of collaboration you have in mind.</li>
          <li><strong>Billing questions:</strong> Use the same inbox and include the email on the account if one exists.</li>
        </ul>
      </section>

      <section>
        <h2>Helpful details for bug reports</h2>
        <p>If something in the app is broken, the most useful messages include:</p>
        <ul>
          <li>the page or feature you were using</li>
          <li>what you expected to happen</li>
          <li>what happened instead</li>
          <li>your device and browser</li>
          <li>a screenshot, if you have one</li>
        </ul>
      </section>

      <section>
        <h2>Response expectations</h2>
        <p>
          Parqara is still in an early operating stage, so response times may vary. We still review the inbox for support, product feedback, and
          serious issues as quickly as possible.
        </p>
      </section>
    </StaticPageShell>
  );
}
