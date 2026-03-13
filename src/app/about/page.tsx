import { StaticPageShell } from "@/components/marketing/static-page-shell";

export default function AboutPage() {
  return (
    <StaticPageShell
      eyebrow="About"
      title="Parqara turns scattered park-day planning into one clear trip workspace."
      description="We built Parqara for people who want a great theme-park day without juggling notes, screenshots, wait times, dining ideas, and group messages across five different apps."
    >
      <section>
        <h2>What Parqara does</h2>
        <p>
          Parqara is a park-day planning app built for modern theme-park trips. It gives you one place to set your park, date, party details,
          must-do rides, dining preferences, pacing, and break windows, then turns those inputs into a plan you can actually use.
        </p>
        <ul>
          <li>Build a trip around real constraints like kids, start times, and walking tolerance.</li>
          <li>Keep the whole outing in one workspace instead of bouncing between notes and group chats.</li>
          <li>Use Mara to help shape the plan faster and surface missed details before the trip starts.</li>
          <li>Move from planning into live guidance when you are in the park.</li>
        </ul>
      </section>

      <section>
        <h2>The problem we are solving</h2>
        <p>
          Theme-park planning usually breaks down because the information is fragmented. Families and groups save ride lists in one place, meal ideas
          somewhere else, ticket details in email, and timing notes in their heads. Then the day changes and the plan falls apart.
        </p>
        <p>
          Parqara exists to reduce that chaos. The product is designed to keep trip structure, preferences, and guidance connected so the day feels
          easier to manage from the first draft through the final itinerary.
        </p>
      </section>

      <section>
        <h2>Who it is for</h2>
        <ul>
          <li>Families planning around kids, breaks, meals, and energy levels.</li>
          <li>Couples and small groups who want a smoother day without overplanning every hour manually.</li>
          <li>Repeat park visitors who want a faster way to organize trips and make better in-the-moment decisions.</li>
        </ul>
      </section>

      <section>
        <h2>How we think about the product</h2>
        <p>
          We want Parqara to feel practical, calm, and useful. That means fewer cluttered planning surfaces, clearer decisions, and better guidance at
          the moment someone actually needs it. We are not trying to turn planning into more work. We are trying to remove friction from it.
        </p>
      </section>
    </StaticPageShell>
  );
}
