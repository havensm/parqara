import { redirect } from "next/navigation";

import { getCurrentUserState, getPostAuthRedirectPath } from "@/lib/auth/guards";
import { isGoogleAuthEnabled } from "@/lib/auth/google";

import { AuthPanel } from "@/components/auth/auth-panel";
import { AuthShell } from "@/components/auth/auth-shell";

export default async function LoginPage() {
  const user = await getCurrentUserState();
  if (user) {
    redirect(getPostAuthRedirectPath(user));
  }

  return (
    <AuthShell
      eyebrow="Login"
      title="Log in to Parqara."
      description="Use your email and password or continue with Google. If you are new here, create an account and start planning right away."
      alternateHref="/signup"
      alternateLabel="Create account"
    >
      <AuthPanel googleEnabled={isGoogleAuthEnabled()} mode="login" />
    </AuthShell>
  );
}

