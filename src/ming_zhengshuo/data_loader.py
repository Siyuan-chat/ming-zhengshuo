from __future__ import annotations

import json
from functools import lru_cache
from importlib import resources
from typing import Any


@lru_cache(maxsize=1)
def load_eras() -> list[dict[str, Any]]:
    eras = _load_json("eras.json")
    historical_rows = _load_json("japanese_historical_eras.json")
    for index, row in enumerate(historical_rows, start=1):
        name, start_year, max_year, aliases, *court = row
        court_name = court[0] if court else None
        polity = f"日本{court_name}朝" if court_name in {"北", "南"} else "日本"
        eras.append(
            {
                "id": f"japan_historical_{index:03d}",
                "name": name,
                "polity": polity,
                "region": "japan",
                "start_year": start_year,
                "max_year": max_year,
                "aliases": aliases,
                "polity_aliases": (
                    ["日本北朝", "北朝", "日本南朝", "南朝"]
                    if court_name == "共"
                    else []
                ),
                "calendar": "japanese_lunisolar",
            }
        )
    medieval_rows = _load_json("sui_tang_five_dynasties_eras.json")
    for index, row in enumerate(medieval_rows, start=1):
        name, polity, start_year, max_year, aliases = row
        traditional_polity = polity.replace("后", "後")
        eras.append(
            {
                "id": f"china_medieval_{index:03d}",
                "name": name,
                "polity": polity,
                "region": "china",
                "start_year": start_year,
                "max_year": max_year,
                "aliases": aliases,
                "polity_aliases": [
                    f"{polity}朝",
                    traditional_polity,
                    f"{traditional_polity}朝",
                ],
                "calendar": "chinese_lunisolar",
            }
        )
    return eras


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
