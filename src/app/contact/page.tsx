import Link from "next/link";

import { StaticPageShell } from "@/components/marketing/static-page-shell";

export default function ContactPage() {
  return (
    <StaticPageShell
      eyebrow="Contact"
      title="Questions, partnerships, or support requests."
      description="Reach out if you want to talk about Parqara, product feedback, or early access conversations."
    >
      <p>
        For general questions and partnership inquiries, email <Link href="mailto:hello@parqara.com" className="font-semibold text-slate-950 underline decoration-slate-300 underline-offset-4">hello@parqara.com</Link>.
      </p>
      <p>
        For product feedback, include the type of trip you were planning and what felt missing or unclear. That context helps us improve the planning
        flow much faster.
      </p>
      <p>
        If you are using Parqara for group outings, travel programs, or concierge-style planning, note that in your message so we can route it to the
        right conversation.
      </p>
    </StaticPageShell>
  );
}
