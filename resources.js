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

// ── SLASHER MASK INTEL DATA (Pint-Sized Slasher Masks — 108 masked corpses, 61 locations) ──
// Per location: `masks` = one placement string per corpse; `where` = how to reach the spot from named
// map landmarks (bearings and distances computed from Mappalachia game-world marker coordinates).
const MASK_QUEST_NEED = 10;            // "The Slasher: Masked Truth"
const MASK_TIERS = [3, 10, 30, 50];       // challenge tiers (93 total)
const MASK_DATA = {
  'The Forest': [
    { name: 'Flatwoods Lookout', where: 'Southwest of Wixon Homestead (~200 m); north of Green Country Lodge (~250 m).', masks: [
      'Inside the cabin just northeast of the tower.',
    ] },
    { name: 'Isolated Cabin', where: 'Northeast of Wixon Homestead (~200 m); southwest of Landview Lighthouse (~200 m); southeast of Vault 76 (~450 m).', masks: [
      'Inside the cabin.',
    ] },
    { name: 'Groves Family Cabin', where: 'West of Aaronholt Homestead (~200 m); southwest of Vault 51 (~450 m).', masks: [
      'On a dead body on the top bunk of the southern cabin.',
    ] },
    { name: 'Alpine River Cabins', where: 'Southwest of Gilman Lumber Mill (~400 m); west of Wixon Homestead (~450 m).', masks: [
      'In the northeast cabin.',
      'In the southwest cabin.',
      'In the northwest cabin.',
    ] },
    { name: 'Camp McClintock', where: 'West of Summersville (~350 m); south of Sutton Station (~400 m); northeast of Charleston (~750 m).', masks: [
      'North lookout tower.',
      'South barracks.',
      'Portable toilet.',
    ] },
    { name: 'Giant Teapot', where: 'North of Poseidon Energy Plant WV-06 (~150 m); west of Charleston Station (~250 m).', masks: [
      'By the slide, to the west.',
    ] },
    { name: 'Camp Adams', where: 'Northwest of Poseidon Energy Plant WV-06 (~350 m); south of Silva Homestead (~400 m).', masks: [
      'Southwest cabin.',
      'Lookout tower.',
    ] },
    { name: 'Tyler County Fairgrounds', where: 'Northwest of Anchor Farm (~500 m); southwest of Aaronholt Homestead (~600 m).', masks: [
      'East slide.',
      'Carousel.',
      'Blue seat ride to the north.',
    ] },
    { name: 'North Kanawha Lookout', where: 'East of Vault 76 (~300 m); north of Landview Lighthouse (~350 m); northwest of Gauley Mine (~650 m).', masks: [
      'Northwest corner of the tower balcony.',
    ] },
    { name: 'East Kanawha Lookout', where: "Southeast of Overseer's Home (~200 m); northwest of Tygart Water Treatment (~250 m).", masks: [
      'Top of the tower, eastern side of the balcony.',
    ] },
    { name: 'Twin Pine Cabins', where: "West of Wilson Brother's Auto Repair (~250 m); southwest of Grafton Station (~450 m).", masks: [
      'On the wall of the westernmost cabin.',
      'Top bunk of the easternmost cabin.',
    ] },
    { name: 'Lakeside Cabins', where: 'North of New Gad (~200 m); southwest of Summersville (~250 m); northeast of Charleston (~700 m).', masks: [
      'Lounge chair on the back deck of the southern house.',
    ] },
    { name: 'New River Gorge Resort', where: 'West of Sutton Station (~300 m); southwest of Sutton (~350 m).', masks: [
      'On a bed inside the southern cabin, the one with a black couch on its entrance stairs.',
      'On a lounge chair at the pool area to the northeast.',
      'Second-floor bedroom of the large barricaded cabin to the southeast.',
    ] },
    { name: 'Overlook Cabin', where: 'Northeast of Sugarmaple (~100 m); north of Hornwright Summer Villa (~100 m).', masks: [
      'Inside the bathroom on the second floor.',
    ] },
  ],
  'The Mire': [
    { name: "Freddy Fear's House of Scares", where: 'Northeast of Vault 94 (~300 m); north of Abandoned Bunker (~350 m); northeast of Pumpkin House (~550 m).', masks: [
      'In a cafe booth.',
      'In the same cafe booth.',
    ] },
    { name: 'Dolly Sods Campground', where: 'Northwest of Carson Family Bunker (~100 m); east of Mosstown (~250 m).', masks: [
      'Pavilion picnic table.',
      'Red tent.',
      'Green tent.',
    ] },
    { name: 'Dolly Sods Wilderness', where: "North of Carson Family Bunker (~250 m); southwest of Ella Ames' Bunker (~300 m).", masks: [
      'First-floor bathroom of the ranger station.',
    ] },
    { name: 'Dolly Sods Lookout', where: "Southwest of Ella Ames' Bunker (~250 m); north of Carson Family Bunker (~300 m).", masks: [
      "On the stairs going up to the tower's top.",
    ] },
    { name: 'East Ridge Lookout', where: 'Northwest of Abandoned Bunker (~50 m); southeast of Vault 94 (~150 m).', masks: [
      'Top of the tower, on the balcony.',
    ] },
    { name: 'Camp Venture', where: 'North of Firebase LT (~250 m); northeast of Firebase Major (~400 m); south of Harpers Ferry (~600 m).', masks: [
      'Southeast storage building.',
      'Bunkhouse Phoenix.',
    ] },
    { name: "Sunday Brothers' Cabin", where: 'South of Berkeley Springs Station (~200 m); west of Harpers Ferry (~350 m).', masks: [
      'Blue shipping container to the north.',
      'Main cabin basement, back-room shower area.',
      'On a toilet down the stairs behind the bootlegging shack to the southeast.',
    ] },
  ],
  'Savage Divide': [
    { name: "Investigator's Cabin", where: "Northwest of Huntersville (~350 m); northwest of Devil's Backbone (~450 m).", masks: [
      'Inside the cabin.',
    ] },
    { name: 'Bailey Family Cabin', where: 'Southwest of Vault 79 (~200 m); south of Mysterious Cave (~350 m).', masks: [
      'Inside the cabin.',
      'In the outhouse.',
    ] },
    { name: 'Autumn Acre Cabin', where: 'East of Wendigo Cave (~200 m); northwest of Berkeley Springs (~450 m); east of Seneca Rocks (~500 m).', masks: [
      'In the bathtub inside.',
      'On a lounge chair outside.',
    ] },
    { name: 'Old Danielson Cabin', where: 'West of Hillside Cavern (~200 m); southwest of Radiant Hills (~350 m).', masks: [
      'In the main cabin.',
      'In a small cabin.',
    ] },
    { name: 'Sylvie & Sons Logging Camp', where: 'East of Sons of Dane Compound (~200 m); south of Hopewell Cave (~300 m).', masks: [
      'At a broken truck.',
    ] },
    { name: 'Fissure Site Sigma', where: 'At the unmarked Halloween Fright Farm, southwest of the Pumpkin House and north of Hopewell Cave, with Fissure Site Sigma just to the west. The spot has no map marker.', masks: [
      'At the unmarked Halloween fright farm, directly north of the fissure site and south-southwest of the Pumpkin House.',
    ] },
    { name: 'Bastion Park', where: 'Northeast of Big Bend Tunnel West (~350 m); west of Site Charlie (~350 m).', masks: [
      'Southeast fountain.',
      'Stone stairs to the northwest.',
      'Slide to the west.',
    ] },
    { name: 'Central Mountain Lookout', where: 'East of Pleasant Valley Station (~400 m); southwest of Wendigo Cave (~400 m); east of Top of the World (~550 m).', masks: [
      'Top of the tower, on the floor of the single room.',
    ] },
    { name: 'East Mountain Lookout', where: 'West of Kerwood Mine (~200 m); east of US-13C Bivouac (~250 m).', masks: [
      'Inside a portable toilet at the base of the tower.',
    ] },
    { name: 'Whitespring Lookout', where: 'West of The Whitespring Golf Club (~200 m); south of The Deep (~250 m).', masks: [
      'Top of the tower, on the balcony, lying down facing east.',
    ] },
    { name: 'South Mountain Lookout', where: 'Southwest of Huntersville (~500 m); east of R&G Station (~600 m); southeast of Foundation (~350 m).', masks: [
      'Red shed at the base of the tower.',
    ] },
    { name: 'NW of Seneca Gang Camp', where: 'Northwest of Seneca Gang Camp, along Highway 63. The spot has no map marker.', masks: [
      'Next to a car on Highway 63.',
    ] },
    { name: 'North Mountain Lookout', where: 'North of Hopewell Cave (~450 m); northeast of Sunnytop Station (~500 m).', masks: [
      "On the stairs going up to the tower's top, next to a ham radio.",
    ] },
    { name: 'Pleasant Valley Cabins', where: 'North of Pleasant Valley Ski Resort (~150 m); north of Pleasant Valley Station (~250 m).', masks: [
      'On a sofa on the first floor of the cabin with a billiards table.',
      'At the motel exterior perched on a cliff, on the outside of a boarded-up room.',
    ] },
    { name: 'Seneca Rocks Visitor Center', where: 'West of Seneca Rocks (~150 m); southeast of Monongah Power Plant (~350 m).', masks: [
      'In the blue house with a fridge on its porch, among the houses south of the visitor center.',
      'Inside the green-trim cabin to the southeast, overlooking the visitor center.',
    ] },
    { name: 'South Cutthroat Camp', where: 'Southwest of Pleasant Valley Station (~100 m); southwest of Pleasant Valley Ski Resort (~150 m); southeast of Top of the World (~100 m).', masks: [
      'Northeastern edge of the camp, propped up at a makeshift dining table under an umbrella.',
    ] },
    { name: 'Spruce Knob Lake', where: 'Northeast of R&G Station (~400 m); east of R & G Processing Services (~450 m).', masks: [
      'Picnic table west of Spruce Knob Boat Rental.',
      'Partially sunken rowboat at the broken docks southwest of the boat rental.',
      'Campsite reached by following the trail east behind the boat rental.',
    ] },
    { name: 'Sunnytop Ski Lanes', where: 'East of Sunnytop Station (~150 m); northwest of Hopewell Cave (~450 m).', masks: [
      'On a bunk bed behind a chained door in the northernmost building.',
      'In a lounge chair by a fire pit, south of the long building.',
      'In a bed on the second floor of a green-and-white building, west side, south of the entrance sign.',
    ] },
    { name: 'Sunnytop Ski Lanes Base Lodge', where: 'Northeast of Sunnytop Station (~400 m); northwest of Hopewell Cave (~500 m).', masks: [
      "First-floor men's bathroom, by the urinal.",
      'On a ski lift seat directly behind (south of) the lodge.',
    ] },
    { name: "Trapper's Camp", where: "Northeast of Devil's Backbone, at the Trappers' camp. The spot has no map marker.", masks: [
      'South side of the camp, on a lookout buttress.',
    ] },
    { name: 'Vault 96', where: 'Northwest of the Vault 96 map marker.', masks: [
      "Northwest of the Vault's map marker, up on the cliff at the unmarked Settlers' camp from the quest Here to Stay. Look for a white Brotherhood flag pole.",
    ] },
  ],
  'Toxic Valley': [
    { name: 'Hemlock Holes', where: 'Northwest of Woods Estate (~400 m); northeast of Makeshift Vault (~400 m).', masks: [
      'Truck bed in the parking lot.',
      'Diner booth.',
    ] },
    { name: 'Kiddie Corner Cabins', where: 'West of Black Bear Lodge (~200 m); north of Clarksburg Shooting Club (~250 m).', masks: [
      'Southeast cabin.',
      'Behind the northwest cabin.',
    ] },
    { name: "Wavy Willard's Water Park", where: 'West of Crater Watchstation (~350 m); northeast of Woods Estate (~350 m).', masks: [
      'Zebra cart to the northwest.',
      'Top of the Ssslither slide.',
      "Knock 'Em Down stall.",
    ] },
    { name: 'Pioneer Scout Camp', where: 'West of Grafton Steel (~250 m); southwest of Carleton Mine (~400 m).', masks: [
      'Cabin B01 near the lake, next to bunk beds.',
      'On a raft near the docks in the middle of the camp.',
      'Cabin A01 in the northeast part of the camp, at a table.',
    ] },
    { name: 'Pioneer Scout Lookout', where: 'West of Grafton Steel (~350 m); southeast of Clarksburg Shooting Club (~450 m).', masks: [
      'Top of the tower, on the balcony, leaning against the western railing.',
    ] },
  ],
  'Ash Heap': [
    { name: 'Camden Park', where: 'West of Brim Quarry (~300 m); northwest of Hornwright Testing Site #04 (~350 m).', masks: [
      'In one of the Widowmaker roller coaster cars.',
      'In the other Widowmaker roller coaster car.',
      'White boat on the Ohio River.',
    ] },
    { name: 'Rollins Labor Camp', where: 'Southwest of The Burning Mine (~250 m); north of Abandoned Mine Shaft 2 (~300 m).', masks: [
      'Outside the camp, in a porta-potty.',
    ] },
    { name: 'Nuka-World on Tour', where: 'Southeast of The Burning Mine (~200 m); northwest of Lake Reynolds (~200 m).', masks: [
      'Hoop Toss stall to the west.',
      'Against the wall of the southwestern exit gate.',
      'Nuka-Launcher roller coaster to the east, at the top of the main entrance ramp.',
    ] },
  ],
  'Cranberry Bog': [
    { name: 'Ranger Lookout', where: 'Northeast of Ranger District Office (~50 m); northeast of Drop Site G3 (~350 m).', masks: [
      'Top of the tower, on the balcony, leaning against the wall.',
    ] },
  ],
  'Skyline Valley': [
    { name: 'Makeout Point', where: 'Southeast of Ranger Station Bunker (~200 m); east of Shenandoah Visitor Center (~400 m); southeast of Vault 96 (~600 m).', masks: [
      'In the bathroom.',
    ] },
    { name: 'Naked Creek', where: 'Northeast of Old Crimora Mines (~200 m); southeast of Grindstone Arch (~350 m).', masks: [
      'Inside a Blue Caravan Company trailer.',
    ] },
    { name: 'Camp Liberty', where: 'Southwest of Shining Creek Cavern (~450 m); southeast of The Trading Post (~500 m).', masks: [
      'Inside the southern Expedition Leader cabin.',
      'On a golf cart in the parking lot just outside the main entrance, to the south.',
      'In the southeast corner behind the stage, in a small shack with a doghouse.',
    ] },
    { name: 'Rapidan Camp', where: 'North of Big Meadows Gas Well (~300 m); northwest of Slumber Mill Motel (~350 m); southwest of Dark Hollow Manor (~350 m).', masks: [
      "Inside the Prime Minister's Cabin, main central room.",
      'In a gazebo overlooking the lake, central southeast.',
      'At the Vertibot landing pad, inside the wide trailer to the north.',
    ] },
  ],
  'Burning Springs': [
    { name: 'Dino Peaks Mini Golf', where: 'Northeast of Super Duper Mart (~400 m); east of Athens (~600 m).', masks: [
      'Off-road vehicle on the raised cliff.',
      'Bench near Hole 3.',
      "Maintenance shed in the dinosaur's jaws.",
    ] },
    { name: "Cobby's Corner", where: 'West of World of Corn. The spot has no map marker.', masks: [
      'Playground west of World of Corn.',
    ] },
    { name: 'World of Corn', where: 'Southwest of Albany (~200 m); southeast of Hocking Hills Train Station (~500 m).', masks: [
      'Under the stairs to the rooftop.',
      'On a picnic table at the bottom of the stone stairs leading to the museum.',
    ] },
    { name: 'Starlight Drive-in', where: 'North of Checkpoint Canyon (~450 m); southeast of Super Duper Mart (~450 m).', masks: [
      'In the ticket booth at the front entrance.',
      'Inside the saucer playground structure in the northwest corner.',
    ] },
    { name: 'Strouds Run State Park', where: 'East of Athens, near Route 50, just before the bridge. The spot has no map marker.', masks: [
      'Unmarked spot east of Athens, near Route 50, right before the bridge.',
    ] },
    { name: 'Tycoon Lake', where: 'East of The Rust Kingdom (~500 m); west of Silva Homestead (~600 m).', masks: [
      'On a beach chair near the fast travel point.',
      'In an outhouse to the north, behind the wooden shack near the fast travel point.',
    ] },
  ],
};

