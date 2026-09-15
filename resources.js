// Game Resources widget logic — Pip-Boy Radio, nuke codes, Minerva tracker,
// calculators, scrap/creature spawn intel, plans exchange, treasure-map
// guide widget, Appalachia clock. Loaded with `defer` from index.html so a
// photo-archive-only visitor isn't parsing/executing this on every visit —
// see CLAUDE.md. Runs automatically on every load (not click-gated): the
// resources-view markup stays inline in index.html and this just renders
// into it a beat later, so crawlability/SEO is unchanged.

// ── Pip-Boy Radio (WAFO 100.76) ──────────────────────────────────
(function() {
  const TRACKS = [
    { file: 'Wasteland_Wonderings.mp3',   title: "Wanderer's Interlude" },
    { file: 'Wasteland_Wonderings_2.mp3', title: 'Appalachia Afternoon' },
    { file: 'Wasteland_Wonderings_3.mp3', title: 'Hardtimes Holler' }
  ];
  let trackIndex = 0;
  let hasStarted = false;

  const audio    = document.getElementById('pb-radio-audio');
  const unit     = document.getElementById('pb-radio-unit');
  const trackEl  = document.getElementById('pb-radio-track');
  const playBtn  = document.getElementById('pb-radio-playbtn');
  const listEl   = document.getElementById('pb-radio-tracklist');

  listEl.innerHTML = TRACKS.map((t, i) =>
    `<div class="pb-radio-tracklist-item" data-idx="${i}"><span>${t.title}</span><span>&#9834;</span></div>`
  ).join('');
  const itemEls = listEl.querySelectorAll('.pb-radio-tracklist-item');

  function renderTrack() {
    trackEl.textContent = TRACKS[trackIndex].title;
    itemEls.forEach((el, i) => el.classList.toggle('pb-active', i === trackIndex));
  }

  function loadTrack(i) {
    trackIndex = i;
    audio.src = TRACKS[trackIndex].file;
    renderTrack();
  }

  audio.addEventListener('play',  () => {
    unit.classList.add('pb-radio-playing');
    playBtn.innerHTML = '&#10074;&#10074; Pause';
  });
  audio.addEventListener('pause', () => {
    unit.classList.remove('pb-radio-playing');
    playBtn.innerHTML = '&#9654; Play';
  });
  audio.addEventListener('ended', () => {
    loadTrack((trackIndex + 1) % TRACKS.length);
    audio.play();
  });

  listEl.addEventListener('click', (e) => {
    const item = e.target.closest('.pb-radio-tracklist-item');
    if (!item) return;
    hasStarted = true;
    loadTrack(Number(item.dataset.idx));
    audio.play();
  });

  window.pbRadioToggle = function() {
    if (!hasStarted) {
      hasStarted = true;
      loadTrack(0);
    }
    if (audio.paused) audio.play();
    else audio.pause();
  };

  window.pbRadioSkip = function() {
    hasStarted = true;
    loadTrack((trackIndex + 1) % TRACKS.length);
    audio.play();
  };
})();

// Render codes into resources panel
document.getElementById('res-code-alpha').textContent   = nukeCodes.alpha;
document.getElementById('res-code-bravo').textContent   = nukeCodes.bravo;
document.getElementById('res-code-charlie').textContent = nukeCodes.charlie;
document.getElementById('res-code-valid').textContent   = 'Valid: ' + nukeCodes.week;

// ── MINERVA TRACKER ──────────────────────────────────────────────
// 35-day cycle: Foundation (Mon-Wed) → Crater (Mon-Wed) → Fort Atlas (Mon-Wed)
//        → Whitespring Big Sale (Thu of week 4 - Mon of week 5) → off week → repeat
// All windows open/close at 12:00 noon US Eastern.
// Anchor: Mon Apr 27 2026 = Foundation cycle start
// (verified: Foundation Jul 6, Crater Jul 13, Fort Atlas Jul 20,
//  Big Sale Jul 30-Aug 3, Foundation Aug 10 — nukaknights.com)

(function initMinerva() {
  const ANCHOR_MS = Date.UTC(2026, 3, 27, 16, 0, 0); // Apr 27 2026 16:00 UTC = noon ET Mon

  const CYCLE = [
    { location: 'Foundation',          type: 'Emporium', startDay: 1, endDay: 3   }, // Mon→Wed
    { location: 'The Crater',          type: 'Emporium', startDay: 1, endDay: 3   }, // Mon→Wed
    { location: 'Fort Atlas',          type: 'Emporium', startDay: 1, endDay: 3   }, // Mon→Wed
    { location: 'Whitespring Resort',  type: 'Big Sale', startDay: 4, endDay: 8   }, // Thu→Mon
  ];

  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  // Each window is a day-offset range from the block-start Monday (noon-to-noon days).
  // Weeks 1-3: Emporium Mon-Wed. Week 4: Big Sale Thu (day 24) → Mon noon (day 28).
  // Week 5 (days 28-35): Minerva is off. Block repeats every 35 days.
  const BLOCK_DAYS = 35;
  const SALE_OFFSETS = [
    { start: 0,  end: 2,  idx: 0 }, // Foundation  Mon–Wed  (days 0-2, open 12pm–12pm)
    { start: 7,  end: 9,  idx: 1 }, // Crater      Mon–Wed  (days 7-9)
    { start: 14, end: 16, idx: 2 }, // Fort Atlas  Mon–Wed  (days 14-16)
    { start: 24, end: 28, idx: 3 }, // Whitespring Thu of week 4 noon → Mon of week 5 noon
  ];

  const DAY_MS = 24 * 60 * 60 * 1000;

  function getMinervaStatus() {
    const now = Date.now();
    const msSinceAnchor = now - ANCHOR_MS;
    if (msSinceAnchor < 0) return null; // before anchor

    const blockMs = BLOCK_DAYS * DAY_MS;
    const posInBlock = msSinceAnchor % blockMs; // ms into current 28-day block
    const dayInBlock = posInBlock / DAY_MS;     // fractional day (noon-to-noon)

    for (const sale of SALE_OFFSETS) {
      if (dayInBlock >= sale.start && dayInBlock < sale.end) {
        const c = CYCLE[sale.idx];
        // ms remaining in this window
        const msRemaining = ((sale.end - dayInBlock) * DAY_MS);
        const daysLeft = Math.floor(msRemaining / DAY_MS);
        const hoursLeft = Math.floor((msRemaining % DAY_MS) / (60 * 60 * 1000));
        return {
          active: true,
          location: c.location,
          type: c.type,
          daysLeft,
          hoursLeft
        };
      }
    }

    // Between windows — find next
    let nextSale = null;
    let minMs = Infinity;
    for (const sale of SALE_OFFSETS) {
      let msUntil = (sale.start * DAY_MS) - posInBlock;
      if (msUntil < 0) msUntil += blockMs; // wraps to next block
      if (msUntil < minMs) { minMs = msUntil; nextSale = sale; }
    }
    const c = CYCLE[nextSale.idx];
    const daysUntil = Math.floor(minMs / DAY_MS);
    const hoursUntil = Math.floor((minMs % DAY_MS) / (60 * 60 * 1000));
    return {
      active: false,
      location: c.location,
      type: c.type,
      daysUntil,
      hoursUntil
    };
  }

  const status = getMinervaStatus();
  const locEl  = document.getElementById('res-minerva-location');
  const subEl  = document.getElementById('res-minerva-sublabel');
  const statEl = document.getElementById('res-minerva-status');

  if (!status) {
    locEl.textContent  = '— Unknown —';
    statEl.textContent = 'Schedule data unavailable';
    return;
  }

  if (status.active) {
    locEl.textContent  = status.location.toUpperCase();
    subEl.textContent  = status.type === 'Big Sale' ? '★ Big Sale ★' : 'Emporium';
    statEl.textContent = `Leaves in ${status.daysLeft}d ${status.hoursLeft}h`;
  } else {
    locEl.classList.add('pb-minerva-unavailable');
    locEl.textContent  = 'Not Available';
    subEl.textContent  = 'Next: ' + status.location.toUpperCase();
    statEl.textContent = `Arrives in ${status.daysUntil}d ${status.hoursUntil}h`;
  }
})();

