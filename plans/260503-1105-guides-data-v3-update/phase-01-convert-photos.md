# Phase 1: Convert Oversized Guide Photos to Web Standard

## Context Links
- Source dir: `docx/Guide-photos/`
- Target dir: `docx/Guide-photos-web/` (new, gitignored or kept per repo policy)
- Existing photo upload script: `scripts/import-guide-photos.ts`
- ImageMagick installed; PIL available via `~/.claude/skills/.venv`

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 0.5h
- **Depends on:** —

Convert oversized photos to web-standard dimensions and quality. Output to `docx/Guide-photos-web/` so originals stay intact and uploads consume optimized files.

## Key Insights
- 2 of 16 photos are catastrophically oversized (>3MB, 5712px tall): Leo, Svante.
- 8 photos exceed 1600px on the longest side and benefit from resize.
- Mats Quist photo (430×640, 25KB) is **already below target** — skip conversion, upload as-is, flag low-res in verification report.
- Mattias Wallin 1.jpeg ignored entirely (no schema slot).
- Convert via Python+PIL (already installed in `.venv`); avoids adding Node `sharp` for one-off batch.

## Requirements

### Functional
- Read each source photo from a fixed allowlist (10 files; see table in `plan.md`).
- Resize so the longest side ≤ 1600 px (preserve aspect ratio); skip resize if already ≤ 1600.
- Re-encode JPEG quality 85 with `progressive=True`, `optimize=True`.
- Strip EXIF (privacy + size).
- Write to `docx/Guide-photos-web/<original-filename>.jpg` (force `.jpg` extension; lowercase).
- Print before/after dimensions and bytes per file.
- Skip Mats Quist (note in output) and Mattias Wallin 1.jpeg.

### Non-Functional
- Idempotent: re-running overwrites outputs; originals untouched.
- Single Python script ≤ 120 lines under `scripts/`.

## Architecture

### Script: `scripts/convert-guide-photos-for-web.py`

```python
# Pseudocode
TARGETS = [
    ("Anders_Boysen.jpeg", "anders-boysen.jpg"),
    ("Annika_Bernholm.jpg", "annika-bernholm.jpg"),
    ("Anette Gustafsson.JPG", "anette-gustafsson.jpg"),
    ("Asa_Ovrelid.jpg", "asa-ovrelid.jpg"),
    ("Jack Voldstad.jpg", "jack-voldstad.jpg"),
    ("Leo Eriksson.JPG", "leo-eriksson.jpg"),
    ("Sophie_Sahlin.jpeg", "sophie-sahlin.jpg"),
    ("Svante Bergqvist.jpeg", "svante-bergqvist.jpg"),
    ("Tommy Nilsson.jpg", "tommy-nilsson.jpg"),
]
SKIP_AS_IS = [("Mats Quist.jpeg", "mats-quist.jpg")]  # copy unchanged
MAX_SIDE = 1600
QUALITY = 85

for src, dst in TARGETS:
    img = Image.open(src_path)
    img = img.convert("RGB")  # strip alpha if any
    if max(img.size) > MAX_SIDE:
        img.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
    img.save(dst_path, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    log(src, before_dim, before_kb, after_dim, after_kb)

for src, dst in SKIP_AS_IS:
    shutil.copy2(src_path, dst_path)
    log_flag(src, "low-res; uploaded as-is")
```

## Related Code Files

### To Create
- `scripts/convert-guide-photos-for-web.py`

### To Read for Context
- `scripts/parse-guides-v2-docx.py` (Python style precedent)
- `scripts/import-guide-photos.ts` (downstream consumer)

### To Modify
- `.gitignore` — add `docx/Guide-photos-web/` if originals dir is tracked but converted is not (check policy).

## Implementation Steps

1. Create `scripts/convert-guide-photos-for-web.py` with allowlist + skip list.
2. Run via `~/.claude/skills/.venv/Scripts/python.exe scripts/convert-guide-photos-for-web.py`.
3. Inspect output dir; spot-check Leo and Svante visually.
4. Confirm all converted files <500KB, longest side ≤1600.
5. Update `.gitignore` if needed.

## Todo List

- [ ] Write `scripts/convert-guide-photos-for-web.py`
- [ ] Run script, capture before/after table in commit message or report
- [ ] Spot-check 2 converted images (open Leo + Svante; verify quality acceptable)
- [ ] Confirm `Mats Quist.jpeg` copied as-is; flag captured for report
- [ ] Decide `.gitignore` for `docx/Guide-photos-web/`
- [ ] Phase 1 done — proceed to Phase 3 upload

## Success Criteria

- 9 photos converted, sizes 100–500KB, dims ≤1600px longest side.
- Mats Quist copied unchanged.
- Originals in `docx/Guide-photos/` untouched.
- Visual quality acceptable (no obvious artifacts on Leo/Svante).

## Risk Assessment

- **Visible artifacts at q85**: bump to q90 if spot-check fails. Cost: +20% file size.
- **Wrong source filename casing on Windows vs git**: script uses exact-match strings; verify dir listing first.

## Security Considerations

- EXIF stripping removes any GPS/device metadata embedded by phone cameras.

## Next Steps

- Phase 3 reads from `docx/Guide-photos-web/` for upload.
