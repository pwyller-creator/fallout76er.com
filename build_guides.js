#!/usr/bin/env node
/* ────────────────────────────────────────────────────────────────────────
   build_guides.js  —  Fallout76er's Wasteland Archive
   Generates crawlable Treasure Map guide pages from TM_DATA in index.html.

   Reads:   ./index.html      (const TM_DATA = [...] — single source of truth)
            ./sitemap.xml     (existing non-/maps/ entries are preserved)
   Writes:  ./maps/index.html                    (hub)
            ./maps/[region]-treasure-map-[num].html  (one page per documented map)
            ./sitemap.xml                        (merged: non-maps entries kept
                                                  verbatim, /maps/ section rebuilt)

   tm-guide.css is hand-managed — this script only references it. Bump CSSVER
   below when that file changes.

   The /maps/ HTML files are DISPOSABLE generated artifacts — never edit them
   by hand. Edit TM_DATA in index.html, then re-run:  node build_guides.js
   Only maps with `documented: true` (plus video/title/desc/meta/published)
   get a page; stubs are skipped.
   ──────────────────────────────────────────────────────────────────────── */

const fs = require('fs');
const path = require('path');

const SITE   = 'https://fallout76er.com';
const TODAY  = new Date().toISOString().slice(0, 10);   // YYYY-MM-DD
const CSSVER = '20260706';                               // bump when tm-guide.css changes
const FONTS  = 'https://fonts.googleapis.com/css2?family=Rye&family=IM+Fell+English:ital@0;1&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap';

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
const escAttr = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// desc HTML → plain text: paragraphs joined by a space, tags stripped, whitespace collapsed
const plainText = (html) => html
  .replace(/<\/p>\s*<p>/g, ' ')
  .replace(/<[^>]+>/g, '')
  .replace(/\s+/g, ' ')
  .trim();

// cut at the last word boundary within `limit` chars, append …
function truncate(text, limit) {
  if (text.length <= limit + 1) return text;
  let cut = text.slice(0, limit + 1);
  cut = cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:]$/, '');
  return cut + '…';
}

// hub-card teaser: prefer a sentence boundary landing between 90 and 150 chars
function teaser(text) {
  const m = /^[\s\S]{89,149}?[.!?](?=\s|$)/.exec(text);
  if (m) return m[0];
  return truncate(text, 150);
}

const regionShort = (name) => name.replace(/^The /, '');
const fileFor = (region, map) => `${region.id}-treasure-map-${map.num}.html`;
const posterFor = (region, map) => map.img || region.img;

// every documented map, flattened in TM_DATA order
function documentedMaps(data) {
  const out = [];
  data.forEach(region => region.maps.forEach(map => {
    if (map.documented) out.push({ region, map });
  }));
  return out;
}

// ── Shared page chrome ───────────────────────────────────────────────────
function head({ title, desc, canonical, og, jsonld }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escAttr(title)}</title>
<meta name="description" content="${escAttr(desc)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="index, follow, max-image-preview:large">

${og}
<link rel="icon" type="image/png" href="/favicon-96x96.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="/tm-guide.css?v=${CSSVER}">

<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>`;
}

const header = (crumbs) => `
<header class="tmg-header">
  <a class="tmg-brand" href="/">Fallout76er's <span>Wasteland Archive</span></a>
  <nav class="tmg-crumbs" aria-label="Breadcrumb">
    ${crumbs}
  </nav>
</header>`;

const footer = `
<footer class="tmg-footer">
  Field-documented in Appalachia by Fallout76er. &nbsp;<a href="/creatures/">Creature Spawn Intel</a> &nbsp;&middot;&nbsp; <a href="https://fallout76er.substack.com" target="_blank" rel="noopener">Wastelander Diary</a> &nbsp;&middot;&nbsp; <a href="https://github.com/pwyller-creator/fallout76er.com" target="_blank" rel="noopener">GitHub</a> &nbsp;&middot;&nbsp; <a href="/">Return to the archive &rarr;</a>
