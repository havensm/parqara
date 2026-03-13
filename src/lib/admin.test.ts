import { describe, expect, it, vi, afterEach } from "vitest";

import { ADMIN_EMAILS, LOCAL_TEST_ADMIN_EMAIL, getAdminAccessAccounts, isAdminEmail } from "@/lib/admin";

describe("admin access", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAppUrl = process.env.APP_URL;
  const originalPublicAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.APP_URL = originalAppUrl;
    process.env.NEXT_PUBLIC_APP_URL = originalPublicAppUrl;
    vi.unstubAllEnvs();
  });

  it("matches the configured admin emails regardless of case", () => {
    expect(isAdminEmail(ADMIN_EMAILS[0])).toBe(true);
    expect(isAdminEmail(ADMIN_EMAILS[1])).toBe(true);
    expect(isAdminEmail("HavenSm09@gmail.com")).toBe(true);
    expect(isAdminEmail("HELLO@PARQARA.COM")).toBe(true);
  });

  it("lists the global admin accounts and the local test admin in local environments", () => {
    process.env.NODE_ENV = "development";

    expect(getAdminAccessAccounts()).toEqual([
      { email: ADMIN_EMAILS[0], scope: "global" },
      { email: ADMIN_EMAILS[1], scope: "global" },
      { email: LOCAL_TEST_ADMIN_EMAIL, scope: "local" },
    ]);
  });

  it("omits the local test admin from the account list in production when the app is not local", () => {
    process.env.NODE_ENV = "production";
    process.env.APP_URL = "https://parqara.com";
    process.env.NEXT_PUBLIC_APP_URL = "https://parqara.com";

    expect(getAdminAccessAccounts()).toEqual([
      { email: ADMIN_EMAILS[0], scope: "global" },
      { email: ADMIN_EMAILS[1], scope: "global" },
    ]);
  });

  it("allows the local test admin email outside production", () => {
    process.env.NODE_ENV = "development";
    expect(isAdminEmail(LOCAL_TEST_ADMIN_EMAIL)).toBe(true);
  });

  it("rejects the local test admin email in production when the app is not local", () => {
    process.env.NODE_ENV = "production";
    process.env.APP_URL = "https://parqara.com";
    process.env.NEXT_PUBLIC_APP_URL = "https://parqara.com";

    expect(isAdminEmail(LOCAL_TEST_ADMIN_EMAIL)).toBe(false);
  });

  it("allows the local test admin email in production if the configured origin is localhost", () => {
    process.env.NODE_ENV = "production";
    process.env.APP_URL = "http://localhost:3000";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

    expect(isAdminEmail(LOCAL_TEST_ADMIN_EMAIL)).toBe(true);
  });

  it("rejects any other email", () => {
    expect(isAdminEmail("someone@example.com")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
  });
});
