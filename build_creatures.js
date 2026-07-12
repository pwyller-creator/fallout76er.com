#!/usr/bin/env node
/* ────────────────────────────────────────────────────────────────────────
   build_creatures.js  —  Fallout76er's Wasteland Archive
   Generates crawlable Creature Spawn Intel pages from spawn-data.js.

   Reads:   ./spawn-data.js   (const SPAWN_DATA = {...})
   Writes:  ./creatures.css                  (shared Pip-Boy stylesheet)
            ./creatures/index.html            (hub)
            ./creatures/[slug].html           (one page per creature)
            ./sitemap-creatures.xml           (submit alongside sitemap.xml)

   These HTML files are DISPOSABLE generated artifacts — never edit them by
   hand. Edit spawn-data.js, then re-run:  node build_creatures.js
   ──────────────────────────────────────────────────────────────────────── */

const fs = require('fs');
const path = require('path');

const SITE   = 'https://fallout76er.com';
const OGIMG  = SITE + '/newcamp.png';
const TODAY  = new Date().toISOString().slice(0, 10);   // YYYY-MM-DD
const CSSVER = '20260629';                               // bump when creatures.css changes
const FONTS  = 'https://fonts.googleapis.com/css2?family=Rye&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap';

// ── Load SPAWN_DATA from the external data file ──────────────────────────
function loadSpawnData() {
  let src = fs.readFileSync(path.join(__dirname, 'spawn-data.js'), 'utf8');
  src = src.slice(src.indexOf('{'));            // drop leading comments + "const SPAWN_DATA ="
  src = src.replace(/;\s*$/, '');               // drop trailing semicolon
  // eslint-disable-next-line no-eval
  return eval('(' + src + ')');
}