// ── GOLD BULLION PLANNER ─────────────────────────────────────────
// Rates (verified 2026-07): 1 treasury note = 10 bullion; gold press
// machine limit 400 bullion (40 notes) per day; Smiley sells 300
// bullion/week at 20 caps each; character holds max 10,000 bullion.
function bpCalc() {
  const val = id => {
    const v = parseFloat(document.getElementById(id).value);
    return (isNaN(v) || v < 0) ? 0 : v;
  };
  const cost   = val('bp-cost');
  const smiley = document.getElementById('bp-smiley').checked;
  const out    = document.getElementById('bp-result');

  if (!cost) {
    out.innerHTML = `<div class="pb-bp-result-sub">— Awaiting field data — enter what the plan costs —</div>`;
    return;
  }

  const HOLD_MAX = 10000;
  if (cost > HOLD_MAX) {
    out.innerHTML = `<div class="pb-bp-result-main">NEVER</div>`
      + `<div class="pb-bp-result-sub">No vault holds more than 10,000 bullion. Ambition logged.</div>`;
    return;
  }
  let bullion    = Math.min(val('bp-have'), HOLD_MAX);
  let pool       = val('bp-notes');
  const rate     = val('bp-rate');
  let days = 0, notesUsed = 0, smileyRuns = 0, never = false;

  while (bullion < cost) {
    const press = Math.min(Math.floor(pool), 40); // 40 notes = 400 bullion/day
    pool     -= press;
    notesUsed += press;
    bullion  += press * 10;
    if (smiley && days % 7 === 0 && bullion < cost) { bullion += 300; smileyRuns++; }
    if (bullion > HOLD_MAX) bullion = HOLD_MAX;
    if (bullion >= cost) break;
    if (!smiley && rate === 0 && Math.floor(pool) === 0) { never = true; break; }
    if (days >= 3650) { never = true; break; }
    days++;
    pool += rate;
  }

  const rows = [];
  if (notesUsed > 0)  rows.push(['Treasury notes pressed', `${notesUsed} (${(notesUsed * 10).toLocaleString()} bullion)`]);
  if (smileyRuns > 0) rows.push(['Smiley pickups', `${smileyRuns} (${(smileyRuns * 300).toLocaleString()} bullion · ${(smileyRuns * 6000).toLocaleString()} caps)`]);
  if (!never)         rows.push(['Bullion at purchase', Math.floor(bullion).toLocaleString()]);
  const breakdown = rows.length
    ? `<div class="pb-bp-breakdown">` + rows.map(r => `<div class="pb-bp-brow"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('') + `</div>`
    : '';

  if (never) {
    out.innerHTML = `<div class="pb-bp-result-main">NEVER</div>`
      + `<div class="pb-bp-result-sub">At this rate the ledger never closes. Earn notes or befriend Smiley.</div>`;
    return;
  }

  if (days === 0) {
    out.innerHTML = `<div class="pb-bp-result-main">TODAY</div>`
      + `<div class="pb-bp-result-sub">Affordable right now — go, before you spend it on something dumb.</div>`
      + breakdown;
    return;
  }

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const eta = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const etaLabel = `${MONTHS[eta.getMonth()]} ${eta.getDate()}, ${eta.getFullYear() + 76}`;
  out.innerHTML = `<div class="pb-bp-result-main">${days} DAY${days === 1 ? '' : 'S'}</div>`
    + `<div class="pb-bp-result-sub">Est. acquisition: ${etaLabel}</div>`
    + breakdown;
}

// ── DAMAGE STACKER ───────────────────────────────────────────────
// Model (community-verified 2026-07, post One Wasteland / Patch 62):
//   outgoing = paper × (1 + extra%/100) × headshot × sneakMult, plus a
//   crit portion of paper × (1 + BetterCrits + extraCrit%) added
//   separately (crit does not interact with the sneak multiplier).
//   Sneak base 2x; Covert Operative +0.15/0.3/0.5 (ranged); Ninja
//   +0.5/1.0 (melee/bows/thrown). Mitigation multiplier =
//   clamp((0.15 × dmg ÷ DR)^0.365, 0.01, 0.99) after penetration:
//   DR = floor(DR × (1 − modPen) × (1 − perkPen)). Crits are mitigated.
function dmgTypeChanged() {
  const melee = document.getElementById('dmg-wtype').value === 'melee';
  const opts = melee
    ? [['0', 'None — sneak 2.0x'], ['0.5', 'Ninja 1 — sneak 2.5x'], ['1', 'Ninja 2 — sneak 3.0x']]
    : [['0', 'None — sneak 2.0x'], ['0.15', 'Covert Operative 1 — sneak 2.15x'], ['0.3', 'Covert Operative 2 — sneak 2.3x'], ['0.5', 'Covert Operative 3 — sneak 2.5x']];
  document.getElementById('dmg-sneakrank').innerHTML =
    opts.map(o => `<option value="${o[0]}">${o[1]}</option>`).join('');
  dmgCalc();
}

function dmgCalc() {
  const val = (id, dflt) => {
    const v = parseFloat(document.getElementById(id).value);
    return (isNaN(v) || v < 0) ? (dflt || 0) : v;
  };
  const out   = document.getElementById('dmg-result');
  const paper = val('dmg-paper');
  if (!paper) {
    out.innerHTML = `<div class="pb-bp-result-sub">— Awaiting field data — enter the Pip-Boy card damage —</div>`;
    return;
  }

  const D        = paper * (1 + val('dmg-bonus') / 100);
  const hs       = val('dmg-head', 1) || 1;
  const sneakMul = 2 + parseFloat(document.getElementById('dmg-sneakrank').value || '0');
  const critAdd  = D * (1 + parseFloat(document.getElementById('dmg-bc').value) + val('dmg-critx') / 100);
  const dr       = val('dmg-dr');
  const drPen    = Math.floor(dr
    * Math.max(0, 1 - Math.min(val('dmg-penmod'), 100) / 100)
    * Math.max(0, 1 - Math.min(val('dmg-penperk'), 100) / 100));

  const mitigate = dmg => (drPen <= 0) ? 1 : Math.min(0.99, Math.max(0.01, Math.pow(0.15 * dmg / drPen, 0.365)));

  const scenarios = [
    ['Normal hit',   D * hs],
    ['Crit',         D * hs + critAdd],
    ['Sneak',        D * hs * sneakMul],
    ['Sneak + Crit', D * hs * sneakMul + critAdd],
  ];

  out.innerHTML = scenarios.map(([name, o]) => {
    const m = mitigate(o);
    const landed = Math.round(o * m);
    const note = (drPen <= 0)
      ? `${Math.round(o).toLocaleString()} outgoing · nothing absorbed`
      : `${Math.round(o).toLocaleString()} outgoing · armor absorbed ${Math.round((1 - m) * 100)}%`;
    return `<div class="pb-dmg-row"><span class="pb-dmg-scen">${name}</span><span class="pb-dmg-val">${landed.toLocaleString()}</span></div>`
      + `<div class="pb-dmg-note">${note}</div>`;
  }).join('') + (dr > 0 && drPen < dr
    ? `<div class="pb-bp-result-sub" style="margin-top:10px;">Penetration cut target resist ${dr.toLocaleString()} → ${drPen.toLocaleString()}</div>`
    : '');
}
dmgTypeChanged(); // populate the sneak-perk select on load

// ── LEGENDARY SCRAP ODDS ─────────────────────────────────────────
// Rates (verified 2026-07 via Nuka Knights + Bethesda support, cross-checked
// against community consensus): scrapping any legendary at a workbench rolls
// a flat 1% chance to learn that item's mod plan (once per item, regardless
// of star count), plus an independent 1.5% chance per star to extract a
// loose mod. Legendary scrip earned per item by star: 1★=1, 2★=2, 3★=4, 4★=6.
const LG_SCRIP = { 1: 1, 2: 2, 3: 4, 4: 6 };
function lgCalc() {
  const n     = parseInt(document.getElementById('lg-count').value, 10);
  const stars = parseInt(document.getElementById('lg-stars').value, 10);
  const out   = document.getElementById('lg-result');
  if (!n || n < 0) {
    out.innerHTML = `<div class="pb-bp-result-sub">— Awaiting field data — enter how many you're scrapping —</div>`;
    return;
  }

  const modRolls = n * stars;
  const probPlan = (1 - Math.pow(0.99, n)) * 100;
  const probMod  = (1 - Math.pow(0.985, modRolls)) * 100;
  const expPlans = n * 0.01;
  const expMods  = modRolls * 0.015;
  const scrip    = n * LG_SCRIP[stars];

  const rows = [
    ['Expected plans learned', expPlans.toFixed(2)],
    ['Chance of &ge;1 loose mod', `${probMod.toFixed(1)}%`],
    ['Expected loose mods', expMods.toFixed(2)],
    ['Legendary scrip earned', scrip.toLocaleString()],
  ];
  const breakdown = `<div class="pb-bp-breakdown">` + rows.map(r => `<div class="pb-bp-brow"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('') + `</div>`;

  out.innerHTML = `<div class="pb-bp-result-main">${probPlan.toFixed(1)}%</div>`
    + `<div class="pb-bp-result-sub">Chance of learning &ge;1 mod plan from ${n.toLocaleString()} ${stars}-star scrap${n === 1 ? '' : 's'}</div>`
    + breakdown;
}

// ── SCRAP INTEL DATA (top 10 rarest materials, alphabetical) ─────
const SCRAP_DATA = {
  'Adhesive': [
    { name: 'Whitespring Resort',         region: 'Savage Divide',  count: 'Very High',   note: 'Wonderglue and duct tape throughout every hotel room, maintenance corridor, and service building. The sheer room count makes this the largest single-location adhesive haul on the map. Combine with the fiberglass telephone run for extreme efficiency — both resources come from the same pass.', map: 'WhitespringResort.webp' },
    { name: 'Flatwoods',                  region: 'The Forest',     count: 'Moderate',    note: 'Wonderglue, economy wonderglue, and duct tape on shelves and workbenches in nearly every house. Low-threat, fast reset, and accessible from day one. The best adhesive option before you can survive the Savage Divide — or keep tatos, corn, mutfruit, and purified water growing at camp and craft vegetable starch for an unlimited home supply.', map: 'Flatwoods.webp' },
    { name: 'Clancy Manor',               region: 'Toxic Valley',   count: 'Moderate',    note: 'Wonderglue, economy wonderglue, and duct tape on the upper-floor metal shelving units. Compact location with quick clear time — useful as a top-up on the Toxic Valley/Forest border. Also holds military ammo bags, making it a rare dual adhesive and ballistic fiber stop.', map: 'ClancyManor.webp' },
  ],
  'Ballistic Fiber': [
    { name: 'Fort Defiance',              region: 'Cranberry Bog',  count: 'Up to 20',    note: 'The single best ballistic fiber stop in Appalachia — 9 military ammo bags (2 fiber each) and 1 military grade duct tape (2 fiber) across the north wing floors. Check every room: second floor rooms off the metal stairs, third floor past the BoS doors, and the shelves by the elevator. Bring Anti-Scorched perks.', map: 'FortDefiance.webp' },
    { name: 'Camp McClintock',            region: 'The Forest',     count: 'Up to 16',    note: '6 military ammo bags and 2 military grade duct tape across the main building, barracks, and surrounding tents — reliable and low-level accessible. Inside the left barracks, behind the front desk, and in the shack southwest of the main building. Best first stop for players who cannot yet reach Fort Defiance.', map: 'CampMcClintock.webp' },
    { name: 'The Thorn',                  region: 'Cranberry Bog',  count: 'Up to 8',     note: '3 military ammo bags and 1 military grade duct tape in the tent and by the ammo box — reliable and fast to clear. A solid third stop on a Cranberry Bog ballistic fiber loop after Fort Defiance and Camp McClintock.', map: 'TheThorn.webp' },
  ],
  'Black Titanium': [
    { name: 'Welch',                      region: 'Ash Heap',       count: 'High',        note: 'The fastest black titanium farm in the game. Roughly 12 Mole Miners patrol the town — kill them, scrap their Mole Miner suits and excavation equipment (each yielding black titanium), then server-hop to reset. Players report 50 black titanium in under 15 minutes. There is also a black titanium vein in the ravine beneath the station.', map: 'Welch.webp' },
    { name: 'Belching Betty',             region: 'Ash Heap',       count: 'High',        note: 'Six black titanium veins along the right-hand tunnel wall, past a locked security cage with an on-site chemistry station — up to 96 ore on a full clear. Fiery, molten interior; fire resistance or the right power armor is not optional.', map: 'BelchingBetty.webp' },
    { name: 'Blackwater Mine',            region: 'Savage Divide',  count: 'Moderate',    note: 'Black titanium ore veins inside the mine alongside consistent Mole Miner drops. Fast interior loop with close ore nodes. Sits just across the Ash Heap border — close enough to Welch to hit both on the same run.', map: 'BlackwaterMine.webp' },
  ],
  'Circuitry': [
    { name: 'Abandoned Bog Town',         region: 'Cranberry Bog',  count: 'High',        note: 'A strong circuitry stop. Sensor modules, high-powered magnets, and military-grade circuitry across the industrial office building — stack this with the nuclear material run, both resources come from the same buildings. Radiation is a constant; bring Rad-X.', map: 'AbandonedBogTown.webp' },
    { name: 'ATLAS Observatory',          region: 'Savage Divide',  count: 'High',        note: 'Sensor modules, biometric scanners, and targeting computers throughout the Enclave research facility. Dense yield in a compact footprint with manageable robot opposition. Combine with the fiber optics and nuclear material pick-ups here for an exceptional tech-material haul.', map: 'ATLASObservatory.webp' },
    { name: 'Watoga Emergency Services',  region: 'Cranberry Bog',  count: 'Moderate',    note: 'Biometric scanners and sensor modules in the medical bays and emergency control rooms. Best run as part of a full Watoga city circuit — hit the shopping center for screws and springs on the same pass.', map: 'WatogaEmergencyServices.webp' },
  ],
  'Fiber Optics': [
    { name: "Ella Ames' Bunker",          region: 'The Mire',       count: '6 microscopes', note: "The best single fiber optics stop in Appalachia. Six microscopes on desks and shelves inside the bunker — each scrapping into 1 fiber optic, 1 crystal, 1 gear, and 1 glass. Low enemy pressure and a compact layout make this the fastest microscope clear available.", map: 'EllaAmesBunker.webp' },
    { name: 'AVR Medical Center',         region: 'The Forest',     count: '7 microscopes', note: 'Seven microscopes spread across the exam rooms and labs, making it the highest microscope count of any single open-world location. The building requires a loading screen, but the full loop through every room is worth it. Combine with the nearby Charleston adhesive run.', map: 'AVRMedicalCenter.webp' },
    { name: 'National Isolated Radio Array', region: 'Savage Divide', count: 'High',       note: 'Multiple microscopes and biometric scanners throughout the radio facility — consistently cited as one of the top fiber optics farms. Combine with a Whitespring fiberglass run nearby for an efficient Savage Divide materials sweep.', map: 'NationalIsolatedRadioArray.webp' },
  ],
  'Fiberglass': [
    { name: 'Top of the World',           region: 'Savage Divide',  count: 'High',        note: 'The premier fiberglass farm. Composite skis stacked on racks outside and inside the resort, plus ski swords throughout — each scrapping into 2 fiberglass. The nearby Pleasant Valley Ski Resort extends the run with more ski racks and ski swords. Easy enemies, compact loop.', map: 'TopOfTheWorld.webp' },
    { name: 'Whitespring Resort',         region: 'Savage Divide',  count: 'High',        note: 'Telephones throughout the vendor rooms, office areas, maintenance shacks, and the adjacent golf club — each telephone scraps into 1 fiberglass. Also check employee-only laundry rooms for Abraxo Cleaner Industrial Grade, yielding 2 fiberglass each. One of the largest single-location hauls available.', map: 'WhitespringResort.webp' },
    { name: 'National Isolated Radio Array', region: 'Savage Divide', count: 'Moderate',  note: 'A cluster of telephones and scattered Abraxo Cleaner Industrial Grade inside the facility buildings. Combine with a Savage Divide circuit hitting Top of the World for a fiberglass-focused sweep of the entire region.', map: 'NationalIsolatedRadioArray.webp' },
  ],
  'Gold': [
    { name: 'Whitespring Mall (Helena)',  region: 'Savage Divide',  count: 'Reliable',    note: "The most efficient gold farm in Appalachia. Robot vendor Helena sells gold plated flip lighters and gold pocket watches — both scrapping directly into gold. Purchase her stock, server-hop to reset her inventory, and repeat. No combat required. Honey Beasts in the resort grounds also drop 2 gold scrap each as a bonus.", map: 'WhitespringMall.webp' },
    { name: 'Whitespring Golf Club',      region: 'Savage Divide',  count: 'Moderate',    note: 'Gold pocket watches on Feral Ghouls patrolling the club grounds, plus scattered gold plated flip lighters inside the clubhouse and pro shop. Combine with the Mall vendor run directly next door for the most productive gold sweep on the map.', map: 'WhitespringGolfClub.webp' },
    { name: 'Charleston Capitol Building', region: 'The Forest',    count: 'Low–Moderate', note: 'Gold pocket watches and gold plated flip lighters on Ghouls and in the senate offices. Also a strong screws and springs location — hit typewriters and desk fans here and the gold items are a secondary bonus on the same pass.', map: 'CharlestonCapitolBuilding.webp' },
  ],
  'Nuclear Material': [
    { name: 'Monongah Power Plant',       region: 'Savage Divide',  count: 'Very High',   note: 'The definitive nuclear material farm. Coolant caps, nuclear waste barrels, and fusion cores throughout the plant — all primary nuclear material sources. Permanently Scorched-infested and heavily irradiated. Rad-X, Radaway, and a hazmat suit are not optional equipment.', map: 'MonongahPowerPlant.webp' },
    { name: 'Abandoned Bog Town',         region: 'Cranberry Bog',  count: 'High',        note: 'Coolant caps and nuclear waste canisters among the industrial wreckage. Stack with the circuitry run above — both yields come from the same buildings, making this one of the most efficient dual-resource farms on the map.', map: 'AbandonedBogTown.webp' },
    { name: 'ATLAS Observatory',          region: 'Savage Divide',  count: 'Moderate',    note: 'Targeting computers, sensor modules, and biometric scanners yield nuclear material alongside circuitry. Lower radiation exposure than the power plant — a viable option for players not yet loaded on Radaway.', map: 'ATLASObservatory.webp' },
  ],
  'Silver': [
    { name: 'Morgantown (City)',          region: 'The Forest',     count: 'Moderate',    note: "Silver pocket watches — the top silver scrap item — appear consistently on Scorched and in the residential buildings throughout Morgantown. One of the community's most cited silver stops, accessible early and combining well with the Airport Feral Ghoul run immediately adjacent.", map: 'MorgantownAirport.webp' },
    { name: 'Whitespring Resort',         region: 'Savage Divide',  count: 'Moderate',    note: "Silver pocket watches on Feral Ghouls patrolling the grounds, plus fancy hairbrushes and silver bowls in the hotel suites and dining rooms — all yielding silver scrap. The resort's size means the total haul across a full sweep rivals more targeted locations.", map: 'WhitespringResort.webp' },
    { name: 'Grafton (Town)',             region: 'Toxic Valley',   count: 'Moderate',    note: 'Silver pocket watches and silver lockets in the residential homes and the hotel. Compact town with manageable Super Mutant opposition. A reliable silver stop — combine with Grafton Steel next door for a Ghoul kill challenge at the same time.', map: 'GraftonTown.webp' },
  ],
  'Ultracite': [
    { name: 'Glassed Cavern',             region: 'Cranberry Bog',  count: 'Up to 61 ore', note: 'The single best ultracite source in Appalachia — 61 ore nodes confirmed inside the cavern system, processable into scrap at a chemistry station. Heavily guarded by high-level Scorched and ultracite-variant creatures. Anti-Scorched perks, a full repair kit, and Radaway are mandatory.', map: 'GlassedCavern.webp' },
    { name: 'Fissure Sites (Nuked Zone)', region: 'Cranberry Bog',  count: 'Very High',   note: 'When a nuke saturates a fissure site, all mineral deposits in the zone convert to ultracite ore and Scorchbeast drop rates spike. The highest burst-yield ultracite window in the game — and the most dangerous. Coordinate with a team for the Scorched Earth event for maximum return.', map: 'FissureSiteNuked.webp' },
    { name: 'Fissure Site Prime',         region: 'Cranberry Bog',  count: 'Moderate',    note: 'Decaying ultracite veins around the fissure perimeters yield ore nodes even without a nuke. Less efficient than a nuked run but available at all times. Located just south of Survey Camp Alpha near Drop Site V9 — a reliable passive stop on any Cranberry Bog circuit.', map: 'FissureSitePrime.webp' },
  ],
};

// ── Scrap Intel sub-menu ─────────────────────────────────────────
let scrapSelectsInit = false;
function initScrapSelects() {
  if (scrapSelectsInit) return;
  scrapSelectsInit = true;
  const nav = document.getElementById('pb-scrap-nav');
  if (!nav) return;
  Object.keys(SCRAP_DATA).forEach(k => {
    const btn = document.createElement('button');
    btn.className = 'pb-spawn-item';
    btn.textContent = k;
    btn.onclick = () => {
      document.querySelectorAll('#pb-scrap-nav .pb-spawn-item').forEach(b => b.classList.remove('pb-active'));
      btn.classList.add('pb-active');
      renderScrapDetail(k);
      document.getElementById('pb-scrap-detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    nav.appendChild(btn);
  });
}

function renderScrapDetail(key) {
  const detail = document.getElementById('pb-scrap-detail');
  if (!key || !SCRAP_DATA[key]) {
    detail.innerHTML = '<div class="pb-spawn-detail-placeholder">Select a scrap type to receive field intelligence.</div>';
    return;
  }
  const spots = SCRAP_DATA[key];
  const ranks = ['01', '02', '03'];
  detail.innerHTML = spots.map((s, i) => {
    const mapImg = s.map
      ? `<img src="${s.map}" class="pb-spawn-map" alt="Map — ${s.name}" onclick="this.classList.toggle('pb-spawn-map-expanded')">`
      : `<div class="pb-spawn-map" style="display:flex;align-items:center;justify-content:center;opacity:0.35;font-family:'Courier Prime',monospace;font-size:9px;letter-spacing:2px;color:var(--pb-mid);border:1px dashed var(--pb-border);cursor:default;">MAP PENDING</div>`;
    return `<div class="pb-spawn-card">
      <div class="pb-spawn-rank">${ranks[i]}</div>
      ${mapImg}
      <div class="pb-spawn-name">${s.name}</div>
      <div class="pb-spawn-region">${s.region}</div>
      <div class="pb-spawn-count">${s.count}</div>
      <div class="pb-spawn-note">${s.note}</div>
    </div>`;
  }).join('');
}

// ── Ingredient Intel sub-menu ─────────────────────────────────────
const INGREDIENT_DATA = {
  'Starlight Berry': [
    { name: 'The Deep', region: 'The Forest', count: 'High + bonus Brain Fungus', note: 'Starlight Berries grow in bush clusters throughout this flooded subterranean facility (the Motherlode Acquisition Facility) under the mountain west of Whitespring Resort — reach the main chamber through an underwater passage from the entrance. The complex also holds bonus Brain Fungus patches, making it a two-ingredient stop on a Berry Mentats run. Watch for cave crickets in the dark and Liberators patrolling the catwalks.', map: 'TheDeep.webp' },
  ],
  'Brain Fungus': [
    { name: 'Big Bend Tunnel', region: 'Cranberry Bog', count: 'Moderate', note: 'Pale Brain Fungus clusters cling to the walls along the run from the west entrance through to the east passage — a dark, damp stretch. Mole miners and molerats are the real obstacle here, not the harvest; clear a path in before circling back for the fungus. Stack this with a Deep run for a two-location Brain Fungus haul on the same Berry Mentats trip.', map: null },
  ],
  'Firecracker Berry': [
    { name: 'Arktos Pharma (NW Parking Lot)', region: 'The Forest', count: 'High', note: "A slew of Firecracker Berries grow in the ground northwest of the Arktos Pharma parking lot, in soil still touched by Project Paradise — the mutation leaves the berries oversized and easy to spot from a distance. Fast-travel to Sutton and head north to the building's north face. Low-hazard and quick to clear, making it a solid opening stop on a Berry Mentats run.", map: null },
  ],
};

let ingredientSelectsInit = false;
function initIngredientSelects() {
  if (ingredientSelectsInit) return;
  ingredientSelectsInit = true;
  const nav = document.getElementById('pb-ingredient-nav');
  if (!nav) return;
  Object.keys(INGREDIENT_DATA).forEach(k => {
    const btn = document.createElement('button');
    btn.className = 'pb-spawn-item';
    btn.textContent = k;
    btn.onclick = () => {
      document.querySelectorAll('#pb-ingredient-nav .pb-spawn-item').forEach(b => b.classList.remove('pb-active'));
      btn.classList.add('pb-active');
      renderIngredientDetail(k);
      document.getElementById('pb-ingredient-detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    nav.appendChild(btn);
  });
}

function renderIngredientDetail(key) {
  const detail = document.getElementById('pb-ingredient-detail');
  if (!key || !INGREDIENT_DATA[key]) {
    detail.innerHTML = '<div class="pb-spawn-detail-placeholder">Select an ingredient to receive field intelligence.</div>';
    return;
  }
  const spots = INGREDIENT_DATA[key];
  const ranks = ['01', '02', '03'];
  detail.innerHTML = spots.map((s, i) => {
    const mapImg = s.map
      ? `<img src="${s.map}" class="pb-spawn-map" alt="Map — ${s.name}" onclick="this.classList.toggle('pb-spawn-map-expanded')">`
      : `<div class="pb-spawn-map" style="display:flex;align-items:center;justify-content:center;opacity:0.35;font-family:'Courier Prime',monospace;font-size:9px;letter-spacing:2px;color:var(--pb-mid);border:1px dashed var(--pb-border);cursor:default;">MAP PENDING</div>`;
    return `<div class="pb-spawn-card">
      <div class="pb-spawn-rank">${ranks[i]}</div>
      ${mapImg}
      <div class="pb-spawn-name">${s.name}</div>
      <div class="pb-spawn-region">${s.region}</div>
      <div class="pb-spawn-count">${s.count}</div>
      <div class="pb-spawn-note">${s.note}</div>
    </div>`;
  }).join('');
}

// ── Pip-Boy navigation ───────────────────────────────────────────
function pbNav(btn) {
  document.querySelectorAll('.pb-menu-item').forEach(b => b.classList.remove('pb-active'));
  btn.classList.add('pb-active');
  const targetId = btn.dataset.pbTarget;
  document.querySelectorAll('.pb-page').forEach(p => p.classList.remove('pb-visible'));
  const target = document.getElementById(targetId);
  if (target) target.classList.add('pb-visible');
  if (targetId === 'pb-page-plans') pbPlansInit();
  if (targetId === 'pb-page-spawn') initSpawnSelects();
  if (targetId === 'pb-page-scrap') initScrapSelects();
  if (targetId === 'pb-page-ingredients') initIngredientSelects();
  if (targetId === 'pb-page-tmaps') tmInit();
}

// ── Pip-Boy Plans Exchange ───────────────────────────────────────
(function() {
  function pbBuildList(containerId, emptyId, countId, data, isTradeList) {
    const container = document.getElementById(containerId);
    const empty     = document.getElementById(emptyId);
    const countEl   = document.getElementById(countId);
    if (!container) return;
    container.innerHTML = '';
    if (!data || data.length === 0) {
      if (empty) empty.style.display = 'block';
      if (countEl) countEl.textContent = '0';
      return;
    }
    if (empty) empty.style.display = 'none';
    if (countEl) countEl.textContent = data.length;
    const BATCH = 100;
    let i = 0;
    function renderBatch() {
      const frag = document.createDocumentFragment();
      const end  = Math.min(i + BATCH, data.length);
      for (; i < end; i++) {
        const entry = data[i];
        const name  = isTradeList ? entry[0] : entry;
        const qty   = isTradeList ? entry[1] : null;
        const div   = document.createElement('div');
        div.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:4px 6px;border-bottom:1px solid rgba(100,200,140,0.08);font-family:\'Special Elite\',monospace;font-size:10px;color:rgba(160,232,192,0.85);letter-spacing:0.5px;';
        div.innerHTML = '<span>' + name + '</span>' +
          (qty ? '<span style="color:rgba(100,200,140,0.7);font-size:9px;min-width:24px;text-align:right;">x' + qty + '</span>' : '');
        frag.appendChild(div);
      }
      container.appendChild(frag);
      if (i < data.length) requestAnimationFrame(renderBatch);
    }
    renderBatch();
  }

  window.pbPlansFilter = function(panel) {
    if (typeof TRADE_PLANS === 'undefined' || typeof WANT_PLANS === 'undefined') return;
    const query = document.getElementById('pb-' + panel + '-search').value.toLowerCase().trim();
    if (panel === 'trade') {
      const filtered = query ? TRADE_PLANS.filter(e => e[0].toLowerCase().includes(query)) : TRADE_PLANS;
      pbBuildList('pb-trade-list', 'pb-trade-empty', 'pb-trade-count', filtered, true);
    } else {
      const filtered = query ? WANT_PLANS.filter(e => e.toLowerCase().includes(query)) : WANT_PLANS;
      pbBuildList('pb-want-list', 'pb-want-empty', 'pb-want-count', filtered, false);
    }
  };

  let pbPlansInitDone = false;
  window.pbPlansInit = function() {
    if (pbPlansInitDone) return;
    pbPlansInitDone = true;
    if (typeof TRADE_PLANS === 'undefined' || typeof WANT_PLANS === 'undefined') {
      ['pb-trade-list','pb-want-list'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<div style="font-family:\'Special Elite\',monospace;font-size:10px;color:rgba(100,200,140,0.4);padding:20px 0;text-align:center;">— DATA FILE NOT LOADED —</div>';
      });
      return;
    }
    if (typeof PLANS_DB_VERSION !== 'undefined') {
      const ver = document.getElementById('pb-plans-version');
      if (ver) ver.textContent = 'Data: ' + PLANS_DB_VERSION;
    }
    pbBuildList('pb-trade-list', 'pb-trade-empty', 'pb-trade-count', TRADE_PLANS, true);
    pbBuildList('pb-want-list',  'pb-want-empty',  'pb-want-count',  WANT_PLANS,  false);
  };

  // Init immediately if Plans page is already visible on load
  document.addEventListener('DOMContentLoaded', function() {
    const page = document.getElementById('pb-page-plans');
    if (page && page.classList.contains('pb-visible')) pbPlansInit();
  });
})();

// ── Spawn Intel sub-menu ─────────────────────────────────────────
let spawnSelectsInit = false;
function initSpawnSelects() {
  if (spawnSelectsInit) return;
  spawnSelectsInit = true;
  const nav = document.getElementById('pb-spawn-nav');
  if (!nav) return;
  Object.keys(SPAWN_DATA).forEach(k => {
    const btn = document.createElement('button');
    btn.className = 'pb-spawn-item';
    btn.textContent = k;
    btn.onclick = () => {
      document.querySelectorAll('#pb-spawn-nav .pb-spawn-item').forEach(b => b.classList.remove('pb-active'));
      btn.classList.add('pb-active');
      renderSpawnDetail(k);
      document.getElementById('pb-spawn-detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    nav.appendChild(btn);
  });
}

function renderSpawnDetail(key) {
  const detail = document.getElementById('pb-spawn-detail');
  if (!key || !SPAWN_DATA[key]) {
    detail.innerHTML = '<div class="pb-spawn-detail-placeholder">Select an enemy type to receive field intelligence.</div>';
    return;
  }
  const spawns = SPAWN_DATA[key];
  detail.innerHTML = spawns.map((s, i) => {
    const rank = String(i + 1).padStart(2, '0');
    const mapImg = s.map
      ? `<img src="${s.map}" class="pb-spawn-map" alt="Map — ${s.name}" onclick="this.classList.toggle('pb-spawn-map-expanded')">`
      : `<div class="pb-spawn-map" style="display:flex;align-items:center;justify-content:center;opacity:0.35;font-family:'Courier Prime',monospace;font-size:9px;letter-spacing:2px;color:var(--pb-mid);border:1px dashed var(--pb-border);cursor:default;">MAP PENDING</div>`;
    // Check if this location has a matching archive photo
    const archivePhoto = photos.find(p => !p.bioOnly && p.file && p.title && p.title.toLowerCase().includes(s.name.toLowerCase().split(' ')[0]));
    const photoLink = archivePhoto
      ? `<a class="pb-spawn-photo-link" onclick="pbOpenPhoto('${archivePhoto.file}')">&#128247; View field photo</a>`
      : '';
    return `<div class="pb-spawn-card">
      <div class="pb-spawn-rank">${rank}</div>
      ${mapImg}
      <div class="pb-spawn-name">${s.name}</div>
      <div class="pb-spawn-region">${s.region}</div>
      <div class="pb-spawn-count">${s.count}</div>
      <div class="pb-spawn-note">${s.note}</div>
      ${photoLink}
    </div>`;
  }).join('');
}

