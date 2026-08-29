---
name: ming-zhengshuo
description: Bidirectionally interchange East Asian era years and Gregorian years for historical research, including Chinese, Japanese, Korean, parallel-court, and project-defined orthodoxy mappings. Use when an agent must identify, compare, normalize, or cross-convert historical era-year expressions; do not claim month/day calendar equivalence.
---

# Ming Zhengshuo

Use the repository's deterministic engine instead of calculating era offsets from memory.

## Interchange

Run from this skill directory:

```bash
python scripts/interchange.py "日本大化元年" --to gregorian --json
python scripts/interchange.py "公元645年" --to japan --json
python scripts/interchange.py "唐贞观十九年" --to japan --json
python scripts/interchange.py "公元1338年" --to all --json
```

Valid targets include `gregorian`, `orthodox`, `all`, `china`, `japan`, `korea`, a polity such as `南唐`, or a specific era name. Prefer JSON for agent workflows. Preserve ambiguity: when `all` returns concurrent eras, report the relevant alternatives rather than selecting one silently.

## Historical-research constraints

- Treat results as year-level normalization, not proof that two month/day expressions are the same civil day.
- The current `calendar_mode` is `preserve`: it keeps the input's trailing month/day text unchanged and returns `day_conversion_applied: false`.
- Do not describe preserved month/day text as converted between Chinese lunisolar, Japanese lunisolar, Julian, or Gregorian calendars.
- State the polity or court when an era name is ambiguous. For Japanese Nanboku-chō results, retain the Northern/Southern Court marker.
- Distinguish a requested regional lookup from the project-defined `orthodox` profile. The latter is an explicit historiographical rule set, not a universally accepted historical judgment.
- If the requested date falls outside the dataset, say so; do not invent an era.

## Programmatic API

Python callers can import `interchange`, `interchange_structured`, and `western_to_eras_structured` from `ming_zhengshuo`. The structured result includes source, Gregorian bridge year, all target matches, calendar metadata, and the human-readable output.

For supported datasets, source notes, installation, and multilingual usage, read [README.md](README.md).
