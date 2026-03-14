import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium, devices } from "playwright";

const baseUrl = process.env.PARQARA_UI_BASE_URL ?? "http://127.0.0.1:3000";
const previewGatePassword = process.env.PREVIEW_GATE_PASSWORD ?? "yard";
const outputDir = path.join(process.cwd(), "output", "playwright", "homepage");

const viewports = [
  {
    name: "desktop",
    viewport: { width: 1440, height: 1200 },
  },
  {
    name: "tablet",
    viewport: { width: 1024, height: 1366 },
  },
  {
    name: "mobile",
    viewport: devices["iPhone 13"].viewport,
    userAgent: devices["iPhone 13"].userAgent,
    isMobile: devices["iPhone 13"].isMobile,
    hasTouch: devices["iPhone 13"].hasTouch,
    deviceScaleFactor: devices["iPhone 13"].deviceScaleFactor,
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
      `Homepage UI check could not reach ${baseUrl}. Start the app first with npm run dev. ${error instanceof Error ? error.message : String(error)}`
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

async function getBox(page, selector) {
  const locator = page.locator(`${selector}:visible`).first();
  await locator.waitFor({ state: "visible" });
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error(`Expected visible element for selector ${selector}`);
  }
  return box;
}

function intersects(a, b) {
  return !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
}

function contains(container, child) {
  return (
    child.x >= container.x - 1 &&
    child.y >= container.y - 1 &&
    child.x + child.width <= container.x + container.width + 1 &&
    child.y + child.height <= container.y + container.height + 1
  );
}

async function assertNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  if (dimensions.scrollWidth > dimensions.clientWidth + 2) {
    throw new Error(`Homepage overflows horizontally: ${dimensions.scrollWidth}px > ${dimensions.clientWidth}px`);
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

async function runChecks(page, name) {
  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 45000 });
  await unlockPreviewGateIfNeeded(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForSelector('[data-testid="homepage-hero"]', { timeout: 45000 });
  await page.waitForTimeout(250);

  await assertNoHorizontalOverflow(page);

  const heroContainer = await getBox(page, '[data-testid="homepage-hero-visual"]');
  const heroRoute = await getBox(page, '[data-testid="hero-route-card"]');
  const heroShared = await getBox(page, '[data-testid="hero-shared-plan-card"]');
  const heroStatus = await getBox(page, '[data-testid="hero-status-card"]');
  const heroLive = await getBox(page, '[data-testid="hero-live-card"]');
  const heroMara = await getBox(page, '[data-testid="hero-mara-panel"]');

  for (const [label, box] of [
    ["hero route card", heroRoute],
    ["hero shared plan card", heroShared],
    ["hero status card", heroStatus],
    ["hero live card", heroLive],
    ["hero Mara panel", heroMara],
  ]) {
    if (!contains(heroContainer, box)) {
      throw new Error(`${label} extends outside the homepage hero visual on ${name}.`);
    }
  }

  const heroPairs = [
    ["hero route card", heroRoute, "hero live card", heroLive],
    ["hero route card", heroRoute, "hero Mara panel", heroMara],
    ["hero shared plan card", heroShared, "hero status card", heroStatus],
    ["hero live card", heroLive, "hero Mara panel", heroMara],
  ];

  for (const [labelA, boxA, labelB, boxB] of heroPairs) {
    if (intersects(boxA, boxB)) {
      throw new Error(`${labelA} overlaps ${labelB} on ${name}.`);
    }
  }

  const routeContainer = await getBox(page, '[data-testid="route-board-visual"]');
  const routeFlow = await getBox(page, '[data-testid="route-board-flow"]');
  const routeMap = await getBox(page, '[data-testid="route-board-map"]');
  const routeDecisions = await getBox(page, '[data-testid="route-board-decisions"]');

  for (const [label, box] of [
    ["route flow", routeFlow],
    ["route map", routeMap],
    ["route decisions", routeDecisions],
  ]) {
    if (!contains(routeContainer, box)) {
      throw new Error(`${label} extends outside the route board visual on ${name}.`);
    }
  }

  const routePairs = [
    ["route flow", routeFlow, "route map", routeMap],
    ["route map", routeMap, "route decisions", routeDecisions],
    ["route flow", routeFlow, "route decisions", routeDecisions],
  ];

  for (const [labelA, boxA, labelB, boxB] of routePairs) {
    if (intersects(boxA, boxB)) {
      throw new Error(`${labelA} overlaps ${labelB} on ${name}.`);
    }
  }

  const agentContainer = await getBox(page, '[data-testid="agent-team-visual"]');
  const agentMara = await getBox(page, '[data-testid="agent-team-mara-card"]');
  const agentSpecialists = await getBox(page, '[data-testid="agent-team-specialists"]');

  if (!contains(agentContainer, agentMara) || !contains(agentContainer, agentSpecialists)) {
    throw new Error(`The agent-team visual escapes its container on ${name}.`);
  }

  if (intersects(agentMara, agentSpecialists)) {
    throw new Error(`The Mara card overlaps the specialist agent grid on ${name}.`);
  }

  await page.screenshot({ path: path.join(outputDir, `homepage-${name}.png`), fullPage: true });
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
    for (const config of viewports) {
      const context = await browser.newContext({
        viewport: config.viewport,
        userAgent: config.userAgent,
        isMobile: config.isMobile,
        hasTouch: config.hasTouch,
        deviceScaleFactor: config.deviceScaleFactor,
      });
      const page = await context.newPage();
      const consoleErrors = await attachConsoleCapture(page);
      let runError = null;

      try {
        await runChecks(page, config.name);
      } catch (error) {
        runError = error;
        await page.screenshot({ path: path.join(outputDir, `homepage-${config.name}-failure.png`), fullPage: true });
      }

      await context.close();

      if (runError) {
        throw runError;
      }

      if (consoleErrors.length) {
        throw new Error(`Console errors on ${config.name}:\n${consoleErrors.join("\n")}`);
      }
    }

    console.log(`Homepage UI checks passed. Screenshots saved to ${outputDir}`);
  } finally {
    await browser?.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});


