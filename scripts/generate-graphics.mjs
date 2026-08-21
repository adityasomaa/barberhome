#!/usr/bin/env node
/**
 * Barberhome - deterministic generative graphics.
 *
 * Every image on the site is produced here. No stock photography, no remote
 * placeholder service, no rasterised assets: each tile is an SVG drawn from a
 * seeded PRNG, so `npm run graphics` always regenerates byte-identical files
 * and the whole visual family can be re-rolled by changing a seed.
 *
 * The shared language across every tile:
 *   - one ink ground, two hairline greys, one accent, used once per tile
 *   - straight-edged geometry borrowed from barbershop tooling
 *   - a soft top-left key light and a corner vignette so tiles sit together
 *
 * Nothing here depicts a person, a face, or a haircut.
 */
import { mkdirSync, writeFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "graphics");

const INK = "#0e100f";
const SURFACE = "#171a19";
const LINE = "#2e3331";
const LINE_2 = "#454b49";
const ACCENT = "#ff6a3d";

/* -- Seeded PRNG ---------------------------------------------------------- */
function hash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rng(seed) {
  const r = mulberry32(hash(seed));
  return {
    next: r,
    range: (lo, hi) => lo + r() * (hi - lo),
    int: (lo, hi) => Math.floor(lo + r() * (hi - lo + 1)),
    pick: (arr) => arr[Math.floor(r() * arr.length)],
    chance: (p) => r() < p,
  };
}

const n = (v) => Math.round(v * 100) / 100;

/* -- Shared chrome -------------------------------------------------------- */
function chromeDefs(id, w, h) {
  return [
    "<defs>",
    `<linearGradient id="key-${id}" x1="0" y1="0" x2="1" y2="1">`,
    '<stop offset="0" stop-color="#ffffff" stop-opacity="0.055"/>',
    '<stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/>',
    "</linearGradient>",
    `<radialGradient id="vig-${id}" cx="0.5" cy="0.42" r="0.78">`,
    '<stop offset="0.45" stop-color="#000000" stop-opacity="0"/>',
    '<stop offset="1" stop-color="#000000" stop-opacity="0.55"/>',
    "</radialGradient>",
    `<clipPath id="clip-${id}"><rect x="0" y="0" width="${w}" height="${h}"/></clipPath>`,
    "</defs>",
  ].join("");
}

function wrap({ id, w, h, body, title }) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title}" preserveAspectRatio="xMidYMid slice">`,
    chromeDefs(id, w, h),
    `<rect width="${w}" height="${h}" fill="${INK}"/>`,
    `<g clip-path="url(#clip-${id})">`,
    body,
    "</g>",
    `<rect width="${w}" height="${h}" fill="url(#key-${id})"/>`,
    `<rect width="${w}" height="${h}" fill="url(#vig-${id})"/>`,
    "</svg>",
    "",
  ].join("\n");
}

/* -- Motifs --------------------------------------------------------------- */

/** Barber pole, read as a field of shearing diagonal bands. */
function pole(r, w, h) {
  const parts = [`<rect width="${w}" height="${h}" fill="${SURFACE}" opacity="0.5"/>`];
  const band = r.range(w * 0.055, w * 0.085);
  const slant = r.range(0.5, 0.85);
  const accentBand = r.int(2, 6);
  let i = 0;
  for (let x = -h * slant - band * 4; x < w + band * 2; x += band) {
    const isAccent = i === accentBand;
    const op = isAccent ? 1 : r.range(0.16, 0.4);
    const fill = isAccent ? ACCENT : i % 2 === 0 ? LINE_2 : LINE;
    const width = isAccent ? band * 0.26 : band * r.range(0.3, 0.55);
    parts.push(
      `<path d="M ${n(x)} ${h} L ${n(x + h * slant)} 0 L ${n(x + h * slant + width)} 0 L ${n(x + width)} ${h} Z" fill="${fill}" opacity="${n(op)}"/>`,
    );
    i++;
  }
  return parts.join("\n");
}

