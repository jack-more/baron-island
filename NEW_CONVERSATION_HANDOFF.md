> **DEPRECATED (July 5, 2026).** This document describes the retired walkable-planet
> direction and rejected prototypes. Its feel/interaction guidance must not be reused.
> The current direction and build are documented in `BARON_DAVIS_WORLD_PASSOFF.md`.

# New Conversation Handoff: Baron Davis Player World

Copy this into a fresh Codex conversation:

```text
We are building a browser-playable Baron Davis player world proof of concept in /Users/jackmorello/Desktop/Jobs/player_world_formatter.

The previous prototype exists, but the visual direction was rejected. Treat the current canvas game as engineering scaffolding only. The next step is an art-first rebuild using Scenario for cohesive 2D anime/cel-shaded asset generation, Meshy or another 3D service only after the look is approved, and Three.js for the actual curved round-world browser game.

Critical reference: https://messenger.abeto.co/
Study it carefully. The target is a small round walkable world with visible curvature, smooth click-hold and keyboard movement, compact zones, dense hand-modeled detail, soft cel-shaded color, ink outlines, a personal story mission structure, outfit expression, and a calm but addictive browser feel. It should feel like a player-owned fan metaverse, not an info site.

Start with Baron Davis as a little boy manifesting his future. The connected round-world route should move through:
1. South Central LA origin: 85th/Avalon as requested by user, while noting exact block details need Baron confirmation. Blue LA sky, low-rise housing, courts, chain-link fence, power lines, corner store, palms.
2. Downtown LA / Staples Center / Clippers chapter.
3. Crossroads High School and UCLA Westwood chapter.
4. Oakland / We Believe Warriors chapter.
5. SF or NY investor tower chapter, showing Baron as investor, creator, and cultural connector with A16Z context.

Do not polish the old placeholder look. First create or operate the art pipeline. If Scenario credentials or a logged-in browser session are available, use Scenario to generate a cohesive style bible and approved key art. Then wire the game to consume those assets in Three.js.

Important files:
- /Users/jackmorello/Desktop/Jobs/player_world_formatter/EVIDENCE.md
- /Users/jackmorello/Desktop/Jobs/player_world_formatter/players/baron_davis.json
- /Users/jackmorello/Desktop/Jobs/player_world_formatter/index.html
- /Users/jackmorello/Desktop/Jobs/player_world_formatter/app.js
- /Users/jackmorello/Desktop/Jobs/player_world_formatter/styles.css
- /Users/jackmorello/Desktop/Jobs/player_world_formatter/assets/
- /Users/jackmorello/Desktop/Jobs/player_world_formatter/NEW_CONVERSATION_HANDOFF.md

Use the handoff file for full requirements, prompts, current status, and acceptance criteria.
```

## Can Codex Run Scenario?

Yes, with one of these paths:

1. Browser path: If the user is logged into Scenario in the in-app browser, Codex can drive the site, create generations, download/export assets, and place them into the project.
2. API path: If the user provides Scenario API credentials in the environment, Codex can script asset generation. Current Scenario docs describe API access for image generation, model training, asset management, and SDKs for TypeScript and Python.
3. Manual account limit: Codex cannot create a paid account, bypass login, spend credits without access, or access a private workspace unless the user provides that session or credentials.

Suggested environment variables for API work:

```bash
export SCENARIO_SDK_API_KEY="..."
export SCENARIO_SDK_API_SECRET="..."
export MESHY_API_KEY="..."
```

Official docs to verify before scripting:

- Scenario API: https://docs.scenario.com/
- Scenario Python SDK: https://docs.scenario.com/api/python
- Scenario TypeScript SDK: https://docs.scenario.com/api/typescript
- Meshy API: https://docs.meshy.ai/en
- Meshy image-to-3D: https://docs.meshy.ai/api/image-to-3d
- Meshy text-to-3D: https://docs.meshy.ai/api/text-to-3d

## Status

The local prototype is running at `http://127.0.0.1:4173` when the simple static server is active:

```bash
cd /Users/jackmorello/Desktop/Jobs/player_world_formatter
python3 -m http.server 4173 --bind 127.0.0.1
```

The current page has:

- A start overlay.
- Canvas-based movement.
- Click or hold movement and keyboard movement.
- District buttons for South Central, LA Clippers, UCLA, Oakland, and investor chapter.
- A rough round-world visual sketch.

The current page does not meet the art bar. Treat it as a movement and UI scaffold.

## Core Product

