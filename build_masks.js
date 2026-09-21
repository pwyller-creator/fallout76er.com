#!/usr/bin/env node
/* ────────────────────────────────────────────────────────────────────────
   build_masks.js  —  Fallout76er's Wasteland Archive
   Generates the crawlable Pint-Sized Slasher mask guide:
     guides/pint-sized-slasher-mask-locations.html
   from MASK_DATA / MASK_QUEST_NEED / MASK_TIERS in resources.js — the same
   data the Pip-Boy "Slasher Mask Locations" checklist widget renders, so the
   crawlable page and the interactive widget can never drift apart.

   Reads:   ./resources.js
   Writes:  ./guides/pint-sized-slasher-mask-locations.html   (generated —
            never hand-edit; edit MASK_DATA and re-run)

   Re-run after any MASK_DATA change:
     node build_masks.js
   Output is deterministic (no build timestamp) so the pre-commit staleness
   check can diff it. Page dates are the constants below — bump MODIFIED when
   the data changes in a way readers should see.

   The page carries its own small <style> block on top of tm-guide.css so
   tm-guide.css (and CSSVER in build_guides.js) stay untouched.
   ──────────────────────────────────────────────────────────────────────── */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SITE = 'https://fallout76er.com';
const OUT = path.join(__dirname, 'guides', 'pint-sized-slasher-mask-locations.html');
const CANONICAL = `${SITE}/guides/pint-sized-slasher-mask-locations.html`;
const FONTS = 'https://fonts.googleapis.com/css2?family=Rye&family=IM+Fell+English:ital@0;1&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap';
const CSS_HREF = '/tm-guide.css?v=20260730b';   // must match CSSVER in build_guides.js
const OG_IMAGE = `${SITE}/KidsToday.webp`;
const PUBLISHED = '2026-09-21';
const MODIFIED = '2026-09-21';
const LAST_CHECKED = '09.21.2026';

// Sandboxed literal eval, same pattern as build_llms.js / build_wasteland_map_links.js.
const evalLiteral = (code) => vm.runInNewContext(code, Object.create(null));

function loadMaskData() {
  const src = fs.readFileSync(path.join(__dirname, 'resources.js'), 'utf8');
  const start = src.indexOf('const MASK_DATA = {');
  if (start === -1) throw new Error('const MASK_DATA not found in resources.js');
  const end = src.indexOf('\n};', start);
  if (end === -1) throw new Error('closing }; of MASK_DATA not found');
  const data = evalLiteral('(' + src.slice(start + 'const MASK_DATA = '.length, end) + '\n})');
  const tiers = /const MASK_TIERS = \[([^\]]+)\]/.exec(src);
  const quest = /const MASK_QUEST_NEED = (\d+)/.exec(src);
  if (!tiers || !quest) throw new Error('MASK_TIERS / MASK_QUEST_NEED not found in resources.js');
  return { data, tiers: tiers[1].split(',').map(n => parseInt(n, 10)), quest: parseInt(quest[1], 10) };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Matches slugifyPbKey() in index.html exactly — the deep links must resolve.
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + 's'}`;
const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);

function joinList(items) {
  if (items.length <= 1) return items.join('');
  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}

const { data: MASK_DATA, tiers: TIERS, quest: QUEST } = loadMaskData();
const regions = Object.keys(MASK_DATA);
const regionMasks = (r) => MASK_DATA[r].reduce((n, l) => n + l.masks.length, 0);
const TOTAL_MASKS = regions.reduce((n, r) => n + regionMasks(r), 0);
const TOTAL_SITES = regions.reduce((n, r) => n + MASK_DATA[r].length, 0);
const TIER_SUM = TIERS.reduce((a, b) => a + b, 0);
if (TOTAL_MASKS !== 108) throw new Error(`MASK_DATA holds ${TOTAL_MASKS} masks, expected 108`);

const allLocs = regions.flatMap(r => MASK_DATA[r].map(l => ({ region: r, ...l })));
const unmarked = allLocs.filter(l => /no map marker/i.test(l.where));
const byMasksDesc = regions.slice().sort((a, b) => regionMasks(b) - regionMasks(a));
const threeMask = allLocs.filter(l => l.masks.length === 3).map(l => l.name);

// ── FAQ (answers are plain text; reused verbatim in FAQPage JSON-LD) ────────
const faqs = [
  {
    q: 'How many Pint-Sized Slasher Masks are there in Fallout 76?',
    a: `${TOTAL_MASKS} — one on each masked corpse, spread across ${TOTAL_SITES} locations in ${regions.length} regions. Atlantic City has none, and the Cranberry Bog has exactly one (Ranger Lookout).`
  },
  {
    q: 'How many masks do I need for The Slasher: Masked Truth and the challenges?',
    a: `The quest The Slasher: Masked Truth needs ${QUEST}. The four challenge tiers need ${joinList(TIERS.map(String))} — ${TIER_SUM} in all — out of ${TOTAL_MASKS} available.`
  },
  {
    q: 'How do I know when I am close to a masked corpse?',
    a: 'Listen for laughter. The masked corpses, killed and dressed by the Pint-Sized Phantoms, sit at fixed spots, and you will hear laughter when you are close to one.'
  },
  {
    q: 'Which region has the most Pint-Sized Slasher Masks?',
    a: `${byMasksDesc[0]} has the most: ${regionMasks(byMasksDesc[0])} masks across ${MASK_DATA[byMasksDesc[0]].length} locations. ${byMasksDesc[1]} is next with ${regionMasks(byMasksDesc[1])} across ${MASK_DATA[byMasksDesc[1]].length}.`
  },
  {
    q: 'Which locations hold three masks?',
    a: `${threeMask.length} locations hold three masks each: ${joinList(threeMask)}. They are the most efficient stops on a mask run.`
  },
  {
    q: 'Are any of the mask spots missing from the in-game map?',
    a: `${unmarked.length} of them had no map marker of their own in the game's marker data: ${joinList(unmarked.map(l => l.name))}. The directions for those use the nearest named landmark instead.`
  },
  {
    q: 'How were these locations and directions worked out?',
    a: 'Where each mask sits was checked in game. The approach directions — nearest named landmark, compass direction and rough distance — are calculated from the game\'s own map-marker coordinates (via the open-source Mappalachia database) and cross-checked against the hand-stitched Wasteland Map on this site. Distances are rounded to the nearest 50 m: close enough to find the spot, not survey-grade.'
  },
];

