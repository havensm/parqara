import { StaticPageShell } from "@/components/marketing/static-page-shell";

export default function AboutPage() {
  return (
    <StaticPageShell
      eyebrow="About"
      title="Parqara helps people plan better trips without the planning chaos."
      description="We are building a calmer way to plan outings, day trips, and vacations with AI-guided recommendations and clear trip structure."
    >
      <p>
        Parqara is designed for people who want a better trip without spending hours stitching together information from maps, reviews, group chats,
        and travel sites.
      </p>
      <p>
        The product brings trip planning into one place so users can set a destination, capture preferences, and get a personalized plan they can
        actually follow.
      </p>
      <p>
        Today that includes outings like theme park visits, zoo trips, beach days, city adventures, and weekend escapes. Over time, the goal is to
        make trip planning feel more guided, more useful, and far less stressful.
      </p>
    </StaticPageShell>
  );
}