Baron Davis is the first proof for a repeatable player-world formatter.

The pitch: every player gets a small, beautiful, addictive memory planet that fans can explore. Each planet captures the feeling of that player's era: neighborhood, school, team chapters, signature moments, music and fashion mood, local places, fan energy, and the player stories that only come out through trust. Baron becomes the host, interviewer, and connective tissue because players will tell him deeper stories than they would tell a generic media product.

The business idea: these worlds become player-owned media spaces. If the world is compelling enough, the player can sell sponsorships, activations, unlocks, digital collectibles, venue integrations, and branded missions inside their own story world.

## User Corrections That Must Be Honored

- This must be a game, not a static site.
- The reference is Messenger by Abeto: https://messenger.abeto.co/
- The world must be round and walkable, with visible curvature.
- The zones must be physically connected, not separate cards or a flat board.
- Movement must feel seamless with click-hold, WASD, and arrow keys.
- The player avatar must move and animate.
- The art needs to be beautiful enough for a serious investor and public-facing pitch.
- Current placeholder art is unacceptable as final direction.
- Outfits are lower priority than movement, world structure, and visual fidelity.
- The South Central zone should not read as East LA.
- The art should move toward anime/cel-shaded, smooth, personal, high-detail, and cohesive.

## Reference Game Findings

Messenger by Abeto feels strong because of these combined decisions:

- A tiny round planet with visible curvature.
- The user can keep walking rather than hitting hard invisible boundaries.
- Third-person camera follows the character smoothly.
- Movement works with click/tap hold and keyboard.
- Art uses simple geometry, hand-drawn-feeling outlines, flat color fields, and soft shadows.
- Prop density is high: signs, fences, mailboxes, benches, NPCs, trees, rocks, stairs, doorways, shop details.
- Areas are distinct but connected by walkable roads and terrain.
- UI floats above the world and stays lightweight.
- Missions are simple delivery loops.
- Clothes, hair, and expressive identity are part of the emotional texture.
- The fidelity comes from cohesion and density, not photoreal rendering.

Sources already collected in `EVIDENCE.md`:

- Messenger site: https://messenger.abeto.co/
- Awwwards case: https://www.awwwards.com/messenger.html
- Communication Arts: https://www.commarts.com/webpicks/messenger
- 80 Level: https://80.lv/articles/deliver-mail-on-tiny-colorful-planet-in-this-relaxing-web-game
- Aftermath: https://aftermath.site/messenger-browser-game-abeto/

## Art Direction

Target style:

- Anime-influenced, cel-shaded, 2.5D or low-poly 3D.
- Warm Los Angeles daylight for the opening.
- Thick but tasteful ink outlines.
- Painterly sky gradients and simple cloud shapes.
- Chunky, readable forms.
- Rich prop detail without visual noise.
- Human, personal, slightly magical realism.
- World scale should make the child avatar feel small but capable.
- Camera should frame the planet curvature and the next zone hint.

Avoid:

- Generic gradient landing pages.
- UI cards pretending to be the world.
- Crude canvas doodles as final art.
- Photoreal NBA likeness or licensed uniforms unless rights are secured.
- Exact team logos or official marks in the rights-light prototype.
- Dark, generic sci-fi metaverse visuals.
- A flat map.

## Baron World Zones

### 1. South Central LA: First Court

Purpose: childhood origin, blue LA sky, neighborhood dreams, first court.

Requested geography: 85th Street and Avalon Boulevard area. Existing evidence in `EVIDENCE.md` supports South Central childhood near Manchester Blvd and San Pedro via Los Angeles Sentinel, so exact 85th/Avalon should be treated as user-supplied and Baron-confirmation pending.

Visuals:

- Blue LA sky.
- Low-rise apartments or projects.
- Chain-link court.
- Corner store.
- Power lines.
- Asphalt, painted curbs, streetlights.
- Palms and sparse trees.
- Kids watching from the fence.
- A bus stop or street sign.

Mission:

- Bring the worn shoes or ball from home to the court.
- First story unlock: who made young Baron believe he could leave the block through basketball?

### 2. Downtown LA: Staples / Clippers

Purpose: hometown return and pro chapter in LA.

Visuals:

- Arena plaza inspired by Staples Center era.
- Red, blue, and white inspired banners without official logos.
- Palm-lined downtown street.
- Street vendors, traffic lights, ticket windows.
- A tunnel into the arena.

Mission:

- Carry a hometown ticket or arena pass to the plaza gate.
- Story unlock: what it meant to come home as a Clipper.

