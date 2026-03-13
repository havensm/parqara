import { describe, expect, it, vi, afterEach } from "vitest";

import { ADMIN_EMAIL, LOCAL_TEST_ADMIN_EMAIL, isAdminEmail } from "@/lib/admin";

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

  it("matches the configured admin email regardless of case", () => {
    expect(isAdminEmail(ADMIN_EMAIL)).toBe(true);
    expect(isAdminEmail("HavenSm09@gmail.com")).toBe(true);
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
