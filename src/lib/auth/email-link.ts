import { createHash, randomBytes } from "node:crypto";

import { sendTransactionalEmail } from "@/lib/email";
import { db } from "@/lib/db";

import { getAppOrigin } from "./google";

const EMAIL_LINK_TTL_MINUTES = 30;

type EmailLinkIntent = "signin" | "signup";

type EmailVerificationResult =
  | { status: "expired" | "invalid" }
  | { email: string; status: "valid" };

function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getEmailVerificationExpiry() {
  return new Date(Date.now() + EMAIL_LINK_TTL_MINUTES * 60 * 1000);
}

function getEmailLinkSubject(intent: EmailLinkIntent) {
  return intent === "signup" ? "Verify your email for Parqara" : "Your Parqara sign-in link";
}

function buildEmailVerificationText(intent: EmailLinkIntent, verificationUrl: string) {
  const intro =
    intent === "signup"
      ? "Verify your email to create your Parqara account."
      : "Use this secure link to sign in to Parqara.";

  return `${intro}\n\nOpen this link within ${EMAIL_LINK_TTL_MINUTES} minutes:\n${verificationUrl}\n\nIf you did not request this email, you can safely ignore it.`;
}

function buildEmailVerificationHtml(intent: EmailLinkIntent, verificationUrl: string) {
  const headline = intent === "signup" ? "Verify your email" : "Sign in to Parqara";
  const body =
    intent === "signup"
      ? "Confirm your email address and Parqara will create your account automatically."
      : "Open the secure link below to continue to your saved adventures.";
  const cta = intent === "signup" ? "Verify email" : "Sign in";

  return `
    <div style="background:#f4f7f5;padding:32px 16px;font-family:Inter,Arial,sans-serif;color:#0f172a;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid rgba(15,23,42,0.08);border-radius:28px;padding:32px;box-shadow:0 20px 60px rgba(15,23,42,0.08);">
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#1b6b63;">Parqara</p>
        <h1 style="margin:0 0 12px;font-size:28px;line-height:1.15;color:#020617;">${headline}</h1>
        <p style="margin:0 0 28px;font-size:16px;line-height:1.7;color:#475569;">${body}</p>
        <a href="${verificationUrl}" style="display:inline-block;border-radius:999px;background:#1b6b63;padding:14px 22px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${cta}</a>
        <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#64748b;">This link expires in ${EMAIL_LINK_TTL_MINUTES} minutes. If you did not request it, you can ignore this email.</p>
        <p style="margin:18px 0 0;font-size:13px;line-height:1.7;color:#94a3b8;word-break:break-all;">${verificationUrl}</p>
      </div>
    </div>
  `;
}

export function buildEmailVerificationUrl(request: Request, token: string) {
  const url = new URL("/api/auth/email/verify", getAppOrigin(request));
  url.searchParams.set("token", token);
  return url.toString();
}

export async function issueEmailVerificationLink(request: Request, email: string, intent: EmailLinkIntent) {
  const normalizedEmail = email.trim().toLowerCase();
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashVerificationToken(token);
  const expiresAt = getEmailVerificationExpiry();

  await db.emailVerificationToken.upsert({
    where: {
      email: normalizedEmail,
    },
    update: {
      expiresAt,
      tokenHash,
    },
    create: {
      email: normalizedEmail,
      expiresAt,
      tokenHash,
    },
  });

  const verificationUrl = buildEmailVerificationUrl(request, token);
  const subject = getEmailLinkSubject(intent);
  const html = buildEmailVerificationHtml(intent, verificationUrl);
  const text = buildEmailVerificationText(intent, verificationUrl);
  const result = await sendTransactionalEmail({
    html,
    subject,
    text,
    to: normalizedEmail,
  });

  if (result.delivery === "preview") {
    console.info(`[Parqara auth email preview] ${verificationUrl}`);
  }

  return {
    delivery: result.delivery,
    expiresAt,
    verificationUrl,
  };
}

export async function consumeEmailVerificationToken(token: string): Promise<EmailVerificationResult> {
  const tokenHash = hashVerificationToken(token);
  const record = await db.emailVerificationToken.findUnique({
    where: {
      tokenHash,
    },
  });

  if (!record) {
    return { status: "invalid" };
  }

  await db.emailVerificationToken.delete({
    where: {
      id: record.id,
    },
  });

  if (record.expiresAt < new Date()) {
    return { status: "expired" };
  }

  return {
    email: record.email,
    status: "valid",
  };
}
