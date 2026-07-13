#!/usr/bin/env node
/*
  build_diary.js — bakes the latest Wastelander Diary posts into index.html.

  Reads the Substack RSS feed (https://fallout76er.substack.com/feed) and
  regenerates the dispatch-note cards between the DIARY:START / DIARY:END
  markers in index.html. Everything outside the markers is preserved
  verbatim; on any fetch/parse error the file is left untouched.

  Run after each new Substack post:  node build_diary.js
  Then upload index.html.
*/

'use strict';

const fs = require('fs');
const path = require('path');

const FEED_URL  = 'https://fallout76er.substack.com/feed';
const INDEX     = path.join(__dirname, 'index.html');
const MAX_POSTS = 3;
const TILTS     = ['-1.2deg', '0.8deg', '-0.6deg'];
const START     = '<!-- DIARY:START -->';
const END       = '<!-- DIARY:END -->';

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  mdash: '—', ndash: '–', hellip: '…',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“'
};

function decodeEntities(s) {
  return s.replace(/&(#?\w+);/g, (m, name) => {
    if (ENTITIES[name] !== undefined) return ENTITIES[name];
    if (name[0] === '#') {
      const code = (name[1] === 'x' || name[1] === 'X')
        ? parseInt(name.slice(2), 16)
        : parseInt(name.slice(1), 10);
      if (!Number.isNaN(code)) return String.fromCodePoint(code);
    }
    return m;
  });
}

const stripTags  = s => s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
                         .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function field(item, tag) {
  const m = item.match(new RegExp('<' + tag + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + tag + '>'));
  if (!m) return '';
  let v = m[1].trim();
  const cdata = v.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  if (cdata) v = cdata[1].trim();
  return v;
}

// Site clock runs 76 years ahead of ours (2026 → 2102) — the reverse of the
// offset build_feed.js applies to photo dates.
function inWorldDate(pubDate) {
  const d = new Date(pubDate);
  if (Number.isNaN(d.getTime())) throw new Error('Unparseable pubDate: ' + pubDate);
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return mm + '.' + dd + '.' + (d.getUTCFullYear() + 76);
}

function excerpt(desc, max = 160) {
  const text = decodeEntities(stripTags(desc));
  if (text.length <= max) return text;
  let cut = text.slice(0, max);
  cut = cut.slice(0, cut.lastIndexOf(' '));
  return cut + '…';
}

function card(post, i) {
  return `    <a class="diary-card" style="--tilt:${TILTS[i % TILTS.length]}" href="${escapeHtml(post.link)}" target="_blank" rel="noopener">
      <span class="diary-card-date">${escapeHtml(post.date)}</span>
      <span class="diary-card-title">${escapeHtml(post.title)}</span>
      <span class="diary-card-excerpt">${escapeHtml(post.excerpt)}</span>
      <span class="diary-card-read">Read the dispatch →</span>
    </a>`;
}

async function main() {
  const res = await fetch(FEED_URL, { headers: { 'user-agent': 'fallout76er.com build_diary' } });
  if (!res.ok) throw new Error('Feed fetch failed: HTTP ' + res.status);
  const xml = await res.text();

  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => m[1]);
  if (items.length === 0) throw new Error('No <item> entries in feed — index.html left untouched');

  const posts = items.slice(0, MAX_POSTS).map(item => {
    const title = decodeEntities(stripTags(field(item, 'title')));
    const link  = decodeEntities(field(item, 'link'));
    if (!title || !link) throw new Error('Feed item missing title or link');
    return {
      title,
      link,
      date: inWorldDate(field(item, 'pubDate')),
      excerpt: excerpt(field(item, 'description'))
    };
  });

  const html = fs.readFileSync(INDEX, 'utf8');
  const a = html.indexOf(START), b = html.indexOf(END);
  if (a === -1 || b === -1 || b < a) throw new Error('DIARY markers not found in index.html');

  const cards = posts.map(card).join('\n');
  const out = html.slice(0, a + START.length) + '\n' + cards + '\n    ' + html.slice(b);
  fs.writeFileSync(INDEX, out);

  console.log('Baked ' + posts.length + ' diary dispatch' + (posts.length === 1 ? '' : 'es') + ' into index.html:');
  posts.forEach(p => console.log('  · ' + p.date + ' — ' + p.title));
}

main().catch(err => { console.error(err.message || err); process.exit(1); });