// ── Slasher Mask Intel sub-menu + progress checklist ─────────────
// Progress lives only in this browser (localStorage) — nothing is sent anywhere.
// Nav buttons keep their text equal to the region key so deepLinkPipBoy('masks', slug) can find them.
const MASK_STORE_KEY = 'f76er-slasher-masks';
const MASK_TOTAL = Object.values(MASK_DATA).reduce((n, locs) => n + locs.reduce((m, l) => m + l.masks.length, 0), 0);
let maskSelectsInit = false;
let maskCurrent = null;
let maskClearArmed = false;
let maskSet = null;

function maskEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function maskGet() {
  if (!maskSet) {
    try { maskSet = new Set(JSON.parse(localStorage.getItem(MASK_STORE_KEY) || '[]')); }
    catch (e) { maskSet = new Set(); }
  }
  return maskSet;
}
function maskSave() {
  try { localStorage.setItem(MASK_STORE_KEY, JSON.stringify([...maskGet()])); } catch (e) { /* storage blocked: progress lasts this visit only */ }
}
function maskKey(region, name, i) { return region + '|' + name + '|' + i; }
function maskRegionTotal(region) { return MASK_DATA[region].reduce((n, l) => n + l.masks.length, 0); }
function maskRegionDone(region) {
  const set = maskGet();
  let n = 0;
  MASK_DATA[region].forEach(l => l.masks.forEach((_, i) => { if (set.has(maskKey(region, l.name, i))) n++; }));
  return n;
}
function maskDoneTotal() {
  return Object.keys(MASK_DATA).reduce((n, r) => n + maskRegionDone(r), 0);
}

