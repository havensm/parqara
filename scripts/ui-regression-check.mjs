import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium, devices } from "playwright";

const baseUrl = process.env.PARQARA_UI_BASE_URL ?? "http://127.0.0.1:3000";
const previewGatePassword = process.env.PREVIEW_GATE_PASSWORD ?? "yard";
const loginEmail = process.env.PARQARA_UI_EMAIL ?? "test@test.com";
const loginPassword = process.env.PARQARA_UI_PASSWORD ?? "test";
const preferredTripId = process.env.PARQARA_UI_TRIP_ID ?? null;
const outputDir = path.join(process.cwd(), "output", "playwright", "regression");

const viewports = [
  {
    name: "desktop",
    viewport: { width: 1440, height: 1200 },
    expectsSidebar: true,
  },
  {
    name: "tablet",
    viewport: { width: 1024, height: 1366 },
    expectsSidebar: false,
  },
  {
    name: "mobile",
    viewport: devices["iPhone 13"].viewport,
    userAgent: devices["iPhone 13"].userAgent,
    isMobile: devices["iPhone 13"].isMobile,
    hasTouch: devices["iPhone 13"].hasTouch,
    deviceScaleFactor: devices["iPhone 13"].deviceScaleFactor,
    expectsSidebar: false,
  },
];

