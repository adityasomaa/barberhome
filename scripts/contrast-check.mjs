#!/usr/bin/env node
/**
 * Barberhome - WCAG contrast gate.
 * Parses the design tokens out of src/app/globals.css and asserts every
 * declared foreground/background pairing clears its required ratio.
 * Run: npm run check:contrast
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const srgb = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const hexToRgb = (hex) => {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
};
const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map(srgb);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const ratio = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

function readTokens() {
  const css = readFileSync(join(root, "src/app/globals.css"), "utf8");
  const tokens = {};
  for (const [, name, value] of css.matchAll(/--(c-[a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8});/g)) {
    tokens[name] = value;
  }
  return tokens;
}

/** [foreground, background, minimum ratio, human label] */
const PAIRS = [
  ["c-fg", "c-bg", 4.5, "body text on page ground"],
  ["c-fg", "c-surface", 4.5, "body text on raised surface"],
  ["c-fg", "c-surface-2", 4.5, "body text on inset surface"],
  ["c-muted", "c-bg", 4.5, "secondary text on page ground"],
  ["c-muted", "c-surface", 4.5, "secondary text on raised surface"],
  ["c-muted", "c-surface-2", 4.5, "secondary text on inset surface"],
  ["c-accent", "c-bg", 4.5, "accent text on page ground"],
  ["c-accent", "c-surface", 4.5, "accent text on raised surface"],
  ["c-accent", "c-surface-2", 4.5, "accent text on inset surface"],
  ["c-on-accent", "c-accent", 4.5, "label on accent fill"],
  ["c-fg", "c-danger", 4.5, "label on danger fill"],
  ["c-danger-fg", "c-bg", 4.5, "error text on page ground"],
  ["c-danger-fg", "c-surface", 4.5, "error text on raised surface"],
  ["c-danger-fg", "c-surface-2", 4.5, "error text on inset surface"],
  ["c-line-strong", "c-bg", 3, "control border on page ground"],
  ["c-line-strong", "c-surface", 3, "control border on raised surface"],
  ["c-accent", "c-surface-3", 4.5, "accent text on selected surface"],
  ["c-fg", "c-surface-3", 4.5, "body text on selected surface"],
];

const tokens = readTokens();
let failed = 0;
const rows = [];
for (const [fg, bg, min, label] of PAIRS) {
  if (!tokens[fg] || !tokens[bg]) {
    rows.push(["MISSING", `${fg} / ${bg}`, "-", min, label]);
    failed++;
    continue;
  }
  const r = ratio(tokens[fg], tokens[bg]);
  const ok = r >= min;
  if (!ok) failed++;
  rows.push([ok ? "PASS" : "FAIL", `${tokens[fg]} on ${tokens[bg]}`, r.toFixed(2), min, label]);
}

const w = (s, n) => String(s).padEnd(n);
console.log(`${w("", 6)}${w("pair", 24)}${w("ratio", 8)}${w("min", 6)}label`);
for (const [status, pair, r, min, label] of rows) {
  console.log(`${w(status, 6)}${w(pair, 24)}${w(r, 8)}${w(min, 6)}${label}`);
}
console.log(`\n${rows.length - failed}/${rows.length} pairings pass.`);
if (failed) {
  console.error(`\n${failed} contrast pairing(s) below the WCAG AA floor.`);
  process.exit(1);
}
