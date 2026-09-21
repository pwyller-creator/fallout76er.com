# CLAUDE.md — Fallout76er's Wasteland Archive

Standing instructions for working on **fallout76er.com**. Read before making any change.

## What this is
- Personal Fallout 76 fan site: "Fallout76er's Wasteland Archive" — photo archive, field journal, creature spawn intel, scrap-farming guide, treasure-map walkthroughs, and a plans-exchange depot.
- Voice throughout: sardonic, deadpan, first-person wasteland-explorer field notes.
- In-game identity: level 555 character "Fallout76er", vendor camp "Rusty Curios & Rares" in Burning Springs.

## Hard constraints (never violate)
- **Vanilla HTML/CSS/JS only.** Never add frameworks, build tools, npm packages, or external dependencies beyond what's already in the files.
- **`index.html` is the single source of truth** for all core content (`PHOTOS`, `TM_DATA`) and SPA routing logic; `resources.js` holds most Pip-Boy widget data/logic (`SCRAP_DATA`, `INGREDIENT_DATA`, render functions) — see File map below for the full split. Pages under `/maps/` and `/creatures/`, `guides/pint-sized-slasher-mask-locations.html`, and the `WM_LINKS` block inside `guides/wasteland-map.html`, are generated artifacts — never hand-edit them.
- **Always work from the current file on disk.** It is authoritative; never reconstruct content from memory or a prior version.
- **Case-sensitive server** (GoDaddy / Apache Linux). Match filename case exactly — `.mp4`, not `.MP4`.
- **JS string safety:** escape apostrophes as `\'` inside single-quoted strings, or use backtick template literals for `desc` fields. One unescaped apostrophe silently breaks the entire script.
- **Special characters as literal UTF-8** (`—`, `·`). Never use Unicode escapes like `\u2014` — they render as literal text on this server stack.
- **Cache-busting:** when editing `spawn-data.js`, `plans-data.js`, or `resources.js`, increment the `?v=` query string on its `<script>` tag in `index.html`.

## Token guardrails
- Never rewrite `index.html` wholesale for a PHOTOS edit — patch in exact snippets only.
- Read scope for `index.html` (revised 2026-09-20): the file is ~350 KB / ~100k tokens, and reading all of it to append one photo entry cost that much for no benefit. For an edit inside a data block (`photos`, `TM_DATA`), read only the region being edited — for a new photo, the last ~15 lines of the `photos` array (the insert anchor) — then `Grep` the new filename to rule out a duplicate. Read the whole file only for structural edits (CSS, routing/JS logic, markup outside a data block) or when unsure what an edit touches.
- The file uses CRLF line endings. Never use `sed -i` or any in-place tool that rewrites line endings on it (a `sed -i` test on 2026-09-20 flipped all 6,600+ lines to LF). Use the Edit tool, or a byte-safe Node edit.
- The PreToolUse hook `.claude/hooks/token-guardrails.js` now only clamps `Read` chunk size on `index.html` so a call can't exceed the 25k-token cap; it no longer forces a full read.