### 3. Crossroads / UCLA: Westside Rise

Purpose: moving between South LA, Crossroads, UCLA, high school fame, college pressure, injury recovery.

Visuals:

- Santa Monica / Westside school courtyard.
- Gym, art-school energy, lockers.
- UCLA-inspired campus steps and blue-gold court details.
- VHS tapes, recruiting letters, training room.

Mission:

- Collect VHS fragments across Crossroads and UCLA.
- Story unlock: moving between worlds without losing where he came from.

### 4. Oakland: We Believe

Purpose: emotional sports peak and fan myth.

Visuals:

- Oakland arena bowl inspired chapter.
- Industrial supports.
- Bridge/transit edge.
- Yellow-blue towels.
- Roaring fan NPCs.
- Playoff night lighting.

Mission:

- Carry a ticket stub through the crowd to light the arena.
- Story unlock: what "We Believe" felt like from inside the storm.

### 5. SF / NY Investor Tower

Purpose: Baron as investor, creator, founder, AI storyteller, Business Inside the Game ecosystem builder, and A16Z cultural leadership context.

Visuals:

- Sleek but warm founder tower.
- Rooftop court.
- Pitch room.
- Screens showing world-building, AI, animation, community, sports tech.
- Founder matchmaking board.
- Creator distribution control room.
- City skyline.

Mission:

- Carry the story seed from the court to the studio, then connect a player, sponsor, founder, investor, advisor, and creator on the BIG board.
- Story unlock: why athlete-owned fan spaces, AI, NIL, and creator distribution can become real business infrastructure.

## Scenario Art Pipeline

Scenario should be used first because this project needs cohesive image style, not random one-off assets.

### Phase 1: Style Bible

Generate and approve these assets before touching gameplay visuals:

1. One hero key art of the full round Baron planet.
2. One orthographic-ish gameplay camera frame.
3. Five district key frames, one per zone.
4. One child Baron avatar sheet.
5. One prop sheet with 20 reusable objects.
6. One color palette and material board.
7. One UI mood board: mission bubble, small map marker, outfit rail, story unlock card.

Output folder:

```text
/Users/jackmorello/Desktop/Jobs/player_world_formatter/assets/scenario/
```

Use file names like:

```text
baron_world_style_bible_01.png
baron_round_planet_keyart_01.png
zone_south_central_keyframe_01.png
zone_downtown_clippers_keyframe_01.png
zone_crossroads_ucla_keyframe_01.png
zone_oakland_webelieve_keyframe_01.png
zone_investor_tower_keyframe_01.png
avatar_child_baron_sheet_01.png
prop_sheet_world_objects_01.png
ui_story_mission_board_01.png
```

### Master Style Prompt

```text
Create a premium browser-game concept art style for a small walkable round planet inspired by a personal basketball life story. Anime-influenced cel-shaded 2.5D game art, hand-painted texture, clean ink outlines, compact low-poly forms, soft block shadows, warm daylight, cinematic but playable camera, emotionally personal, high prop density, readable silhouettes, charming miniature world, no photorealism, no official NBA logos, no exact jersey marks, no cluttered UI. The world should feel like a tiny spherical memory planet that fans can walk around in.
```

### Round Planet Key Art Prompt

```text
A cohesive tiny spherical walkable planet for Baron Davis as a child manifesting his future. The planet has connected neighborhoods on one curved surface: South Central Los Angeles court and low-rise housing under blue LA sky, downtown LA arena plaza inspired by the Clippers era, Crossroads and UCLA Westside school and campus, Oakland We Believe arena district with yellow-blue fan energy, and a sleek SF or NY investor tower with rooftop court and AI story studio. Premium anime cel-shaded 2.5D browser game art, hand-painted texture, clean ink outlines, soft shadows, dense readable props, warm and personal, round-world curvature visible, third-person gameplay perspective, no official NBA logos, no photorealism.
```

### South Central Prompt

```text
South Central Los Angeles childhood basketball district for a premium tiny round-world browser game. Blue LA sky, warm concrete court, chain-link fence, low-rise apartments or projects, corner store, street signs, power lines, palms, asphalt, neighborhood kids, worn shoes, basketball hoop, young dream energy. Anime-influenced cel-shaded 2.5D game art, clean ink outlines, hand-painted texture, readable geometry, soft shadows, no gang imagery, no official logos, no photorealism, not East LA architecture.
```

### Downtown LA / Clippers Prompt

