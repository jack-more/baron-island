# Bart Oatmeal Island Passoff

Last updated: July 5, 2026 (evening)

## Read This First

All prior guidance about how this experience should play or feel — the tiny walkable
planet, Messenger-by-Abeto as the reference, click-hold walking, avatar movement rules,
mission-delivery loops — is **retired**. Do not rebuild from it, do not "honor" it, do not
inherit its framing. Earlier prototypes built on that guidance were rejected.

The one true reference for feel and fidelity is the **Wii Sports Resort island flyover**:

https://www.youtube.com/watch?v=Rb0KONWs4kI&t=30s

Calm, warm, toy-scale, alive. You are in the air. The world is a place you drift over,
not a menu you click through.

## Who Bart Oatmeal Is (July 5 rebrand)

**Bart Oatmeal is Baron Davis's rapper alter-ego and metaverse character** (ESPN,
Okayplayer). The real ecosystem grounds the world: **Oatmeal Radio Café** at 4859 W
Jefferson Blvd LA (coffee + streaming studio + venue; mission: prison reform & foster
care reform, "barista A&Rs → managers → owners"), **SLIC Studios** (where he records),
the **STEELCUT** albums, and Business Inside the Game. The island is his world; the
five moments are still Baron's evidence-backed life arc.

## What Exists Now (the current build)

`index.html` + `src/` at the repo root is **BART OATMEAL** — a browser-playable Three.js
island flyover, verified end-to-end in desktop and mobile viewports.
Live at https://jack-more.github.io/baron-island/

The experience:

- One island, Wuhu-style: central mountain, harbor bay, beaches, shallows, a loop road,
  a lighthouse, sailboats, gulls, drifting clouds, cars on the road, a sponsor blimp.
- You fly a little seaplane towing a BARON ISLAND banner. Bank-to-turn physics, terrain
  floor, soft ceiling, boost.
- **Semi-ambient attract mode**: with no input, the plane flies an island tour on
  autopilot (like the Wii flyover demo). Any touch/key takes control; ~10s idle hands it
  back. This is the "homepage for a retired athlete" mode — it is beautiful doing nothing.
- Five landmarks from Baron's life sit on the island: South Central LA first court,
  Crossroads→UCLA campus, Oakland Harbor (arena, cranes, pier), Downtown LA plaza,
  Summit Tower (B.I.G. / investor chapter) on the mountain shoulder.
- A **gold ring** floats over each landmark. Fly through it → the plane circles the
  landmark while a moment card opens → play that moment's **sponsored mini-game** →
  win unlocks the era's interview prompt (from `players/baron_davis.json`), a star,
  and **raffle tickets**.
- **Split-screen mini-games with real graphics**: the island keeps flying on the left;
  the game panel docks right. First Shot is a drawn court scene (hoop, net, kid, ball
  arc animation); Drop the Beat is a spinning STEELCUT vinyl with a pulse ring and
  equalizer; Fix the Tape uses drawn cassette cards.
- **Raffle economy**: game wins = +5 tickets (+2 replays), balloons = +1 each. The
  Raffle Shelf (🎁 in the HUD) lists real-feeling prizes — game-worn signed jersey,
  signed STEELCUT vinyl, Radio Café merch box, SLIC studio session — with ticket
  costs and an ENTER flow. Raffle proceeds framing: the café's reform mission.
- **Sponsored mini-games**: every mini-game carries a "PRESENTED BY <sponsor>" slot,
  filled with placeholder inventory from Baron's real portfolio (Super Coffee, Tracklib,
  Sleeper, Thrive, B.I.G. — per the U.S. Chamber interview evidence). The blimp banner is
  a second sponsor surface. This is the business proof: player-owned ad inventory inside
  a player-owned world.
- **Palm Court**: a signature lofi cove on the southeast shore — an organized double
  arc of palms with string lights framing a little RADIO CAFÉ (striped awning, rooftop
  radio, parasols, beach chairs). Music notes drift up from the antenna and a soft
  pentatonic melody plays when you fly near. Palm rows also flank the coastal road
  stretches ("Palm Drive"). Aesthetic reference: the Oatmeal Radio Cafe lofi vibe.
- 20 pop-balloons scattered around the island for pure joy; popping is scored and
  persisted. Five stars → finale card with the pitch line.
- All-synthesized audio (WebAudio): warm pad, speed-linked wind, ring chimes, pop sounds,
  café melody, win fanfare. No audio assets. Mute button in the HUD.
- Golden-hour lofi palette: peach horizon, warm sun, faint illustrated contour bands
  on the grass.
- **DBZ-Los-Angeles art direction** (July 5 evening pass): Toriyama-style capsule dome
  buildings with porthole windows mixed into every skyline, a big gold **BARON CORP.**
  dome by Summit Tower, orange wasteland mesas on the mountain flanks, hover-capsule
  cars (no wheels, glowing skirts) on the loop road, and a Kame-House-style
  **BARON HOUSE** islet offshore at (172, 148) with its own balloon. Saturated
  grass/water, vivid blue sky over the peach horizon.
