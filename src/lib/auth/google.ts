import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";

import { GOOGLE_OAUTH_STATE_COOKIE_NAME } from "@/lib/constants";

const GOOGLE_AUTH_BASE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const GOOGLE_SCOPE = "openid email profile";
const GOOGLE_STATE_TTL_SECONDS = 60 * 10;
const LOCALHOST_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

export type GoogleUserProfile = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
};

export function isGoogleAuthEnabled() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google sign-in is not configured.");
  }

  return { clientId, clientSecret };
}

function normalizeOrigin(value?: string | null) {
  const normalizedValue = value?.trim();
  if (!normalizedValue) {
    return null;
  }

  return normalizedValue.replace(/\/$/, "");
}

function getConfiguredAppOrigin() {
  const configuredOrigins = [normalizeOrigin(process.env.APP_URL), normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL)];

  for (const configuredOrigin of configuredOrigins) {
    if (!configuredOrigin) {
      continue;
    }

    if (process.env.NODE_ENV === "production" && LOCALHOST_ORIGIN_PATTERN.test(configuredOrigin)) {
      continue;
    }

    return configuredOrigin;
  }

  return null;
}

function getForwardedOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!forwardedHost) {
    return null;
  }

  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol || new URL(request.url).protocol.replace(/:$/, "");

  return `${protocol}://${forwardedHost}`;
}

export function getAppOrigin(request: Request) {
  const configuredOrigin = getConfiguredAppOrigin();
  if (configuredOrigin) {
    return configuredOrigin;
  }

  return getForwardedOrigin(request) ?? new URL(request.url).origin;
}

export function getGoogleCallbackUrl(request: Request) {
  return `${getAppOrigin(request)}/api/auth/google/callback`;
}

export async function createGoogleAuthState() {
  const state = randomUUID();
  const cookieStore = await cookies();

  cookieStore.set(GOOGLE_OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: GOOGLE_STATE_TTL_SECONDS,
    path: "/",
  });

  return state;
}

export async function consumeGoogleAuthState(expectedState: string) {
  const cookieStore = await cookies();
  const actualState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE_NAME)?.value;

  cookieStore.set(GOOGLE_OAUTH_STATE_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
  });

  return Boolean(actualState && actualState === expectedState);
}

export function buildGoogleAuthUrl(request: Request, state: string) {
  const { clientId } = getGoogleConfig();
  const url = new URL(GOOGLE_AUTH_BASE_URL);

  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleCallbackUrl(request),
    response_type: "code",
    scope: GOOGLE_SCOPE,
    prompt: "select_account",
    state,
  }).toString();

  return url;
}

export async function exchangeGoogleCode(request: Request, code: string) {
  const { clientId, clientSecret } = getGoogleConfig();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getGoogleCallbackUrl(request),
      grant_type: "authorization_code",
    }).toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to exchange the Google authorization code.");
  }

  const tokens = (await response.json()) as { access_token?: string };
  if (!tokens.access_token) {
    throw new Error("Google did not return an access token.");
  }

  return tokens.access_token;
}

export async function getGoogleUserProfile(accessToken: string) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load the Google user profile.");
  }

  return (await response.json()) as GoogleUserProfile;
}
