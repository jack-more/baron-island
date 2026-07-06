# Player World Formatter

This toolkit turns an NBA player's life, career, culture, and interview material into a reusable metaverse world spec.

It is built for Baron Davis to use with NBA friends.

## What It Produces

- Evidence pack with links
- Player world thesis
- Six to eight era zones
- One simple mission per zone
- Story unlock prompts for Baron interviews
- Outfit unlocks and culture signals
- Rights-light prototype rules
- Licensed upgrade notes
- One-shot WebGL build prompt
- Data gaps to confirm with the player


## BART OATMEAL — playable build (July 2026)

**Live site:** https://jack-more.github.io/baron-island/ (GitHub Pages from `main` on `jack-more/baron-island`)

The browser build at the repo root is **BART OATMEAL** (Baron Davis's alter-ego
world): a Wii Sports Resort-style island flyover. You pilot (or watch autopilot fly) a seaplane over an island built
from Baron's life; gold rings over each landmark open sponsored mini-games that
unlock his interview prompts. Earlier prototypes are parked in `legacy/` — do not
extend them.

Run it:

```bash
cd /Users/jackmorello/Desktop/Jobs/player_world_formatter
python3 -m http.server 4173 --bind 127.0.0.1
# open http://127.0.0.1:4173
# after editing src/, hard-reload (Cmd+Shift+R) — the browser heuristically caches modules
```

Highlights:

- Semi-ambient attract mode: no input → the plane tours the island on autopilot
- Bank-to-turn flight (drag / WASD / arrows, shift to boost), no fail states
- Five landmarks, five sponsored mini-games, five interview-prompt unlocks
- Pop-balloons, sponsor blimp, sailboats, gulls, synthesized ambient audio
- Progress persists in localStorage; `baronWorld.reset()` in the console clears it

See `BARON_DAVIS_WORLD_PASSOFF.md` for the feel bar and architecture.

## Files

- `EVIDENCE.md`: research basis and product laws
- `player_world_formatter.py`: markdown generator
- `schema/player_world.schema.json`: expected data structure
- `templates/player_world_intake_template.json`: blank intake form for any player
- `templates/player_world_intake_form.md`: human-facing interview form
- `players/baron_davis.json`: filled Baron Davis example
- `outputs/baron_davis_world.md`: generated Baron spec
- `BARON_DAVIS_WORLD_PASSOFF.md`: best current handoff for restarting execution cleanly
- `NEW_CONVERSATION_HANDOFF.md`: complete passoff for restarting the Baron world build in a fresh Codex conversation

## Usage

From this folder:

```bash
python3 player_world_formatter.py players/baron_davis.json --out outputs/baron_davis_world.md
```

For the next player:

```bash
cp templates/player_world_intake_template.json players/new_player.json
python3 player_world_formatter.py players/new_player.json --out outputs/new_player_world.md
```

## Intake Workflow

1. Gather evidence from official bios, team pages, player interviews, local sources, archival clips, and trusted media.
2. Fill the evidence array first.
3. Build six to eight zones from the player's life and career.
4. Add one mission and one story unlock prompt per zone.
5. Mark anything personal, geographic, or emotional as confirmation needed until the player validates it.
6. Generate the spec.
7. Use the generated story unlock prompts in Baron's interview.
8. Regenerate with confirmed player stories.

## Core Rule

Evidence comes first. The formatter can be imaginative only after it knows what it is anchored to.