// Open a photo from the spawn intel page — returns to resources after detail view back
function pbOpenPhoto(filename) {
  const p = photos.find(ph => ph.file === filename);
  if (!p) return;
  filteredPhotos = photos.filter(ph => !ph.bioOnly);
  currentPhotoIndex = filteredPhotos.indexOf(p);
  if (currentPhotoIndex === -1) { filteredPhotos = [...photos]; currentPhotoIndex = filteredPhotos.indexOf(p); }
  detailBackTarget = 'resources';
  document.getElementById('resources-view').style.display = 'none';
  showDetail(p);
}

// ── TREASURE MAPS — guide widget (TM_DATA itself stays in index.html; the
// SEO structured-data builder there reads it directly) ────────────────────
let tmActiveRegion = null;

function tmInit() {
  const grid = document.getElementById('tm-region-grid');
  if (!grid || grid.dataset.built) return;
  grid.dataset.built = 'true';
  TM_DATA.forEach(region => {
    const documented = region.maps.filter(m => m.documented).length;
    const total = region.maps.length;
    const card = document.createElement('div');
    card.className = 'tm-region-card';
    card.onclick = () => tmShowMapList(region.id);
    card.innerHTML =
      '<div class="tm-region-card-bg" style="background-image:url(\'' + region.img + '\'); background-color:' + region.fallbackColor + ';"></div>' +
      '<div class="tm-region-card-overlay"></div>' +
      '<div class="tm-region-card-body">' +
        '<div class="tm-region-name">' + region.name + '</div>' +
        '<div class="tm-region-badge">' + documented + ' of ' + total + ' documented</div>' +
      '</div>';
    grid.appendChild(card);
  });
}