## File map
- `index.html` — monolithic entry page. Photo archive (`PHOTOS` array), nuke-codes rendering logic, Minerva tracker, month-tab system, `TM_DATA`, and all SPA routing/hash logic (`showResources()`, `pushView`, the `deepLinkPipBoy()` deep-link system). Scrap/ingredient data and most Pip-Boy widget render logic itself now live in `resources.js`, not here — see below.
- `spawn-data.js` — external. `SPAWN_DATA` (creature spawns). Loaded via `<script>` with `?v=`.
- `plans-data.js` — external. `TRADE_PLANS`, `WANT_PLANS`, `PLANS_DB_VERSION`. Loaded via `<script>` with `?v=`.
- `resources.js` — external, `defer`-loaded. `SCRAP_DATA`, `INGREDIENT_DATA`, `MASK_DATA` (+ `MASK_QUEST_NEED`, `MASK_TIERS`), `pbNav()`, and the render/init functions for every Pip-Boy sub-page (Radio, Plans Exchange, Scrap/Ingredient Spawn Intel, Slasher Mask checklist, treasure-map widget). Loaded via `<script>` with `?v=`.
- `creatures.css` — shared stylesheet for `/creatures/` pages.
- `/creatures/` — crawlable creature detail pages + hub. **Generated** by `build_creatures.js`.
- `/maps/` — treasure-map guide pages + hub. **Generated** by `build_guides.js` from `TM_DATA` in `index.html`.
- `guides/wasteland-map.html` — interactive scrollable/searchable Appalachia map (`WM_DIGSITES`, `WM_LANDMARKS` hand-managed; the `WM_CREATURES_BY_LANDMARK`/`WM_SCRAP_BY_LANDMARK`/`WM_INGREDIENT_BY_LANDMARK` tooltip blocks between `WM_LINKS:START`/`END` are **generated** by `build_wasteland_map_links.js` — never hand-edit them). Not owned by any build script for `WM_LANDMARKS` itself; a new pin needs the manual ORB-matching workflow (see the fo76-map-pin-repair skill).
- `guides/pint-sized-slasher-mask-locations.html` — crawlable guide to all 108 Pint-Sized Slasher masks (61 locations, landmark + compass directions, per-mask placements, FAQ + JSON-LD). **Generated** by `build_masks.js` from `MASK_DATA` in `resources.js` — the same data drives the Pip-Boy "Slasher Mask Locations" checklist (`pb-page-masks`; deep link `#section=resources&masks=<region-slug>`). Never hand-edit; edit `MASK_DATA` and re-run. Approach directions (`where` fields) were computed from Mappalachia map-marker coordinates (2026-09-21); five sites have no marker and use wording verified in game.
- `sitemap.xml` — non-map URLs hand-managed; the `/maps/` entries are regenerated in place by `build_guides.js` (it preserves everything else verbatim).
- `sitemap-creatures.xml` — generated by `build_creatures.js`.
- `feed.xml` — Atom feed. **Generated** by `build_feed.js` from `photos` + `TM_DATA` in `index.html`.
- `llms.txt` — plain-text site map for AI assistants/answer engines (the [llms.txt](https://llmstxt.org) convention). **Generated** by `build_llms.js` from `SPAWN_DATA` (`spawn-data.js`) + `TM_DATA` in `index.html`.

## Build scripts
- `build_creatures.js` lives in the project root (tracked in git). It outputs the `/creatures/` pages and `sitemap-creatures.xml`. When creature data changes, re-run it (`node build_creatures.js`); never hand-edit the generated pages.
- `build_guides.js` lives in the project root (tracked in git). It reads `TM_DATA` from `index.html` and outputs the `/maps/` pages, the maps hub, and the `/maps/` section of `sitemap.xml` (non-map sitemap entries are kept verbatim). When treasure-map data changes, re-run it (`node build_guides.js`); never hand-edit the generated pages. It does **not** own `tm-guide.css` — that stays hand-managed; bump `CSSVER` in the script when the CSS changes.
- `build_feed.js` (project root, tracked) reads `photos` + `TM_DATA` from `index.html` and outputs `feed.xml` (Atom, 30 newest entries). Re-run after every new photo or newly documented treasure map. Photo entries convert in-world 2102 dates to real dates by subtracting 76 years; output is deterministic (no build timestamp). Photo entries carry an enclosure link + `media:content` tag (image URL) — keep these; feed readers use them, and the Bluesky auto-post pipeline (see Social) depends on the feed's photo-entry URL shape.
- `build_diary.js` (project root, tracked) fetches the Substack RSS feed (`fallout76er.substack.com/feed`) and bakes the 3 newest posts as static dispatch cards into `index.html` between the `<!-- DIARY:START -->` / `<!-- DIARY:END -->` markers (the "Fireside Dispatches" section above Camp Spotlight). Re-run after every new Substack post, then upload `index.html`. Post dates display in-world (+76 years). Only the marker span is generated — the section shell and its CSS are hand-managed in `index.html`.
- `build_llms.js` (project root, tracked) reads `SPAWN_DATA` + `TM_DATA` and outputs `llms.txt` — a link + one-line-description index of every crawlable page (homepage, guides, every creature page, every documented treasure-map guide) for AI assistants/answer engines. Re-run after creature or treasure-map data changes: `node build_llms.js`, then upload `llms.txt`.
- `build_wasteland_map_links.js` (project root, tracked) reads `SPAWN_DATA`, `SCRAP_DATA`/`INGREDIENT_DATA` (resources.js), and the already-pinned `WM_LANDMARKS` names in `guides/wasteland-map.html`, then regenerates that page's `WM_CREATURES_BY_LANDMARK`/`WM_SCRAP_BY_LANDMARK`/`WM_INGREDIENT_BY_LANDMARK` tooltip blocks by exact name match (a short audited `LANDMARK_ALIASES` table in the script covers known near-miss names). Re-run after any `SPAWN_DATA`/`SCRAP_DATA`/`INGREDIENT_DATA` change: `node build_wasteland_map_links.js`, then upload `guides/wasteland-map.html`. Does **not** place new landmark pins (`WM_LANDMARKS` x/y) — that's still the manual ORB-matching workflow in the fo76-map-pin-repair skill. Covered by the pre-commit staleness guard below since 2026-09-20.
- `build_masks.js` (project root, tracked) reads `MASK_DATA`/`MASK_QUEST_NEED`/`MASK_TIERS` from `resources.js` and outputs `guides/pint-sized-slasher-mask-locations.html` (deterministic; refuses to build unless the data totals exactly 108 masks). Re-run after any `MASK_DATA` change: `node build_masks.js`, then upload the page **and** `resources.js`/`index.html`. Bump `MODIFIED`/`LAST_CHECKED` in the script when the data changes materially, and update this page's `sitemap.xml` `lastmod` by hand. Its own `<style>` block sits on top of `tm-guide.css`, so `CSSVER` is untouched. Covered by the pre-commit staleness guard (triggers on `resources.js` or `build_masks.js` staged).
- **Pre-commit staleness guard** (not tracked in git — hooks live outside the repo at `C:\Users\tdcot\git-external\fallout76er.com.git\hooks\pre-commit`, plus a helper `extract-block.js` in the same folder, since the working copy's `.git` is just a `gitdir:` pointer): re-runs the relevant build script(s) above and blocks the commit if `feed.xml` / `/maps/` / `/creatures/` / `sitemap*.xml` / `llms.txt` would come out stale relative to what's staged, if `tm-guide.css` changed without a `CSSVER` bump in `build_guides.js`, or if `spawn-data.js`/`plans-data.js`/`nuke-codes-data.js`/`resources.js` changed without its `?v=` cache-bust in `index.html` moving, or if the `WM_LINKS` tooltip blocks in `guides/wasteland-map.html` would regenerate differently (via `build_wasteland_map_links.js`; triggers on `spawn-data.js`, `resources.js`, or the map page itself being staged), or if the Slasher mask guide would regenerate differently (via `build_masks.js`; triggers on `resources.js` or the script being staged — added 2026-09-21). Triggers are scoped to the actual `photos`/`TM_DATA` block content so an unrelated `index.html` edit doesn't false-fire. Bypass a genuine false positive with `git commit --no-verify`. Added 2026-09-14 after two missed `build_feed.js` re-runs shipped stale `feed.xml` to the live site.

## Design system
Two distinct aesthetics — keep them separate, don't mix.

**Photo archive / main page — worn-paper field journal:**
- CSS vars: `--ink`, `--rust`, `--rust-dim`, `--rust-mute`, `--paper`, `--paper-dark`, `--paper-darker`, `--text-mid`, `--border-dim`.
- Fonts: Rye (headings), Courier Prime (UI / labels / dates), IM Fell English (body prose) — the three families loaded by the `<link>` in `index.html`. Rock Salt / Special Elite / Caveat were retired and are not loaded (see the fo76-design-system skill).

**Interactive data widgets (scrap / spawn) — Pip-Boy amber phosphor:**
- CSS vars: `--pb-border`, `--pb-bright`, `--pb-dim`, `--pb-glow`.
- Fonts: IM Fell English (prose), Courier New (UI).
- Two-pane layout: left nav menu, right display pane.
- Both the creature and scrap menu handlers use `scrollIntoView` + `scroll-margin-top: 90px` so the results panel stays visible after a selection — preserve this when touching those handlers.

Overall look: post-apocalyptic wasteland — worn paper, rust, amber glow.

## PHOTOS array (photo-archive entries)
Shape:
```js
{
  file: 'filename.webp',
  title: 'Short evocative title',
  date: 'MM.DD.YYYY',
  tag: 'Location',        // Location | Encounter | NPC | Player | Item | Camp
  threat: 'MEDIUM',       // NONE | LOW | MEDIUM | HIGH | EXTREME
  region: 'REGION NAME',  // a sub-region or named place after a dash is fine
  alt: 'Literal visual description — REGION NAME',  // image-SEO/accessibility alt text; see fo76-photo-entry skill
  desc: 'Atmospheric in-world field note.'
}
```
- Images are `.webp` throughout (favicon / apple-touch icons stay `.png`).
- `bioOnly: true` flags a bio image so it's excluded from the main archive grid.
- Every non-`bioOnly` entry also needs a 640px-wide grid thumbnail at `thumbs/<file>` (same filename) — the grid template loads from `thumbs/`, not the full-res file, so a missing thumbnail 404s silently in the grid. Generate via `node .claude/generate-thumb.js <file> --force` after watermarking; ship both files together. See fo76-photo-entry skill for the full pipeline.
- Month tabs build dynamically from photo dates; tag filter buttons are hardcoded in the filter bar.
- New entry from a screenshot: infer region / threat / tag from the visuals, write `desc` as a survivor's field note. Pwyller makes all final copy calls and often rewrites drafts substantially.

## Nuke codes
- Live in the `nukeCodes` object in `nuke-codes-data.js` (`week`, `alpha`, `bravo`, `charlie`) — external file, loaded via `<script src="/nuke-codes-data.js?v=...">` in `index.html` (same `?v=` cache-bust convention as `spawn-data.js`/`plans-data.js`). `index.html` itself only holds the rendering logic now.
- Update weekly — codes run Thursday–Wednesday; server reset is Wednesday ~8pm ET (new codes take effect Thursday).
- Updated by running `.claude\update-nuke-codes.ps1` manually (not scheduled). It fetches nukaknights.com + falloutbuilds.com/fo76/nuke-codes/ deterministically (regex, no LLM), requires both to agree, shows a diff, and only writes/uploads/commits+pushes after an explicit y/n. It uploads `nuke-codes-data.js` + `index.html` via SFTP itself — no FileZilla needed for this specific update. `nukacrypt.com` is a React SPA behind a private GraphQL API and isn't scraped automatically; it stays as a manual-fallback reference source only.
- SFTP private key for the script lives DPAPI-encrypted at `%LOCALAPPDATA%\fallout76er-tools\sftp-key-credential.xml`, outside the repo and outside OneDrive sync — never in git, never shared with Claude. Switched from a plain-FTP username/password to SSH-key auth 2026-09-15 (see Performance/hosting below).

## Plans exchange (`plans-data.js`)
- `TRADE_PLANS`: items to give away — quantity ≥ 2, sorted descending by quantity.
- `WANT_PLANS`: **curated** rare / sought items only (PA mods, prime receivers, event exclusives, rare weapon / backpack mods, underarmor linings, recipes). Not vendor staples or common drops.
- Master tradeable list: `Fallout76_Plans.csv` (FED76-derived). Known rename: ".44 Pistol" in the CSV = "44 Revolver" in game.

## Treasure maps (`TM_DATA`)
- A clickable entry needs `documented: true` plus `video`, `title`, `desc`, `meta`, and `published` (YYYY-MM-DD, used as the guide page's uploadDate). Without those it renders as an inert stub; `build_guides.js` errors on a documented entry missing any of them.
- Optional `img` on a map entry overrides the region image as that guide's poster/thumbnail.
- After any `TM_DATA` change, re-run `node build_guides.js`.

## Spotlight (`spotlight/spotlight.json`)
- Updates need only an image swap + a JSON edit — no HTML changes.

## Video
- Click-to-load facade pattern: zero MP4 bytes download until the user hits play. Preserve this.
- Capture with Xbox Game Bar. Compress with HandBrake: RF 22–23, H.264, 30fps constant, Web Optimized, Slow preset, AAC 128kbps.

## Performance / hosting
- `.htaccess` handles browser caching (one-year max-age + immutable for static assets), gzip via mod_deflate, and security headers.
- Avoid load-heavy third-party widgets (the Digits.net hit counter cost ~1,148ms and was pulled for that reason).
- Deploy via `.claude\upload.ps1` (below) over **SFTP with SSH-key auth**, host `132.148.181.102` port 22, to the `public_html` web root. Switched from plain FTP + username/password 2026-09-15 — the key was generated via cPanel → SSH Access, is stored DPAPI-encrypted (never plaintext on disk, never in a OneDrive-synced folder — that mistake happened once during setup and the key was regenerated + the old one de-authorized as a result). FileZilla is a documented manual fallback only, not the default path. Nuke codes are the exception in flow but not in transport: `update-nuke-codes.ps1` (see Nuke codes section) uploads `index.html` + `nuke-codes-data.js` itself via the same SFTP mechanism after an explicit approval prompt.
- `.claude\upload.ps1 -Files a,b,c` (invoke directly, never nested in another `pwsh` call — that breaks comma-array splitting) uploads an explicit file list via SFTP, reusing the same DPAPI-encrypted key credential as `update-nuke-codes.ps1` (`.claude\sftp-lib.ps1`, dot-sourced by both), then auto-runs `verify-deploy.js` against exactly those files. Hardcoded deny-list (`.claude/`, `.git/`, credentials, `.env`, `.xlsm/.xlsx`) and allow-list (known site file names/prefixes/extensions) both gate every file regardless of what's passed — an unrecognized path aborts the whole batch. No interactive prompt by design and no git commit/push; the confirmation is chat approval before invoking it, plus the tool's own permission prompt (so it must stay off any auto-allow list). `-DryRun` previews without touching the credential or network.

## GitHub
- **Public repo**: github.com/pwyller-creator/fallout76er.com (branch `main`) — exists for authorship/provenance; the site footer links to it. Anything committed is world-readable.
- Commit author email is the GitHub noreply address (set in repo-local `git config user.email`) — never commit with a personal email.
- `.claude/`, `har.json`, and `launch-claude-code.bat` are deliberately gitignored (personal/local) — never track them. Same for anything else personal.
- Push after committing — GitHub is the offsite backup and public record, so unpushed commits defeat the purpose.
- Deployment is `.claude\upload.ps1` over SFTP (SSH-key auth) except for nuke codes, which `update-nuke-codes.ps1` uploads itself the same way; pushing to GitHub does **not** deploy the site. `README.md` and `.github/` are repo-only, not uploaded to the server. FileZilla remains configured as a manual fallback (its "fallout76er" site entry was updated to SFTP/port 22/key auth 2026-09-15, key file at `%LOCALAPPDATA%\fallout76er-tools\fallout76er_deploy.filezilla-key` — no password stored anymore, unlike the old plain-FTP entry).

## SEO
- Standalone crawlable pages: `/creatures/[slug].html` and `/maps/[region]-treasure-map-[num].html`.
- Each gets a canonical URL, Open Graph tags, JSON-LD (Article + BreadcrumbList), and related internal links. The homepage footer links both hubs.
- IndexNow key: `f76er2026wastelandarchive4269ab`.
- Tools: Google Search Console (Domain property), Bing Webmaster Tools, IndexNow. **Yandex does not work** for this site (SMS verification fails) — don't suggest it.

## Social
- Bluesky: bsky.app/profile/fallout76er.com (DID `did:plc:hknfh6hoeldcg373afuu3vs2`).
- **Bluesky auto-post**: a Make.com scenario ("Integration RSS") polls `feed.xml` daily at 6 AM and posts new **photo entries** to Bluesky — image attached, clickable `fallout76er.com` link, `#Fallout76 #FO76` tags. Flow: RSS watch → filter (entry URL contains `#photo=`) → HTTP image download → Bluesky Upload media → API call (`createRecord` with a link facet at bytes 0–15 covering the literal `fallout76er.com` prefix — that prefix must stay exactly 15 ASCII bytes or the link breaks). Constraints the site must honor:
  - Photo entry URLs in the feed must keep the `#photo=<file>` form — the filter and the image-URL derivation (`replace(url; "#photo="; "")`) both depend on it.
  - Treasure-map guides and Substack dispatches never post (no `#photo=` in their URLs) — intentional.
  - Archive images must stay well under Bluesky's ~1 MB image cap (standard q80 compression lands ~200–300 KB, fine).
  - `feed.xml` must keep serving with `charset=utf-8` (set in `.htaccess`) — without it Make decodes UTF-8 as Latin-1 and mangles em dashes.
  - New photo → upload `index.html` + image + `feed.xml` → the 6 AM poll posts it (or "Run once" in the Make scenario editor for immediate posting). Full Make module mappings live in Claude's memory, not here.
- Lemmy for community posts.
- **Tumblr**: fallout76er.tumblr.com. Manual/on-request, same as Lemmy — never automatic like Bluesky. Post via `.claude\post-tumblr.ps1` (OAuth 1.0a, DPAPI-encrypted credential from a one-time `.claude\tumblr-oauth-setup.ps1` run); delete via `.claude\delete-tumblr-post.ps1`. Offer a Tumblr post alongside the Lemmy ask for any new archive/photo/creature/treasure-map entry.
- **Discord: declined — do not suggest it.**
- Watermarking via Watermark.pro (SVG watermark on file).

## Working style
- Make surgical edits to the actual file and show the diff; don't rewrite sections that didn't need touching.
- Verify changes before presenting — especially JS string escaping and any `?v=` cache-bust bumps.
- Pwyller owns all copy and voice decisions.