async function ensureServerReachable() {
  try {
    const response = await fetch(baseUrl, { redirect: "manual" });
    if (response.status >= 500) {
      throw new Error(`received ${response.status}`);
    }
  } catch (error) {
    throw new Error(
      `UI regression check could not reach ${baseUrl}. Start the app first with npm run dev. ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function unlockPreviewGateIfNeeded(page) {
  const gateForm = page.locator("#gate-form");
  if ((await gateForm.count()) === 0) {
    return;
  }

  await page.fill("#password", previewGatePassword);
  await Promise.all([
    page.waitForLoadState("networkidle", { timeout: 45000 }),
    page.click("#submit-button"),
  ]);

  const errorMessage = await page.locator("#error").textContent();
  if (errorMessage?.trim()) {
    throw new Error(`Preview gate rejected the password: ${errorMessage.trim()}`);
  }
}

async function attachConsoleCapture(page) {
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });
  return consoleErrors;
}

async function assertNoHorizontalOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  if (dimensions.scrollWidth > dimensions.clientWidth + 2) {
    throw new Error(`${label} overflows horizontally: ${dimensions.scrollWidth}px > ${dimensions.clientWidth}px`);
  }
}

async function screenshot(page, viewportName, label) {
  await page.screenshot({ path: path.join(outputDir, `${label}-${viewportName}.png`), fullPage: true });
}

async function gotoRoute(page, route, label) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 45000 });
  await unlockPreviewGateIfNeeded(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(250);
  await assertNoHorizontalOverflow(page, label);
}

async function assertAuthPage(page) {
  const header = page.getByRole("heading").first();
  await header.waitFor({ state: "visible" });
}

async function login(page) {
  await gotoRoute(page, "/login", "login");
  await page.getByLabel("Email").fill(loginEmail);
  await page.getByLabel("Password").fill(loginPassword);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 45000 }),
    page.getByRole("button", { name: /sign in/i }).click(),
  ]);
  await page.waitForLoadState("networkidle", { timeout: 45000 });
}

async function assertWorkspaceChrome(page, viewport) {
  const appFrame = page.locator('[data-testid="app-frame"]');
  await appFrame.waitFor({ state: "visible", timeout: 45000 });

  const sidebarVisible = await page.locator('[data-testid="sidebar-nav"]').isVisible().catch(() => false);
  const bottomBarVisible = await page.locator('[data-testid="bottom-tab-bar"]').isVisible().catch(() => false);

  if (viewport.expectsSidebar && !sidebarVisible) {
    throw new Error(`Expected desktop sidebar for ${viewport.name}.`);
  }

  if (!viewport.expectsSidebar && !bottomBarVisible) {
    throw new Error(`Expected bottom tab bar for ${viewport.name}.`);
  }
}

async function assertPlannerWorkspace(page, viewport) {
  await page.locator('[data-testid="planner-workspace-shell"]').waitFor({ state: "visible", timeout: 45000 });
  await page.locator('[data-testid="planner-module-strip"]').waitFor({ state: "visible", timeout: 45000 });

  if (viewport.expectsSidebar) {
    const railVisible = await page.locator('[data-testid="planner-desktop-rail"]').isVisible();
    if (!railVisible) {
      throw new Error(`Planner desktop rail is missing on ${viewport.name}.`);
    }
  } else {
    const trigger = page.locator('[data-testid="planner-mobile-mara-trigger"]');
    await trigger.waitFor({ state: "visible", timeout: 45000 });
    await trigger.click();
    await page.getByRole("heading", { name: "Mara" }).waitFor({ state: "visible", timeout: 45000 });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  }
}

async function findTripRoutes(page) {
  if (preferredTripId) {
    return {
      plannedRoute: `/trips/${preferredTripId}`,
      liveRoute: `/trips/${preferredTripId}/live`,
    };
  }

  const hrefs = await page.locator('a[href*="/trips/"]').evaluateAll((links) =>
    links
      .map((link) => link.getAttribute("href"))
      .filter(Boolean)
  );

  const plannedHref = hrefs.find((href) => /^\/trips\/[^/?#]+$/.test(href));
  if (!plannedHref) {
    return { plannedRoute: null, liveRoute: null };
  }

  return {
    plannedRoute: plannedHref,
    liveRoute: `${plannedHref}/live`,
  };
}

async function runViewportSuite(browser, viewport) {
  const context = await browser.newContext({
    viewport: viewport.viewport,
    userAgent: viewport.userAgent,
    isMobile: viewport.isMobile,
    hasTouch: viewport.hasTouch,
    deviceScaleFactor: viewport.deviceScaleFactor,
  });
  const page = await context.newPage();
  const consoleErrors = await attachConsoleCapture(page);
  const warnings = [];

  try {
    await gotoRoute(page, "/", "homepage");
    await page.locator('[data-testid="homepage-hero"]').waitFor({ state: "visible", timeout: 45000 });
    await screenshot(page, viewport.name, "homepage");

    await gotoRoute(page, "/pricing", "pricing");
    await page.getByRole("heading", { name: /free for manual planning/i }).waitFor({ state: "visible", timeout: 45000 });
    await screenshot(page, viewport.name, "pricing");

    await gotoRoute(page, "/login", "login");
    await assertAuthPage(page);
    await screenshot(page, viewport.name, "login");

    await gotoRoute(page, "/signup", "signup");
    await assertAuthPage(page);
    await screenshot(page, viewport.name, "signup");

    await login(page);

    await gotoRoute(page, "/app", "app-home");
    await assertWorkspaceChrome(page, viewport);
    await page.locator('[data-testid="top-utility-bar"]').waitFor({ state: "visible", timeout: 45000 });
    await screenshot(page, viewport.name, "app-home");

    await gotoRoute(page, "/dashboard", "dashboard");
    await assertWorkspaceChrome(page, viewport);
    await assertPlannerWorkspace(page, viewport);
    await screenshot(page, viewport.name, "dashboard");

    await gotoRoute(page, "/trips/new", "trip-draft");
    await assertWorkspaceChrome(page, viewport);
    await assertPlannerWorkspace(page, viewport);
    await screenshot(page, viewport.name, "trip-draft");

    const discoveredRoutes = await findTripRoutes(page);
    if (discoveredRoutes.plannedRoute) {
      await gotoRoute(page, discoveredRoutes.plannedRoute, "trip-planned");
      await assertWorkspaceChrome(page, viewport);
      await assertPlannerWorkspace(page, viewport);
      await screenshot(page, viewport.name, "trip-planned");

      await gotoRoute(page, discoveredRoutes.liveRoute, "trip-live");
      await assertWorkspaceChrome(page, viewport);
      await screenshot(page, viewport.name, "trip-live");
    } else {
      warnings.push(`No non-draft trip route was available for ${viewport.name}; planned/live captures were skipped.`);
    }

    await gotoRoute(page, "/calendar", "calendar");
    await assertWorkspaceChrome(page, viewport);
    await screenshot(page, viewport.name, "calendar");

    await gotoRoute(page, "/billing", "billing");
    await assertWorkspaceChrome(page, viewport);
    await screenshot(page, viewport.name, "billing");

    await gotoRoute(page, "/profile", "profile");
    await assertWorkspaceChrome(page, viewport);
    await screenshot(page, viewport.name, "profile");
  } catch (error) {
    await page.screenshot({ path: path.join(outputDir, `failure-${viewport.name}.png`), fullPage: true });
    throw error;
  } finally {
    await context.close();
  }

  if (consoleErrors.length) {
    throw new Error(`Console errors on ${viewport.name}:\n${consoleErrors.join("\n")}`);
  }

  return warnings;
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  await ensureServerReachable();

  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
  } catch {
    browser = await chromium.launch({ headless: true });
  }

  try {
    const warnings = [];
    for (const viewport of viewports) {
      warnings.push(...(await runViewportSuite(browser, viewport)));
    }

    if (warnings.length) {
      console.warn(warnings.join("\n"));
    }

    console.log(`UI regression checks passed. Screenshots saved to ${outputDir}`);
  } finally {
    await browser?.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
