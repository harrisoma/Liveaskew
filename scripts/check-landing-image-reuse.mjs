#!/usr/bin/env node
/**
 * Build guard: ensure every image asset imported into the landing page
 * (src/routes/index.tsx) is referenced exactly once outside its import line.
 *
 * Fails the build (exit 1) if any image identifier is reused.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = resolve(__dirname, "../src/routes/index.tsx");

const source = readFileSync(FILE, "utf8");
const lines = source.split("\n");

// 1) Collect image identifiers from import statements.
//    Match imports whose path looks like an image/asset.
const imageImportRe =
  /^\s*import\s+(\w+)\s+from\s+["']([^"']+\.(?:jpe?g|png|gif|webp|avif|svg|png\.asset\.json|jpg\.asset\.json))["']\s*;?\s*$/;

const imageIdents = new Map(); // ident -> import path
const importLineNumbers = new Set();

lines.forEach((line, idx) => {
  const m = line.match(imageImportRe);
  if (m) {
    imageIdents.set(m[1], m[2]);
    importLineNumbers.add(idx);
  }
});

if (imageIdents.size === 0) {
  console.log("✓ landing-image-reuse: no landing images (home is the mobile app).");
  process.exit(0);
}

// 2) Count occurrences of each ident in the file body, excluding the import lines.
const bodyLines = lines.filter((_, idx) => !importLineNumbers.has(idx));
const body = bodyLines.join("\n");

const offenders = [];
for (const ident of imageIdents.keys()) {
  // Whole-word match so `avatar01` doesn't match `avatar010`.
  const re = new RegExp(`\\b${ident}\\b`, "g");
  const count = (body.match(re) || []).length;
  if (count > 1) offenders.push({ ident, count });
}

if (offenders.length > 0) {
  console.error("");
  console.error(
    "✗ landing-image-reuse: image assets reused on the landing page (src/routes/index.tsx).",
  );
  console.error("  Each imported image must appear exactly once outside its import statement.");
  console.error("");
  for (const { ident, count } of offenders) {
    console.error(`    • ${ident}  used ${count}×  (${imageIdents.get(ident)})`);
  }
  console.error("");
  process.exit(1);
}

console.log(
  `✓ landing-image-reuse: ${imageIdents.size} image assets, each used exactly once.`,
);