</footer>`;

const videoScript = `
<script>
(function(){
  var box = document.getElementById('tmg-video');
  if (!box) return;
  box.addEventListener('click', function(){
    var src = box.getAttribute('data-src');
    if (!src) return;
    var v = document.createElement('video');
    v.src = src; v.controls = true; v.playsInline = true; v.autoplay = true;
    v.setAttribute('preload', 'auto');
    v.className = 'tmg-video-el';
    box.innerHTML = '';
    box.appendChild(v);
    v.play().catch(function(){});
  }, { once: true });
})();
</script>`;

// ── Guide page ───────────────────────────────────────────────────────────
function guidePage(region, map, allDocs) {
  const file = fileFor(region, map);
  const canonical = `${SITE}/maps/${file}`;
  const poster = posterFor(region, map);
  const text = plainText(map.desc);
  const metaDesc = truncate(text, 155);
  const pageTitle = `Fallout 76 ${regionShort(region.name)} Treasure Map ${map.num} | Fallout76er`;

  const og = `<meta property="og:type" content="article">
<meta property="og:title" content="${escAttr(map.title)}">
<meta property="og:description" content="${escAttr(metaDesc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}/${poster}">
<meta property="og:site_name" content="Fallout76er's Wasteland Archive">
<meta property="og:locale" content="en_US">
<meta property="og:video" content="${SITE}/${map.video}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escAttr(map.title)}">
<meta name="twitter:description" content="${escAttr(metaDesc)}">
<meta name="twitter:image" content="${SITE}/${poster}">
`;

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "VideoObject",
        "name": map.title,
        "description": text,
        "thumbnailUrl": `${SITE}/${poster}`,
        "contentUrl": `${SITE}/${map.video}`,
        "embedUrl": canonical,
        "uploadDate": map.published,
        "inLanguage": "en-US",
        "isFamilyFriendly": true,
        "creator": { "@type": "Person", "name": "Fallout76er" },
        "publisher": { "@type": "Person", "name": "Fallout76er" },
        "about": `Fallout 76 ${region.name} treasure map dig site walkthrough`
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/" },
          { "@type": "ListItem", "position": 2, "name": "Treasure Maps", "item": SITE + "/maps/" },
          { "@type": "ListItem", "position": 3, "name": map.title, "item": canonical }
        ]
      }
    ]
  };

  const crumbs = `<a href="/">Home</a><span class="sep">&rsaquo;</span><a href="/maps/">Treasure Maps</a><span class="sep">&rsaquo;</span><span>${region.name}</span><span class="sep">&rsaquo;</span><span class="cur">Map ${map.num}</span>`;

  const related = allDocs
    .filter(d => !(d.region.id === region.id && d.map.num === map.num))
    .slice(0, 6)
    .map(d => `      <a href="/maps/${fileFor(d.region, d.map)}">${d.map.title}</a>`)
    .join('\n');

  return head({ title: pageTitle, desc: metaDesc, canonical, og, jsonld }) + `
<body>${header(crumbs)}

<main class="tmg-main">
  <h1 class="tmg-title">${map.title}</h1>
  <p class="tmg-meta">${map.meta}</p>

  <div class="tmg-video" id="tmg-video" data-src="/${map.video}">
    <img class="tmg-poster" src="/${poster}" alt="${escAttr(map.title + ' — Appalachia treasure map')}" loading="lazy" width="1920" height="1080">
    <button class="tmg-play" type="button" aria-label="Play walkthrough video">&#9654;</button>
  </div>

  <article class="tmg-desc">
    ${map.desc}
  </article>

  <section class="tmg-related" aria-label="More dig sites">
    <h2 class="tmg-related-h">More Documented Dig Sites</h2>
    <div class="tmg-related-links">
${related}
    </div>
  </section>

  <p class="tmg-back"><a href="/maps/">&larr; Back to all treasure map guides</a></p>
</main>
${footer}
${videoScript}
</body>
</html>
`;
}

// ── Hub page ─────────────────────────────────────────────────────────────
function hubPage(allDocs) {
  const canonical = `${SITE}/maps/`;
  const title = 'Fallout 76 Treasure Map Guides | Fallout76er';
  const desc = 'Every documented Fallout 76 treasure map dig site in Appalachia, with video walkthroughs and step-by-step field notes from a wasteland survivor.';
  const ogImage = `${SITE}/${posterFor(allDocs[0].region, allDocs[0].map)}`;

  const og = `<meta property="og:type" content="website">