// ── Page pieces ─────────────────────────────────────────────────────────────
const title = 'Fallout 76 Pint-Sized Slasher Mask Locations (All 108) | Fallout76er';
const ogTitle = 'Fallout 76 Pint-Sized Slasher Mask Locations — All 108, With Directions';
const desc = `All ${TOTAL_MASKS} Pint-Sized Slasher Mask locations in Fallout 76: landmark and compass directions, exactly where each mask sits, and a Pip-Boy checklist. Field-verified.`;
const h1 = `Fallout 76 Pint-Sized Slasher Mask Locations — All ${TOTAL_MASKS}, With Directions`;

const jsonld = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: ogTitle,
      description: desc,
      image: OG_IMAGE,
      datePublished: PUBLISHED,
      dateModified: MODIFIED,
      inLanguage: 'en-US',
      author: { '@type': 'Person', name: 'Fallout76er' },
      publisher: { '@type': 'Person', name: 'Fallout76er' },
      mainEntityOfPage: CANONICAL,
      about: 'Fallout 76 The Slasher Update — Pint-Sized Slasher Mask locations',
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Pint-Sized Slasher Mask Locations', item: CANONICAL },
      ],
    },
  ],
};

const pageCss = `
.msk-glance { width: 100%; border-collapse: collapse; margin: 6px 0 4px; font-family: 'Courier Prime', 'Courier New', monospace; font-size: 13px; letter-spacing: 0.5px; }
.msk-glance th, .msk-glance td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--pb-border); }
.msk-glance th { color: var(--pb-faint); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: 400; }
.msk-glance td { color: var(--pb-dim); }
.msk-glance td:first-child a { color: var(--pb-bright); text-decoration: none; }
.msk-glance td:first-child a:hover { text-shadow: var(--pb-glow); }
.msk-glance tfoot td { color: var(--pb-bright); border-bottom: none; text-transform: uppercase; }
.msk-jump { font-family: 'Courier Prime', 'Courier New', monospace; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; display: flex; flex-wrap: wrap; gap: 8px 16px; margin: 18px 0 4px; }
.msk-jump a { color: var(--pb-dim); text-decoration: none; border-bottom: 1px dashed var(--pb-faint); }
.msk-jump a:hover { color: var(--pb-bright); }
.msk-note { font-family: 'Courier Prime', 'Courier New', monospace; font-size: 12px; letter-spacing: 0.5px; color: var(--pb-faint); line-height: 1.6; margin-top: 10px; }
.msk-loc { border: 1px solid var(--pb-border); background: rgba(8,5,0,0.5); padding: 14px 18px 12px; margin-bottom: 14px; scroll-margin-top: 16px; }
.msk-loc-h { font-family: 'Courier Prime', 'Courier New', monospace; font-size: 15px; font-weight: 700; letter-spacing: 1px; color: var(--pb-bright); text-transform: uppercase; display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
.msk-count { font-size: 11px; font-weight: 400; letter-spacing: 2px; color: rgba(160,240,120,0.95); border: 1px solid rgba(140,220,100,0.45); padding: 1px 8px; white-space: nowrap; }
.msk-where { font-family: 'Courier Prime', 'Courier New', monospace; font-size: 13px; letter-spacing: 0.3px; color: var(--pb-mid); margin: 8px 0 6px; line-height: 1.6; }
.msk-lbl { color: var(--pb-faint); letter-spacing: 2px; text-transform: uppercase; font-size: 11px; margin-right: 6px; }
.msk-list { padding-left: 22px; font-size: 18px; line-height: 1.6; color: var(--pb-dim); }
.msk-list li { margin: 2px 0; }
.msk-region-meta { font-family: 'Courier Prime', 'Courier New', monospace; font-size: 12px; letter-spacing: 2px; color: var(--pb-faint); text-transform: uppercase; margin: -8px 0 14px; }
.msk-track { font-family: 'Courier Prime', 'Courier New', monospace; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; margin: 2px 0 18px; }
.msk-track a { color: var(--pb-mid); }
.msk-track a:hover { color: var(--pb-bright); }
.tmg-intro a, .tmg-faq-a a { color: var(--pb-mid); }
@media (max-width: 600px) { .msk-loc { padding: 12px 14px 10px; } .msk-list { font-size: 17px; } .msk-loc-h { font-size: 14px; } }
`.trim();

