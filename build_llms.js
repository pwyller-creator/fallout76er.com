#!/usr/bin/env node
/* ────────────────────────────────────────────────────────────────────────
   build_llms.js  —  Fallout76er's Wasteland Archive
   Generates llms.txt (https://llmstxt.org convention) — a plain-text map of
   the site for AI assistants and answer engines, with a direct link to
   every crawlable page.

   Reads:   ./spawn-data.js   (SPAWN_DATA)
            ./index.html      (TM_DATA — single source of truth)
   Writes:  ./llms.txt

   llms.txt is a DISPOSABLE generated artifact — never edit it by hand.
   Re-run after creature or treasure-map data changes:  node build_llms.js
   ──────────────────────────────────────────────────────────────────────── */

const fs = require('fs');
const path = require('path');

const SITE = 'https://fallout76er.com';

// ── Load SPAWN_DATA from the external data file ──────────────────────────
function loadSpawnData() {
  let src = fs.readFileSync(path.join(__dirname, 'spawn-data.js'), 'utf8');
  src = src.slice(src.indexOf('{'));
  src = src.replace(/;\s*$/, '');
  // eslint-disable-next-line no-eval
  return eval('(' + src + ')');
}

// ── Load TM_DATA from index.html ─────────────────────────────────────────
function loadTmData() {
  const src = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const start = src.indexOf('const TM_DATA = [');
  if (start === -1) throw new Error('TM_DATA not found in index.html');
  const end = src.indexOf('\n];', start);
  if (end === -1) throw new Error('TM_DATA closing "];" not found');
  // eslint-disable-next-line no-eval
  return eval(src.slice(start + 'const TM_DATA ='.length, end + 3));
}

// ── Helpers ──────────────────────────────────────────────────────────────
const slug = (name) => name.toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[()'".,]/g, '')
  .trim()
  .replace(/\s+/g, '-');

const uniq = (arr) => [...new Set(arr)];
function regionsOf(spawns) { return uniq(spawns.map(s => s.region)); }

function listProse(items) {
  if (items.length === 1) return items[0];
  if (items.length === 2) return items[0] + ' and ' + items[1];
  return items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
}

const plainText = (html) => html
  .replace(/<\/p>\s*<p>/g, ' ')
  .replace(/<[^>]+>/g, '')
  .replace(/\s+/g, ' ')
  .trim();

function truncate(text, limit) {
  if (text.length <= limit + 1) return text;
  let cut = text.slice(0, limit + 1);
  cut = cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:]$/, '');
  return cut + '…';
}

// ── Build ────────────────────────────────────────────────────────────────
function build() {
  const spawnData = loadSpawnData();
  const creatureNames = Object.keys(spawnData).sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1);

  const tmData = loadTmData();
  const docs = [];
  tmData.forEach(region => region.maps.forEach(map => {
    if (map.documented) docs.push({ region, map });
  }));

  const lines = [];
  lines.push(`# Fallout76er's Wasteland Archive`);
  lines.push('');
  lines.push(`> A field-documented Fallout 76 archive written in-character as sardonic survivor field notes: creature spawn-location intel, treasure-map dig-site walkthroughs, weekly nuke codes, a plans-exchange trading depot, and a photo archive. In-game identity: level 491 character "Fallout76er," vendor camp "Rusty Curios & Rares" in Burning Springs, Appalachia.`);
  lines.push('');
  lines.push(`## Core Pages`);
  lines.push(`- [Wasteland Archive Homepage](${SITE}/): Photo archive, weekly nuke codes, Minerva tracker, scrap-farming data, Pip-Boy calculators (Gold Bullion Planner, Legendary Scrap Odds, Damage Stacker), and the plans-exchange trading depot.`);
  lines.push(`- [Interactive Wasteland Map](${SITE}/guides/wasteland-map.html): Clickable full map of Appalachia with dig-site, landmark, and scrap-farm pins.`);
  lines.push(`- [S.C.O.R.E. Challenge FAQ](${SITE}/guides/score-challenge-faq.html): Field-verified answers to which creatures and items count toward S.C.O.R.E. challenges, plus known bugs and fast-farm routes.`);
  lines.push(`- [Wastelander Diary](https://fallout76er.substack.com): Substack field-journal dispatches.`);
  lines.push('');
  lines.push(`## Creature Spawn Intel`);
  lines.push(`- [Creature Spawn Intel Hub](${SITE}/creatures/): Every documented creature spawn-location guide in Fallout 76 (${creatureNames.length} creatures).`);
  creatureNames.forEach(name => {
    const spawns = spawnData[name];
    const regions = regionsOf(spawns);
    lines.push(`- [${name}](${SITE}/creatures/${slug(name)}.html): ${spawns.length} field-verified spawn ${spawns.length === 1 ? 'location' : 'locations'} across ${listProse(regions)}.`);
  });
  lines.push('');
  lines.push(`## Treasure Map Guides`);
  lines.push(`- [Treasure Map Guides Hub](${SITE}/maps/): Every documented Fallout 76 treasure-map dig site, with video walkthroughs (${docs.length} guides).`);
  docs.forEach(({ region, map }) => {
    const file = `${region.id}-treasure-map-${map.num}.html`;
    const excerpt = truncate(plainText(map.desc), 140);
    lines.push(`- [${map.title}](${SITE}/maps/${file}): ${region.name}, Treasure Map ${map.num}. ${excerpt}`);
  });
  lines.push('');
  lines.push(`## Optional`);
  lines.push(`- [GitHub Repository](https://github.com/pwyller-creator/fallout76er.com): Source code and authorship provenance.`);
  lines.push('');

  fs.writeFileSync(path.join(__dirname, 'llms.txt'), lines.join('\n'));
  console.log(`Built llms.txt: ${creatureNames.length} creatures, ${docs.length} treasure maps.`);
}

build();
