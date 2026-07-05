#!/usr/bin/env python3
"""Inspect a Scenario model's input schema before running generation."""

from __future__ import annotations

import json
import os
import sys
from typing import Any

from scenario_sdk import Scenario


def to_dict(value: Any) -> dict[str, Any]:
    if hasattr(value, "model_dump"):
        return value.model_dump(by_alias=True)
    if isinstance(value, dict):
        return value
    return {"repr": repr(value)}


def main() -> int:
    model_id = os.environ.get("SCENARIO_MODEL_ID") or (sys.argv[1] if len(sys.argv) > 1 else "")
    if not model_id:
        print("Usage: SCENARIO_MODEL_ID=model_... .venv/bin/python scripts/scenario_model_inputs.py")
        print("   or: .venv/bin/python scripts/scenario_model_inputs.py model_...")
        return 2

    client = Scenario()
    model = client.models.retrieve(model_id)
    data = to_dict(model)

    keep = {
        "id": data.get("id") or data.get("modelId"),
        "name": data.get("name"),
        "type": data.get("type"),
        "status": data.get("status"),
        "shortDescription": data.get("shortDescription") or data.get("short_description"),
        "inputs": data.get("inputs"),
        "uiConfig": data.get("uiConfig") or data.get("ui_config"),
        "parameters": data.get("parameters"),
    }

    print(json.dumps(keep, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