function tmShowRegions() {
  document.getElementById('tm-view-regions').style.display = 'block';
  document.getElementById('tm-view-maplist').style.display = 'none';
  document.getElementById('tm-view-entry').style.display = 'none';
  const w = document.getElementById('tm-entry-video-wrap');
  if (w) w.innerHTML = '';
}

function tmShowMapList(regionId) {
  if (regionId) tmActiveRegion = regionId;
  const region = TM_DATA.find(r => r.id === tmActiveRegion);
  if (!region) return;

  document.getElementById('tm-view-regions').style.display = 'none';
  document.getElementById('tm-view-maplist').style.display = 'block';
  document.getElementById('tm-view-entry').style.display = 'none';

  document.getElementById('tm-breadcrumb-region').textContent = region.name.toUpperCase();

  const list = document.getElementById('tm-map-list');
  list.innerHTML = '';
  region.maps.forEach(map => {
    const row = document.createElement('div');
    row.className = 'tm-map-row' + (map.documented ? '' : ' tm-locked');
    row.innerHTML =
      '<span class="tm-map-num">MAP ' + map.num + '</span>' +
      '<span class="tm-map-label">' + region.name + ' Treasure Map ' + map.num + '</span>' +
      '<span class="tm-map-status ' + (map.documented ? 'documented' : 'undocumented') + '">' +
        (map.documented ? '&#9670; FILED' : '&#9675; PENDING') +
      '</span>';
    if (map.documented) row.onclick = () => tmShowEntry(tmActiveRegion, map.num);
    list.appendChild(row);
  });

  const w = document.getElementById('tm-entry-video-wrap');
  if (w) w.innerHTML = '';
}

