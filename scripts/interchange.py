#!/usr/bin/env python3
"""Portable agent entrypoint for the Ming Zhengshuo repository."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = REPOSITORY_ROOT / "src"
sys.path.insert(0, str(SOURCE_ROOT))

from ming_zhengshuo import interchange, interchange_structured  # noqa: E402


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Bidirectionally interchange East Asian era and Gregorian years."
    )
    parser.add_argument("text", help="Era-year or Gregorian-year expression")
    parser.add_argument(
        "--to",
        default="all",
        help="gregorian, orthodox, all, china, japan, korea, polity, or era",
    )
    parser.add_argument(
        "--calendar",
        default="preserve",
        help="Calendar conversion mode; currently only preserve is implemented",
    )
    parser.add_argument("--profile", default="default", help="Orthodoxy profile")
    parser.add_argument("--json", action="store_true", help="Emit structured JSON")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.json:
        result = interchange_structured(
            args.text,
            target=args.to,
            profile=args.profile,
            calendar_mode=args.calendar,
        )
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(
            interchange(
                args.text,
                target=args.to,
                profile=args.profile,
                calendar_mode=args.calendar,
            )
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
