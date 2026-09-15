#!/usr/bin/env node
/* ────────────────────────────────────────────────────────────────────────
   build_wasteland_map_links.js  —  Fallout76er's Wasteland Archive
   Regenerates the WM_CREATURES_BY_LANDMARK / WM_SCRAP_BY_LANDMARK /
   WM_INGREDIENT_BY_LANDMARK lookup blocks inside guides/wasteland-map.html
   (between the WM_LINKS:START / WM_LINKS:END markers) from the real data
   sources — SPAWN_DATA, SCRAP_DATA, INGREDIENT_DATA — matched against the
   landmark names already pinned in WM_LANDMARKS.

   WM_LANDMARKS itself (pin x/y coordinates) is READ-ONLY here and never
   touched — placing a brand-new landmark still requires the manual
   ORB-matching workflow (see the fo76-map-pin-repair skill). This script
   only keeps each *already-pinned* landmark's tooltip contents in sync, so
   a new SPAWN_DATA / SCRAP_DATA / INGREDIENT_DATA entry whose location
   name exactly matches an existing pin shows up on the map automatically,
   with zero hand-editing of wasteland-map.html.

   Reads:   ./spawn-data.js              (SPAWN_DATA)
            ./resources.js               (SCRAP_DATA, INGREDIENT_DATA)
            ./guides/wasteland-map.html  (WM_LANDMARKS — read-only)
   Writes:  ./guides/wasteland-map.html  (WM_LINKS:START..END block only —
            everything else in the file, including WM_LANDMARKS, is left
            byte-for-byte untouched)

   Re-run after any SPAWN_DATA, SCRAP_DATA, or INGREDIENT_DATA change:
     node build_wasteland_map_links.js
   ──────────────────────────────────────────────────────────────────────── */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Sandboxed (no require/process/fs in scope) so a corrupted data literal
// can't reach the filesystem or network even if it ever contained anything
// beyond an object/array literal — same pattern as build_llms.js.
const evalLiteral = (code) => vm.runInNewContext(code, Object.create(null));

function sliceBlock(src, startMarker, endMarker) {
  const start = src.indexOf(startMarker);
  if (start === -1) throw new Error(`${JSON.stringify(startMarker)} not found`);
  const end = src.indexOf(endMarker, start);
  if (end === -1) throw new Error(`closing ${JSON.stringify(endMarker)} not found after ${JSON.stringify(startMarker)}`);
  return src.slice(start, end);
}

function loadSpawnData() {
  const src = fs.readFileSync(path.join(__dirname, 'spawn-data.js'), 'utf8');
  const code = sliceBlock(src, 'const SPAWN_DATA = {', '\n};');
  return evalLiteral('(' + code.slice('const SPAWN_DATA = '.length) + '})');
}

function loadResourcesConst(varName) {
  const src = fs.readFileSync(path.join(__dirname, 'resources.js'), 'utf8');
  const code = sliceBlock(src, `const ${varName} = {`, '\n};');
  return evalLiteral('(' + code.slice(`const ${varName} = `.length) + '})');
}

function loadLandmarkNames(mapFile) {
  const src = fs.readFileSync(mapFile, 'utf8');
  const code = sliceBlock(src, 'const WM_LANDMARKS = [', '\n];');
  const arr = evalLiteral('(' + code.slice('const WM_LANDMARKS = '.length) + '])');
  return arr.map((l) => l.name);
}

