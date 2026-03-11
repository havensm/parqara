import { describe, expect, it } from "vitest";

import { ADMIN_EMAIL, isAdminEmail } from "@/lib/admin";

describe("admin access", () => {
  it("matches the configured admin email regardless of case", () => {
    expect(isAdminEmail(ADMIN_EMAIL)).toBe(true);
    expect(isAdminEmail("HavenSm09@gmail.com")).toBe(true);
  });

  it("rejects any other email", () => {
    expect(isAdminEmail("someone@example.com")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
  });
});
