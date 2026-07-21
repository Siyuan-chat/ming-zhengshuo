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
            lines.append(f"{index}. {era['polity']}{self.era_name}{year}年")
        if self.candidates:
            example = f"{self.candidates[0]['polity']}{self.era_name}{year}年"
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
            "polity": era["polity"],
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
        official = _find_official_era(western_year, segment["target_polity"])
        if official:
            era_year = western_year - int(official["start_year"]) + 1
            return {
                "polity": segment["target_polity"],
                "era": official["name"],
                "era_year": era_year,
                "mode": mode,
                "text": (
                    f"{segment['target_polity']}{official['name']}"
                    f"{int_to_cn(era_year)}年{rest}"
                ),
            }
        return {
            "polity": segment["target_polity"],
            "era": "正朔待补",
            "era_year": western_year,
            "mode": mode,
            "text": f"{segment['target_polity']}正朔待补（公元{western_year}年{rest}）",
        }

    raise MingZhengshuoError(f"错误：暂不支持正统线模式“{mode}”。")


def _format_source(era: dict[str, Any], era_year: int, rest: str) -> str:
    return f"{era['polity']}{era['name']}{int_to_cn(era_year)}年{rest}"


def _hint_matches_era(polity_hint: str, era: dict[str, Any]) -> bool:
    hint = polity_hint.strip()
    if hint == era["polity"]:
        return True
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
        return "大宋"
    return target_polity


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