// ── Helpers ──────────────────────────────────────────────────────────────
const slug = (name) => name.toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[()'".,]/g, '')
  .trim()
  .replace(/\s+/g, '-');

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escAttr = (s) => esc(s).replace(/"/g, '&quot;');

const uniq = (arr) => [...new Set(arr)];

function regionsOf(spawns) { return uniq(spawns.map(s => s.region)); }

function listProse(items) {
  if (items.length === 1) return items[0];
  if (items.length === 2) return items[0] + ' and ' + items[1];
  return items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
}

// ── Per-page <head> ──────────────────────────────────────────────────────
function head(title, desc, canonical, jsonld) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${escAttr(desc)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escAttr(title)}">
<meta property="og:description" content="${escAttr(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${OGIMG}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="/favicon-96x96.png?v=20260429" sizes="96x96">
<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=20260429">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=20260429">
<link rel="manifest" href="/site.webmanifest?v=20260429">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="/creatures.css?v=${CSSVER}">
<script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
</script>
</head>`;
}

const chrome = `
<header class="pb-top">
  <a class="pb-wordmark" href="/">FALLOUT76ER<span>.COM</span></a>
  <div class="pb-eyebrow">&#9670; CREATURE SPAWN INTEL</div>
</header>`;

const foot = `
<footer class="pb-foot">
  <nav aria-label="Site">
    <a href="/">Wasteland Archive</a>
    <span aria-hidden="true">&middot;</span>
    <a href="/creatures/">All Creatures</a>
    <span aria-hidden="true">&middot;</span>
    <a href="/maps/">Treasure Maps</a>
    <span aria-hidden="true">&middot;</span>
    <a href="https://github.com/pwyller-creator/fallout76er.com" target="_blank" rel="noopener">GitHub</a>
  </nav>
  <p>Field-documented in Appalachia by Fallout76er. Counts vary with server population and active events.</p>
</footer>
</body>
</html>`;

// ── Creature page ────────────────────────────────────────────────────────
function creaturePage(name, spawns, related, prev, next) {
  const s = slug(name);
  const canonical = `${SITE}/creatures/${s}.html`;
  const regions = regionsOf(spawns);
  const n = spawns.length;
  const title = `${name} — Fallout 76 Spawn Locations | Fallout76er's Wasteland Archive`;
  let desc = `Field-verified ${name} spawn locations in Fallout 76 across ${listProse(regions)}. Counts, regions, and tactical notes from the Wasteland Archive.`;
  if (desc.length > 300) desc = `Field-verified ${name} spawn locations in Fallout 76 across ${regions.length} regions. Counts, regions, and tactical notes from the Wasteland Archive.`;

  const intro = `Tracking a ${name} in Appalachia? The Archive logs ${n} spawn ${n === 1 ? 'location' : 'locations'} for it${regions.length ? ' across ' + listProse(regions) : ''}. Server population and active events shift the odds, but these are the spots the field notes keep returning to.`;

  const cards = spawns.map((sp, i) => {
    const rank = String(i + 1).padStart(2, '0');
    const mapEl = sp.map
      ? `\n          <img class="loc-map" src="/${sp.map}" alt="${escAttr(name + ' spawn map — ' + sp.name + ' (' + sp.region + '), Fallout 76')}" loading="lazy">`
      : `\n          <div class="loc-map-pending" aria-hidden="true">MAP PENDING</div>`;
    return `      <article class="loc">
        <div class="loc-rank">${rank}</div>
        <div class="loc-body">
          <h2 class="loc-name">${esc(sp.name)}</h2>
          <div class="loc-meta"><span class="tag region">${esc(sp.region)}</span><span class="tag count">${esc(sp.count)}</span></div>
          <p class="loc-note">${esc(sp.note)}</p>${mapEl}
        </div>
      </article>`;
  }).join('\n');

  const relLinks = related.map(r =>
    `<a href="/creatures/${slug(r)}.html">${esc(r)}</a>`).join('\n      ');

  const pager =
    `<a class="pager prev" href="/creatures/${slug(prev)}.html" rel="prev">&larr; ${esc(prev)}</a>` +
    `<a class="pager next" href="/creatures/${slug(next)}.html" rel="next">${esc(next)} &rarr;</a>`;

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": `Where to Find the ${name} in Fallout 76`,
        "description": desc,
        "datePublished": "2026-06-24",
        "dateModified": TODAY,
        "image": OGIMG,
        "mainEntityOfPage": { "@type": "WebPage", "@id": canonical },
        "author": { "@type": "Organization", "name": "Fallout76er's Wasteland Archive", "url": SITE + "/" },
        "publisher": { "@type": "Organization", "name": "Fallout76er's Wasteland Archive", "url": SITE + "/" }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Wasteland Archive", "item": SITE + "/" },
          { "@type": "ListItem", "position": 2, "name": "Creature Spawn Intel", "item": SITE + "/creatures/" },
          { "@type": "ListItem", "position": 3, "name": name, "item": canonical }
        ]
      }
    ]
  };

  return head(title, desc, canonical, jsonld) + `
<body class="scanlines">
${chrome}
<main class="pb-main">
  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="/">Archive</a> <span>/</span>
    <a href="/creatures/">Creatures</a> <span>/</span>
    <span class="here">${esc(name)}</span>
  </nav>

  <h1 class="pb-h1">${esc(name)}<span class="pb-h1-sub">Spawn Locations</span></h1>
  <p class="pb-intro">${esc(intro)}</p>

  <section class="locations" aria-label="${escAttr(name)} spawn locations">
${cards}
  </section>

  <section class="related" aria-label="Related intel">
    <h2 class="related-h">Related Intel</h2>
    <div class="related-links">
      ${relLinks}
    </div>
    <p class="widget-link">Browse the live, filterable terminal in the <a href="/">Game Resources</a> section of the Archive.</p>
  </section>

  <nav class="pager-row" aria-label="More creatures">${pager}</nav>
</main>
${foot}`;
}

// ── Hub page ─────────────────────────────────────────────────────────────
function hubPage(names, data) {
  const canonical = `${SITE}/creatures/`;
  const title = `Fallout 76 Creature Spawn Locations — Field Intel | Fallout76er's Wasteland Archive`;
  const desc = `Where to find every creature in Fallout 76: ${names.length} field-verified spawn-location guides across Appalachia, from Deathclaws to the Ultracite Titan.`;

  const cards = names.map(name => {
    const sp = data[name];
    const regions = regionsOf(sp);
    const tags = regions.slice(0, 3).map(r => `<span class="chip">${esc(r)}</span>`).join('');
    const more = regions.length > 3 ? `<span class="chip more">+${regions.length - 3}</span>` : '';
    return `    <a class="card" href="/creatures/${slug(name)}.html">
      <span class="card-name">${esc(name)}</span>
      <span class="card-count">${sp.length} ${sp.length === 1 ? 'site' : 'sites'}</span>
      <span class="card-tags">${tags}${more}</span>
    </a>`;
  }).join('\n');

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "name": "Fallout 76 Creature Spawn Locations",
        "description": desc,
        "url": canonical,
        "isPartOf": { "@type": "WebSite", "name": "Fallout76er's Wasteland Archive", "url": SITE + "/" }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Wasteland Archive", "item": SITE + "/" },
          { "@type": "ListItem", "position": 2, "name": "Creature Spawn Intel", "item": canonical }
        ]
      },
      {
        "@type": "ItemList",
        "numberOfItems": names.length,
        "itemListElement": names.map((name, i) => ({
          "@type": "ListItem", "position": i + 1, "name": name,
          "url": `${SITE}/creatures/${slug(name)}.html`
        }))
      }
    ]
  };

  return head(title, desc, canonical, jsonld) + `
<body class="scanlines">
${chrome}
<main class="pb-main">
  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="/">Archive</a> <span>/</span>
    <span class="here">Creatures</span>
  </nav>

  <h1 class="pb-h1">Creature Spawn Intel<span class="pb-h1-sub">${names.length} entries &middot; Appalachia</span></h1>
  <p class="pb-intro">Every creature the Archive has documented, with the locations, counts, and tactical notes that hold up in the field. Pick a target.</p>

  <section class="hub-grid" aria-label="All creatures">
${cards}
  </section>
</main>
${foot}`;
}

