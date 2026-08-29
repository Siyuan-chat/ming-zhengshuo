from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .data_loader import load_eras, load_orthodoxy_profile
from .numerals import int_to_cn
from .parser import ParseError, parse


class MingZhengshuoError(Exception):
    """Base class for user-facing conversion errors."""


@dataclass(frozen=True)
class AmbiguousEraError(MingZhengshuoError):
    era_name: str
    era_year: int
    candidates: list[dict[str, Any]]

    def __str__(self) -> str:
        lines = ["该年号存在多个候选："]
        year = int_to_cn(self.era_year)
        for index, era in enumerate(self.candidates, start=1):
            lines.append(
                f"{index}. {_display_polity(era['polity'])}{self.era_name}{year}年"
            )
        if self.candidates:
            example = (
                f"{_display_polity(self.candidates[0]['polity'])}"
                f"{self.era_name}{year}年"
            )
            lines.append(f"请指定政权，例如：{example}")
        return "\n".join(lines)


@dataclass(frozen=True)
class EraYearOutOfRangeError(MingZhengshuoError):
    era: dict[str, Any]
    era_year: int

    def __str__(self) -> str:
        max_year = self.era["max_year"]
        return (
            f"错误：{self.era['name']}年号没有第{int_to_cn(self.era_year)}年。"
            f"{self.era['name']}年号范围为{self.era['name']}元年至"
            f"{self.era['name']}{int_to_cn(max_year)}年。"
        )


@dataclass(frozen=True)
class UnknownEraError(MingZhengshuoError):
    era_name: str
    polity_hint: str | None = None

    def __str__(self) -> str:
        if self.polity_hint:
            return f"错误：未找到“{self.polity_hint}{self.era_name}”对应的年号数据。"
        return f"错误：未找到“{self.era_name}”对应的年号数据。"


@dataclass(frozen=True)
class NoOrthodoxSegmentError(MingZhengshuoError):
    western_year: int
    profile: str

    def __str__(self) -> str:
        return f"错误：正统线“{self.profile}”没有覆盖公元{self.western_year}年。"


@dataclass(frozen=True)
class NoTargetEraError(MingZhengshuoError):
    western_year: int
    target: str

    def __str__(self) -> str:
        return f"错误：公元{self.western_year}年没有匹配目标“{self.target}”的年号数据。"


def convert(text: str, profile: str = "default") -> str:
    try:
        return convert_structured(text, profile=profile)["output"]
    except (MingZhengshuoError, ParseError, ValueError) as exc:
        return str(exc)


def convert_structured(text: str, profile: str = "default") -> dict[str, Any]:
    parsed = parse(text)
    era = resolve_era(
        parsed["era_name"],
        parsed["era_year"],
        polity_hint=parsed["polity_hint"],
    )
    western_year = source_era_to_western_year(
        era["name"],
        parsed["era_year"],
        polity_hint=parsed["polity_hint"],
    )
    rest = parsed["rest"]
    source_text = _format_source(era, parsed["era_year"], rest)
    orthodox = western_to_orthodox_structured(western_year, rest=rest, profile=profile)

    if orthodox["mode"] == "gregorian":
        output = f"{source_text} = {orthodox['text']}"
    else:
        output = f"{source_text} = 公元{western_year}年 = {orthodox['text']}"

    return {
        "input": text,
        "source": {
            "polity": _display_polity(era["polity"]),
            "era": era["name"],
            "era_year": parsed["era_year"],
            "rest": rest,
        },
        "western_year": western_year,
        "orthodox": {
            "polity": orthodox["polity"],
            "era": orthodox["era"],
            "era_year": orthodox["era_year"],
            "mode": orthodox["mode"],
        },
        "output": output,
    }


def interchange(
    text: str,
    target: str = "all",
    profile: str = "default",
    calendar_mode: str = "preserve",
) -> str:
    """Convert either a Gregorian year or an era year to a selected target."""
    try:
        return interchange_structured(
            text,
            target=target,
            profile=profile,
            calendar_mode=calendar_mode,
        )["output"]
    except (MingZhengshuoError, ParseError, ValueError) as exc:
        return str(exc)