/** Comb teeth: a ruled field of vertical strokes with a varying baseline. */
function comb(r, w, h) {
  const parts = [];
  const gap = r.range(w / 46, w / 30);
  const accentAt = r.int(6, 18);
  const freq = r.range(0.8, 1.5);
  let i = 0;
  for (let x = gap; x < w - gap * 0.5; x += gap) {
    const t = i / (w / gap);
    const len = h * (0.24 + 0.5 * Math.abs(Math.sin(t * Math.PI * freq + 0.6)));
    const isAccent = i === accentAt;
    parts.push(
      `<rect x="${n(x)}" y="${n(h - len)}" width="${n(gap * 0.2)}" height="${n(len)}" fill="${isAccent ? ACCENT : LINE_2}" opacity="${isAccent ? 1 : n(r.range(0.3, 0.7))}"/>`,
    );
    i++;
  }
  parts.push(`<rect x="0" y="${n(h * 0.97)}" width="${w}" height="${n(h * 0.012)}" fill="${LINE_2}" opacity="0.6"/>`);
  return parts.join("\n");
}

/** Clipper blade: nested chevrons stepping across the frame. */
function blade(r, w, h) {
  const parts = [];
  const rows = r.int(9, 14);
  const step = h / rows;
  const peak = r.range(w * 0.14, w * 0.26);
  const accentRow = r.int(1, rows - 2);
  for (let i = 0; i < rows; i++) {
    const y = step * i + step * 0.5;
    const isAccent = i === accentRow;
    const pts = [];
    const teeth = r.int(4, 7);
    for (let k = 0; k <= teeth; k++) {
      const x = (w / teeth) * k;
      pts.push(`${n(x)},${n(y + (k % 2 === 0 ? -peak * 0.12 : peak * 0.12))}`);
    }
    parts.push(
      `<polyline points="${pts.join(" ")}" fill="none" stroke="${isAccent ? ACCENT : LINE_2}" stroke-width="${n(isAccent ? step * 0.14 : step * r.range(0.05, 0.11))}" opacity="${isAccent ? 1 : n(r.range(0.35, 0.8))}" stroke-linejoin="round"/>`,
    );
  }
  return parts.join("\n");
}

/** Hex floor tile, the classic barbershop mosaic. */
function tile(r, w, h) {
  const parts = [];
  const R = r.range(w / 22, w / 15);
  const dx = R * Math.sqrt(3);
  const dy = R * 1.5;
  const accentCol = r.int(2, 8);
  const accentRow = r.int(1, 6);
  let row = 0;
  for (let y = -dy; y < h + dy; y += dy) {
    let col = 0;
    const offset = row % 2 ? dx / 2 : 0;
    for (let x = -dx; x < w + dx; x += dx) {
      const cx = x + offset;
      const pts = [];
      for (let k = 0; k < 6; k++) {
        const a = (Math.PI / 3) * k - Math.PI / 6;
        pts.push(`${n(cx + R * Math.cos(a))},${n(y + R * Math.sin(a))}`);
      }
      const isAccent = row === accentRow && col === accentCol;
      const filled = isAccent || r.chance(0.16);
      parts.push(
        `<polygon points="${pts.join(" ")}" fill="${isAccent ? ACCENT : filled ? SURFACE : "none"}" fill-opacity="${isAccent ? 1 : filled ? 0.9 : 0}" stroke="${LINE}" stroke-width="${n(R * 0.055)}"/>`,
      );
      col++;
    }
    row++;
  }
  return parts.join("\n");
}

/** Straight-razor sweep: concentric arcs opening from one corner. */
function razor(r, w, h) {
  const parts = [`<rect width="${w}" height="${h}" fill="${SURFACE}" opacity="0.35"/>`];
  const cx = r.chance(0.5) ? w * r.range(-0.15, 0.12) : w * r.range(0.88, 1.15);
  const cy = h * r.range(0.9, 1.2);
  const count = r.int(11, 18);
  const accentAt = r.int(2, count - 2);
  const base = Math.hypot(w, h);
  for (let i = 0; i < count; i++) {
    const rad = base * (0.14 + (i / count) * r.range(0.85, 1.05));
    const isAccent = i === accentAt;
    parts.push(
      `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(rad)}" fill="none" stroke="${isAccent ? ACCENT : LINE_2}" stroke-width="${n(isAccent ? base * 0.005 : base * r.range(0.0012, 0.0032))}" opacity="${isAccent ? 1 : n(r.range(0.28, 0.7))}"/>`,
    );
  }
  return parts.join("\n");
}