// ── Sitemap ──────────────────────────────────────────────────────────────
function sitemap(names) {
  const urls = [
    `  <url><loc>${SITE}/creatures/</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
    ...names.map(name =>
      `  <url><loc>${SITE}/creatures/${slug(name)}.html</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`)
  ].join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

// ── Stylesheet (Pip-Boy amber phosphor terminal) ─────────────────────────
const CSS = `/* creatures.css — generated by build_creatures.js. Edit the generator, not this file. */
:root{
  --pb-bg:#0c0800; --pb-panel:#120c02;
  --pb-bright:rgba(255,195,55,1); --pb-mid:rgba(230,168,45,0.95);
  --pb-dim:rgba(200,145,35,0.85); --pb-faint:rgba(175,125,25,0.65);
  --pb-border:rgba(200,140,25,0.5); --pb-glow:0 0 12px rgba(255,185,45,0.35);
}
*{margin:0;padding:0;box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{
  background:var(--pb-bg); color:var(--pb-mid);
  font-family:'Courier Prime',monospace; font-size:17px; line-height:1.6;
  min-height:100vh; padding:0 18px 64px;
  background-image:radial-gradient(ellipse at top,rgba(120,80,10,0.18),transparent 60%);
}
body.scanlines::before{
  content:''; position:fixed; inset:0; pointer-events:none; z-index:50;
  background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.18) 3px,rgba(0,0,0,0.18) 4px);
  mix-blend-mode:multiply;
}
a{color:var(--pb-bright); text-decoration:none}
a:hover{text-shadow:var(--pb-glow)}
:focus-visible{outline:2px solid var(--pb-bright); outline-offset:2px}
main{max-width:880px; margin:0 auto}

.pb-top{
  max-width:880px; margin:0 auto; display:flex; align-items:center; justify-content:space-between;
  flex-wrap:wrap; gap:8px; padding:18px 0 14px; border-bottom:1px solid var(--pb-border); margin-bottom:24px;
}
.pb-wordmark{font-family:'Rye',serif; font-size:22px; letter-spacing:1px; color:var(--pb-bright); text-shadow:var(--pb-glow)}
.pb-wordmark span{color:var(--pb-faint)}
.pb-eyebrow{font-size:11px; letter-spacing:3px; color:var(--pb-dim); text-transform:uppercase}

.crumbs{font-size:12px; letter-spacing:1px; color:var(--pb-faint); text-transform:uppercase; margin-bottom:20px}
.crumbs span{opacity:0.5; margin:0 4px}
.crumbs .here{color:var(--pb-dim)}

.pb-h1{font-family:'Rye',serif; font-size:clamp(30px,6vw,46px); color:var(--pb-bright);
  text-shadow:var(--pb-glow); line-height:1.1; margin-bottom:14px}
.pb-h1-sub{display:block; font-family:'Courier Prime',monospace; font-size:14px; font-weight:700;
  letter-spacing:4px; color:var(--pb-faint); text-transform:uppercase; text-shadow:none; margin-top:8px}
.pb-intro{color:var(--pb-dim); max-width:64ch; margin-bottom:36px; font-style:italic}

.locations{display:flex; flex-direction:column; gap:14px}
.loc{display:flex; gap:16px; border:1px solid var(--pb-border); border-radius:4px;
  background:var(--pb-panel); padding:18px 20px; box-shadow:inset 0 0 30px rgba(0,0,0,0.55)}
.loc-rank{font-family:'Rye',serif; font-size:22px; color:var(--pb-faint); min-width:40px; padding-top:2px}
.loc-body{flex:1}
.loc-name{font-size:21px; color:var(--pb-bright); text-shadow:var(--pb-glow); margin-bottom:8px; font-weight:700}
.loc-meta{display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px}
.tag{font-size:11px; letter-spacing:1px; text-transform:uppercase; padding:3px 9px; border:1px solid var(--pb-border); border-radius:2px}
.tag.region{color:var(--pb-mid)}
.tag.count{color:var(--pb-faint); border-style:dashed}
.loc-note{color:var(--pb-dim)}
.loc-map{display:block; width:100%; max-width:440px; margin-top:14px; border:1px solid var(--pb-border); border-radius:3px; filter:sepia(0.12); transition:filter .15s}
.loc-map:hover{filter:sepia(0)}
.loc-map-pending{display:flex; align-items:center; justify-content:center; width:100%; max-width:440px; min-height:88px; margin-top:14px; border:1px dashed var(--pb-border); border-radius:3px; color:var(--pb-faint); font-size:11px; letter-spacing:3px; text-transform:uppercase}

.related{margin-top:48px; border-top:1px solid var(--pb-border); padding-top:26px}
.related-h{font-size:13px; letter-spacing:3px; text-transform:uppercase; color:var(--pb-faint); margin-bottom:16px}
.related-links{display:flex; flex-wrap:wrap; gap:8px 10px; margin-bottom:18px}
.related-links a{font-size:13px; padding:6px 12px; border:1px solid var(--pb-border); border-radius:2px; color:var(--pb-mid)}
.related-links a:hover{border-color:var(--pb-bright); color:var(--pb-bright)}
.widget-link{font-size:14px; color:var(--pb-faint)}

.pager-row{display:flex; justify-content:space-between; gap:12px; margin-top:40px; flex-wrap:wrap}
.pager{font-size:13px; letter-spacing:1px; color:var(--pb-dim)}
.pager:hover{color:var(--pb-bright)}

.hub-grid{display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:12px; margin-top:8px}
.card{display:flex; flex-direction:column; gap:6px; border:1px solid var(--pb-border); border-radius:4px;
  background:var(--pb-panel); padding:14px 16px; box-shadow:inset 0 0 24px rgba(0,0,0,0.5); transition:border-color .15s,transform .15s}
.card:hover{border-color:var(--pb-bright); transform:translateY(-2px)}
.card-name{font-size:18px; color:var(--pb-bright); font-weight:700}
.card-count{font-size:11px; letter-spacing:1px; text-transform:uppercase; color:var(--pb-faint)}
.card-tags{display:flex; flex-wrap:wrap; gap:5px; margin-top:2px}
.chip{font-size:10px; letter-spacing:0.5px; text-transform:uppercase; color:var(--pb-mid); border:1px solid var(--pb-border); border-radius:2px; padding:2px 6px}
.chip.more{color:var(--pb-faint); border-style:dashed}

.pb-foot{max-width:880px; margin:56px auto 0; border-top:1px solid var(--pb-border); padding-top:22px;
  text-align:center; font-size:12px; color:var(--pb-faint)}
.pb-foot nav{margin-bottom:8px}
.pb-foot nav span{opacity:0.5; margin:0 4px}
.pb-foot a{color:var(--pb-dim)}
.pb-foot a:hover{color:var(--pb-bright)}

@media (max-width:560px){
  body{font-size:16px}
  .loc{flex-direction:column; gap:8px}
  .loc-rank{min-width:0}
  .hub-grid{grid-template-columns:1fr 1fr}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
`;

// ── Build ────────────────────────────────────────────────────────────────
function build() {
  const data = loadSpawnData();
  const names = Object.keys(data).sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1);
  const outDir = path.join(__dirname, 'creatures');
  fs.mkdirSync(outDir, { recursive: true });

  // related = up to 6 other creatures sharing a region
  function relatedFor(name) {
    const myRegions = new Set(regionsOf(data[name]));
    const scored = names.filter(o => o !== name).map(o => ({
      name: o,
      shared: regionsOf(data[o]).filter(r => myRegions.has(r)).length
    })).filter(x => x.shared > 0).sort((a, b) => b.shared - a.shared);
    return scored.slice(0, 6).map(x => x.name);
  }

  fs.writeFileSync(path.join(__dirname, 'creatures.css'), CSS);

  names.forEach((name, i) => {
    const prev = names[(i - 1 + names.length) % names.length];
    const next = names[(i + 1) % names.length];
    const html = creaturePage(name, data[name], relatedFor(name), prev, next);
    fs.writeFileSync(path.join(outDir, slug(name) + '.html'), html);
  });

  fs.writeFileSync(path.join(outDir, 'index.html'), hubPage(names, data));
  fs.writeFileSync(path.join(__dirname, 'sitemap-creatures.xml'), sitemap(names));

  console.log(`Built ${names.length} creature pages + hub + creatures.css + sitemap-creatures.xml`);
}

build();
