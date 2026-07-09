// ─────────────────────────────────────────────────────────────────────────────
// plans-data.js  —  Fallout76er Plans Exchange data
//
// HOW TO UPDATE:
//   1. Upload your updated Fallout_76_Plan___Mod_Database.xlsx to claude.ai
//   2. Say: "Regenerate plans-data.js from this workbook"
//   3. Replace this file on your server — no other changes needed.
//
// TRADE_PLANS  — plans you own with qty >= 2 (extras available to trade/sell)
//   Format: [ ["Plan Name", qty], ... ]  sorted by qty descending
//
// WANT_PLANS   — tradable plans not yet owned, curated by owner
//   Format: [ "Plan Name", ... ]
//   Note: untradable plans (Gleaming Depths raid, Covert Scout, Solar/Thorn
//         armor, Arctic Marine, Botsmith) are excluded — must be self-earned.
//
// Last updated: May 2026
// ─────────────────────────────────────────────────────────────────────────────

const PLANS_DB_VERSION = "Curated rare & sought-after plans · May 2026";

const TRADE_PLANS = [
  ["Mr. Handy Buzz Blade", 33],
  ["Excavator Motion-Assist Servos", 23],
  ["Mole Miner Gauntlet", 10],
  ["Single-Action Revolver Ivory Grip", 9],
  ["Campfire Tales Tent", 6],
  ["Cushioned Robot Armor Legs", 6],
  ["Cushioned Marine Armor Legs", 5],
  ["T-45 Motion-Assist Servos", 5],
  ["Basketball Hoop 2", 4],
  ["Bathtub", 4],
  ["Chemistry Workbench", 4],
  ["Glowing Skeleton Costume", 4],
  ["BioCommMesh Robot Armor Lining", 3],
  ["BioCommMesh Trapper Armor Lining", 3],
  ["Cultist Dagger", 3],
  ["Gas Signage", 3],
  ["Gulper Smacker", 3],
  ["High-Tech Table", 3],
  ["Lead Lined Marine Armor Chest", 3],
  ["Light Metal Torso", 3],
  ["Lion Statues", 3],
  ["MIRV Frag Grenade", 3],
  ["Military Cot", 3],
  ["Modern Kitchen Tables", 3],
  ["Modern Paintings", 3],
  ["Office Desk", 3],
  ["Pre-War Dressers", 3],
  ["Raider Motion-Assist Servos", 3],
  ["Redcoat Outfit", 3],
  ["Robot Beer Steins Display Case", 3],
  ["Strengthened Combat Armor Limbs", 3],
  ["Track Lighting", 3],
  ["Ultra-Light Build Marine Armor Limbs", 3],
  ["Vault 76 Jumpsuit", 3],
  ["Wooden Patio Chair", 3],
  ["Ashtray", 2],
  ["Backyard Grill", 2],
  ["Baseball Player Statue", 2],
  ["Basketball Hoop", 2],
  ["Bear-Proof Trashcan", 2],
  ["Blue Ridge Rug", 2],
  ["Brahmin Skin Rug", 2],
  ["Civil War Cannon", 2],
  ["Combat Shotgun Medium NV Scope", 2],
  ["Cushioned Raider Armor Legs", 2],
  ["Daisy Rug", 2],
  ["Deep Pocketed Trapper Armor Chest", 2],
  ["Electrified Mr. Handy Buzz Blade", 2],
  ["Giant Red Dinosaur", 2],
  ["Glowing Skeleton Hood", 2],
  ["Gulper Head", 2],
  ["Laser Gun Refined Beta Wave Tuner", 2],
  ["Lederhosen Outfit", 2],
  ["Lederhosen Outfit Hat", 2],
  ["Mounted Blue Devil Head", 2],
  ["Park Grill", 2],
  ["Pipe Gun Medium Night Vision Scope", 2],
  ["Pipe Gun Precise .45 Receiver", 2],
  ["Pocketed Leather Armor Limbs", 2],
  ["Pocketed Raider Armor Chest", 2],
  ["Pocketed Raider Armor Limbs", 2],
  ["Potted Plants", 2],
  ["Rug Set 2", 2],
  ["Rusted Ghoul Jack-O-Lite", 2],
  ["Scarecrows", 2],
  ["Sickle", 2],
  ["Strengthened Raider Armor Limbs", 2],
  ["Strengthened Robot Armor Limbs", 2],
  ["T-51b Motion-Assist Servos", 2],
  ["Trash Can", 2],
  ["Vault Door Jack O'Lantern", 2],
  ["Water Filter", 2],
  ["Wendigo Colossus Skin Rug", 2],
  ["Wooden Crate", 2]
];

const WANT_PLANS = [
  // Power Armor mods — Scorchbeast Queen drops (~0.02% each)
  "Ultracite Calibrated Shocks",
  "Ultracite Emergency Protocols",

  // Armor — Gold Bullion (Regs / Minerva)
  "Vault 94 Scout Armor Mask",
  "Civil Engineer Under Armor",

  // Armor — world drop / vendor
  "Shielded Lining Casual Underarmor",
  "Sturdy Metal Left Leg",
  "Sturdy Metal Right Leg",
  "Marine Armor Helmet",

  // Weapons — tradable
  "Grognak Axe",
  "Head Hunter Scythe",
  "Pole Hook",
  "Compound Bow",

  // Outfits & headwear — Stamps (Giuseppe Della Ripa)
  "Snake Wrangler Outfit",
  "Snake Wrangler Hat",
  "Tinkerer's Overalls",
  "Tinkerer's Goggles",
  "Muni Drudger Outfit",
  "Muni Drudger Operator Outfit",
  "Muni Drudger Worker Outfit",
  "Union Hat",

  // Outfits — quest / event rewards (tradable plans)
  "Trucker Uniform",
  "Apocalyptic Farmer Outfit",
  "Confederate Uniform",
  "Enforcer's Outfit",

  // Nuclear Winter legacy plans
  "Nuclear Winter Letterman's Jacket"
];