function maskChipsHTML(done) {
  let cum = 0;
  const chips = [];
  MASK_TIERS.forEach((t, i) => {
    cum += t;
    chips.push({ label: 'Tier ' + (i + 1), need: cum, tip: 'Challenge tier ' + (i + 1) + ' completes at ' + cum + ' masks collected in all' });
  });
  return chips.map(c => {
    const ok = done >= c.need;
    return '<span class="pb-mask-chip' + (ok ? ' pb-done' : '') + '" title="' + maskEsc(c.tip) + '">' + c.label + ' · ' + c.need + (ok ? ' ✓' : '') + '</span>';
  }).join('');
}

function maskHeadHTML() {
  const done = maskDoneTotal();
  return '<div class="pb-mask-head">' +
    '<div class="pb-mask-total"><span id="pb-mask-done">' + done + '</span> / ' + MASK_TOTAL + ' <small>masks collected</small></div>' +
    '<div class="pb-mask-chips" id="pb-mask-chips">' + maskChipsHTML(done) + '</div>' +
    '<div class="pb-mask-tools"><a href="/guides/pint-sized-slasher-mask-locations.html">Read the full guide &rarr;</a>' +
    '<button type="button" class="pb-mask-clear" id="pb-mask-clear" onclick="maskClear()">Clear progress</button></div>' +
    '</div>';
}

