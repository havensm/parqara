const LOCALHOST_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

export const ADMIN_EMAILS = ["havensm09@gmail.com", "hello@parqara.com"] as const;
export const LOCAL_TEST_ADMIN_EMAIL = "test@test.com";

export type AdminAccessAccount = {
  email: string;
  scope: "global" | "local";
};

function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

function normalizeOrigin(value?: string | null) {
  const normalizedValue = value?.trim();
  if (!normalizedValue) {
    return null;
  }

  return normalizedValue.replace(/\/$/, "");
}

export function isLocalAdminEnvironment() {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const configuredOrigins = [normalizeOrigin(process.env.APP_URL), normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL)];
  return configuredOrigins.some((origin) => Boolean(origin && LOCALHOST_ORIGIN_PATTERN.test(origin)));
}

export function getAdminAccessAccounts(): AdminAccessAccount[] {
  const accounts: AdminAccessAccount[] = ADMIN_EMAILS.map((email) => ({
    email,
    scope: "global",
  }));

  if (isLocalAdminEnvironment()) {
    accounts.push({
      email: LOCAL_TEST_ADMIN_EMAIL,
      scope: "local",
    });
  }

  return accounts;
}

export function isAdminEmail(email: string | null | undefined) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return false;
  }

  if (ADMIN_EMAILS.some((adminEmail) => normalizeEmail(adminEmail) === normalizedEmail)) {
    return true;
  }

  return normalizedEmail === normalizeEmail(LOCAL_TEST_ADMIN_EMAIL) && isLocalAdminEnvironment();
}
