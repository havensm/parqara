import { access, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const nextCli = join(repoRoot, "node_modules", "next", "dist", "bin", "next");
const nextBuildDir = join(repoRoot, ".next");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function removeWithRetry(targetPath, attempts = 6, delayMs = 2_000) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await rm(targetPath, { recursive: true, force: true });
      return;
    } catch (error) {
      if (attempt === attempts) {
        throw error;
      }

      await sleep(delayMs);
    }
  }
}

try {
  await access(nextBuildDir);
  await removeWithRetry(nextBuildDir);
} catch (error) {
  if (error && typeof error === "object" && "code" in error && error.code !== "ENOENT") {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Unable to clear .next before starting Next.js. This workspace may still have a local file lock (for example from OneDrive sync or another running dev session). Close any open app windows or pause sync, then retry. Original error: ${detail}`
    );
  }
}

try {
  await access(nextCli);
} catch {
  throw new Error(`Could not find ${nextCli}. Run npm install first.`);
}

const child = spawn(process.execPath, [nextCli, "dev", "--webpack", ...process.argv.slice(2)], {
  cwd: repoRoot,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

