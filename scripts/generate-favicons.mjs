import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(
  repoRoot,
  "src",
  "assets",
  "Logo",
  "official",
  "gxz-wordmark-dark.webp",
);
const stackedSource = path.join(
  repoRoot,
  "src",
  "assets",
  "Logo",
  "official",
  "gxz-stacked-dark.webp",
);
const publicDir = path.join(repoRoot, "public");

async function renderSquare(size) {
  const logo = await sharp(source)
    .resize({
      width: Math.round(size * 0.88),
      height: Math.round(size * 0.48),
      fit: "contain",
      withoutEnlargement: false,
    })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: "#050505",
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toBuffer();
}

function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size === 256 ? 0 : size, 0);
  entry.writeUInt8(size === 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);

  return Buffer.concat([header, entry, png]);
}

const outputs = [
  [16, "gxz-favicon-16x16.png"],
  [32, "gxz-favicon-32x32.png"],
  [48, "gxz-favicon-48x48.png"],
  [180, "gxz-apple-touch-icon.png"],
  [192, "gxz-android-chrome-192x192.png"],
  [512, "gxz-android-chrome-512x512.png"],
];

const rendered = new Map();
for (const [size, filename] of outputs) {
  const png = await renderSquare(size);
  rendered.set(size, png);
  await fs.writeFile(path.join(publicDir, filename), png);
}

await fs.writeFile(
  path.join(publicDir, "gxz-favicon.ico"),
  pngToIco(rendered.get(48), 48),
);

const shareLogo = await sharp(stackedSource)
  .resize({ width: 640, height: 360, fit: "contain" })
  .png()
  .toBuffer();
const shareImage = await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 4,
    background: "#050505",
  },
})
  .composite([{ input: shareLogo, gravity: "center" }])
  .png()
  .toBuffer();
await fs.writeFile(path.join(publicDir, "og", "gxz-search-share.png"), shareImage);

console.log("Generated GXZ favicon, app icon, and search sharing files.");
