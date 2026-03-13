import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";

const outputPath = path.resolve("public/characters/mara-portrait-openai.png");
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is not set.");
}

const client = new OpenAI({ apiKey });

const prompt = [
  "Create a polished illustrated character portrait for Mara, the friendly concierge inside a modern trip-planning app.",
  "Female-presenting travel guide, bust portrait, warm smile, bright expressive eyes, approachable and capable.",
  "Style should feel like a premium app mascot: soft clean illustration, slightly playful, elegant, not childish, not photorealistic.",
  "Take inspiration from friendly travel concierge artwork: sun hat or subtle travel styling, relaxed posture, welcoming expression.",
  "Use Parqara brand colors: teal, deep navy, sea-glass, soft sand, warm cream.",
  "Simple airy background with soft sky-like gradient glow, minimal clutter, no props, no text, no lettering, no logos, no badges, no name tags, no border, no frame.",
  "Square composition, centered, readable at small dashboard sizes, high-contrast face and silhouette."
].join(" ");

const result = await client.images.generate({
  model: "gpt-image-1",
  prompt,
  size: "1024x1024",
  quality: "high",
});

const imageBase64 = result.data?.[0]?.b64_json;

if (!imageBase64) {
  throw new Error("OpenAI did not return image data.");
}

await fs.writeFile(outputPath, Buffer.from(imageBase64, "base64"));
console.log(`Saved ${outputPath}`);
