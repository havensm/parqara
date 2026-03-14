import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function printUsage() {
  console.log(`Usage: node scripts/create-pr.mjs [options]

Creates a GitHub pull request for the current branch.

Options:
  --title <value>       Pull request title. Defaults to the latest commit subject.
  --body <value>        Pull request body markdown.
  --body-file <path>    Read the pull request body from a file.
  --base <branch>       Base branch to target. Defaults to main.
  --head <branch>       Head branch to use. Defaults to the current git branch.
  --repo <owner/name>   GitHub repository slug. Defaults to origin remote.
  --draft               Create the pull request as a draft.
  --dry-run             Print the payload without calling GitHub.
  --help                Show this help output.
`);
}

function readFlagValue(argv, index, flag) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}.`);
  }

  return value;
}

function parseArgs(argv) {
  const options = {
    base: "main",
    body: null,
    bodyFile: null,
    draft: false,
    dryRun: false,
    head: null,
    repo: null,
    title: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--draft") {
      options.draft = true;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg.startsWith("--title=")) {
      options.title = arg.slice("--title=".length);
      continue;
    }

    if (arg === "--title") {
      options.title = readFlagValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg.startsWith("--body=")) {
      options.body = arg.slice("--body=".length);
      continue;
    }

    if (arg === "--body") {
      options.body = readFlagValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg.startsWith("--body-file=")) {
      options.bodyFile = arg.slice("--body-file=".length);
      continue;
    }

    if (arg === "--body-file") {
      options.bodyFile = readFlagValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg.startsWith("--base=")) {
      options.base = arg.slice("--base=".length);
      continue;
    }

    if (arg === "--base") {
      options.base = readFlagValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg.startsWith("--head=")) {
      options.head = arg.slice("--head=".length);
      continue;
    }

    if (arg === "--head") {
      options.head = readFlagValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg.startsWith("--repo=")) {
      options.repo = arg.slice("--repo=".length);
      continue;
    }

    if (arg === "--repo") {
      options.repo = readFlagValue(argv, index, arg);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function parseDotEnv(source) {
  const values = {};

  for (const line of source.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex < 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value.replace(/\\n/gu, "\n");
  }

  return values;
}

async function loadLocalEnv() {
  const envValues = {};

  for (const fileName of [".env.local", ".env"]) {
    const filePath = path.resolve(fileName);

    try {
      const source = await fs.readFile(filePath, "utf8");
      Object.assign(envValues, parseDotEnv(source));
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw error;
      }
    }
  }

  return envValues;
}

async function runGit(args) {
  const { stdout } = await execFileAsync("git", args, {
    cwd: process.cwd(),
  });

  return stdout.trim();
}

function parseRepoSlug(remoteUrl) {
  const cleaned = remoteUrl.replace(/\.git$/u, "");
  const httpsMatch = cleaned.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)$/iu);
  if (httpsMatch) {
    return `${httpsMatch[1]}/${httpsMatch[2]}`;
  }

  const sshMatch = cleaned.match(/^git@github\.com:([^/]+)\/([^/]+)$/iu);
  if (sshMatch) {
    return `${sshMatch[1]}/${sshMatch[2]}`;
  }

  return null;
}

function getGitHubToken(localEnv) {
  const token =
    process.env.GH_TOKEN ||
    process.env.GITHUB_TOKEN ||
    localEnv.GH_TOKEN ||
    localEnv.GITHUB_TOKEN ||
    "";

  return token.trim();
}

async function resolveRepoSlug(explicitRepo) {
  if (explicitRepo) {
    return explicitRepo;
  }

  const originUrl = await runGit(["remote", "get-url", "origin"]);
  const repoSlug = parseRepoSlug(originUrl);
  if (!repoSlug) {
    throw new Error("Could not infer a GitHub repo from origin. Pass --repo owner/name.");
  }

  return repoSlug;
}

async function resolveHeadBranch(explicitHead) {
  if (explicitHead) {
    return explicitHead;
  }

  const branchName = await runGit(["branch", "--show-current"]);
  if (!branchName) {
    throw new Error("Could not determine the current branch. Pass --head explicitly.");
  }

  return branchName;
}

async function resolveTitle(explicitTitle) {
  if (explicitTitle) {
    return explicitTitle;
  }

  const latestCommitTitle = await runGit(["log", "-1", "--pretty=%s"]);
  if (!latestCommitTitle) {
    throw new Error("Could not determine a pull request title. Pass --title explicitly.");
  }

  return latestCommitTitle;
}

async function resolveBody(body, bodyFile) {
  if (bodyFile) {
    return fs.readFile(path.resolve(bodyFile), "utf8");
  }

  return body ?? "";
}

function buildHeadRef(repoSlug, headBranch) {
  if (headBranch.includes(":")) {
    return headBranch;
  }

  const [owner] = repoSlug.split("/");
  return `${owner}:${headBranch}`;
}

async function githubRequest({ body, method, route, token }) {
  const response = await fetch(`https://api.github.com${route}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "parqara-pr-script",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const raw = await response.text();
  const payload = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? payload.message
        : response.statusText;

    throw new Error(`GitHub API ${response.status}: ${message}`);
  }

  return payload;
}

async function findExistingPullRequest({ base, headRef, repoSlug, token }) {
  const pulls = await githubRequest({
    method: "GET",
    route: `/repos/${repoSlug}/pulls?state=open&base=${encodeURIComponent(base)}&head=${encodeURIComponent(
      headRef
    )}`,
    token,
  });

  return Array.isArray(pulls) ? pulls[0] ?? null : null;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  const localEnv = await loadLocalEnv();
  const token = getGitHubToken(localEnv);
  if (!token && !options.dryRun) {
    throw new Error(
      "Missing GH_TOKEN or GITHUB_TOKEN. Add one to your shell, .env.local, or .env before creating PRs."
    );
  }

  const repoSlug = await resolveRepoSlug(options.repo);
  const headBranch = await resolveHeadBranch(options.head);
  const headRef = buildHeadRef(repoSlug, headBranch);
  const title = await resolveTitle(options.title);
  const body = await resolveBody(options.body, options.bodyFile);

  if (headBranch === options.base) {
    throw new Error("Head and base branches are the same. Pass a different --base or --head.");
  }

  const payload = {
    base: options.base,
    body,
    draft: options.draft,
    head: headBranch,
    title,
  };

  if (options.dryRun) {
    // Prefer the API payload over browser automation so Codex can open PRs without a GUI.
    console.log(JSON.stringify({ repo: repoSlug, ...payload }, null, 2));
    return;
  }

  const existingPullRequest = await findExistingPullRequest({
    base: options.base,
    headRef,
    repoSlug,
    token,
  });

  if (existingPullRequest) {
    console.log(`Pull request already exists: ${existingPullRequest.html_url}`);
    return;
  }

  const createdPullRequest = await githubRequest({
    body: payload,
    method: "POST",
    route: `/repos/${repoSlug}/pulls`,
    token,
  });

  console.log(`Created PR #${createdPullRequest.number}: ${createdPullRequest.html_url}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
