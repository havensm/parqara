import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import OpenAI from "openai";

import { uiAssetManifest } from "./ui-asset-manifest.mjs";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const force = args.has("--force");
const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
const onlyIds = onlyArg
  ? new Set(onlyArg.replace("--only=", "").split(",").map((value) => value.trim()).filter(Boolean))
  : null;

const selectedAssets = onlyIds ? uiAssetManifest.filter((asset) => onlyIds.has(asset.id)) : uiAssetManifest;

if (!selectedAssets.length) {
  console.error("No UI assets matched the requested filters.");
  process.exit(1);
}

const apiKey = process.env.OPENAI_API_KEY;
if (!dryRun && !apiKey) {
  throw new Error(
    "OPENAI_API_KEY is not set. Run with `node --env-file=.env scripts/generate-ui-assets.mjs` or export the variable first."
  );
}

const client = apiKey ? new OpenAI({ apiKey }) : null;

// Keep generation manifest-driven so the same prompts can be rerun as the UI evolves.
for (const asset of selectedAssets) {
  const outputPath = path.resolve(asset.out);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  if (dryRun) {
    console.log(`[dry-run] ${asset.id} -> ${asset.out}`);
    console.log(asset.prompt);
    console.log("");
    continue;
  }

  if (!force) {
    try {
      await fs.access(outputPath);
      console.log(`Skipping existing ${asset.out}`);
      continue;
    } catch {
      // File does not exist; continue.
    }
  }

  console.log(`Generating ${asset.id} -> ${asset.out}`);

  const result = await client.images.generate({
    model: "gpt-image-1",
    prompt: asset.prompt,
    size: asset.size,
    quality: asset.quality,
    ...(asset.background ? { background: asset.background } : {}),
  });

  const imageBase64 = result.data?.[0]?.b64_json;
  if (!imageBase64) {
    throw new Error(`OpenAI did not return image data for ${asset.id}.`);
  }

  await fs.writeFile(outputPath, Buffer.from(imageBase64, "base64"));
}

console.log("UI asset generation complete.");

