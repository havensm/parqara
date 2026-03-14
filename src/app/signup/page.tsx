import { redirect } from "next/navigation";

import { getCurrentUserStateIfAvailable, getPostAuthRedirectPath } from "@/lib/auth/guards";
import { isGoogleAuthEnabled } from "@/lib/auth/google";

import { AuthPanel } from "@/components/auth/auth-panel";
import { AuthShell } from "@/components/auth/auth-shell";

export default async function SignupPage() {
  const user = await getCurrentUserStateIfAvailable();
  if (user) {
    redirect(getPostAuthRedirectPath(user));
  }

  return (
    <AuthShell
      eyebrow="Sign up"
      title="Set up Parqara in minutes."
      description="Create an account, start planning with the assistant, and save the defaults that make every future adventure faster to shape."
      alternateHref="/login"
      alternateLabel="Already have an account? Log in"
    >
      <AuthPanel googleEnabled={isGoogleAuthEnabled()} mode="signup" />
    </AuthShell>
  );
}


