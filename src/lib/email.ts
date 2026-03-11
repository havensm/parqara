type EnvShape = Record<string, string | undefined>;

export type EmailProvider = "postmark" | "resend" | "preview";

export type EmailDeliveryResult = {
  delivery: "provider" | "preview";
  provider: EmailProvider;
};

type SendTransactionalEmailInput = {
  html: string;
  subject: string;
  text: string;
  to: string;
};

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

export function isPostmarkEmailConfigured(env: EnvShape = process.env) {
  return hasValue(env.POSTMARK_SERVER_TOKEN) && hasValue(env.POSTMARK_FROM_EMAIL);
}

export function isResendEmailConfigured(env: EnvShape = process.env) {
  return hasValue(env.RESEND_API_KEY) && hasValue(env.RESEND_FROM_EMAIL);
}

export function getConfiguredEmailProvider(env: EnvShape = process.env): Exclude<EmailProvider, "preview"> | null {
  if (isPostmarkEmailConfigured(env)) {
    return "postmark";
  }

  if (isResendEmailConfigured(env)) {
    return "resend";
  }

  return null;
}

export function isEmailDeliveryConfigured(env: EnvShape = process.env) {
  return getConfiguredEmailProvider(env) !== null;
}

async function sendWithPostmark({ html, subject, text, to }: SendTransactionalEmailInput): Promise<EmailDeliveryResult> {
  const response = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": process.env.POSTMARK_SERVER_TOKEN!.trim(),
    },
    body: JSON.stringify({
      From: process.env.POSTMARK_FROM_EMAIL!.trim(),
      To: to,
      Subject: subject,
      HtmlBody: html,
      TextBody: text,
      MessageStream: process.env.POSTMARK_MESSAGE_STREAM?.trim() || "outbound",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || "Unable to send the email with Postmark.");
  }

  return {
    delivery: "provider",
    provider: "postmark",
  };
}

async function sendWithResend({ html, subject, text, to }: SendTransactionalEmailInput): Promise<EmailDeliveryResult> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL!.trim(),
      to: [to],
      subject,
      html,
      text,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || "Unable to send the email verification message.");
  }

  return {
    delivery: "provider",
    provider: "resend",
  };
}

export async function sendTransactionalEmail({ html, subject, text, to }: SendTransactionalEmailInput): Promise<EmailDeliveryResult> {
  const provider = getConfiguredEmailProvider();

  if (!provider) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Email delivery is not configured. Add POSTMARK_SERVER_TOKEN and POSTMARK_FROM_EMAIL or RESEND_API_KEY and RESEND_FROM_EMAIL."
      );
    }

    return { delivery: "preview", provider: "preview" };
  }

  if (provider === "postmark") {
    return sendWithPostmark({ html, subject, text, to });
  }

  return sendWithResend({ html, subject, text, to });
}
