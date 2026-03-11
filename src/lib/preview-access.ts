const PREVIEW_ACCESS_COOKIE_NAME = "parqara_preview_access";
const DEFAULT_PREVIEW_ACCESS_PASSWORD = "yard";
const DEFAULT_PREVIEW_ACCESS_MAX_AGE_SECONDS = 60 * 60 * 12;
const PREVIEW_ACCESS_DISABLED_VALUES = new Set(["0", "false", "no", "off"]);

type PreviewAccessCookieOptions = {
  httpOnly: true;
  maxAge: number;
  path: "/";
  sameSite: "lax";
  secure: boolean;
};

function getPreviewAccessSecret(): string {
  return process.env.SESSION_SECRET?.trim() || "parqara-preview-access-secret";
}

function getPreviewAccessEncoder(): TextEncoder {
  return new TextEncoder();
}

async function digestPreviewAccessValue(value: string): Promise<string> {
  const payload = `${getPreviewAccessSecret()}:${value}`;
  const bytes = getPreviewAccessEncoder().encode(payload);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function isPreviewAccessEnabled(): boolean {
  const configuredValue = process.env.PREVIEW_GATE_ENABLED?.trim().toLowerCase();

  if (!configuredValue) {
    return true;
  }

  return !PREVIEW_ACCESS_DISABLED_VALUES.has(configuredValue);
}

export function getPreviewAccessPassword(): string {
  return process.env.PREVIEW_GATE_PASSWORD?.trim() || DEFAULT_PREVIEW_ACCESS_PASSWORD;
}

export async function createPreviewAccessToken(): Promise<string> {
  return digestPreviewAccessValue(`preview:${getPreviewAccessPassword()}`);
}

export async function hasPreviewAccess(cookieValue?: string | null): Promise<boolean> {
  if (!cookieValue) {
    return false;
  }

  return cookieValue === (await createPreviewAccessToken());
}

export function getPreviewAccessCookieOptions(secure: boolean): PreviewAccessCookieOptions {
  return {
    httpOnly: true,
    maxAge: DEFAULT_PREVIEW_ACCESS_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure,
  };
}

export { PREVIEW_ACCESS_COOKIE_NAME };