const glanceRows = regions.map(r =>
  `        <tr><td><a href="#${slug(r)}">${esc(r)}</a></td><td>${MASK_DATA[r].length}</td><td>${regionMasks(r)}</td></tr>`).join('\n');

const jumpNav = regions.map(r => `<a href="#${slug(r)}">${esc(r)}</a>`).join('\n    ');

function locationHtml(l) {
  const n = l.masks.length;
  const items = l.masks.map(m => `        <li>${esc(m)}</li>`).join('\n');
  return `    <article class="msk-loc" id="${slug(l.name)}">
      <h3 class="msk-loc-h"><span>${esc(l.name)}</span><span class="msk-count">${plural(n, 'mask')}</span></h3>
      <p class="msk-where"><span class="msk-lbl">Find it</span>${esc(l.where)}</p>
      <ol class="msk-list">
${items}
      </ol>
    </article>`;
}

function regionHtml(r) {
  const locs = MASK_DATA[r];
  return `  <section class="tmg-faq-section" id="${slug(r)}" aria-label="${esc(r)} mask locations">
    <h2 class="tmg-faq-section-h">${esc(r)}</h2>
    <p class="msk-region-meta">${plural(locs.length, 'location')} &middot; ${plural(regionMasks(r), 'mask')}</p>
    <p class="msk-track"><a href="/#section=resources&amp;masks=${slug(r)}">Track ${esc(r)} in the Pip-Boy checklist &rarr;</a></p>
${locs.map(locationHtml).join('\n')}
  </section>`;
}

const faqHtml = faqs.map(f => `    <details class="tmg-faq-item">
      <summary class="tmg-faq-q">${esc(f.q)}</summary>
      <div class="tmg-faq-a"><p>${esc(f.a)}</p></div>
    </details>`).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${CANONICAL}">
<meta name="robots" content="index, follow, max-image-preview:large">

<meta property="og:type" content="article">
<meta property="og:title" content="${esc(ogTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${CANONICAL}">
<meta property="og:image" content="${OG_IMAGE}">
<meta property="og:site_name" content="Fallout76er's Wasteland Archive">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(ogTitle)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${OG_IMAGE}">

<link rel="icon" type="image/png" href="/favicon-96x96.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="${CSS_HREF}">
<style>
${pageCss}
</style>

<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body>
<header class="tmg-header">
  <a class="tmg-brand" href="/">Fallout76er's <span>Wasteland Archive</span></a>
  <nav class="tmg-crumbs" aria-label="Breadcrumb">
    <a href="/">Home</a><span class="sep">&rsaquo;</span><span class="cur">Pint-Sized Slasher Mask Locations</span>
  </nav>
</header>