function maskCardsHTML(region) {
  const set = maskGet();
  return MASK_DATA[region].map(l => {
    const rows = l.masks.map((m, i) => {
      const k = maskKey(region, l.name, i);
      const on = set.has(k);
      return '<label class="pb-mask-row' + (on ? ' pb-done' : '') + '"><input type="checkbox" data-k="' + maskEsc(k) + '"' +
        (on ? ' checked' : '') + ' onchange="maskToggle(this)"><span>' + maskEsc(m) + '</span></label>';
    }).join('');
    return '<div class="pb-spawn-card pb-mask-card"><div class="pb-spawn-rank">' + l.masks.length + '</div>' +
      '<div class="pb-spawn-name">' + maskEsc(l.name) + '</div>' +
      '<div class="pb-spawn-region">' + maskEsc(region) + '</div>' +
      '<div class="pb-mask-where">' + maskEsc(l.where) + '</div>' + rows + '</div>';
  }).join('');
}

function renderMaskDetail(region) {
  const detail = document.getElementById('pb-mask-detail');
  if (!detail) return;
  maskClearArmed = false;
  maskCurrent = (region && MASK_DATA[region]) ? region : null;
  detail.innerHTML = maskHeadHTML() + (maskCurrent
    ? maskCardsHTML(maskCurrent)
    : '<div class="pb-spawn-detail-placeholder">Select a region to see where the Phantoms left their dead.</div>');
}