/** Leather strop: a tight crosshatch weave. */
function strop(r, w, h) {
  const parts = [`<rect width="${w}" height="${h}" fill="${SURFACE}" opacity="0.45"/>`];
  const gap = r.range(w / 40, w / 26);
  const accentAt = r.int(4, 14);
  let i = 0;
  for (let x = -h; x < w + h; x += gap) {
    parts.push(
      `<line x1="${n(x)}" y1="0" x2="${n(x + h)}" y2="${h}" stroke="${i === accentAt ? ACCENT : LINE_2}" stroke-width="${n(i === accentAt ? gap * 0.22 : gap * r.range(0.05, 0.12))}" opacity="${i === accentAt ? 1 : n(r.range(0.2, 0.5))}"/>`,
    );
    i++;
  }
  for (let x = -h; x < w + h; x += gap * r.range(1.4, 2.1)) {
    parts.push(
      `<line x1="${n(x)}" y1="${h}" x2="${n(x + h)}" y2="0" stroke="${LINE}" stroke-width="${n(gap * r.range(0.05, 0.1))}" opacity="${n(r.range(0.2, 0.45))}"/>`,
    );
  }
  return parts.join("\n");
}

/** Talc stipple: a graded dot field. */
function talc(r, w, h) {
  const parts = [];
  const count = r.int(340, 520);
  const accentAt = r.int(20, count - 20);
  for (let i = 0; i < count; i++) {
    const x = r.range(0, w);
    const y = r.range(0, h);
    const bias = 1 - y / h;
    const rad = r.range(w * 0.0012, w * 0.0055) * (0.5 + bias);
    const isAccent = i === accentAt;
    parts.push(
      `<circle cx="${n(x)}" cy="${n(y)}" r="${n(isAccent ? rad * 3 : rad)}" fill="${isAccent ? ACCENT : LINE_2}" opacity="${isAccent ? 1 : n(r.range(0.15, 0.65) * (0.4 + bias))}"/>`,
    );
  }
  for (let i = 0; i < 5; i++) {
    const y = r.range(h * 0.15, h * 0.9);
    parts.push(`<rect x="0" y="${n(y)}" width="${w}" height="1" fill="${LINE}" opacity="${n(r.range(0.3, 0.7))}"/>`);
  }
  return parts.join("\n");
}

/** Mirror frame: concentric rounded rectangles under a row of bulbs. */
function mirror(r, w, h) {
  const parts = [`<rect width="${w}" height="${h}" fill="${SURFACE}" opacity="0.4"/>`];
  const rings = r.int(7, 11);
  const accentAt = r.int(1, rings - 2);
  const min = Math.min(w, h);
  for (let i = 0; i < rings; i++) {
    const t = i / rings;
    const inset = min * 0.04 + t * min * 0.42;
    const isAccent = i === accentAt;
    parts.push(
      `<rect x="${n(inset)}" y="${n(inset)}" width="${n(w - inset * 2)}" height="${n(h - inset * 2)}" rx="${n(min * 0.02)}" fill="none" stroke="${isAccent ? ACCENT : LINE_2}" stroke-width="${n(isAccent ? min * 0.006 : min * r.range(0.0015, 0.0035))}" opacity="${isAccent ? 1 : n(r.range(0.3, 0.75))}"/>`,
    );
  }
  const bulbs = r.int(7, 12);
  for (let i = 0; i < bulbs; i++) {
    const x = (w / (bulbs + 1)) * (i + 1);
    parts.push(`<circle cx="${n(x)}" cy="${n(h * 0.055)}" r="${n(min * 0.006)}" fill="${LINE_2}" opacity="0.8"/>`);
  }
  return parts.join("\n");
}

const MOTIFS = { pole, comb, blade, tile, razor, strop, talc, mirror };

/* -- Wordmark -------------------------------------------------------------
   "BARBERHOME" set as drawn geometry, not a font reference, so the mark
   renders identically in the OG card, the app icon, and anywhere SVG lands.
   Each glyph is a stroked path on a 100-unit em.                           */
