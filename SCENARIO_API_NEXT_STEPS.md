# Scenario API Next Steps

Google login is stalling in the in-app browser. Use the API route instead.

## What To Do In Your Normal Browser

1. Open Scenario in your normal browser where login works.
2. Go to your account, team, developer, or API settings.
3. Create an API key and API secret for the Baron project/team.
4. Do not paste the secret into chat.
5. In this project terminal, set:

```bash
cd /Users/jackmorello/Desktop/Jobs/player_world_formatter
export SCENARIO_SDK_API_KEY="your_key_here"
export SCENARIO_SDK_API_SECRET="your_secret_here"
```

Then tell Codex the variables are set.

## Smoke Test

Run:

```bash
.venv/bin/python scripts/scenario_api_smoke.py
```

This only lists private trained models. It does not run a paid generation.

## Inspect A Model

After choosing a model:

```bash
export SCENARIO_MODEL_ID="model_..."
.venv/bin/python scripts/scenario_model_inputs.py
```

The output shows which input fields the generation body needs.

## First Asset To Generate

Use the round-world key art first:

```text
A cohesive tiny spherical walkable planet for Baron Davis as a child manifesting his future. The planet has connected neighborhoods on one curved surface: South Central Los Angeles court and low-rise housing under blue LA sky, downtown LA arena plaza inspired by the Clippers era, Crossroads and UCLA Westside school and campus, Oakland We Believe arena district with yellow-blue fan energy, and a sleek SF or NY investor tower with rooftop court and AI story studio. Premium anime cel-shaded 2.5D browser game art, hand-painted texture, clean ink outlines, soft shadows, dense readable props, warm and personal, round-world curvature visible, third-person gameplay perspective, no official NBA logos, no photorealism.
```

Save outputs under:

```text
/Users/jackmorello/Desktop/Jobs/player_world_formatter/assets/scenario/
```
