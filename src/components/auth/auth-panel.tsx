"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, MailCheck } from "lucide-react";
import { useState, useTransition } from "react";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type AuthMode = "login" | "signup";
type AuthMethod = "email-link" | "password";

type AuthPanelProps = {
  googleEnabled: boolean;
  mode: AuthMode;
};

type EmailLinkNotice = {
  message: string;
  previewUrl?: string;
};

const inputClassName =
  "mt-2 w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none ring-0 transition focus:border-[#1b6b63]/40";

const oauthErrorMessages: Record<string, string> = {
  email_link_expired: "That email link has expired. Request a fresh one to continue.",
  email_link_invalid: "That email link is no longer valid. Request a new one from the login page.",
  google_access_denied: "Google sign-in was cancelled before the account could be connected.",
  google_auth_failed: "Google sign-in did not complete successfully. Please try again.",
  google_email_unverified: "Your Google account email must be verified before it can be used to sign in.",
  google_missing_code: "Google sign-in returned an incomplete response. Please try again.",
  google_not_configured: "Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.",
  google_state_invalid: "Google sign-in could not be verified. Please try again from the login page.",
};

export function AuthPanel({ googleEnabled, mode }: AuthPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [emailLinkNotice, setEmailLinkNotice] = useState<EmailLinkNotice | null>(null);
  const oauthError = searchParams.get("error");
  const displayError = error ?? (oauthError ? oauthErrorMessages[oauthError] || "Unable to continue with authentication." : null);
  const isSignup = mode === "signup";

  async function submitPasswordForm(formData: FormData) {
    const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/signin";
    const payload = isSignup
      ? {
          firstName: String(formData.get("firstName") || "").trim(),
          email: String(formData.get("email") || ""),
          password: String(formData.get("password") || ""),
        }
      : {
          email: String(formData.get("email") || ""),
          password: String(formData.get("password") || ""),
        };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as { error?: string; nextPath?: string };
    if (!response.ok) {
      throw new Error(result.error || "Authentication failed.");
    }

    router.push(result.nextPath || "/dashboard");
    router.refresh();
  }

  async function submitEmailLink(formData: FormData) {
    const response = await fetch("/api/auth/email/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: String(formData.get("email") || ""),
        intent: isSignup ? "signup" : "signin",
      }),
    });

    const result = (await response.json()) as { error?: string; message?: string; previewUrl?: string };
    if (!response.ok) {
      throw new Error(result.error || "Unable to send the email link.");
    }

    setEmailLinkNotice({
      message: result.message || "Check your inbox for the next step.",
      previewUrl: result.previewUrl,
    });
  }

  function resetMessages() {
    setError(null);
    setEmailLinkNotice(null);
  }

  if (!isSignup) {
    return (
      <Card className="w-full p-6 sm:p-8">
        <div>
          <Badge variant="neutral">Welcome back</Badge>
          <h2 className="mt-4 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
            Sign in to Parqara
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
            Use your email and password or continue with Google. If you do not have an account yet, create one first.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <Link
            href={googleEnabled ? "/api/auth/google/start" : "#"}
            aria-disabled={!googleEnabled}
            className={cn(
              buttonStyles({ variant: "secondary", size: "lg" }),
              "w-full justify-center gap-3",
              !googleEnabled ? "pointer-events-none opacity-60" : ""
            )}
          >
            <GoogleMark />
            <span>Continue with Google</span>
          </Link>
          {!googleEnabled ? (
            <p className="text-sm leading-7 text-slate-500">Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env` to enable Google sign-in.</p>
          ) : null}
        </div>

        <div className="my-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          <span>Or sign in with email</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            resetMessages();
            startTransition(async () => {
              try {
                await submitPasswordForm(formData);
              } catch (submitError) {
                setError(submitError instanceof Error ? submitError.message : "Unable to continue.");
              }
            });
          }}
        >
          <label className="block text-sm text-slate-600">
            Email
            <input name="email" type="email" className={inputClassName} placeholder="you@parqara.app" required />
          </label>

          <label className="block text-sm text-slate-600">
            Password
            <input name="password" type="password" className={inputClassName} placeholder="Enter your password" required />
          </label>

          {displayError ? <p className="rounded-[22px] border border-[#efc1bc] bg-[#fff0ee] px-4 py-3 text-sm text-[#b14b41]">{displayError}</p> : null}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-teal-700 underline underline-offset-4">
            Create one
          </Link>
        </p>
      </Card>
    );
  }

  return (
    <Card className="w-full p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge variant="neutral">Create your account</Badge>
          <h2 className="mt-4 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
            Start with the easiest way in.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
            Use Google, a verified email link, or a password-based account. Once you are in, the planner and your profile can capture the defaults you want Parqara to remember.
          </p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          <p className="font-semibold text-slate-950">After you sign in</p>
          <p className="mt-1">The planner can help collect trip context right away.</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Link
          href={googleEnabled ? "/api/auth/google/start" : "#"}
          aria-disabled={!googleEnabled}
          className={cn(
            buttonStyles({ variant: "secondary", size: "lg" }),
            "w-full justify-center gap-3",
            !googleEnabled ? "pointer-events-none opacity-60" : ""
          )}
        >
          <GoogleMark />
          <span>Continue with Google</span>
        </Link>
        {!googleEnabled ? (
          <p className="text-sm leading-7 text-slate-500">Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env` to enable Google sign-in.</p>
        ) : null}
      </div>

      <div className="my-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        <span>Or continue with email</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="flex rounded-full border border-slate-200 bg-white p-1">
        {([
          { value: "email-link", label: "Verify by email" },
          { value: "password", label: "Use password" },
        ] as const).map((option) => (
          <button
            key={option.value}
            type="button"
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
              authMethod === option.value ? "bg-slate-950 text-white" : "text-slate-600 hover:text-slate-950"
            }`}
            onClick={() => {
              setAuthMethod(option.value);
              resetMessages();
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          resetMessages();
          startTransition(async () => {
            try {
              if (authMethod === "email-link") {
                await submitEmailLink(formData);
                return;
              }

              await submitPasswordForm(formData);
            } catch (submitError) {
              setError(submitError instanceof Error ? submitError.message : "Unable to continue.");
            }
          });
        }}
      >
        {authMethod === "password" ? (
          <label className="block text-sm text-slate-600">
            First name
            <input name="firstName" className={inputClassName} placeholder="Jordan" required />
          </label>
        ) : null}

        <label className="block text-sm text-slate-600">
          Email
          <input name="email" type="email" className={inputClassName} placeholder="you@parqara.app" required />
        </label>

        {authMethod === "password" ? (
          <label className="block text-sm text-slate-600">
            Password
            <input name="password" type="password" className={inputClassName} placeholder="Minimum 8 characters" required />
          </label>
        ) : (
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-500">
            <p className="font-semibold text-slate-950">Create an account with just your email.</p>
            <p className="mt-2">We will send a one-time verification link and create the account after you confirm the address.</p>
          </div>
        )}

        {displayError ? <p className="rounded-[22px] border border-[#efc1bc] bg-[#fff0ee] px-4 py-3 text-sm text-[#b14b41]">{displayError}</p> : null}
        {emailLinkNotice ? (
          <div className="rounded-[22px] border border-[#b9e6da] bg-[#edf8f4] px-4 py-3 text-sm text-[#17584f]">
            <p>{emailLinkNotice.message}</p>
            {emailLinkNotice.previewUrl ? (
              <div className="mt-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[#3b7b71]">Development preview</p>
                <Link href={emailLinkNotice.previewUrl} className="mt-2 inline-flex text-sm font-semibold text-[#17584f] underline underline-offset-4">
                  Open the verification link
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending
            ? authMethod === "email-link"
              ? "Sending link..."
              : "Working..."
            : authMethod === "email-link"
              ? "Send verification email"
              : "Create account"}
        </Button>
      </form>

      <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-600">
        <div className="flex items-center gap-3 text-slate-950">
          <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-cyan-50 text-teal-700">
            <MailCheck className="h-5 w-5" />
          </div>
          <p className="font-semibold">Smooth first-run flow</p>
        </div>
        <p className="mt-4">
          Sign in once, use the planner or your profile to capture preferences, and let Parqara remember them for the next adventure.
        </p>
        <div className="mt-4 flex items-center gap-3 text-slate-950">
          <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-cyan-50 text-teal-700">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <p className="font-semibold">OpenAI-ready planner</p>
        </div>
        <p className="mt-2">Add your OpenAI key to `.env` when you are ready for itinerary generation and planning assistance.</p>
      </div>
    </Card>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M21.805 12.041c0-.824-.067-1.425-.212-2.049H12.2v3.765h5.514c-.111.936-.712 2.346-2.048 3.293l-.019.126 3.012 2.333.208.021c1.914-1.769 3.016-4.371 3.016-7.489Z"
        fill="#4285F4"
      />
      <path
        d="M12.2 21.818c2.701 0 4.97-.891 6.627-2.413l-3.201-2.48c-.857.601-2.004 1.024-3.426 1.024-2.646 0-4.893-1.769-5.694-4.215l-.119.01-3.132 2.423-.041.112c1.647 3.268 5.026 5.539 8.986 5.539Z"
        fill="#34A853"
      />
      <path
        d="M6.506 13.734a5.857 5.857 0 0 1-.334-1.902c0-.668.122-1.313.323-1.903l-.006-.127-3.171-2.462-.104.05A9.64 9.64 0 0 0 2.2 11.832c0 1.556.378 3.028 1.014 4.441l3.292-2.539Z"
        fill="#FBBC05"
      />
      <path
        d="M12.2 5.714c1.792 0 3.002.779 3.692 1.425l2.691-2.624C17.159 3.181 14.9 2.182 12.2 2.182c-3.96 0-7.339 2.27-8.986 5.539l3.281 2.539c.812-2.446 3.059-4.546 5.705-4.546Z"
        fill="#EB4335"
      />
    </svg>
  );
}