<main class="tmg-main">
  <h1 class="tmg-title">${esc(h1)}</h1>
  <p class="tmg-meta">Topic: The Slasher Update &middot; Status: Field-Verified &middot; Last Checked: ${LAST_CHECKED}</p>

  <article class="tmg-intro">
    <p>The Slasher Update left Appalachia with ${TOTAL_MASKS} masked corpses, killed and dressed by the Pint-Sized Phantoms and parked at fixed spots, each one wearing a Pint-Sized Slasher Mask. The quest The Slasher: Masked Truth wants ${QUEST} of them. The four challenge tiers want ${joinList(TIERS.map(String))} &mdash; ${TIER_SUM} in all. Below is every one: ${TOTAL_SITES} locations across ${regions.length} regions, how to reach each, and where the mask sits once you're standing there.</p>
    <p>Where each mask sits was checked in game. The directions to reach each spot are worked out from the game's own map-marker coordinates &mdash; nearest landmark, compass direction, rough distance &mdash; so treat the distances as close enough to find it, not survey-grade. Get within earshot and listen for laughter.</p>
  </article>

  <section class="tmg-faq-section" aria-label="Masks at a glance">
    <h2 class="tmg-faq-section-h">All ${TOTAL_MASKS} Masks at a Glance</h2>
    <table class="msk-glance">
      <thead><tr><th>Region</th><th>Locations</th><th>Masks</th></tr></thead>
      <tbody>
${glanceRows}
      </tbody>
      <tfoot><tr><td>Appalachia</td><td>${TOTAL_SITES}</td><td>${TOTAL_MASKS}</td></tr></tfoot>
    </table>
    <nav class="msk-jump" aria-label="Jump to a region">
    ${jumpNav}
    </nav>
    <p class="msk-note">Tracking a run? The <a href="/#section=resources&amp;masks=the-forest" style="color:var(--pb-mid)">Pip-Boy mask checklist</a> ticks off each corpse as you go and remembers your progress in your own browser.</p>
  </section>

${regions.map(regionHtml).join('\n\n')}

  <section class="tmg-faq-section" aria-label="Frequently asked questions">
    <h2 class="tmg-faq-section-h">Slasher Mask FAQ</h2>
${faqHtml}
  </section>

  <section class="tmg-faq-section" aria-label="How the directions were made">
    <h2 class="tmg-faq-section-h">Where the Directions Come From</h2>
    <div class="tmg-intro" style="border-top:none;padding-top:0;font-size:17px;">
      <p>Landmark positions come from the open-source <a href="https://github.com/AHeroicLlama/Mappalachia" target="_blank" rel="noopener">Mappalachia</a> map-marker database, read for the current game version and cross-checked against the hand-stitched <a href="/guides/wasteland-map.html">Wasteland Map</a> on this site. Each direction reads from the landmark to the mask spot, so &ldquo;northeast of Wixon Homestead&rdquo; means the spot lies northeast of it. Where a spot has no marker of its own, the direction uses the nearest named place instead.</p>
    </div>
  </section>

  <section class="tmg-related" aria-label="More from the archive">
    <h2 class="tmg-related-h">More From The Archive</h2>
    <div class="tmg-related-links">
      <a href="/guides/wasteland-map.html">Wasteland Map</a>
      <a href="/creatures/">Creature Spawn Intel</a>
      <a href="/maps/">Treasure Map Guides</a>
      <a href="/guides/score-challenge-faq.html">S.C.O.R.E. Challenge FAQ</a>
    </div>
  </section>

  <p class="tmg-back"><a href="/">&larr; Back to the Wasteland Archive</a></p>
</main>

<footer class="tmg-footer">
  Field-documented in Appalachia by Fallout76er. &nbsp;<a href="/creatures/">Creature Spawn Intel</a> &nbsp;&middot;&nbsp; <a href="/maps/">Treasure Map Guides</a> &nbsp;&middot;&nbsp; <a href="/guides/wasteland-map.html">Wasteland Map</a> &nbsp;&middot;&nbsp; <a href="/guides/score-challenge-faq.html">S.C.O.R.E. Challenge FAQ</a> &nbsp;&middot;&nbsp; <a href="https://fallout76er.substack.com" target="_blank" rel="noopener">Wastelander Diary</a> &nbsp;&middot;&nbsp; <a href="https://github.com/pwyller-creator/fallout76er.com" target="_blank" rel="noopener">GitHub</a> &nbsp;&middot;&nbsp; <a href="/">Return to the archive &rarr;</a>
</footer>
</body>
</html>
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
console.log(`Wrote ${path.relative(__dirname, OUT)}: ${TOTAL_SITES} locations, ${TOTAL_MASKS} masks, ${(html.length / 1024).toFixed(1)} KB`);