function maskRefresh() {
  const done = maskDoneTotal();
  const el = document.getElementById('pb-mask-done');
  if (el) el.textContent = done;
  const chips = document.getElementById('pb-mask-chips');
  if (chips) chips.innerHTML = maskChipsHTML(done);
  document.querySelectorAll('#pb-mask-nav .pb-spawn-item').forEach(b => {
    const r = b.dataset.region;
    const d = maskRegionDone(r), t = maskRegionTotal(r);
    b.dataset.count = d + '/' + t;
    b.classList.toggle('pb-mask-nav-done', d === t);
  });
}

function maskToggle(input) {
  const set = maskGet();
  if (input.checked) set.add(input.dataset.k); else set.delete(input.dataset.k);
  maskSave();
  if (input.parentNode) input.parentNode.classList.toggle('pb-done', input.checked);
  maskRefresh();
}

function maskClear() {
  const btn = document.getElementById('pb-mask-clear');
  if (!maskClearArmed) {
    maskClearArmed = true;
    if (btn) btn.textContent = 'Really clear? Click again';
    return;
  }
  maskSet = new Set();
  maskSave();
  renderMaskDetail(maskCurrent);
  maskRefresh();
}

function initMaskSelects() {
  if (maskSelectsInit) return;
  maskSelectsInit = true;
  const nav = document.getElementById('pb-mask-nav');
  if (!nav) return;
  Object.keys(MASK_DATA).forEach(k => {
    const btn = document.createElement('button');
    btn.className = 'pb-spawn-item pb-mask-nav-item';
    btn.textContent = k;
    btn.dataset.region = k;
    btn.onclick = () => {
      document.querySelectorAll('#pb-mask-nav .pb-spawn-item').forEach(b => b.classList.remove('pb-active'));
      btn.classList.add('pb-active');
      renderMaskDetail(k);
      document.getElementById('pb-mask-detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    nav.appendChild(btn);
  });
  renderMaskDetail(null);
  maskRefresh();
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
  if (targetId === 'pb-page-masks') initMaskSelects();
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