```text
Downtown Los Angeles arena plaza district for a Baron Davis tiny round-world game. Staples Center era inspiration without official marks, red-blue-white banners, palm-lined plaza, ticket windows, tunnel entrance, street vendors, traffic lights, evening glow, hometown return energy. Anime cel-shaded 2.5D browser game art, compact low-poly forms, ink outlines, soft shadows, high prop detail, no official team logos, no photorealism.
```

### Crossroads / UCLA Prompt

```text
Westside Los Angeles school and UCLA campus district for a Baron Davis tiny round-world game. Crossroads-inspired creative school courtyard, gym doors, lockers, art studio hint, bus route from South LA, UCLA-inspired campus steps, blue-gold practice court, VHS tapes, recruiting letters, training room doorway, late 1990s college basketball mood. Anime cel-shaded 2.5D game art, clean ink outlines, warm daylight, readable props, personal coming-of-age feeling, no official school marks, no photorealism.
```

### Oakland We Believe Prompt

```text
Oakland We Believe basketball district for a Baron Davis tiny round-world game. Curved planet road leads into an arena bowl, industrial Bay Area supports, transit station, bridge hint, yellow-blue fan towels, ticket stubs, playoff night energy, loud crowd as stylized NPC shapes, mythic underdog feeling. Premium anime cel-shaded 2.5D browser game art, ink outlines, soft shadows, dense props, no official NBA logos, no exact jersey marks, no photorealism.
```

### Investor Tower Prompt

```text
SF or NY investor tower district for Baron Davis as creator, investor, and AI storytelling connector. Sleek warm tower attached to the same tiny round planet, rooftop basketball court, glass pitch room, screens showing animated worlds and sports tech, founder desks, city skyline, cultural leadership energy, premium but human. Anime cel-shaded 2.5D browser game art, clean ink outlines, soft shadows, refined details, no corporate logos, no photorealism.
```

### Child Baron Avatar Prompt

```text
Child basketball prodigy avatar for a premium anime cel-shaded tiny round-world browser game, inspired by Baron Davis as a young Los Angeles hooper but not photoreal. Small playable third-person character, expressive confident posture, cool 1990s hoop clothes, short braids or period-appropriate hair option, sneakers, backpack option, basketball accessory. Create a turnaround and simple walk-cycle frames: idle, walk front, walk back, walk side, run, interact. Clean ink outlines, transparent background, readable at small size, no official logos.
```

### Prop Sheet Prompt

```text
Prop sheet for a Baron Davis tiny round-world browser game. Include chain-link fence segment, street sign, basketball hoop, worn shoes, basketball, corner store sign, palm tree, power line pole, bus stop, ticket booth, arena banner, VHS tape, recruiting letter, locker, campus bench, yellow fan towel, ticket stub, transit sign, rooftop court hoop, pitch room screen, briefcase, story seed object. Anime cel-shaded 2.5D game assets, clean ink outlines, transparent background, consistent palette, no official logos.
```

## Meshy or 3D Conversion Pipeline

Use Meshy after Scenario key art is approved.

Best use cases:

- Convert selected props to GLB.
- Generate low-poly buildings or terrain chunks.
- Retexture or remesh assets to match the style.
- Produce simplified objects for Three.js, then apply custom toon materials.

Do not start with Meshy for final style. Lock the visual language first.

Expected outputs:

```text
/Users/jackmorello/Desktop/Jobs/player_world_formatter/assets/models/
  child_baron.glb
  court_hoop.glb
  chainlink_fence.glb
  corner_store.glb
  lowrise_apartment.glb
  arena_plaza.glb
  campus_steps.glb
  oakland_arena.glb
  investor_tower.glb
```

## Three.js Rebuild Plan

Replace the canvas visual layer with a Three.js scene.

Recommended architecture:

- `src/main.js`: app boot, render loop, asset loading.
- `src/world/planet.js`: curved planet terrain, local-up math, district placement.
- `src/world/pathGraph.js`: walkable graph around the sphere.
- `src/player/controller.js`: click-hold, WASD, arrows, path following.
- `src/player/avatar.js`: child Baron model or sprite animation.
- `src/camera/followCamera.js`: smooth third-person spherical camera.
- `src/ui/hud.js`: minimal story UI.
- `src/data/baronWorld.js`: zones, missions, story unlocks, asset references.

Core technical requirements:

