#!/usr/bin/env node
/**
 * Barberhome - Open Graph card.
 *
 * Rasterised at build time into a static PNG that Next serves straight from
 * the app directory. The alternative, generating it per request with
 * next/og, needs the font file to be present in the serverless bundle at
 * runtime; a card that 500s is worse than one that cannot change without a
 * rebuild. Nothing here is a photograph: the card is the wordmark over the
 * same generated pole motif the hero uses, so it belongs to the same visual
 * family as the site.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1200;
const H = 630;

const INK = "#0e100f";
const BONE = "#f2efe9";
const ACCENT = "#ff6a3d";

/** Reuse the generated hero tile so the card is not a separate design. */
function heroBody() {
  const svg = readFileSync(join(root, "public/graphics/hero.svg"), "utf8");
  const inner = svg.match(/<g clip-path="url\(#clip-hero\)">([\s\S]*?)<\/g>/);
  return inner ? inner[1] : "";
}

function build() {
  const wordmark = readFileSync(join(root, "public/graphics/wordmark.svg"), "utf8");
  const paths = wordmark.match(/<g[\s\S]*<\/g>/)?.[0] ?? "";

  // Wordmark is 1026 x 116 in its own viewBox; scale it to 62% of the card.
  const markWidth = W * 0.62;
  const markScale = markWidth / 1026;
  const markX = (W - markWidth) / 2;
  const markY = H * 0.42;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <clipPath id="card"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath>
    <radialGradient id="cardvig" cx="0.5" cy="0.45" r="0.8">
      <stop offset="0.3" stop-color="#000000" stop-opacity="0.2"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.82"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${INK}"/>
  <g clip-path="url(#card)" transform="translate(0 -60) scale(0.75)" opacity="0.75">
    ${heroBody()}
  </g>
  <rect width="${W}" height="${H}" fill="url(#cardvig)"/>
  <rect x="0" y="0" width="${W}" height="6" fill="${ACCENT}"/>
  <g transform="translate(${markX} ${markY}) scale(${markScale})" stroke="${BONE}">
    ${paths.replace(/stroke="#f2efe9"/, `stroke="${BONE}"`)}
  </g>
  <rect x="${markX}" y="${markY + 116 * markScale + 34}" width="${markWidth}" height="3" fill="${ACCENT}"/>
</svg>`;

  writeFileSync(join(root, "public/graphics/og.svg"), svg);

  return sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toFile(join(root, "src/app/opengraph-image.png"))
    .then((info) => {
      console.log(`OG card written: ${info.width}x${info.height}, ${info.size} bytes`);
    });
}

await build();