- Controls: drag or WASD/arrows with **inverted pitch** (up/forward = dive,
  down/back = climb), **Space (or Shift) = boost**.

Run it:

```bash
cd /Users/jackmorello/Desktop/Jobs/player_world_formatter
python3 -m http.server 4173 --bind 127.0.0.1
# open http://127.0.0.1:4173
```

Code layout:

```text
src/main.js       app shell: camera, input, HUD, pickups, moment/story/finale flow
src/flight.js     seaplane + flight model + autopilot (tour and orbit modes)
src/island.js     analytic-heightfield terrain, water, road, biome scatter, ambient life
src/landmarks.js  five landmark set pieces, gold rings, balloons, blimp, road cars
src/props.js      toon prop factories + canvas textures (all art is procedural)
src/minigames.js  five DOM mini-games (timing shot, memory match, rhythm, catch, matching)
src/audio.js      synthesized ambience and SFX
src/data.js       landmark content + sponsor slots, distilled from players/baron_davis.json
vendor/           Three.js r160 + OutlineEffect, vendored (runs offline)
legacy/           rejected prototypes (canvas, tiny-planet). Reference only. Do not extend.
```

Debug hooks (console): `baronWorld.{skipIntro, flyTo(id), hitRing(id), tick(s), state, reset}`.

## Feel Bar (acceptance criteria)

Do not present a build as ready unless:

- It opens in the browser and is beautiful within 3 seconds, before any interaction.
- Left alone, it flies itself and stays interesting (attract mode is first-class).
- Flying feels gentle and forgiving — no way to crash, no fail states in the air.
- The island reads as one coherent, warm, toy-scale place with visible landmarks.
- Rings, balloons, and moments produce sound and delight when touched.
- Every mini-game is 20–40 seconds, winnable, and carries a sponsor slot.
- Wins unlock evidence-backed interview prompts, not generic copy.
- No official NBA/team/school marks; sponsors are placeholder text only.
- Desktop and mobile both verified.

## Business Frame (unchanged, still the point)

- Fans explore a player's life as a place; each moment is sponsorship inventory the
  player owns (mini-game presenting rights, blimp/banner surfaces, future portals).
- Baron is the wedge: he can get deeper stories from NBA peers and package them through
  a repeatable formatter (`player_world_formatter.py` + intake templates).
- The interview prompts unlocked by play are the content engine: Baron answers them in
  his own voice, or uses them to interview the next player.

## Evidence Pack (still valid)

Baron:

- UCLA profile: https://uclabruins.com/sports/1999/6/21/207910475
- NBA stats profile: https://www.nba.com/stats/player/1884/career
- NBA Players Only bio: https://www.nba.com/news/players-only-baron-davis-tnt
- LA Sentinel profile: https://lasentinel.net/socal-legends-baron-davis.html
- BaronDavis.com: https://barondavis.com/
- BRIC profile: https://www.bricfoundation.org/profile/baron-davis
- U.S. Chamber Business of Sports interview (sponsor portfolio source):
  https://www.uschamber.com/sports-and-entertainment/business-of-sports-how-an-nba-star-pivoted-to-entrepreneurship
- A16Z Cultural Leadership Fund: https://a16z.com/clf/
- A16Z CLF LinkedIn post: https://www.linkedin.com/posts/a16z-cultural-leadership-fund_what-is-baron-davis-most-excited-about-with-activity-7343372351985631233-fV9-

Story spine, era zones, missions, outfits, and interview prompts live in
`players/baron_davis.json` and `outputs/baron_davis_world.md`. The *content* there is
good; ignore any *interaction* language in it (walking, deliveries, click-to-walk).

## Rights-Light Rules (unchanged)

- Fictional/inspired marks only until licenses exist; no official logos or jerseys.
- Sponsor slots are placeholder text, not endorsements.
- Original synthesized audio only until music rights are cleared.
- Exact childhood geography is Baron-confirmation pending.
- All first-person memories are placeholders until Baron records or approves them.

## Polish Backlog

- Four benign "gradientMap has value of undefined" console warnings at startup
  (cosmetic; materials render correctly).
- Sign the Board still DOM-only; could get a drawn plaza scene like Shot/Beat.
- Raffle entries are demo-only (localStorage); a real raffle needs a backend + rules.

- Second sponsor surface pass: rotating blimp banners, ring-sponsor tie-ins.
- Balloon pop particle burst (currently scale/fade-out).
- Evening/golden-hour lighting variant (WSR has time-of-day; ours is fixed afternoon).
- Optional gamepad support.
- Scenario/Meshy asset upgrade path if procedural art needs to level up for the pitch:
  generate key art with Scenario (`scripts/scenario_api_smoke.py`, keys required), then
  swap prop factories for GLB imports landmark-by-landmark.

## Data Gaps to Confirm with Baron

- Which sponsors may be named vs. placeholder.
- Which NBA/Warriors/Hornets/Clippers/UCLA/Crossroads references can be licensed.
- Whether childhood geography is depicted exactly or as an emotional composite.
- Voice, archival, and music rights for the licensed build.
- The first three NBA friends for plug-and-play formatter tests.
