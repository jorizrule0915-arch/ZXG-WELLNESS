import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stackedLogo = path.join(
  repoRoot,
  "src",
  "assets",
  "Logo",
  "official",
  "gxz-stacked-dark.webp",
);

const logo = await sharp(stackedLogo)
  .resize({ width: 640, height: 360, fit: "contain" })
  .png()
  .toBuffer();
const image = await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 4,
    background: "#050505",
  },
})
  .composite([{ input: logo, gravity: "center" }])
  .png()
  .toBuffer();

await fs.writeFile(path.join(repoRoot, "public", "og", "gxz-search-share.png"), image);
console.log("Generated the centered GXZ search and sharing image.");
