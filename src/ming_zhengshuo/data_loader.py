from __future__ import annotations

import json
from functools import lru_cache
from importlib import resources
from typing import Any


@lru_cache(maxsize=1)
def load_eras() -> list[dict[str, Any]]:
    return _load_json("eras.json")


@lru_cache(maxsize=1)
def load_orthodoxy_profiles() -> dict[str, list[dict[str, Any]]]:
    return _load_json("orthodoxy_profiles.json")


def load_orthodoxy_profile(profile: str = "default") -> list[dict[str, Any]]:
    profiles = load_orthodoxy_profiles()
    if profile not in profiles:
        available = "、".join(sorted(profiles))
        raise ValueError(f"未知正统线 profile：{profile}。可选：{available}")
    return profiles[profile]


def _load_json(name: str) -> Any:
    data_path = resources.files(__package__).joinpath("data", name)
    return json.loads(data_path.read_text(encoding="utf-8"))
