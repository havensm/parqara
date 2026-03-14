import { redirect } from "next/navigation";

import { getCurrentUserStateIfAvailable, getPostAuthRedirectPath } from "@/lib/auth/guards";
import { isGoogleAuthEnabled } from "@/lib/auth/google";

import { AuthPanel } from "@/components/auth/auth-panel";
import { AuthShell } from "@/components/auth/auth-shell";

export default async function LoginPage() {
  const user = await getCurrentUserStateIfAvailable();
  if (user) {
    redirect(getPostAuthRedirectPath(user));
  }

  return (
    <AuthShell
      eyebrow="Login"
      title="Log in to Parqara."
      description="Pick up your planner, route, and live updates right where you left them."
      alternateHref="/signup"
      alternateLabel="Create account"
      variant="minimal"
      panelOrder="panel-first"
    >
      <AuthPanel googleEnabled={isGoogleAuthEnabled()} mode="login" />
    </AuthShell>
  );
}


