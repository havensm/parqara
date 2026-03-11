import { getUserBillingState } from "@/lib/billing";
import { getCurrentUserState } from "@/lib/auth/guards";

import { PremiumHomepage } from "@/components/marketing/premium-homepage";

export default async function Home() {
  const user = await getCurrentUserState();
  const signedIn = Boolean(user);
  const primaryHref = user ? "/dashboard" : "/signup";
  const primaryLabel = user ? "Open dashboard" : "Get started";
  const secondaryHref = user ? "/profile" : "/#how-it-works";
  const secondaryLabel = user ? "View profile" : "How it works";
  const currentTier = user ? getUserBillingState(user).currentTier : undefined;

  return (
    <PremiumHomepage
      currentTier={currentTier}
      primaryHref={primaryHref}
      primaryLabel={primaryLabel}
      secondaryHref={secondaryHref}
      secondaryLabel={secondaryLabel}
      signedIn={signedIn}
    />
  );
}

