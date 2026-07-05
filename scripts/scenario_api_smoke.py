#!/usr/bin/env python3
"""Smoke-test Scenario SDK access without running a paid generation."""

from __future__ import annotations

import os
import sys
from typing import Any

from scenario_sdk import Scenario


def mask(value: str | None) -> str:
    if not value:
        return "missing"
    if len(value) <= 8:
        return "set"
    return f"{value[:4]}...{value[-4:]}"


def model_to_dict(model: Any) -> dict[str, Any]:
    if hasattr(model, "model_dump"):
        return model.model_dump(by_alias=True)
    if isinstance(model, dict):
        return model
    return {"repr": repr(model)}


def main() -> int:
    api_key = os.environ.get("SCENARIO_SDK_API_KEY")
    api_secret = os.environ.get("SCENARIO_SDK_API_SECRET")
    bearer_auth = os.environ.get("SCENARIO_SDK_JWT")

    print("Scenario SDK credential check")
    print(f"SCENARIO_SDK_API_KEY={mask(api_key)}")
    print(f"SCENARIO_SDK_API_SECRET={mask(api_secret)}")
    print(f"SCENARIO_SDK_JWT={mask(bearer_auth)}")

    if not ((api_key and api_secret) or bearer_auth):
        print()
        print("Missing credentials. Set SCENARIO_SDK_API_KEY and SCENARIO_SDK_API_SECRET first.")
        return 2

    client = Scenario()

    print()
    print("Listing private trained models, page size 10...")
    models = client.models.list(privacy="private", status="trained", page_size=10)

    count = 0
    for model in models:
        data = model_to_dict(model)
        count += 1
        print()
        print(f"{count}. {data.get('name') or data.get('id') or data.get('modelId')}")
        print(f"   id: {data.get('id') or data.get('modelId')}")
        print(f"   type: {data.get('type')}")
        print(f"   status: {data.get('status')}")
        print(f"   description: {(data.get('shortDescription') or data.get('short_description') or '')[:180]}")
        if count >= 10:
            break

    if count == 0:
        print("No trained private models returned. Try public model listing or create/select a model in Scenario.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
