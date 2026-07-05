#!/usr/bin/env python3
"""Generate evidence-backed player-world specs from structured player data."""

from __future__ import annotations

import argparse
import json
import re
import textwrap
from pathlib import Path
from typing import Any


def slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "_", value.strip().lower())
    return cleaned.strip("_") or "player_world"


def md_list(items: list[str]) -> str:
    return "\n".join(f"- {item}" for item in items)


def wrap(value: str, width: int = 92) -> str:
    return textwrap.fill(value, width=width)


def evidence_index(evidence: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {item["id"]: item for item in evidence}


def evidence_refs(ids: list[str], index: dict[str, dict[str, Any]]) -> str:
    refs = []
    for item_id in ids:
        item = index.get(item_id)
        if item:
            refs.append(f"[{item_id}]({item['url']})")
    return ", ".join(refs)


def zone_block(zone: dict[str, Any], index: dict[str, dict[str, Any]], number: int) -> str:
    parts = [
        f"### {number}. {zone['title']}",
        "",
        f"**Era Role:** {zone['era_role']}",
        "",
        "**Evidence:** " + evidence_refs(zone.get("evidence_ids", []), index),
        "",
        "**Visual World:**",
        md_list(zone.get("visuals", [])),
        "",
        "**Zeitgeist Signals:**",
        md_list(zone.get("zeitgeist", [])),
        "",
        "**Young Fan Feeling:**",
        wrap(zone["fan_feeling"]),
        "",
        f"**Mission:** {zone['mission']['name']}",
        wrap(zone["mission"]["description"]),
        "",
        "**Story Unlock Prompt:**",
        wrap(zone["story_unlock_prompt"]),
        "",
        "**Outfit Unlocks:**",
        md_list(zone.get("outfits", [])),
    ]
    return "\n".join(parts)


def render_world(data: dict[str, Any]) -> str:
    index = evidence_index(data.get("evidence", []))
    player = data["player"]
    system = data["system"]
    zones = data["zones"]
    output = []

    output.extend(
        [
            f"# {player['display_name']}: {system['title']}",
            "",
            f"**Formatter Version:** {data.get('formatter_version', '1.0')}",
            "",
            f"**Core Thesis:** {wrap(system['core_thesis'])}",
            "",
            f"**Audience Feeling:** {wrap(system['audience_feeling'])}",
            "",
            "## Evidence Pack",
            "",
        ]
    )

    for item in data.get("evidence", []):
        output.extend(
            [
                f"### {item['id']}: {item['claim']}",
                "",
                f"- Source: [{item['source_name']}]({item['url']})",
                f"- Use in world: {item['use']}",
                "",
            ]
        )

    output.extend(
        [
            "## Player World Architecture",
            "",
            f"**World Structure:** {system['world_structure']}",
            "",
            f"**Main Quest:** {system['main_quest']['name']}",
            wrap(system["main_quest"]["description"]),
            "",
            "**Interaction Rules:**",
            md_list(system.get("interaction_rules", [])),
            "",
            "**Social Rules:**",
            md_list(system.get("social_rules", [])),
            "",
            "**Rights-Light Prototype Rules:**",
            md_list(system.get("rights_light_rules", [])),
            "",
            "## Era Zones",
            "",
        ]
    )

    for number, zone in enumerate(zones, start=1):
        output.append(zone_block(zone, index, number))
        output.append("")

    output.extend(
        [
            "## Interview Capture Kit",
            "",
            "Use these questions in the player interview before generating the licensed world.",
            "",
            md_list(data.get("interview_questions", [])),
            "",
            "## Plug-and-Play Intake Fields",
            "",
            "For the next player, replace these fields first:",
            "",
            md_list(
                [
                    "Identity: player name, nicknames, hometown, player archetype, emotional thesis",
                    "Era zones: childhood, high school or college, breakthrough, signature NBA story, reinvention, current chapter",
                    "Culture signals: music mood, fashion, local places, media artifacts, fan behaviors, language, brands",
                    "Memory objects: shoes, tapes, letters, play cards, photos, studio notes, local objects",
                    "Missions: one simple delivery or retrieval action per zone",
                    "Story unlocks: player-only questions Baron can ask because of trust",
                    "Outfits: era-inspired fits and licensed jersey upgrades",
                    "Evidence: source URLs, source labels, confidence notes, and rights notes",
                ]
            ),
            "",
            "## One-Shot Build Prompt",
            "",
            render_prompt(data),
            "",
            "## Data Gaps To Confirm With Player",
            "",
            md_list(data.get("data_gaps", [])),
            "",
        ]
    )

    return "\n".join(output).replace("\n\n\n", "\n\n")


def render_prompt(data: dict[str, Any]) -> str:
    player = data["player"]
    system = data["system"]
    zone_names = ", ".join(zone["title"] for zone in data["zones"])
    missions = "; ".join(zone["mission"]["name"] for zone in data["zones"])
    prompt = f"""
Create a browser-based WebGL playable prototype called "{player['display_name']}: {system['title']}".

The experience is a compact spherical memory world inspired by Messenger by Abeto. Use click or tap movement, a smart follow camera, a calm checklist, light NPC dialogue, outfit customization, and social presence through 3D emoji only.

The world zones are: {zone_names}.

The main quest is "{system['main_quest']['name']}". The mission route is: {missions}.

The emotional target is: {system['audience_feeling']}

Keep the prototype rights-light until official assets are approved. Use inspired palettes, fictional marks, original audio beds, and era-evocative props. Once licensed, replace with official NBA, team, school, player voice, archival footage, and approved brand assets.

Make the result feel personal, smooth, and playable within the first minute. Prioritize animation feel, silhouette readability, warm lighting, localized sound, memory objects, and short first-person story unlocks.
"""
    return textwrap.dedent(prompt).strip()


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_output(content: str, out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(content + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate a player-world markdown spec.")
    parser.add_argument("player_json", type=Path, help="Path to player world JSON input.")
    parser.add_argument(
        "--out",
        type=Path,
        help="Output markdown path. Defaults to outputs/<player-slug>_world.md",
    )
    args = parser.parse_args()

    data = load_json(args.player_json)
    player_slug = slugify(data["player"]["display_name"])
    output_path = args.out or Path("outputs") / f"{player_slug}_world.md"
    write_output(render_world(data), output_path)
    print(f"Wrote {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