def interchange_structured(
    text: str,
    target: str = "all",
    profile: str = "default",
    calendar_mode: str = "preserve",
) -> dict[str, Any]:
    if calendar_mode != "preserve":
        raise MingZhengshuoError(
            f"错误：历法模式“{calendar_mode}”尚未实现；当前仅支持 preserve（月日原样保留）。"
        )
    source = _parse_interchange_source(text)
    western_year = source["western_year"]
    rest = source["rest"]
    normalized_target = target.strip()

    if normalized_target in {"gregorian", "ce", "公元", "西历", "西曆", "西暦"}:
        targets = [_gregorian_result(western_year, rest)]
        target_kind = "gregorian"
    elif normalized_target in {"orthodox", "正朔", "default"}:
        targets = [western_to_orthodox_structured(western_year, rest, profile)]
        target_kind = "orthodox"
    else:
        targets = western_to_eras_structured(western_year, target=normalized_target)
        if not targets:
            raise NoTargetEraError(western_year, normalized_target)
        for item in targets:
            item["text"] = f"{item['text']}{rest}"
        target_kind = "eras"

    parts = [source["text"]]
    gregorian_text = f"公元{western_year}年{rest}"
    if source["kind"] != "gregorian" and target_kind != "gregorian":
        parts.append(gregorian_text)
    for item in targets:
        if item["text"] not in parts:
            parts.append(item["text"])

    return {
        "input": text,
        "source": source,
        "western_year": western_year,
        "target": normalized_target,
        "matches": targets,
        "calendar": {
            "mode": calendar_mode,
            "source_calendar": source.get("calendar", "gregorian"),
            "target_calendars": sorted(
                {
                    item.get("calendar", "rule_based_or_gregorian")
                    for item in targets
                }
            ),
            "precision": "year",
            "day_conversion_applied": False,
            "preserved_text": rest,
            "note": "月日原样保留，尚未进行阴阳历、儒略历或格里历之间的换算。",
        },
        "output": " = ".join(parts),
    }


def western_to_eras_structured(
    western_year: int,
    target: str = "all",
) -> list[dict[str, Any]]:
    """Return every matching era for a Gregorian year and target selector."""
    matches: list[dict[str, Any]] = []
    for era in load_eras():
        if not _target_matches_era(target, era):
            continue
        start_year = int(era["start_year"])
        end_year = _era_end_year(era)
        if western_year < start_year or (end_year is not None and western_year >= end_year):
            continue
        era_year = western_year - start_year + 1
        matches.append(
            {
                "id": era["id"],
                "polity": era["polity"],
                "region": era.get("region"),
                "era": era["name"],
                "era_year": era_year,
                "calendar": era.get("calendar"),
                "text": _format_source(era, era_year, ""),
            }
        )
    return sorted(
        matches,
        key=lambda item: (
            {"china": 0, "japan": 1, "korea": 2}.get(item.get("region"), 9),
            item["polity"],
            item["era"],
        ),
    )


def source_era_to_western_year(
    era_name: str,
    era_year: int,
    polity_hint: str | None = None,
) -> int:
    era = resolve_era(era_name, era_year, polity_hint=polity_hint)
    return int(era["start_year"]) + era_year - 1


def resolve_era(
    era_name: str,
    era_year: int,
    polity_hint: str | None = None,
) -> dict[str, Any]:
    candidates = [
        era
        for era in load_eras()
        if era_name == era["name"] or era_name in era.get("aliases", [])
    ]
    if polity_hint:
        candidates = [era for era in candidates if _hint_matches_era(polity_hint, era)]

    if not candidates:
        raise UnknownEraError(era_name, polity_hint=polity_hint)
    if len(candidates) > 1:
        raise AmbiguousEraError(era_name, era_year, candidates)

    era = candidates[0]
    max_year = era.get("max_year")
    if era_year < 1:
        raise MingZhengshuoError(f"错误：{era['name']}年号年份必须大于零。")
    if max_year is not None and era_year > int(max_year):
        raise EraYearOutOfRangeError(era, era_year)
    return era


def find_orthodox_segment(western_year: int, profile: str = "default") -> dict[str, Any]:
    for segment in load_orthodoxy_profile(profile):
        end_year = segment.get("end_year")
        if western_year >= int(segment["start_year"]) and (
            end_year is None or western_year < int(end_year)
        ):
            return segment
    raise NoOrthodoxSegmentError(western_year, profile)


def western_to_orthodox(
    western_year: int,
    rest: str = "",
    profile: str = "default",
) -> str:
    return western_to_orthodox_structured(western_year, rest=rest, profile=profile)["text"]


def western_to_orthodox_structured(
    western_year: int,
    rest: str = "",
    profile: str = "default",
) -> dict[str, Any]:
    segment = find_orthodox_segment(western_year, profile=profile)
    mode = segment["mode"]

    if mode == "continuous_era":
        era_year = western_year - int(segment["base_year"]) + 1
        era = segment["base_era"]
        prefix = _dynastic_prefix(era, segment["target_polity"])
        return {
            "polity": segment["target_polity"],
            "era": era,
            "era_year": era_year,
            "mode": mode,
            "text": f"{prefix}{era}{int_to_cn(era_year)}年{rest}",
        }

    if mode == "minguo":
        era_year = western_year - 1911
        return {
            "polity": segment["target_polity"],
            "era": "民国",
            "era_year": era_year,
            "mode": mode,
            "text": f"民国{int_to_cn(era_year)}年{rest}",
        }

    if mode == "gregorian":
        return {
            "polity": segment["target_polity"],
            "era": "公元",
            "era_year": western_year,
            "mode": mode,
            "text": f"公元{western_year}年{rest}",
        }

    if mode == "official_era":
        prefix = _official_prefix(segment["target_polity"])
        official = _find_official_era(western_year, segment["target_polity"])
        if official:
            era_year = western_year - int(official["start_year"]) + 1
            return {
                "polity": segment["target_polity"],
                "era": official["name"],
                "era_year": era_year,
                "mode": mode,
                "text": (
                    f"{prefix}{official['name']}"
                    f"{int_to_cn(era_year)}年{rest}"
                ),
            }
        return {
            "polity": segment["target_polity"],
            "era": "正朔待补",
            "era_year": western_year,
            "mode": mode,
            "text": f"{prefix}正朔待补（公元{western_year}年{rest}）",
        }

    raise MingZhengshuoError(f"错误：暂不支持正统线模式“{mode}”。")