// Matches build_creatures.js / build_llms.js exactly — must stay identical
// so generated hrefs point at real /creatures/<slug>.html files.
const creatureSlug = (name) => name.toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[()'".,]/g, '')
  .trim()
  .replace(/\s+/g, '-');

// Matches slugifyPbKey() in index.html exactly — must stay identical so
// generated hrefs resolve to a real Pip-Boy deep-link card.
const pbSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Some real-world locations get a shorter/plainer name on the map pin than
// the exact string used in SPAWN_DATA/SCRAP_DATA (event-suffixed, "(Town)"
// vs "Town", a named sub-building vs the landmark, etc). Exact-match alone
// would silently drop these — this table is the deliberate, audited list of
// known near-misses (verified against the pre-generator hand-curated data
// 2026-09-15), not a fuzzy-matching guess. Add to it if a future audit finds
// another legitimate case; don't widen the matcher itself to "close enough".
const LANDMARK_ALIASES = {
  'Point Pleasant': ['Point Pleasant (Night)'],
  'Welch': ['Welch Station'],
  'Grafton Town': ['Grafton (Town)', 'Grafton Day (Event)'],
  'Morgantown Airport': ['Morgantown (City)'],
};

// Builds { landmarkName: [{name, href}, ...] } by exact-matching each
// category's location entries' `name` field against the pinned landmarks
// (plus the audited alias table above).
function buildLookup(data, landmarkNames, hrefFor) {
  const nameToLandmark = new Map();
  landmarkNames.forEach((name) => nameToLandmark.set(name, name));
  Object.keys(LANDMARK_ALIASES).forEach((landmark) => {
    if (!landmarkNames.includes(landmark)) return;
    LANDMARK_ALIASES[landmark].forEach((alias) => nameToLandmark.set(alias, landmark));
  });
  const out = {};
  Object.keys(data).forEach((category) => {
    data[category].forEach((entry) => {
      if (!nameToLandmark.has(entry.name)) return;
      const landmark = nameToLandmark.get(entry.name);
      out[landmark] = out[landmark] || [];
      if (!out[landmark].some((e) => e.name === category)) {
        out[landmark].push({ name: category, href: hrefFor(category) });
      }
    });
  });
  // Preserve WM_LANDMARKS order (readable diffs, matches existing convention).
  const ordered = {};
  landmarkNames.forEach((name) => { if (out[name]) ordered[name] = out[name]; });
  return ordered;
}

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

function formatLookup(varName, lookup) {
  const lines = [`const ${varName} = {`];
  Object.keys(lookup).forEach((landmark) => {
    const entries = lookup[landmark]
      .map((e) => `{ name: '${esc(e.name)}', href: '${esc(e.href)}' }`)
      .join(', ');
    lines.push(`  '${esc(landmark)}': [ ${entries} ],`);
  });
  lines.push('};');
  return lines.join('\n');
}

function build() {
  const mapFile = path.join(__dirname, 'guides', 'wasteland-map.html');
  const spawnData = loadSpawnData();
  const scrapData = loadResourcesConst('SCRAP_DATA');
  const ingredientData = loadResourcesConst('INGREDIENT_DATA');
  const landmarkNames = loadLandmarkNames(mapFile);

  const creatures = buildLookup(spawnData, landmarkNames, (name) => `/creatures/${creatureSlug(name)}.html`);
  const scrap = buildLookup(scrapData, landmarkNames, (name) => `/#section=resources&scrap=${pbSlug(name)}`);
  const ingredients = buildLookup(ingredientData, landmarkNames, (name) => `/#section=resources&ingredient=${pbSlug(name)}`);

  const START = '// ─── WM_LINKS:START — auto-generated by build_wasteland_map_links.js, do not hand-edit ───';
  const END = '// ─── WM_LINKS:END ───';
  const body = [
    START,
    '// Regenerate with `node build_wasteland_map_links.js` after any SPAWN_DATA',
    '// (spawn-data.js), SCRAP_DATA, or INGREDIENT_DATA (both resources.js) change.',
    '// Folds spawn/scrap/ingredient entries into a landmark\'s tooltip by exact',
    '// name match against WM_LANDMARKS above, rather than plotting a separate',
    '// same-coordinate pin. WM_LANDMARKS itself (pin x/y) is untouched by the',
    '// generator — a brand-new landmark still needs manual ORB-matched placement',
    '// first (see the fo76-map-pin-repair skill); once it\'s in WM_LANDMARKS,',
    '// its tooltip contents here update automatically on every future entry.',
    formatLookup('WM_CREATURES_BY_LANDMARK', creatures),
    '',
    formatLookup('WM_SCRAP_BY_LANDMARK', scrap),
    '',
    formatLookup('WM_INGREDIENT_BY_LANDMARK', ingredients),
    END,
  ].join('\n');

  const src = fs.readFileSync(mapFile, 'utf8');
  const start = src.indexOf(START);
  const end = src.indexOf(END);
  if (start === -1 || end === -1) throw new Error('WM_LINKS markers not found in wasteland-map.html');
  const out = src.slice(0, start) + body + src.slice(end + END.length);
  fs.writeFileSync(mapFile, out);

  const landmarksTouched = new Set([...Object.keys(creatures), ...Object.keys(scrap), ...Object.keys(ingredients)]);
  console.log(`Synced wasteland-map.html: ${landmarksTouched.size} landmarks with live tooltip data ` +
    `(${Object.keys(creatures).length} creature, ${Object.keys(scrap).length} scrap, ${Object.keys(ingredients).length} ingredient).`);
}

build();
