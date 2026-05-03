#!/usr/bin/env python3
"""Parse v3 NEW guide DOCX profiles → structured Swedish JSON.

v3 adds 3 new guides on top of v2 (Anette Gustafsson, Leo Eriksson, Mats Quist).
The 12 v2 docx files are byte-identical in v3 → not re-parsed.

Re-uses v2 parsing helpers via importlib (filename has hyphens so plain import
won't work). Output mirrors v2 shape but adds `operatingAreasRaw` for downstream
city resolution.

Usage:
    ~/.claude/skills/.venv/Scripts/python.exe scripts/parse-guides-v3-docx.py
"""
from __future__ import annotations

import importlib.util
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCX_DIR = ROOT / "docx" / "Guides data v3"
OUT_PATH = ROOT / "data" / "guides-v3-sv.json"

# Filenames present in v3 but NOT in v2 (parse only these)
V3_NEW_FILES = [
    "Anette_Gustafsson_Guideprofil.docx",
    "Leo_Eriksson_Guideprofil.docx",
    "Mats_Quist_Guideprofil.docx",
]


def _load_v2_module():
    """Load parse-guides-v2-docx.py as a module despite hyphenated filename."""
    v2_path = Path(__file__).parent / "parse-guides-v2-docx.py"
    spec = importlib.util.spec_from_file_location("parse_guides_v2_docx", str(v2_path))
    if spec is None or spec.loader is None:
        raise ImportError(f"cannot load {v2_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def extract_operating_areas(raw_lang_line: str) -> list[str]:
    """Pull city names from prefix of 'Stockholm, Uppsala & Sigtuna · Svenska, …'.

    Returns raw display names (original casing), comma- or '&'-separated.
    """
    last = ""
    for sep in ("•", "·"):  # bullet, middle dot
        if sep in raw_lang_line:
            last, _, _ = raw_lang_line.rpartition(sep)
            break
    if not last:
        return []
    return [s.strip() for s in re.split(r"[,&]", last) if s.strip()]


def main() -> int:
    if not DOCX_DIR.is_dir():
        print(f"ERROR: source dir missing: {DOCX_DIR}", file=sys.stderr)
        return 1

    v2 = _load_v2_module()

    guides: list[dict] = []
    for filename in V3_NEW_FILES:
        path = DOCX_DIR / filename
        if not path.is_file():
            print(f"  [error] missing: {path}", file=sys.stderr)
            return 1
        print(f"Parsing {path.name} …")
        guide = v2.parse_guide_file(path)
        # Augment with operating-areas extraction (v2 dropped this; v3 needs it)
        guide["operatingAreasRaw"] = extract_operating_areas(guide.get("languagesRaw", ""))
        guides.append(guide)

    guides.sort(key=lambda g: g["slug"])
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(guides, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\nWrote {len(guides)} guides -> {OUT_PATH.relative_to(ROOT)}")
    for g in guides:
        langs = "/".join(g["passThroughLanguages"])
        addl = "/".join(g["passThroughAdditionalLanguages"]) or "—"
        cities = ", ".join(g["operatingAreasRaw"])
        print(
            f"  {g['slug']:<22} langs=[{langs}]  addl=[{addl}]  "
            f"cities=[{cities}]  specs={len(g['sv']['specializations'])}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
