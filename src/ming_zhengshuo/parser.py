from __future__ import annotations

import re
from typing import Any

from .data_loader import load_eras
from .numerals import cn_to_int


class ParseError(Exception):
    pass


YEAR_RE = re.compile(
    r"^(?P<year>\d+|元|[零〇一二两兩三四五六七八九十百千万萬廿卅]+)年(?P<rest>.*)$"
)

COMMON_POLITY_HINTS = [
    "大韩帝国",
    "清朝",
    "日本",
    "朝鲜",
    "韩国",
    "大韩",
    "中国",
    "清",
    "倭",
]


def parse(text: str, eras: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    cleaned = "".join(text.strip().split())
    if not cleaned:
        raise ParseError("错误：输入不能为空。")

    eras = eras or load_eras()
    matches: list[tuple[int, str | None, str, str]] = []

    for era in eras:
        labels = [era["name"], *era.get("aliases", [])]
        hints = _known_hints(eras)
        for label in labels:
            if cleaned.startswith(label):
                matches.append((len(label), None, label, cleaned[len(label) :]))
            for hint in hints:
                prefix = f"{hint}{label}"
                if cleaned.startswith(prefix):
                    matches.append((len(prefix), hint, label, cleaned[len(prefix) :]))

    if not matches:
        raise ParseError("错误：无法识别输入中的年号。")

    _, polity_hint, era_name, tail = sorted(matches, key=lambda item: item[0], reverse=True)[
        0
    ]
    year_match = YEAR_RE.match(tail)
    if not year_match:
        raise ParseError(f"错误：无法识别“{era_name}”后的年份。")

    return {
        "polity_hint": polity_hint,
        "era_name": era_name,
        "era_year": cn_to_int(year_match.group("year")),
        "rest": year_match.group("rest"),
    }


def _known_hints(eras: list[dict[str, Any]]) -> list[str]:
    hints = set(COMMON_POLITY_HINTS)
    for era in eras:
        hints.add(era["polity"])
        hints.update(era.get("polity_aliases", []))
    return sorted(hints, key=len, reverse=True)