const GLYPHS = {
  A: "M6 100 L32 0 L58 0 L84 100 M20 62 L70 62",
  B: "M10 0 L10 100 M10 0 L58 0 Q80 0 80 25 Q80 50 58 50 L10 50 M10 50 L62 50 Q84 50 84 75 Q84 100 62 100 L10 100",
  E: "M14 0 L14 100 M14 0 L80 0 M14 50 L68 50 M14 100 L80 100",
  H: "M12 0 L12 100 M78 0 L78 100 M12 50 L78 50",
  M: "M8 100 L8 0 L45 66 L82 0 L82 100",
  O: "M45 0 Q84 0 84 50 Q84 100 45 100 Q6 100 6 50 Q6 0 45 0 Z",
  R: "M12 0 L12 100 M12 0 L60 0 Q82 0 82 28 Q82 56 60 56 L12 56 M50 56 L84 100",
};

function wordmarkPaths(word, { x = 0, y = 0, size = 100, tracking = 8 } = {}) {
  const s = size / 100;
  const out = [];
  let cursor = x;
  for (const ch of word.toUpperCase()) {
    const d = GLYPHS[ch];
    if (!d) {
      cursor += size * 0.5;
      continue;
    }
    out.push(`<path d="${d}" transform="translate(${n(cursor)} ${n(y)}) scale(${n(s)})"/>`);
    cursor += 92 * s + tracking;
  }
  return { paths: out.join(""), width: cursor - x - tracking };
}

/* -- Build ---------------------------------------------------------------- */
const TILES = [
  { name: "hero", motif: "pole", w: 1600, h: 1000, title: "Pola pita diagonal dalam warna aksen Barberhome" },
  { name: "service-potong-rambut", motif: "comb", w: 900, h: 675, title: "Pola garis sisir bergaris" },
  { name: "service-cukur-jenggot", motif: "razor", w: 900, h: 675, title: "Pola busur konsentris menyapu" },
  { name: "service-keramas-pijat", motif: "talc", w: 900, h: 675, title: "Bidang titik berbutir bergradasi" },
  { name: "service-potong-anak", motif: "tile", w: 900, h: 675, title: "Pola ubin mozaik heksagonal" },
  { name: "service-pewarnaan", motif: "strop", w: 900, h: 675, title: "Pola anyaman garis silang" },
  { name: "service-perawatan", motif: "blade", w: 900, h: 675, title: "Pola rusuk chevron bertumpuk" },
  { name: "panel-book", motif: "mirror", w: 1200, h: 900, title: "Pola bingkai persegi konsentris" },
  { name: "panel-services", motif: "blade", w: 1200, h: 675, title: "Pola rusuk chevron bertumpuk" },
];

function build() {
  if (existsSync(OUT)) {
    for (const f of readdirSync(OUT)) rmSync(join(OUT, f));
  }
  mkdirSync(OUT, { recursive: true });

  for (const t of TILES) {
    const r = rng(`barberhome:v1:${t.name}`);
    const body = MOTIFS[t.motif](r, t.w, t.h);
    writeFileSync(join(OUT, `${t.name}.svg`), wrap({ id: t.name, w: t.w, h: t.h, body, title: t.title }));
  }

  const { paths, width } = wordmarkPaths("BARBERHOME", { size: 100, tracking: 10 });
  for (const [file, stroke] of [
    ["wordmark.svg", "#f2efe9"],
    ["wordmark-accent.svg", ACCENT],
  ]) {
    writeFileSync(
      join(OUT, file),
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 ${n(width + 16)} 116" role="img" aria-label="Barberhome"><g fill="none" stroke="${stroke}" stroke-width="11" stroke-linecap="square" stroke-linejoin="miter">${paths}</g></svg>\n`,
    );
  }

  const mono = wordmarkPaths("B", { size: 100, tracking: 0 });
  writeFileSync(
    join(OUT, "monogram.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="Barberhome"><rect width="128" height="128" rx="26" fill="${INK}"/><rect x="4" y="4" width="120" height="120" rx="23" fill="none" stroke="${ACCENT}" stroke-width="5"/><g transform="translate(30 20) scale(0.88)" fill="none" stroke="${ACCENT}" stroke-width="13" stroke-linecap="square">${mono.paths}</g></svg>\n`,
  );

  console.log(`Generated ${TILES.length + 3} graphics into public/graphics/`);
}

build();
