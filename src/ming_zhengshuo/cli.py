from __future__ import annotations

import argparse

from .converter import convert


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
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    print(convert(args.text, profile=args.profile))
    return 0