- Use Three.js.
- Use a small sphere or deformed rounded planet mesh.
- Place zones using spherical coordinates.
- Player has position on sphere surface plus local up vector.
- Character rotates to align with the planet normal.
- Camera follows behind and above, smoothing position and look-at.
- Click or hold on the world raycasts to a walkable target.
- Keyboard input moves along the tangent plane.
- World road network loops around the sphere so the user can circle back.
- Use toon shading and outline pass or duplicated backface outline meshes.
- Use compressed textures and GLB assets.
- Use instancing for repeated props.
- Keep UI lightweight.

The current `app.js` already has useful concepts:

- Zones array.
- Props array.
- Player angle and lat.
- Click and hold target movement.
- Keyboard input.
- HUD prompts.

Preserve the data thinking, replace the rendering and movement math with real Three.js spherical navigation.

## Existing Project Files

```text
/Users/jackmorello/Desktop/Jobs/player_world_formatter/
  README.md
  EVIDENCE.md
  player_world_formatter.py
  players/baron_davis.json
  outputs/baron_davis_world.md
  schema/player_world.schema.json
  templates/player_world_intake_form.md
  templates/player_world_intake_template.json
  index.html
  styles.css
  app.js
  assets/
  proofs/
```

Existing generated assets:

```text
assets/little-baron-sprite.png
assets/little-baron-source.png
assets/baron-world-empty.png
assets/baron-dream-world.png
assets/baron-dream-world-webgl.jpg
assets/sketch-south-central.png
assets/sketch-staples-clippers.png
assets/sketch-crossroads-ucla.png
assets/sketch-oakland-warriors.png
assets/sketch-investor-tower.png
assets/anime-connected-world-board.png
```

Do not treat these as the final art style. Some may be useful as mood or proof that the user liked the young Baron emotional direction, especially `baron-dream-world.png`.

## Existing Evidence

The most important local evidence file is:

```text
/Users/jackmorello/Desktop/Jobs/player_world_formatter/EVIDENCE.md
```

Important Baron sources already captured:

- UCLA Athletics profile: https://uclabruins.com/sports/1999/6/21/207910475
- NBA stats profile: https://www.nba.com/stats/player/1884/career
- NBA Players Only bio: https://www.nba.com/news/players-only-baron-davis-tnt
- Los Angeles Sentinel profile: https://lasentinel.net/socal-legends-baron-davis.html
- BaronDavis.com: https://barondavis.com/
- BRIC profile: https://www.bricfoundation.org/profile/baron-davis
- U.S. Chamber Business of Sports interview: https://www.uschamber.com/sports-and-entertainment/business-of-sports-how-an-nba-star-pivoted-to-entrepreneurship
- A16Z Cultural Leadership Fund: https://a16z.com/clf/
- A16Z CLF LinkedIn post: https://www.linkedin.com/posts/a16z-cultural-leadership-fund_what-is-baron-davis-most-excited-about-with-activity-7343372351985631233-fV9-

Confidence note:

- 85th Street and Avalon Boulevard is from the user's brief. The local evidence currently supports South Central childhood but marks exact block details as confirmation pending.

## Acceptance Criteria

The next proof should pass these checks before showing it as a serious Baron-facing candidate:

- The first screen is a playable world, not an information page.
- The round world curvature is obvious within two seconds.
- The user can move with click-hold, WASD, and arrow keys.
- The player avatar visibly walks or runs.
- The five districts are connected on one physical planet.
- South Central reads as South Central LA.
- Downtown LA, UCLA/Crossroads, Oakland, and investor tower are visually distinct but stylistically cohesive.
- The art looks like a premium anime/cel-shaded browser game.
- The user can see enough detail to imagine sponsorship and fan retention.
- No official team marks appear unless licensed.
- The build runs locally at `http://127.0.0.1:4173` or a clearly stated dev-server URL.
- Screenshots are taken across desktop and mobile before final delivery.

## Immediate Next Moves

1. Confirm whether the current Scenario browser session is logged in.
2. If logged in, create the Scenario style bible assets using the prompts above.
3. Save/export assets to `assets/scenario/`.
4. Pick the strongest single round-world key art and show it to the user first.
5. Only after visual approval, begin the Three.js rebuild.
6. Reuse the existing local data and evidence.
7. Keep the old canvas prototype available as reference for controls, but do not show it as final art.

## Short Answer For The User

Yes, Codex can run Scenario if the user is logged in or provides API credentials. The right workflow is Scenario for art cohesion, Meshy for selected 3D conversion after approval, then Three.js for a real curved playable world.