function tmShowEntry(regionId, mapNum) {
  const region = TM_DATA.find(r => r.id === regionId);
  if (!region) return;
  const map = region.maps.find(m => m.num === mapNum);
  if (!map || !map.documented) return;

  document.getElementById('tm-view-regions').style.display = 'none';
  document.getElementById('tm-view-maplist').style.display = 'none';
  document.getElementById('tm-view-entry').style.display = 'block';

  document.getElementById('tm-breadcrumb-entry-region').textContent = region.name.toUpperCase();
  document.getElementById('tm-breadcrumb-entry-map').textContent = 'MAP ' + map.num;

  const wrap = document.getElementById('tm-entry-video-wrap');
  const poster = map.img || region.img || '';
  wrap.innerHTML =
    '<button class="tm-video-facade" type="button" aria-label="Play walkthrough video">' +
      '<img src="' + poster + '" alt="' + map.title + ' — Appalachia map" loading="lazy">' +
      '<span class="tm-video-play" aria-hidden="true">&#9654;</span>' +
    '</button>';
  const facadeBtn = wrap.querySelector('.tm-video-facade');
  if (facadeBtn) facadeBtn.addEventListener('click', function() {
    const vid = document.createElement('video');
    vid.src = map.video;
    vid.className = 'tm-entry-video-el';
    vid.controls = true; vid.playsInline = true; vid.autoplay = true;
    vid.setAttribute('preload', 'auto');
    wrap.innerHTML = '';
    wrap.appendChild(vid);
    vid.play().catch(function(){});
  }, { once: true });

  document.getElementById('tm-entry-title').textContent = map.title;
  document.getElementById('tm-entry-desc').innerHTML = map.desc;
  document.getElementById('tm-entry-meta').textContent = map.meta;

  const guideLink = document.getElementById('tm-entry-guide-link');
  if (guideLink) {
    guideLink.href = '/maps/' + regionId + '-treasure-map-' + map.num + '.html';
    guideLink.textContent = '◆ Open full guide page ↗';
  }
}