<meta property="og:title" content="Fallout 76 Treasure Map Guides">
<meta property="og:description" content="${escAttr(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta property="og:site_name" content="Fallout76er's Wasteland Archive">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Fallout 76 Treasure Map Guides">
<meta name="twitter:description" content="${escAttr(desc)}">
`;

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": canonical,
        "name": "Fallout 76 Treasure Map Guides",
        "url": canonical,
        "description": desc,
        "inLanguage": "en-US",
        "isPartOf": { "@id": SITE + "/#website" }
      },
      {
        "@type": "ItemList",
        "name": "Documented Treasure Map Dig Sites",
        "numberOfItems": allDocs.length,
        "itemListElement": allDocs.map((d, i) => ({
          "@type": "ListItem", "position": i + 1, "name": d.map.title,
          "url": `${SITE}/maps/${fileFor(d.region, d.map)}`
        }))
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/" },
          { "@type": "ListItem", "position": 2, "name": "Treasure Map Guides", "item": canonical }
        ]
      }
    ]
  };

  const crumbs = `<a href="/">Home</a><span class="sep">&rsaquo;</span><span class="cur">Treasure Map Guides</span>`;

  const cards = allDocs.map(d => {
    const t = teaser(plainText(d.map.desc));
    return `      <a class="tmg-card" href="/maps/${fileFor(d.region, d.map)}">
        <span class="tmg-card-thumb"><img src="/${posterFor(d.region, d.map)}" alt="${escAttr(d.map.title + ' — ' + d.region.name + ' map')}" loading="lazy" width="1920" height="1080"></span>
        <span class="tmg-card-body">
          <span class="tmg-card-region">${d.region.name} · Map ${d.map.num}</span>
          <span class="tmg-card-title">${d.map.title}</span>
          <span class="tmg-card-teaser">${t}</span>
          <span class="tmg-card-cta">View guide &rarr;</span>
        </span>
      </a>`;
  }).join('\n');

  return head({ title, desc, canonical, og, jsonld }) + `
<body>${header(crumbs)}

<main class="tmg-main tmg-hub-main">
  <h1 class="tmg-title">Treasure Map Guides</h1>
  <p class="tmg-hub-intro">Every documented dig site I've tracked down across Appalachia, each with a video walkthrough and step-by-step field notes. Pick a map and go get buried treasure &mdash; minimal deaths not guaranteed.</p>

  <div class="tmg-hub-grid">
${cards}
  </div>

  <p class="tmg-back"><a href="/">&larr; Back to the Wasteland Archive</a></p>
</main>
${footer}
</body>
</html>
`;
}

// ── Sitemap merge ────────────────────────────────────────────────────────
// Keeps every non-/maps/ <url> block verbatim (hand-managed), then appends
// the regenerated /maps/ section: hub first, then each documented map.
function mergeSitemap(allDocs) {
  const xml = fs.readFileSync(path.join(__dirname, 'sitemap.xml'), 'utf8');
  const blocks = xml.match(/  <url>[\s\S]*?<\/url>/g) || [];
  const kept = blocks.filter(b => !/<loc>[^<]*\/maps\//.test(b));

  const mapUrl = (loc, changefreq, priority) =>
    `  <url>
    <loc>${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

  const mapsBlocks = [
    mapUrl(`${SITE}/maps/`, 'weekly', '0.9'),
    ...allDocs.map(d => mapUrl(`${SITE}/maps/${fileFor(d.region, d.map)}`, 'monthly', '0.8'))
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...kept, ...mapsBlocks].join('\n')}
</urlset>
`;
}

// ── Build ────────────────────────────────────────────────────────────────
function build() {
  const data = loadTmData();
  const allDocs = documentedMaps(data);

  for (const { region, map } of allDocs) {
    const missing = ['video', 'title', 'desc', 'meta', 'published'].filter(k => !map[k]);
    if (missing.length) {
      throw new Error(`${region.id} map ${map.num} is documented but missing: ${missing.join(', ')}`);
    }
  }

  const outDir = path.join(__dirname, 'maps');
  fs.mkdirSync(outDir, { recursive: true });

  allDocs.forEach(({ region, map }) => {
    fs.writeFileSync(path.join(outDir, fileFor(region, map)), guidePage(region, map, allDocs));
  });
  fs.writeFileSync(path.join(outDir, 'index.html'), hubPage(allDocs));
  fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), mergeSitemap(allDocs));

  console.log(`Built ${allDocs.length} treasure-map pages + hub + merged sitemap.xml`);
}

build();
