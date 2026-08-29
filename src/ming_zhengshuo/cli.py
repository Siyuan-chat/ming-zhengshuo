from __future__ import annotations

import argparse
import json

from .converter import convert, interchange, interchange_structured


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="ming-zhengshuo",
        description="将东亚历史年号转换为默认正统线纪年。",
    )
    parser.add_argument("text", help="待转换文本，例如：同治五年三月初八")
    parser.add_argument(
        "--profile",
        default="default",
        help="正统线 profile 名称，当前默认为 default。",
    )
    parser.add_argument(
        "--to",
        dest="target",
        help="互换目标：gregorian、orthodox、all、china、japan、korea、政权或年号。",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="以 JSON 输出结构化互换结果（需配合 --to）。",
    )
    parser.add_argument(
        "--calendar",
        default="preserve",
        help="历法模式预留接口；当前仅支持 preserve（月日原样保留）。",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.target:
        if args.json:
            result = interchange_structured(
                args.text,
                target=args.target,
                profile=args.profile,
                calendar_mode=args.calendar,
            )
            print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            print(
                interchange(
                    args.text,
                    target=args.target,
                    profile=args.profile,
                    calendar_mode=args.calendar,
                )
            )
    else:
        print(convert(args.text, profile=args.profile))
    return 0
