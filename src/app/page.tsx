import { getUserBillingState } from "@/lib/billing";
import { getCurrentUserStateIfAvailable } from "@/lib/auth/guards";

import { PremiumHomepage } from "@/components/marketing/premium-homepage";

export default async function Home() {
  const user = await getCurrentUserStateIfAvailable();
  const currentTier = user ? getUserBillingState(user).currentTier : undefined;

  return (
    <PremiumHomepage
      currentTier={currentTier}
      primaryHref={user ? "/app" : "/signup"}
      primaryLabel={user ? "Open home" : "Get started"}
      secondaryHref={user ? "/dashboard" : "/#how-it-works"}
      secondaryLabel={user ? "Open planners" : "How it works"}
      signedIn={Boolean(user)}
    />
  );
}