// FO76 runs at 20:1 — 1 real minute = 20 in-game minutes.
// A full in-game day = 72 real minutes.
// Anchor: the game world clock is synced to real UTC.
// In-game midnight = real UTC midnight (confirmed by community testing).
// In-game date starts at Oct 23, 2103 (25 years post-bombs).
(function initClock() {
  const RATIO = 20; // 1 real minute = 20 in-game minutes

  // Bomb date as explicit UTC ms — avoids local-time parsing bugs
  const BOMB_MS = Date.UTC(2077, 9, 23); // Oct 23 2077

  // In-game epoch: game world starts Oct 23, 2102 (25 years post-war)
  // We anchor the in-game calendar to real UTC: each real day = 20 in-game days.
  // Use a fixed real anchor (Jan 1 2024 00:00 UTC) → in-game Jan 1, 2102
  // so the date always increments cleanly from a known pair.
  const REAL_ANCHOR_MS  = Date.UTC(2024, 0, 1);  // Jan 1 2024 UTC
  const IG_ANCHOR_YEAR  = 2102;
  const IG_ANCHOR_DOY   = 1; // Jan 1

  const MONTHS     = ['Jan','Feb','Mar','Apr','May','Jun',
                      'Jul','Aug','Sep','Oct','Nov','Dec'];
  const MONTH_DAYS = [31,28,31,30,31,30,31,31,30,31,30,31];

  const elTime  = document.getElementById('clk-time');
  const elDate  = document.getElementById('clk-date');
  const elDay   = document.getElementById('clk-day');
  const elDawn  = document.getElementById('clk-dawn');
  const elBombs = document.getElementById('clk-bombs');

  function pad(n) { return String(Math.floor(Math.abs(n))).padStart(2,'0'); }

  // Convert a count of in-game days since anchor to a calendar date object {year, month(0-based), day}
  function igDaysToDate(igDays) {
    let year = IG_ANCHOR_YEAR;
    let doy  = IG_ANCHOR_DOY - 1 + Math.floor(igDays); // 0-based day of year
    // advance years
    while (true) {
      const daysInYear = 365; // FO76 doesn't track leap years, keep simple
      if (doy < daysInYear) break;
      doy -= daysInYear;
      year++;
    }
    // advance months
    let month = 0;
    while (month < 11 && doy >= MONTH_DAYS[month]) {
      doy -= MONTH_DAYS[month];
      month++;
    }
    return { year, month, day: doy + 1 };
  }

  function tick() {
    const now = new Date();

    // ── Real seconds elapsed since UTC midnight ──
    const midnight        = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const realSecToday    = (now.getTime() - midnight) / 1000;

    // ── In-game seconds within today's 24h cycle ──
    // One real day = 86400s real → 86400 × 20 ig-seconds = 1,728,000 ig-seconds
    // = 20 full in-game days. We want the time WITHIN the current in-game day.
    const igSecRaw  = realSecToday * RATIO;
    const igSecDay  = igSecRaw % (24 * 3600); // position within current ig day

    const igHour = Math.floor(igSecDay / 3600);
    const igMin  = Math.floor((igSecDay % 3600) / 60);
    const igSec  = Math.floor(igSecDay % 60);
    const ampm   = igHour < 12 ? 'AM' : 'PM';
    const h12    = igHour % 12 || 12;
    elTime.textContent = `${pad(h12)}:${pad(igMin)}:${pad(igSec)} ${ampm}`;

    // ── Period of day ──
    const periods = [
      [0,5,'Night — Deep Dark'],[5,7,'Pre-Dawn'],[7,9,'Morning'],
      [9,17,'Daytime'],[17,19,'Evening'],[19,21,'Dusk'],[21,24,'Night']
    ];
    const period = periods.find(([s,e]) => igHour >= s && igHour < e);
    if (elDay) elDay.textContent = period ? period[2] : '';

    // ── In-game date ──
    // Real days since anchor × 20 = in-game days since anchor
    const realDaysSinceAnchor = (now.getTime() - REAL_ANCHOR_MS) / (86400 * 1000);
    const igDaysSinceAnchor   = realDaysSinceAnchor * RATIO;
    const d = igDaysToDate(igDaysSinceAnchor);
    elDate.textContent = `${MONTHS[d.month]} ${d.day}, ${d.year}`;

    // ── Real time until next dawn (06:00 in-game) ──
    const dawnIgSec = 6 * 3600;
    const igSecsUntilDawn = igSecDay < dawnIgSec
      ? dawnIgSec - igSecDay
      : (24 * 3600 - igSecDay) + dawnIgSec;
    const realSecsUntilDawn = igSecsUntilDawn / RATIO;
    const dm = Math.floor(realSecsUntilDawn / 60);
    const ds = Math.floor(realSecsUntilDawn % 60);
    elDawn.textContent = `${dm}m ${pad(ds)}s`;

    // ── Days until The Great War ──
    const bombDays = Math.floor((BOMB_MS - now.getTime()) / (86400 * 1000));
    elBombs.textContent = bombDays.toLocaleString();
  }

  tick();
  setInterval(tick, 1000);
})();
