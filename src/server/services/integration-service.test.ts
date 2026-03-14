import { describe, expect, it } from "vitest";

import { getAdminIntegrationsSnapshot } from "@/server/services/integration-service";

function findIntegration(key: string, env: Record<string, string>) {
  return getAdminIntegrationsSnapshot(env).integrations.find((integration) => integration.key === key);
}

describe("getAdminIntegrationsSnapshot", () => {
  it("marks live integrations based on the current env", () => {
    const snapshot = getAdminIntegrationsSnapshot({
      GOOGLE_CLIENT_ID: "google-client",
      GOOGLE_CLIENT_SECRET: "google-secret",
      APP_URL: "https://app.parqara.com",
      RESEND_API_KEY: "resend-key",
      RESEND_FROM_EMAIL: "hello@parqara.com",
    });

    expect(snapshot.summary.configured).toBe(1);
    expect(snapshot.summary.partial).toBe(1);
    expect(snapshot.summary.missing).toBe(7);
    expect(findIntegration("google-auth", {
      GOOGLE_CLIENT_ID: "google-client",
      GOOGLE_CLIENT_SECRET: "google-secret",
      APP_URL: "https://app.parqara.com",
      RESEND_API_KEY: "resend-key",
      RESEND_FROM_EMAIL: "hello@parqara.com",
    })?.status).toBe("configured");
    expect(findIntegration("transactional-email", {
      GOOGLE_CLIENT_ID: "google-client",
      GOOGLE_CLIENT_SECRET: "google-secret",
      APP_URL: "https://app.parqara.com",
      RESEND_API_KEY: "resend-key",
      RESEND_FROM_EMAIL: "hello@parqara.com",
    })?.status).toBe("partial");
    expect(snapshot.integrations.find((integration) => integration.key === "sentry")?.stage).toBe("recommended");
    expect(snapshot.integrations.find((integration) => integration.key === "tomorrow-weather")?.status).toBe("missing");
    expect(snapshot.integrations.find((integration) => integration.key === "queue-times")?.status).toBe("missing");
  });

  it("treats postmark and stripe as configured when their required keys exist", () => {
    const env = {
      POSTMARK_SERVER_TOKEN: "postmark-token",
      POSTMARK_FROM_EMAIL: "hello@parqara.com",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
      STRIPE_SECRET_KEY: "sk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_123",
      STRIPE_PRICE_PLUS_MONTHLY: "price_plus",
      STRIPE_PRICE_PRO_MONTHLY: "price_pro",
      MAPBOX_ACCESS_TOKEN: "mapbox-token",
    };

    expect(findIntegration("transactional-email", env)?.status).toBe("configured");
    expect(findIntegration("stripe-billing", env)?.status).toBe("configured");
    expect(findIntegration("mapbox", env)?.status).toBe("configured");
  });
});

