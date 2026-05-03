#!/usr/bin/env python3
"""Parse v2 guide DOCX profiles → structured Swedish JSON.

Reads all .docx files in docx/Guides data v2/, extracts sectioned content,
and writes a single data/guides-v2-sv.json array sorted by slug.

Consumed by Phase 2 (Claude in-session translation) and Phase 4 (CMS import).
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from docx import Document

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DOCX_DIR = ROOT / "docx" / "Guides data v2"
DEFAULT_OUT_PATH = ROOT / "data" / "guides-v2-sv.json"

# Section header prefixes (tolerant startswith match, lowercased)
SECTION_PREFIXES = {
    "om ": "bio",
    "specialisering": "specializations",
    "guidestil": "guideStyle",
    "vad gästerna uppskattar": "whatGuestsAppreciate",
    "det som gör": "uniqueAspects",
}

HEADER_LINE = "guide profile"  # case-insensitive startswith
FOOTER_PREFIX = "private tours"  # case-insensitive startswith, indicates footer

LANGUAGE_MAP = {
    "svenska": "sv", "swedish": "sv",
    "engelska": "en", "english": "en",
    "tyska": "de", "german": "de",
    "franska": "fr", "french": "fr",
    "spanska": "es", "spanish": "es",
    "italienska": "it", "italian": "it",
}
ADDITIONAL_LANGUAGE_MAP = {
    "japanska": "ja", "norska": "no", "danska": "da", "finska": "fi",
    "holländska": "nl", "polska": "pl", "ryska": "ru",
    # v3: Meänkieli — Finnish minority language; not a standard ISO code.
    # Surfaced through this slug so downstream import can map to credential string
    # if Payload's additionalLanguages enum lacks it.
    "meänkieli": "meankieli",
}

# Quote characters to strip from pull quote
QUOTE_CHARS = '"\u201C\u201D\u201E\u00AB\u00BB\u2039\u203A\u2018\u2019\u00AB\u00BB'

ALT_SPELLING_RE = re.compile(r"\[alternativ stavning\s+([^\]]+)\]", re.IGNORECASE)


def to_slug(raw_name: str) -> str:
    """Mirror of scripts/translate-guide-data.ts toSlug(): first + last, diacritic fold."""
    parts = [p for p in raw_name.strip().split() if p]
    if not parts:
        return ""
    first, last = parts[0], parts[-1]
    combined = f"{first} {last}".lower()
    # Swedish/German/Romance diacritics
    replacements = {
        "å": "a", "ä": "a", "ö": "o", "ø": "o", "ü": "u",
        "é": "e", "è": "e", "ñ": "n",
    }
    for src, dst in replacements.items():
        combined = combined.replace(src, dst)
    combined = re.sub(r"[^a-z0-9]+", "-", combined)
    return combined.strip("-")


def extract_alt_spelling(raw_name: str) -> tuple[str, str | None]:
    """Strip `[alternativ stavning X]` → (clean_name, alt_spelling)."""
    m = ALT_SPELLING_RE.search(raw_name)
    if not m:
        return raw_name.strip(), None
    clean = ALT_SPELLING_RE.sub("", raw_name).strip()
    return clean, m.group(1).strip()


def parse_languages(raw: str) -> tuple[list[str], list[str]]:
    """Parse 'Stockholm  •  Svenska, Engelska, …' line. Drop location prefix.

    Splits on comma. Each item lowercased and matched against maps.
    Returns (mapped_main, mapped_additional).
    """
    # Drop location prefix: take everything after the LAST bullet-like separator
    # Lines may have multiple bullets: "Sigtuna • Birka • Uppsala • Svenska, Engelska"
    body = raw
    for sep in ("\u2022", "\u00B7"):  # bullet, middle dot
        if sep in body:
            body = body.rsplit(sep, 1)[1]
            break
    items = [s.strip().lower() for s in re.split(r"[,/]", body) if s.strip()]
    main: list[str] = []
    additional: list[str] = []
    unknown: list[str] = []
    for item in items:
        # strip plural/declension endings + punctuation
        key = item.rstrip(".").strip()
        if key in LANGUAGE_MAP:
            code = LANGUAGE_MAP[key]
            if code not in main:
                main.append(code)
        elif key in ADDITIONAL_LANGUAGE_MAP:
            code = ADDITIONAL_LANGUAGE_MAP[key]
            if code not in additional:
                additional.append(code)
        else:
            unknown.append(item)
    if unknown:
        print(f"  [warn] unmapped language tokens: {unknown}", file=sys.stderr)
    return main, additional


def classify_section(line: str) -> str | None:
    """Return section key if line matches a known header, else None."""
    low = line.lower().strip()
    for prefix, key in SECTION_PREFIXES.items():
        if low.startswith(prefix):
            return key
    return None


def is_header_line(line: str) -> bool:
    return line.lower().strip().startswith(HEADER_LINE)


def is_footer_line(line: str) -> bool:
    return line.lower().strip().startswith(FOOTER_PREFIX)


def strip_quotes(text: str) -> str:
    out = text.strip()
    while out and out[0] in QUOTE_CHARS:
        out = out[1:]
    while out and out[-1] in QUOTE_CHARS:
        out = out[:-1]
    return out.strip()


def parse_guide_file(path: Path) -> dict:
    """Extract one guide dict from docx path."""
    doc = Document(str(path))
    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    if not paragraphs:
        raise ValueError(f"empty docx: {path.name}")

    # Index 0 = header line, Index 1 = name, Index 2 = loc+languages
    if not is_header_line(paragraphs[0]):
        raise ValueError(f"{path.name}: first line not 'GUIDE PROFILE…': {paragraphs[0]!r}")

    raw_name = paragraphs[1]
    lang_line = paragraphs[2]
    name, alt_spelling = extract_alt_spelling(raw_name)
    # Prefer alt spelling (ASCII Latin form) for slug derivation to match v1 CMS slugs
    # e.g. "Sabine Grün [alternativ stavning Gruen]" -> slug from "Sabine Gruen" = sabine-gruen
    slug_source = name
    if alt_spelling:
        parts = name.split()
        if parts:
            slug_source = " ".join(parts[:-1] + [alt_spelling])
    slug = to_slug(slug_source)
    main_langs, additional_langs = parse_languages(lang_line)

    # Walk remaining paragraphs, bucketing by section
    sections: dict[str, list[str]] = {
        "bio": [], "specializations": [], "guideStyle": [],
        "whatGuestsAppreciate": [], "uniqueAspects": [],
    }
    current: str | None = None
    for line in paragraphs[3:]:
        if is_footer_line(line):
            break
        key = classify_section(line)
        if key is not None:
            current = key
            continue  # skip the header line itself
        if current is None:
            # Pre-section content (shouldn't happen; treat as bio)
            current = "bio"
        sections[current].append(line)

    # Validate every section has content
    for key in ("bio", "specializations", "guideStyle", "whatGuestsAppreciate", "uniqueAspects"):
        if not sections[key]:
            raise ValueError(f"{path.name}: empty section '{key}'")

    # Post-process sections
    bio_text = "\n\n".join(sections["bio"])
    # Specializations: each paragraph is one item; strip leading bullets/dashes
    spec_items = [re.sub(r"^[\-\u2022\*·]\s*", "", s).strip() for s in sections["specializations"]]
    spec_items = [s for s in spec_items if s]
    guide_style = "\n\n".join(sections["guideStyle"])
    appreciate = "\n\n".join(sections["whatGuestsAppreciate"])

    # Unique aspects: first paragraph that's wrapped in quotes = quote, rest = body
    unique_paras = sections["uniqueAspects"]
    quote_text = ""
    body_paras: list[str] = []
    for i, para in enumerate(unique_paras):
        stripped = para.strip()
        if not quote_text and any(stripped.startswith(c) for c in QUOTE_CHARS):
            quote_text = strip_quotes(stripped)
            body_paras = unique_paras[i + 1:]
            break
    if not quote_text:
        # Fallback: first paragraph is quote-ish (italic line), rest is body
        quote_text = strip_quotes(unique_paras[0])
        body_paras = unique_paras[1:]
    unique_body = "\n\n".join(body_paras) if body_paras else ""

    result: dict = {
        "slug": slug,
        "name": name,
        "languagesRaw": lang_line,
        "passThroughLanguages": main_langs,
        "passThroughAdditionalLanguages": additional_langs,
        "sv": {
            "bio": bio_text,
            "specializations": spec_items,
            "guideStyle": guide_style,
            "whatGuestsAppreciate": appreciate,
            "uniqueAspectsQuote": quote_text,
            "uniqueAspectsBody": unique_body,
        },
    }
    if alt_spelling:
        result["nameAltSpelling"] = alt_spelling
    return result


def main() -> int:
    if not DOCX_DIR.exists():
        print(f"Source dir missing: {DOCX_DIR}", file=sys.stderr)
        return 1
    files = sorted(DOCX_DIR.glob("*.docx"))
    if len(files) != 12:
        print(f"[warn] expected 11 docx files, found {len(files)}", file=sys.stderr)
    guides: list[dict] = []
    for path in files:
        print(f"Parsing {path.name}…")
        try:
            guides.append(parse_guide_file(path))
        except Exception as exc:
            print(f"  [error] {path.name}: {exc}", file=sys.stderr)
            raise

    guides.sort(key=lambda g: g["slug"])
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(guides, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\nWrote {len(guides)} guides -> {OUT_PATH.relative_to(ROOT)}")
    for g in guides:
        langs = "/".join(g["passThroughLanguages"])
        print(f"  {g['slug']:<20} [{langs}] specs={len(g['sv']['specializations'])} quote={len(g['sv']['uniqueAspectsQuote'])}c")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
