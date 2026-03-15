import { getUserBillingState } from "@/lib/billing";
import { getCurrentUserStateIfAvailable } from "@/lib/auth/guards";

import { PremiumHomepage } from "@/components/marketing/premium-homepage";

export default async function Home() {
  const user = await getCurrentUserStateIfAvailable();
  const currentTier = user ? getUserBillingState(user).currentTier : undefined;

  return (
    <PremiumHomepage
      currentTier={currentTier}
      primaryHref={user ? "/dashboard" : "/signup"}
      primaryLabel={user ? "Open Mara" : "Get started"}
      secondaryHref={user ? "/calendar" : "/#how-it-works"}
      secondaryLabel={user ? "Open calendar" : "How it works"}
      signedIn={Boolean(user)}
    />
  );
}
