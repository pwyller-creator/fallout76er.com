// ── SPAWN INTEL DATA ── source of truth for the Creature Spawn Intel widget ──
// Edit creatures here, then re-run build_creatures.js to regenerate
// the /creatures/ pages, the hub, and sitemap-creatures.xml.
// Loaded by index.html via <script src="/spawn-data.js?v=..."> before the main script.

const SPAWN_DATA = {
  'Yao Guai': [
    { name: 'Dolly Sods Wilderness',        region: 'The Mire',        count: '2 guaranteed', note: 'One at the entrance road, one en route to the Campground. Private world recommended — these go fast on public servers.', map: 'DollySodsWilderness.webp' },
    { name: 'Mountainside Bed & Breakfast', region: 'Savage Divide',   count: '2 guaranteed', note: 'Follow the railway tracks downhill to the west. Both spawn reliably every reset.', map: 'MountainsideBedAndBreakfast.webp' },
    { name: 'High Knob Lookout',            region: 'Skyline Valley',  count: '3 guaranteed', note: 'Northeast of the lookout at a scenic overlook. Least contested of the reliable spawns.', map: 'HighKnobLookout.webp' },
  ],
  'Snallygaster': [
    { name: 'Flooded Trainyard',            region: 'Cranberry Bog',   count: 'Up to 7',       note: 'Single best farming location in Appalachia. Open terrain makes kiting easy. Acid drops are a bonus.', map: 'FloodedTrainyard.webp' },
    { name: "Toxic Larry's Meat 'n Go",     region: 'Savage Divide',   count: '3 guaranteed', note: 'Quickest daily clear. Three outside the building every reset. Server-hop if someone beat you to it.', map: 'ToxicLarrys.webp' },
    { name: 'Charleston Downtown',          region: 'The Forest',      count: '2 guaranteed', note: 'Between Hornwright HQ and the Capitol Building — not inside the perimeter. Good for XP stacking alongside other urban enemies.', map: 'CharlestonDowntown.webp' },
  ],
  'Deathclaw': [
    { name: 'Deathclaw Island',             region: 'The Forest',      count: '1 guaranteed', note: 'Small island southeast of Vault 76, with a nest at its center. This one spawns at level 21, so it is a rare Deathclaw a newer survivor can actually take.', map: 'DeathclawIsland.webp' },
    { name: 'Thunder Mountain Substation',  region: 'Cranberry Bog',   count: '1 guaranteed', note: "Power substation in the Bog. The Deathclaw here usually spawns mid-brawl with a pack of giant ants, who do some of the softening-up for you.", map: 'ThunderMountainSubstation.webp' },
    { name: 'Abandoned Waste Dump',         region: 'The Mire',        count: '2 guaranteed', note: 'South of Haven Church and northeast of Harpers Ferry — the dump hides a nest with two guaranteed spawns, plus a hidden bunker entrance in the wall behind it. The most reliable multi-Deathclaw stop in Appalachia.', map: 'AbandonedWasteDump.webp' },
  ],
  'Mole Miner': [
    { name: 'Welch',                        region: 'Ash Heap',        count: 'Up to 10',      note: 'The premier Mole Miner farm in Appalachia — roughly a dozen patrol the town. Scrap their mining suits and excavation gear, then server-hop to reset.', map: 'Welch.webp' },
    { name: 'Blackwater Mine',              region: 'Savage Divide',   count: '5–8',           note: 'Interior and exterior spawns. Server-hop to reset quickly. Bring fire resistance — some carry flamer variants.', map: 'BlackwaterMine.webp' },
    { name: 'Mount Blair Trainyard',        region: 'Ash Heap',        count: '3–5',           note: "Sprawling location with multiple spawn pockets. Don't miss the tunnels under the main structure.", map: 'MountBlairTrainyard.webp' },
  ],
  'Feral Ghoul': [
    { name: 'Watoga Emergency Services',    region: 'Cranberry Bog',   count: '8+',            note: 'Eight or more crowd the top floor of the old Brotherhood field hospital, with a solid chance at legendaries mixed in. Come geared — these Ghouls run higher-level than most.', map: 'WatogaEmergencyServices.webp' },
    { name: 'Charleston Fire Department',   region: 'The Forest',      count: '6–10',          note: 'Guaranteed Ghouls inside and on the grounds. Combine with a lead farm run for double value.', map: 'CharlestonFireDepartment.webp' },
    { name: 'Grafton Steel',                region: 'Toxic Valley',    count: '6–8',           note: 'Industrial site with consistent Ghoul density. Watch for the occasional Glowing One in the smelter area.', map: 'GraftonSteel.webp' },
  ],
  'Super Mutant': [
    { name: 'West Tek Research Center',     region: 'Savage Divide',   count: '10–15',         note: 'Legendary farming hotspot. Dense interior spawns with high legendary drop rate. Run the full loop.', map: 'WestTekResearchCenter.webp' },
    { name: 'Grafton Dam',                  region: 'Toxic Valley',    count: '6–8',           note: 'Exterior and dam-top spawns. Pairs with the Grafton Steel Ghoul run for an efficient Toxic Valley circuit.', map: 'GraftonDam.webp' },
    { name: 'Huntersville',                 region: 'Savage Divide',   count: '8–12',          note: 'Entire town is Super Mutant territory. One of the largest open-world mutant populations on the map.', map: 'Huntersville.webp' },
  ],
  'Scorched': [
    { name: 'Monongah Power Plant',         region: 'Savage Divide',   count: '10–20',         note: 'Permanently infested. Interior spawns reset fast. Good for bulk Scorched kill challenges in one location.', map: 'MonongahPowerPlant.webp' },
    { name: 'Morgantown Airport',           region: 'The Forest',      count: '8–12',          note: 'Shares the area with Ghouls — efficient double-dip if both are on your challenge list.', map: 'MorgantownAirport.webp' },
    { name: 'Site Charlie',                 region: 'Savage Divide',   count: '6–10',          note: 'Silo exterior and surrounding terrain. Scorched density increases during nuke events.', map: 'SiteCharlie.webp' },
  ],
  'Mirelurk': [
    { name: 'Summersville',                 region: 'The Forest',      count: 'Up to 10',      note: 'Along the riverbank and inside the red-and-white house at the edge of town — softshells cluster both spots. Server-hop between the two for a fast clear.', map: 'Summerville.webp' },
    { name: 'Lakeside Cabins',              region: 'The Forest',      count: '3–5',           note: 'Easy early-game location. Multiple variants including Hunters. Safe approach from the road above.', map: 'LakesideCabins.webp' },
    { name: 'Harpers Ferry',               region: 'The Mire',        count: '4–7',           note: 'Town exterior and riverbank. Often contested — go private world for a clean clear.', map: 'HarpersFerry.webp' },
  ],
  'Wendigo': [
    { name: "Abbie's Bunker",               region: 'The Mire',        count: 'Up to 3',       note: 'Most reliable Wendigo location in Appalachia. On the road south of the bunker, by the truck suspended in the trees. Server-hop to reset.', map: 'AbbiesBunker.webp' },
    { name: 'Wendigo Cave',                 region: 'Savage Divide',   count: '2–3',           note: "Named for a reason. Dark interior with multiple spawns. Don't go in without a light source and full AP.", map: 'WendigoCave.webp' },
    { name: 'KMAX Transmission',            region: 'The Mire',        count: '1–2',           note: 'Transmission tower with consistent Wendigo presence. Quieter than Abbie\'s — good fallback if that area is cleared.', map: 'KMAXTransmission.webp' },
  ],
  'Radstag': [
    { name: 'Thomas Farm',                  region: 'Savage Divide',   count: '4–6',           note: 'East of Dent & Sons Construction, marked by the big barn. A busted Aerosolizer bleached this whole herd albino-white — the single most reliable Radstag farm on the map.' },
    { name: 'Whitespring Golf Club',        region: 'Savage Divide',   count: '2–3',           note: 'A small herd grazes the fairways near the clubhouse. Easy add-on if you are already running the resort for gold or silver scrap.', map: 'WhitespringGolfClub.webp' },
    { name: 'Gauley Mine',                  region: 'The Forest',      count: '2',             note: 'Along the railroad tracks at the mine exit, southeast of Landview Lighthouse. Fast-travel straight to the landmark for a quick, low-effort clear.', map: 'GauleyMine.webp' },
  ],
  'Blood Eagle': [
    { name: "Widow's Perch",                region: 'Ash Heap',        count: '4–6',           note: 'Their territory. Dense camp with guaranteed spawns. Combine with a Deathclaw check nearby.', map: 'WidowsPerch.webp' },
    { name: 'The Sludge Works',             region: 'Ash Heap',        count: '5–8',           note: 'Chemical plant thick with Blood Eagles. Elevated positions make this a sniper-friendly run.', map: 'TheSludgeWorks.webp' },
    { name: 'Rollins Labor Camp',           region: 'Ash Heap',         count: '8–12',          note: "West of Nuka-World on Tour, where you free Beckett from captivity. The single densest Blood Eagle camp in Appalachia, with good sniping positions across the yard — pair with the Sludge Works next door for a fast weekly clear.", map: 'Rollins_Labor_Camp.webp' },
  ],
  'Cryptid (Any)': [
    { name: "Toxic Larry's Meat 'n Go",     region: 'Savage Divide',   count: '3 Snallygasters', note: 'Fastest cryptid daily clear. Three guaranteed outside. Done in under two minutes.', map: 'ToxicLarrys.webp' },
    { name: "Abbie's Bunker",               region: 'The Mire',        count: 'Up to 3 Wendigos', note: 'Wendigos count as cryptids. Reliable multi-spawn for weekly cryptid challenges.', map: 'AbbiesBunker.webp' },
    { name: 'Flooded Trainyard',            region: 'Cranberry Bog',   count: 'Up to 7 Snallygasters', note: 'Overkill for a daily, ideal for weekly. Clear the whole yard in one go.', map: 'FloodedTrainyard.webp' },
  ],
  'Floater': [
    { name: 'Lake Eloise',                  region: 'Savage Divide',   count: 'Up to 6',      note: 'South of Spruce Knob Campground, east of Vault 96. Six around the lake and the small campground in mixed Gnasher, Freezer, and Flamer variants. Watch for antennas poking out of the dirt — that is a buried Floater waiting to ambush.', map: 'LakeEloise.webp' },
    { name: 'Big Maw',                       region: 'The Mire',        count: 'Up to 6',      note: 'The crater rim hosts a reliable cluster, often alongside the Super Mutants who keep Floaters as pets. Open ground makes them easy to spot once they surface.', map: 'BigMaw.webp' },
    { name: "Solomon's Pond",                region: 'Savage Divide',   count: 'Up to 5',      note: 'Directly east of Whitespring Resort — a free fast-travel hop away. Five around the water. Server-hop here for fast daily clears.', map: 'SolomonsPond.webp' },
  ],
  'Gulper': [
    { name: 'Gulper Lagoon',                 region: 'The Mire',        count: '4 guaranteed', note: 'The definitive Gulper stop. Four always patrol the water right by the fast-travel point. Look up — they perch in the trees and drop on you. Clears the daily in one visit.', map: 'GulperLagoon.webp' },
    { name: 'Dyer Chemical',                 region: 'The Mire',        count: '2 guaranteed', note: 'Two reliably north-northwest of the plant along the river. A quick top-up if the Lagoon was already picked clean.', map: 'DyerChemical.webp' },
    { name: 'Moonshine Jamboree',            region: 'The Mire',        count: 'Event wave',   note: "Runs near Sunday Brothers' Cabin. The event throws waves of Gulpers, Anglers, and Feral Ghouls at three stills — overkill for a daily, ideal for the weekly, and you bag Anglers on the same run." },
  ],
  'Angler': [
    { name: 'Gnarled Shallows',              region: 'The Mire',        count: '3 guaranteed', note: "East of Abbie's Bunker on the northern tip of the Mire — follow the river north to the pond. Three submerged, disguised as lure weed until you get close. Mirelurks sometimes spawn here too.", map: 'GnarledShallows.webp' },
    { name: 'North of Gnarled Shallows',     region: 'The Mire',        count: '3 guaranteed', note: 'A second pod sits just north of the Shallows. The two spots together knock out the weekly in a single loop.', map: 'GnarledShallows.webp' },
    { name: 'Thunder Mountain Substation',   region: 'Cranberry Bog',   count: '3 reliable',   note: 'A patrolling group of Gulpers often draws Anglers into a fight here — let them soften each other up, then collect both for crafting. Anglers also count toward cryptid challenges.', map: 'ThunderMountainSubstation.webp' },
  ],
  'Mole Rat': [
    { name: 'Hillfolk Hotdogs',              region: 'The Forest',      count: 'Up to 13',     note: 'South of Sunshine Meadows Industrial Farm. One of the two best Mole Rat farms in the game — well over the five needed for the daily. Stay on the ground or they burrow and vanish.', map: 'HillfolkHotdogs.webp' },
    { name: 'Welch Station',                 region: 'Ash Heap',        count: 'Up to 13',     note: 'West along the tracks — the other premier farm, with brood mothers spawning extra rats. Easy fast-travel access. Server-hop to reset.', map: 'Welch.webp' },
    { name: 'Green Country Lodge',           region: 'The Forest',      count: '3+',           note: 'A small reliable cluster right at the lodge entrance. Good first stop on a Forest Mole Rat loop before hitting Hillfolk Hotdogs.', map: 'GreenCountryLodge.webp' },
  ],
  'Mothman': [
    { name: 'Path to Enlightenment (Event)', region: 'The Forest',      count: 'Guaranteed',   note: 'Mothman has no fixed farm — it is summoned. Fast-travel to Landview Lighthouse when the event is live, fill the lamp with bioluminescent fluid from radtoads and fireflies, and the Wise Mothman spawns at the base once it is lit. The single best way to tick a Mothman challenge — commune with him after for a hefty XP buff.', map: 'LandviewLighthouse.webp' },
    { name: 'Queen of the Hunt',             region: 'The Mire',        count: 'Chance spawn', note: "Starting this event at Hunter's Shack in the Mire can draw a vengeful Mothman. Not guaranteed, but a solid secondary if Encryptid is not active." },
    { name: 'Point Pleasant (Night)',        region: 'The Forest',      count: 'Rare random',  note: "The Mothman Museum and surrounding town are the cryptid's lore home, and rare nighttime sightings still occur. Atmospheric, but do not rely on it for a challenge.", map: 'PointPleasant.webp' },
  ],
  'Radscorpion': [
    { name: 'Carleton Mine',                 region: 'Toxic Valley',    count: 'Up to 5',      note: 'Five reliably inside, both during and after the Wastelanders quest Cheating Death. Burrowers — they erupt from the floor as you move through the tunnels, so keep moving and watch your flanks.', map: 'CarletonMine.webp' },
    { name: 'World of Corn',                 region: 'Burning Springs', count: 'Up to 5',      note: 'Nests scattered among the corn sculptures around the museum. The Burning Radscorpion variants here count the same toward kill challenges.' },
    { name: 'Sinkhole Solutions',            region: 'Skyline Valley',  count: 'Event waves',  note: 'The public event throws dozens of Radscorpions at you in waves, with a guaranteed legendary in the final wave. Overkill for a daily, the fastest weekly clear there is.' },
  ],
  'Radroach': [
    { name: "Abbie's Bunker",                region: 'The Mire',        count: 'Up to 5',      note: 'Five inside the bunker, reliable and low-threat. Quickest grab for the Kill Insects daily if you are already in the Mire.', map: 'AbbiesBunker.webp' },
    { name: 'Campfire Tales (Event)',        region: 'The Forest',      count: 'Event spawn',  note: 'Runs at Camp Adams. Spawns Radroaches alongside Bloodbugs, Ticks, and Rad Ants — efficient for the Kill Insects weekly in one sitting.' },
    { name: 'Urban Interiors',               region: 'The Forest',      count: 'Common',       note: 'Radroaches infest sewers, basements, and ruined buildings throughout Charleston and Morgantown. Not a destination so much as a guarantee — you will trip over them clearing any city.' },
  ],
  'Wolf': [
    { name: 'Autumn Acre Cabin',             region: 'Savage Divide',   count: 'Up to 6',      note: 'Northeast of Top of the World. A pack of six spawns reliably around the cabin — the single best wolf farm on the map. Server-hop to reset the pack.', map: 'AutumnAcreCabin.webp' },
    { name: 'Northwest of Widows Perch',     region: 'Ash Heap',        count: 'Up to 3',      note: 'Three wander the ridge northwest of the Perch. Combine with a Blood Eagle clear for an efficient Ash Heap circuit.', map: 'WidowsPerch.webp' },
    { name: 'Free Range (Event)',            region: 'The Forest',      count: 'Event pack',   note: 'Triggers near Tyler County Fairgrounds and opens with roughly seven wolves. The related Leader of the Pack event also guarantees packs and drops a legendary from the pack leader.' },
  ],
  'Mongrel': [
    { name: 'Big Bend Tunnel',               region: 'Ash Heap',        count: '11 + 4 Alpha', note: 'The definitive canine farm — eleven Mongrels plus four Alpha Mongrels inside the tunnel. Clears any Kill a Canine challenge in a single pass.', map: 'BigBendTunnelEast.webp' },
    { name: 'Aaronholt Homestead',           region: 'The Forest',      count: '5 + 5 Dogs',   note: 'Five Mongrels and five Dogs around the abandoned farm. Doubles as a Bloodbug and Bloatfly stop, so you can stack insect challenges here too.', map: 'AaronholtHomestead.webp' },
    { name: 'Sylvie and Sons Logging Camp',  region: 'Savage Divide',   count: 'Variable',     note: 'Northeast of Fort Atlas, due east of the Sons of Dane compound. Usually a pack of canines — sometimes Wolves, sometimes Mongrels. Worth a swing-by, not a guarantee.', map: 'SylvieandSonsLoggingCamp.webp' },
  ],
  'Bloodbug': [
    { name: 'Aaronholt Homestead',           region: 'The Forest',      count: 'Reliable',     note: 'A prime insect farm — Bloodbugs and Bloatflies in numbers. Also holds Mongrels and Dogs, making it a rare two-challenge stop.', map: 'AaronholtHomestead.webp' },
    { name: 'New River Gorge Resort',        region: 'The Forest',      count: 'Up to 3',      note: 'Three spawn near the dead Brahmin by the truck-blocked bridge. Approach from the water and they will usually come to you.', map: 'NewRiverGorgeResort.webp' },
    { name: 'Philippi Battlefield Cemetery', region: 'Toxic Valley',    count: 'Chance',       note: 'Bloodbugs lurk among the graves. Less dense than Aaronholt, but a useful top-up if the homestead was already cleared.', map: 'PhilippiBattlefieldCemetery.webp' },
  ],
  'Stingwing': [
    { name: 'White Maintenance Building',    region: 'Savage Divide',   count: '3 fixed',      note: 'Northwest of the snake symbol near Whitespring Resort — a reliable fixed spawn of three. The most consistent Stingwing stop in the core regions.' },
    { name: "Big B's Rest Stop",             region: 'The Mire',        count: '3 to 4',       note: 'Around the small pond southeast of the rest stop. Erratic fliers — V.A.T.S. earns its keep here.', map: 'BigBsRestStop.webp' },
    { name: "Bleeding Kate's Grindhouse",    region: 'The Forest',      count: '2 to 3',       note: 'Nests cling to the drive-in movie screen. Watch the poison sting — it blurs your vision for a few seconds.', map: 'BleedingKatesGrindhouse.webp' },
  ],
  'Tick': [
    { name: 'Big Maw',                       region: 'The Mire',        count: 'Several',      note: 'The crater hosts Ticks alongside Bloatflies and Stingwings — a mixed-insect grab bag good for the Kill Insects challenges.', map: 'BigMaw.webp' },
    { name: 'Stings and Things (Daily)',     region: 'The Mire',        count: 'Quest spawn',  note: 'The daily insect quest from Dolly Sods Wilderness will sometimes task you with Ticks and spawn them on the path. The most directed way to find them.' },
    { name: 'Tea Time (Event)',              region: 'The Forest',      count: 'Event spawn',  note: 'Runs at The Giant Teapot and throws Ticks, Bloodbugs, and Ants. Ticks have no great fixed farm, so events and the insect daily are your best bet.' },
  ],
  'Cave Cricket': [
    { name: 'Lucky Hole Mine',               region: 'Savage Divide',   count: 'Packs',        note: 'Swarms through the lower levels and the surrounding woods. High Damage Resistance, so bring an energy weapon; ballistics chip away slowly.', map: 'LuckyHoleMine.webp' },
    { name: 'Tanagra Town',                  region: 'The Mire',        count: '5 guaranteed', note: 'A small cave near the top of the great tree, thick with crickets — the premier Acid farm in the game, over 50 waste acid per clear with a server-hop. Maxed Perception means they are near-impossible to sneak up on — expect to fight, not ambush.', map: 'TanagraTown.webp' },
    { name: 'Uncanny Caverns',               region: 'Cranberry Bog',   count: 'Packs',        note: 'Spread through the cave system, densest in the lower levels. A good Bog-side alternative when Lucky Hole is contested.', map: 'UncannyCaverns.webp' },
  ],
  'Radtoad': [
    { name: 'The Sludge Hole',               region: 'Savage Divide',   count: '2 to 3',       note: 'Just west of Wendigo Cave. Two or three always sit in the waterlogged pit — the one fixed, low-threat spawn, ideal for the Critical Hit daily.', map: 'TheSludgeHole.webp' },
    { name: 'Grafton Dam',                   region: 'Toxic Valley',    count: 'Up to 5',      note: 'Around five near the water and the dam face. Denser than the Sludge Hole, but Grafton is a higher-level area — come geared.', map: 'GraftonDam.webp' },
    { name: 'Path to Enlightenment (Event)', region: 'The Forest',      count: 'Event waves',  note: 'At Landview Lighthouse. Lighting the beacon spawns guaranteed waves of Radtoads at the base — the fastest way to farm a pile of them.', map: 'LandviewLighthouse.webp' },
  ],
  'Honey Beast': [
    { name: 'South of Middle Mountain Pitstop', region: 'Savage Divide', count: '3 guaranteed', note: 'Three reliably spawn between the Pitstop and Solomon\'s Pond. The most consistent fixed Honey Beast spot — start a farming loop here.', map: 'MiddleMountainPitstop.webp' },
    { name: "Freddy Fear's House of Scares", region: 'The Mire',        count: 'Up to 2',      note: 'In the unmarked cave to the northeast — the same cave the Stings and Things Bloatfly Gland task sends you to. Two Honey Beasts, often with Bloatflies backing them up.', map: 'FreddyFearsHouseofScares.webp' },
    { name: 'Irrational Fear (Event)',       region: 'The Mire',        count: '6 to 9',       note: "Starts at Raleigh Clay's Bunker. You escort a bee-phobic Mr. Handy and fight off six to nine Honey Beasts — overkill for the daily, perfect for the weekly." },
  ],
  'Mega Sloth': [
    { name: 'Southern Belle Motel',          region: 'The Mire',        count: 'Small group',  note: 'A group hangs from the trees south of the motel. Mega Sloths are passive and do not show on the compass — listen for their low groans or pop Berry Mentats to spot them.', map: 'SouthernBelleMotel.webp' },
    { name: 'Tanagra Town',                  region: 'The Mire',        count: '1 to 2',       note: 'Wandering the clearings and hanging from the treeline around town. The Mire is their primary habitat, so this is a dependable secondary stop.', map: 'TanagraTown.webp' },
    { name: 'Superior Sunset Farm',          region: 'Cranberry Bog',   count: 'Chance',       note: 'They drift into the Bog as well. The weekly is usually Take a Camera Picture of a Mega Sloth — line up the shot before it ambles off, since photo mode does not count.', map: 'SuperiorSunsetFarm.webp' },
  ],
  'Brahmin': [
    { name: 'Flatwoods',                     region: 'The Forest',      count: '4 to 9',       note: 'Grazing around the church in the town center, directly south of Vault 76. Respawns reliably — the best and most accessible Brahmin stop, friendly to brand-new survivors.', map: 'Flatwoods.webp' },
    { name: 'Big Bend Tunnel East',          region: 'Ash Heap',        count: 'Up to 3',      note: 'Three right at the fast-travel point. Quick and easy, though other players on the server may have beaten you to them — check back in fifteen minutes or hop servers.', map: 'BigBendTunnelEast.webp' },
    { name: 'Middle Mountain Pitstop',       region: 'Savage Divide',   count: 'Up to 4',      note: 'Four around the pitstop. Brahmin are peaceful — the daily needs only two kills, but you can milk them for Brahmin Milk instead if you would rather keep them for recipes.', map: 'MiddleMountainPitstop.webp' },
  ],
  'Scorchbeast': [
    { name: 'Fissure Site Prime',            region: 'Cranberry Bog',   count: '2+ in the air', note: 'Two are always circling overhead, southwest of the Glassed Cavern. This is the fissure you nuke to spawn the Scorchbeast Queen — approach the north and south rifts to draw more out.', map: 'FissureSitePrime.webp' },
    { name: 'Fissure Site Alpha',            region: 'Cranberry Bog',   count: '1 / ~18 min',   note: 'Southeast of Survey Camp Alpha, right next to Watoga. A fresh Scorchbeast climbs out roughly every eighteen minutes — loop it with Prime and you will never wait.', map: 'FissureSite.webp' },
    { name: 'Surface to Air (Event)',        region: 'Cranberry Bog',   count: 'Event spawn',   note: 'The dedicated Scorchbeast farming event. Cripple the wings with Concentrated Fire to force them down, and never stand near the bright center of a fissure — falling in is instant death and your dropped loot is gone.' },
  ],
  'Behemoth': [
    { name: "Solomon's Lower Pond",          region: 'Savage Divide',   count: '1 guaranteed',  note: "An unmarked pond southwest of Solomon's Pond and southeast of the Vantage — one stands in the water, guaranteed. The only dependable open-world Behemoth on the map.", map: 'SolomonsPond.webp' },
    { name: 'Abandoned Bog Town',            region: 'Cranberry Bog',   count: '1',             note: 'A Behemoth looms among the Super Mutants near Pylon V-13. A tower of muscle swinging a fire-hydrant club — it also hurls boulders, so keep moving at range.', map: 'AbandonedBogTown.webp' },
    { name: 'Primal Cuts (Event)',           region: 'Cranberry Bog',   count: 'Event boss',    note: 'During Meat Week, a Prime Behemoth caps the Cranberry Bog run as the final boss — bigger, tougher, and loaded with meat.' },
  ],
  'Hermit Crab': [
    { name: "Northwest of Abbie's Bunker",   region: 'The Mire',        count: '1 guaranteed',  note: 'One always spawns at the bend in the highway road northwest of the bunker, wearing a van or container as a shell. Slow, but it hits like a truck and spews hatchlings in waves.', map: 'AbbiesBunker.webp' },
    { name: 'Abandoned Bog Town',            region: 'Cranberry Bog',   count: 'Chance',        note: 'A crab patrols the highway southwest of Bogtown. Keep your distance — when it pulls into its shell and shakes, four to six hatchlings are about to pour out.', map: 'AbandonedBogTown.webp' },
    { name: 'Southern Belle Motel',          region: 'The Mire',        count: 'Chance',        note: 'Another reliable highway spawn, on the road southwest of the motel. They cannot fit through doors or climb obstacles, so high ground shuts them down.', map: 'SouthernBelleMotel.webp' },
  ],
  'Assaultron': [
    { name: 'Watoga Station',                region: 'Cranberry Bog',   count: 'Several',       note: 'Several patrol the perimeter walkway just west of the station, and the whole robot-choked city is your best all-purpose Destroy a Robot farm. Skip Mayor for a Day if you want them hostile — that quest turns every Watoga bot passive.', map: 'WatogaStation.webp' },
    { name: 'Grafton Steel',                 region: 'Toxic Valley',    count: 'Several',       note: 'Angry robots pack the underground works, sharing the site with Super Mutants — a closer option than Watoga for a quick Assaultron kill.', map: 'GraftonSteel.webp' },
    { name: 'Whitespring Resort',            region: 'Savage Divide',   count: 'Many',          note: 'White-painted Whitespring Assaultrons patrol the grounds and interior as security. Passive until provoked, so fire first. Cripple the legs and back off — they detonate on death.', map: 'WhitespringResort.webp' },
  ],
  'Mister Gutsy': [
    { name: 'Camp McClintock',               region: 'The Forest',      count: 'Several',       note: 'The automated Army training camp is staffed almost entirely by Mister Gutsies and Sergeant Gutsies — the most reliable Gutsy farm in the game. You will hear the anti-communist hollering before you see them.', map: 'CampMcClintock.webp' },
    { name: 'Dyer Chemical (Sewers)',        region: 'The Mire',        count: 'Several',       note: 'The sewers crawl with Gutsies, Protectrons, Robobrains, and the occasional Sentry Bot. A dense mixed-robot pocket, good for the generic Destroy a Robot challenge.', map: 'DyerChemical.webp' },
    { name: 'Whitespring Resort',            region: 'Savage Divide',   count: 'Several',       note: 'Whitespring Mr. Gutsy units serve as security and merchants — passive unless provoked. Three weaponized arms and heavy plating make a high-level one a genuine threat.', map: 'WhitespringResort.webp' },
  ],
  'Grafton Monster': [
    { name: 'Charleston Trainyard',          region: 'The Forest',      count: '1 guaranteed',  note: 'One always roams the dried riverbed near the second red train bridge, southeast of the Poseidon Energy Plant, sometimes wandering in to brawl with mole rats. The most reliable fixed cryptid spawn for a quick Kill a Cryptid.', map: 'ChrlestonTrainyard.webp' },
    { name: 'Hemlock Holes',                 region: 'The Forest',      count: '1 guaranteed',  note: 'A guaranteed roamer southeast of the maintenance building, out in the open. Aim for the blowholes on its shoulders for bonus damage — it has no head to shoot.', map: 'HemlockHoles.webp' },
    { name: 'Grafton Day (Event)',           region: 'Toxic Valley',    count: 'Event boss',    note: 'The headless brute caps the parade as the end boss. Fast-travel to Grafton and there is a fifty-percent chance the event fires, cooldown permitting.', map: 'GraftonTown.webp' },
  ],
  'Flatwoods Monster': [
    { name: 'Invaders From Beyond (Event)',  region: 'Events',          count: 'Event spawn',   note: 'The Zetan invasion event spawns Flatwoods Monsters across the map at the top of each hour — the only reliable way to find more than one. They only appear when the event is live.' },
    { name: 'Queen of the Hunt (Daily)',     region: 'The Mire',        count: 'Chance spawn',  note: "Run the daily from Hunter's Shack — one of the rotating cryptid targets can be a Flatwoods Monster. Repeatable once a day, your steadiest non-event shot." },
    { name: 'Night Random Encounters',       region: 'The Forest',      count: 'Rare random',   note: 'They only appear after dark, teleporting and abducting lone wanderers — the riverbanks near Thunder Mountain are a known haunt. It mind-controls nearby enemies and vanishes in a flash if you run. Atmospheric, never dependable.' },
  ],
  'Sheepsquatch': [
    { name: 'Trail Hill Overlook',           region: 'Skyline Valley',  count: '1 guaranteed',  note: 'A guaranteed spawn at this unmarked overlook southeast of Slumber Mill Motel — the one Sheepsquatch you can count on without an event.', map: 'TrailHillOverlook.webp' },
    { name: 'Free Range (Event)',            region: 'The Forest',      count: 'Event boss',    note: 'Escort three Brahmin home and one or two Sheepsquatch arrive as the boss fight. The most common event source, and it can trigger anywhere the herd is.' },
    { name: 'Primal Cuts (Ash Heap)',        region: 'Ash Heap',        count: 'Event boss',    note: 'During Meat Week, a Prime Sheepsquatch caps the Ash Heap version of the event. Duck behind cover when it rears up — that is the spine volley off its back. Aim for the head, its only weak spot.' },
  ],
  'Mirelurk Queen': [
    { name: 'Spruce Knob Lake',              region: 'Cranberry Bog',   count: 'Queen + 9',     note: 'Nine Mirelurks, a King, and a Queen erupting from the lake — the densest single-stop Mirelurk farm. She rises from the water with a roar, so keep the shoreline at your back.', map: 'SpruceKnobLake.webp' },
    { name: 'Toxic Dried Lakebed',           region: 'Toxic Valley',    count: 'Queen + 6',     note: 'A Queen roams the island near Kiddie Corner Cabins with a half-dozen Mirelurks. Open ground makes her easy to kite, away from her poison pool.', map: 'ToxicDriedLakebed.webp' },
    { name: 'Quarry X3',                     region: 'Cranberry Bog',   count: '1 Queen',       note: 'A Queen lurks in the flooded quarry. Largest enemy short of the Scorchbeast Queen and a Behemoth — her spit lays an AoE pool that ramps damage the longer you stand in it. Hit the head, spouts, and legs.', map: 'QuarryX3.webp' },
  ],
  'Fog Crawler': [
    { name: 'Carleton Mine',                 region: 'Toxic Valley',    count: '1 reliable',    note: 'The only dependable fixed Fog Crawler, deep in the mine — but it only appears once you are working the raider quest Cheating Death. Find the mine too early and the crawler will not be there.', map: 'CarletonMine.webp' },
    { name: 'Dabney Homestead',              region: 'The Mire',        count: '3 (event)',     note: 'Claim the workshop and the Clear Out Enemies wave usually includes three Fog Crawlers, the top Fiber Optics farm in the game.', map: 'DabneyHomestead.webp' },
    { name: 'Dolly Sods Campground',         region: 'The Mire',        count: 'Chance',        note: 'A chance roamer in the fog. Immune to silenced attacks, radiation, and poison — bring loud ballistic or explosive damage and aim for the legs up close.', map: 'DollySodsWilderness.webp' },
  ],
  'Ogua': [
    { name: 'Beasts of Burden (Event)',      region: 'Cranberry Bog',   count: 'Event boss',    note: 'A legendary Ogua caps this event at Sacramental Glade. The turtle-cryptid retreats into its shell to shrug off damage — wait for it to extend, then punish.' },
    { name: 'Sinkhole Solutions (Event)',    region: 'Skyline Valley',  count: 'Event boss',    note: 'The final wave at Tycoon Lake pits a legendary Ogua against three legendary Emperor Radscorpions on the opposite shore — kill both groups inside the three-minute timer. The one guaranteed non-random Ogua besides Beasts of Burden.' },
    { name: 'Roadside Scenes (Random)',      region: 'Savage Divide',   count: 'Rare random',   note: 'Turns up at wrecked-car encounters, often mid-fight with a Blue Devil or Mothman cultists. Introduced in Once in a Blue Moon; counts toward Kill a Cryptid.' },
  ],
  'Jersey Devil': [
    { name: 'Sins of the Father (Quest)',    region: 'Atlantic City',   count: 'Quest boss',    note: 'The only way to face the true Jersey Devil — the final boss of the Russo questline. It flees rather than dies, but you still get the kill credit and XP. The rarest cryptid in the game.' },
    { name: 'Flooded City Center',           region: 'Atlantic City',   count: 'Quest spawn',   note: 'Where the showdown happens. Start the questline at The Rose Room, the nightclub in the former Ingram Mansion — talk to the bartender Vin.' },
    { name: 'Lesser Devils (City Streets)',  region: 'Atlantic City',   count: 'Common',        note: "The Devil's juvenile offspring roam the outskirts and appear in expedition missions; they count toward Kill a Cryptid even when the true Devil is out of reach." },
  ],
  'Scorchbeast Queen': [
    { name: 'Scorched Earth (Event)',        region: 'Cranberry Bog',   count: 'Nuke boss',     note: 'Complete Mission: Countdown and drop a nuke on Fissure Site Prime. The original endgame boss: 3-star legendary, server-wide, thirty-minute timer, eight-plus players recommended. Cripple a wing to ground her; the head takes 150% damage. Perch on Drop Site V9 where she cannot reach you.' },
  ],
  'Earle Williams': [
    { name: 'A Colossal Problem (Event)',    region: 'Savage Divide',   count: 'Nuke boss',     note: 'Nuke Monongah Mine to crack it open, then drop the shaft to fight Earle, a hugely mutated Wendigo Colossus. Endless Wendigos spawn during the fight — a screw and fiberglass goldmine. Maggie in Foundation also points you here via Something Sentimental.' },
    { name: 'Blast-Zone Colossus (Random)',  region: 'Cranberry Bog',   count: 'Rare random',   note: 'A wild Wendigo Colossus (not Earle himself) can rarely spawn in a nuked zone — most often the Overgrown Sundew Grove when players nuke Fissure Prime for Scorched Earth.' },
  ],
  'Ultracite Titan': [
    { name: 'Seismic Activity (Event)',      region: 'Ash Heap',        count: 'Nuke boss',     note: 'Nuke Abandoned Mine Shaft 2 beside Nuka-World on Tour to trigger it. Destroy eleven Ultracite Crystals with melee to summon the Titan, a giant mutated Mole Rat that spits out endless Mole Miners and Ultramites. Drops ultracite scrap and 4-star named weapons.' },
  ],
  'Glowing One': [
    { name: 'Whitespring Resort',            region: 'Savage Divide',   count: '1 reliable',    note: 'A Glowing One always sits on one of the houses near the northernmost exit — the most dependable fixed glowing ghoul on the map.', map: 'WhitespringResort.webp' },
    { name: 'Camden Park',                   region: 'Ash Heap',        count: '2 glowing',     note: 'Two glowing radroaches almost always lurk in the restrooms — the fastest tick for any Photograph a Glowing Creature daily.', map: 'CamdenPark2.webp' },
    { name: 'Blast Zones (Nuked)',           region: 'Savage Divide',   count: 'Many',          note: 'Nuking a populated zone like Monongah, Morgantown, or Charleston turns its ghouls into Glowing Ones. The broader Glowing Creature challenge also counts glowing Mole Miners at Mount Blair and glowing Wendigos at Appalachian Antiques.' },
  ],
  'Sentry Bot': [
    { name: '98 NAR Regional',               region: 'Savage Divide',   count: '1 reliable',    note: 'Patrols the road north of Whitespring near the cargo train — the most reliable spawn. Beware the Annihilator variant; it can one-shot a mid-level character, so come geared.', map: '98NARRegional.webp' },
    { name: 'Dyer Chemical',                 region: 'The Mire',        count: '1+',            note: 'Sentry Bots patrol the grounds as groundskeepers. If one is missing it was killed by a rampaging enemy — server-hop and it returns.', map: 'DyerChemical.webp' },
    { name: 'Nuclear Silos',                 region: 'Savage Divide',   count: '1 each',        note: 'Each silo interior holds Sentry Bots — convenient if you are already running Alpha, Bravo, or Charlie for nuke codes. The Critical Hit a Sentry Bot challenge wants a VATS crit; cripple-arm dailies reset with a server-hop.', map: 'SiteAlpha.webp' },
  ],
  'Cultist': [
    { name: 'Point Pleasant',                region: 'The Forest',      count: '26',            note: 'Dozens cluster around the Mothman Museum — server-hop and clear for the fastest Kill a Cultist daily or weekly. Also the battleground of the seasonal Mothman Equinox.', map: 'PointPleasant.webp' },
    { name: 'Lucky Hole Mine',               region: 'Savage Divide',   count: '22',            note: "Twenty-plus patrol the mine and its tunnels — the cult's post-war home. Doubles as a Cave Cricket and Acid stop.", map: 'LuckyHoleMine.webp' },
    { name: 'Clancy Manor',                  region: 'Toxic Valley',    count: '13',            note: 'A long-standing cult encampment near the Forest border, with Mothman Eggs and teddy bears inside for flavor. Melee and sneak attackers — let them come to you.', map: 'ClancyManor.webp' },
  ],
  'Lost': [
    { name: 'Vault 63',                      region: 'Skyline Valley',  count: 'Dense',         note: 'The electrified, ghoulified dwellers of Vault 63 are thickest in and around the vault; the main questline wades straight through them.' },
    { name: 'Skyline Valley (Storm Zones)',  region: 'Skyline Valley',  count: 'Throughout',    note: 'They roam the whole region and grow stronger when the rolling storm passes overhead, crackling with electricity. Fight them between storm fronts when you can.' },
    { name: 'Slumber Mill Motel Roads',      region: 'Skyline Valley',  count: 'Packs',         note: 'Packs wander the roads and overlooks near the motel — convenient alongside your existing Skyline Valley field sites.', map: 'SlumberMillMotel.webp' },
  ],
  'Blue Devil': [
    { name: 'Safe and Sound (Event)',        region: 'Savage Divide',   count: 'Event target',  note: 'The Blue Devil is the prize cryptid of this event at Middle Mountain Pitstop — the reliable way to find one, and the source of its unique plans and outfit.', map: 'MiddleMountainPitstop.webp' },
    { name: 'Wilderness Skirmishes',         region: 'Savage Divide',   count: 'Rare random',   note: 'Turns up mid-fight against raiders or other factions; watch the World Activity menu for skirmishes and you may catch one in the open.' },
    { name: 'Scene Encounters (Random)',     region: 'The Forest',      count: 'Rare random',   note: 'Rare roadside spawns. Its scream inflicts Uncontrollable Fear and sends you running — bring fear resistance or Wasteland Whisperer.' },
  ],
  'Mutant Hound': [
    { name: 'West Tek Research Center',      region: 'Savage Divide',   count: 'Pack',          note: 'The FEV facility swarms with Super Mutants and the Mutant Hounds that run with them — the densest pack on the map, but a high-level area.', map: 'WestTekResearchCenter.webp' },
    { name: 'Huntersville',                  region: 'Savage Divide',   count: 'Pack',          note: 'The original mutant town; hounds patrol alongside the mutants and the occasional Behemoth. Closer and lower-level than West Tek.', map: 'Huntersville.webp' },
    { name: 'Crevasse Dam',                  region: 'The Mire',        count: 'Pack',          note: 'A reliable mutant camp where hounds travel with the pack. They count toward Kill a Canine challenges alongside Wolves, Mongrels, and Dogs.', map: 'CrevasseDam.webp' },
  ],
  'Bloatfly': [
    { name: 'Aaronholt Homestead',           region: 'The Forest',      count: 'Reliable',      note: 'The all-purpose insect farm — Bloatflies and Bloodbugs in numbers, with Mongrels and Dogs for a bonus canine challenge.', map: 'AaronholtHomestead.webp' },
    { name: 'Big Maw',                       region: 'The Mire',        count: 'Several',       note: 'Bloatflies share the crater with Ticks and Stingwings — a one-stop grab bag for the Kill Insects challenges.', map: 'BigMaw.webp' },
    { name: 'Honey Beast Dens',              region: 'The Mire',        count: 'Escort',        note: "Bloatflies almost always escort Honey Beasts, such as the cave northeast of Freddy Fear's. Slow gas-bags that burst on death — pop them at range." },
  ],
  'Critters (Small Game)': [
    { name: 'The Forest Farms',              region: 'The Forest',      count: 'Ambient',       note: 'Cats, Chickens, Opossums, and Brahmin wander the homesteads — Flatwoods, the Wayward, Sunnytop. Easy Take a Photo targets that will not fight back.' },
    { name: 'Savage Divide Woods',           region: 'Savage Divide',   count: 'Ambient',       note: 'Rabbits, Squirrels, and Foxes dart through the high forests. Quick photo-challenge fauna — tag them with the camera before they scatter.' },
    { name: 'Mire & Bog Waters',             region: 'The Mire',        count: 'Ambient',       note: 'Beavers and Frogs sit by the water, harmless but handy for the small-game and photo dailies. Several seasonal challenges ask for a specific critter, so keep the camera ready.' },
  ],
};
