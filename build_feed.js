#!/usr/bin/env node
/* ────────────────────────────────────────────────────────────────────────
   build_feed.js  —  Fallout76er's Wasteland Archive
   Generates the Atom feed (feed.xml) from `photos` and TM_DATA in index.html.

   Reads:   ./index.html   (const photos = [...] and const TM_DATA = [...])
   Writes:  ./feed.xml

   Entries: archive photos (bioOnly excluded) + documented treasure-map
   guides, newest first, capped at 30. Photo dates are in-world 2102 dates;
   the feed's machine timestamps subtract 76 years (2102 → 2026 — the same
   offset the game uses), while the visible field note keeps the 2102 date.

   Output is deterministic — no build timestamp — so re-running without a
   content change leaves feed.xml byte-identical.

   feed.xml is a DISPOSABLE generated artifact — never edit it by hand.
   Edit index.html data, then re-run:  node build_feed.js
   (Run after every new photo or newly documented treasure map.)
   ──────────────────────────────────────────────────────────────────────── */

const fs = require('fs');
const path = require('path');

const SITE = 'https://fallout76er.com';
const FEED_URL = SITE + '/feed.xml';
const MAX_ENTRIES = 30;
const YEAR_OFFSET = 76;   // in-world 2102 ↔ real 2026

// ── Load both arrays from index.html ─────────────────────────────────────
function extractArray(src, decl) {
  const start = src.indexOf(decl);
  if (start === -1) throw new Error(decl + ' not found in index.html');
  const end = src.indexOf('\n];', start);
  if (end === -1) throw new Error('closing "];" not found for ' + decl);
  // eslint-disable-next-line no-eval
  return eval(src.slice(start + decl.length - 1, end + 3));
}

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escAttr = (s) => esc(s).replace(/"/g, '&quot;');

// 'MM.DD.YYYY' in-world → RFC3339 real-world timestamp
function photoDate(d) {
  const [mm, dd, yyyy] = d.split('.');
  return `${Number(yyyy) - YEAR_OFFSET}-${mm}-${dd}T12:00:00Z`;
}

function entryXml(e) {
  return `  <entry>
    <title>${esc(e.title)}</title>
    <link href="${esc(e.url)}" rel="alternate" type="text/html"/>
    <id>${esc(e.url)}</id>
    <published>${e.date}</published>
    <updated>${e.date}</updated>
    <category term="${esc(e.category)}"/>
    <content type="html">${esc(e.html)}</content>
  </entry>`;
}

function build() {
  const src = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const photos = extractArray(src, 'const photos = [');
  const tmData = extractArray(src, 'const TM_DATA = [');

  const entries = [];

  photos.filter(p => !p.bioOnly).forEach(p => {
    entries.push({
      title: p.title,
      url: `${SITE}/#photo=${encodeURIComponent(p.file)}`,
      date: photoDate(p.date),
      category: p.tag,
      html: `<img src="${SITE}/${p.file}" alt="${escAttr(p.title)}"/>` +
            `<p>${esc(p.desc)}</p>` +
            `<p><em>${esc(p.region)} · Threat: ${esc(p.threat)} · Field date ${esc(p.date)}</em></p>`
    });
  });

  tmData.forEach(region => region.maps.forEach(map => {
    if (!map.documented) return;
    entries.push({
      title: map.title,
      url: `${SITE}/maps/${region.id}-treasure-map-${map.num}.html`,
      date: `${map.published}T12:00:00Z`,
      category: 'Treasure Map Guide',
      html: map.desc +
            `<p><em>${esc(map.meta)}</em> — <a href="${SITE}/maps/${region.id}-treasure-map-${map.num}.html">video walkthrough on the guide page</a></p>`
    });
  }));

  entries.sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
  const latest = entries.slice(0, MAX_ENTRIES);
  const updated = latest.length ? latest[0].date : '2026-01-01T12:00:00Z';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Fallout76er's Wasteland Archive</title>
  <subtitle>Field reports, photo archive updates, and treasure-map walkthroughs from Appalachia — documented so you don't have to die finding out.</subtitle>
  <link href="${FEED_URL}" rel="self" type="application/atom+xml"/>
  <link href="${SITE}/" rel="alternate" type="text/html"/>
  <id>${SITE}/</id>
  <updated>${updated}</updated>
  <icon>${SITE}/favicon-96x96.png</icon>
  <author>
    <name>Fallout76er</name>
    <uri>${SITE}/</uri>
  </author>
${latest.map(entryXml).join('\n')}
</feed>
`;

  fs.writeFileSync(path.join(__dirname, 'feed.xml'), xml);
  console.log(`Built feed.xml — ${latest.length} entries (of ${entries.length} total), newest: ${updated}`);
}

build();
