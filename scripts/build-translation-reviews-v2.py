#!/usr/bin/env python3
"""Generate per-guide review markdowns from data/translated-guides-v2.json.

Each markdown shows SV/EN/DE stacked blockquotes per field, so PO can
spot-check translations before import.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IN_PATH = ROOT / "data" / "translated-guides-v2.json"
OUT_DIR = ROOT / "data" / "translations-review"

FIELD_TITLES = [
    ("bio", "Bio"),
    ("specializations", "Specializations"),
    ("guideStyle", "Guide Style"),
    ("whatGuestsAppreciate", "What Guests Appreciate"),
    ("uniqueAspectsQuote", "Unique Aspects (Quote)"),
    ("uniqueAspectsBody", "Unique Aspects (Body)"),
]

LOCALE_LABELS = [("sv", "Swedish"), ("en", "English"), ("de", "German")]


def render_field_value(value):
    """Render string or list as blockquote markdown."""
    if isinstance(value, list):
        return "\n".join(f"> - {item}" for item in value)
    # Multi-paragraph string → blockquote each non-empty line, keep blank lines
    lines = value.split("\n")
    out = []
    for line in lines:
        if line.strip():
            out.append(f"> {line}")
        else:
            out.append(">")
    return "\n".join(out)


def build_markdown(guide: dict) -> str:
    lines = [f"# {guide['name']}", ""]
    lines.append(f"Slug: `{guide['slug']}`")
    lines.append("")
    lines.append(f"Languages: {'/'.join(guide['passThroughLanguages'])}")
    if guide.get("passThroughAdditionalLanguages"):
        lines.append(f"Additional: {'/'.join(guide['passThroughAdditionalLanguages'])}")
    lines.append("")

    for field_key, field_title in FIELD_TITLES:
        lines.append(f"## {field_title}")
        lines.append("")
        for locale_key, locale_label in LOCALE_LABELS:
            lines.append(f"**{locale_label}**")
            lines.append("")
            lines.append(render_field_value(guide[locale_key][field_key]))
            lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    guides = json.loads(IN_PATH.read_text(encoding="utf-8"))
    for g in guides:
        path = OUT_DIR / f"guide-v2-{g['slug']}.md"
        path.write_text(build_markdown(g), encoding="utf-8")
        print(f"  wrote {path.relative_to(ROOT)} ({len(path.read_text(encoding='utf-8'))} chars)")
    print(f"\n{len(guides)} review markdowns in {OUT_DIR.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