def _format_source(era: dict[str, Any], era_year: int, rest: str) -> str:
    return f"{_display_polity(era['polity'])}{era['name']}{int_to_cn(era_year)}年{rest}"


def _parse_interchange_source(text: str) -> dict[str, Any]:
    import re

    cleaned = "".join(text.strip().split())
    match = re.match(r"^(?:公元|西历|西曆|西暦|CE)?(?P<year>\d{1,4})年(?P<rest>.*)$", cleaned)
    if match:
        western_year = int(match.group("year"))
        if western_year < 1:
            raise MingZhengshuoError("错误：公元年份必须大于零。")
        rest = match.group("rest")
        return {
            "kind": "gregorian",
            "text": f"公元{western_year}年{rest}",
            "western_year": western_year,
            "rest": rest,
        }

    parsed = parse(text)
    era = resolve_era(
        parsed["era_name"],
        parsed["era_year"],
        polity_hint=parsed["polity_hint"],
    )
    western_year = int(era["start_year"]) + parsed["era_year"] - 1
    return {
        "kind": "era",
        "text": _format_source(era, parsed["era_year"], parsed["rest"]),
        "western_year": western_year,
        "rest": parsed["rest"],
        "polity": era["polity"],
        "era": era["name"],
        "era_year": parsed["era_year"],
        "calendar": era.get("calendar"),
    }


def _gregorian_result(western_year: int, rest: str) -> dict[str, Any]:
    return {
        "polity": "公元",
        "era": "公元",
        "era_year": western_year,
        "mode": "gregorian",
        "calendar": "gregorian",
        "text": f"公元{western_year}年{rest}",
    }


def _era_end_year(era: dict[str, Any]) -> int | None:
    if era.get("end_year") is not None:
        return int(era["end_year"])
    if era.get("max_year") is not None:
        return int(era["start_year"]) + int(era["max_year"])
    return None


def _target_matches_era(target: str, era: dict[str, Any]) -> bool:
    normalized = target.strip().lower()
    if normalized in {"", "all", "全部", "すべて"}:
        return True

    region_aliases = {
        "china": {"china", "chinese", "中国", "中國"},
        "japan": {"japan", "japanese", "日本"},
        "korea": {"korea", "korean", "朝鲜", "朝鮮", "韩国", "韓國"},
    }
    for region, aliases in region_aliases.items():
        if normalized in {alias.lower() for alias in aliases}:
            return era.get("region") == region

    labels = {
        era["name"],
        era["polity"],
        _display_polity(era["polity"]),
        *era.get("aliases", []),
        *era.get("polity_aliases", []),
    }
    return normalized in {label.lower() for label in labels}


def _hint_matches_era(polity_hint: str, era: dict[str, Any]) -> bool:
    hint = polity_hint.strip()
    if hint == era["polity"]:
        return True
    if hint == "南朝":
        return era["polity"] == "日本南朝" or hint in era.get(
            "polity_aliases", []
        )
    if hint == "北朝":
        return era["polity"] == "日本北朝" or hint in era.get(
            "polity_aliases", []
        )
    region = era.get("region")
    if hint in {"日本", "倭"}:
        return region == "japan" or era["polity"] == "日本"
    if hint in {"朝鲜", "韩国", "大韩", "大韩帝国"}:
        return region == "korea" or era["polity"] in {"朝鲜", "大韩帝国"}
    if hint in {"清", "清朝", "中国"}:
        return era["polity"] == "清"
    return hint in era.get("polity_aliases", [])


def _dynastic_prefix(era_name: str, target_polity: str) -> str:
    if era_name == "永历":
        return "大明"
    if era_name == "祥兴":
        return "宋"
    return _display_polity(target_polity)


def _official_prefix(target_polity: str) -> str:
    if target_polity in {"明", "南明"}:
        return "大明"
    if target_polity in {"北宋", "南宋"}:
        return "宋"
    return _display_polity(target_polity)


def _display_polity(polity: str) -> str:
    names = {
        "西晋": "晋",
        "东晋": "晋",
        "刘宋": "宋",
        "北宋": "宋",
        "南宋": "宋",
        "南齐": "齐",
        "南梁": "梁",
        "南陈": "陈",
    }
    return names.get(polity, polity)


def _find_official_era(
    western_year: int,
    target_polity: str,
) -> dict[str, Any] | None:
    for era in load_eras():
        if era["polity"] != target_polity:
            continue
        max_year = era.get("max_year")
        end_year = era.get("end_year")
        if end_year is None and max_year is not None:
            end_year = int(era["start_year"]) + int(max_year)
        if end_year is None:
            if western_year >= int(era["start_year"]):
                return era
        elif int(era["start_year"]) <= western_year < int(end_year):
            return era
    return None
