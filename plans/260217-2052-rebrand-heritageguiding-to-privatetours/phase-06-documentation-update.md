# Phase 06: Documentation Update

## Context Links
- [Plan Overview](./plan.md)
- [Phase 01-05](./plan.md)

## Overview
- **Date:** 2026-02-17
- **Description:** Update README, docs/, and plan files with new brand name and domain
- **Priority:** P2 (lower priority than code changes, but needed for consistency)
- **Status:** Pending
- **Review Status:** Not started

## Key Insights
- 12+ markdown files reference old brand
- README.md is primary onboarding doc -- must be accurate
- Docs folder has 7+ files with brand references
- Plan files are historical but should reflect current state
- `CLAUDE.md` references project name and Slack channel

## Requirements

### Functional
- All documentation references "PrivateTours" instead of "HeritageGuiding"
- All URLs point to privatetours.se
- Clone/setup instructions use correct repo name
- Environment variable examples use new domain

### Non-Functional
- Documentation remains internally consistent
- No broken relative links

## Architecture
No architectural changes. Markdown file updates only.

## Related Code Files

### Root Files
1. `README.md`
2. `CLAUDE.md`

### Docs Directory
3. `docs/project-overview-pdr.md`
4. `docs/code-standards.md`
5. `docs/codebase-summary.md`
6. `docs/design-guidelines.md`
7. `docs/deployment-guide.md`
8. `docs/system-architecture.md`
9. `docs/infrastructure-setup.md`
10. `docs/MVP-PROJECT-PLAN.md`
11. `docs/project-roadmap.md` (if exists)
12. `docs/project-changelog.md` (if exists)

## Implementation Steps

### Step 1: README.md
- Find: `# HeritageGuiding Platform` -> Replace: `# PrivateTours Platform`
- Find: `heritageguiding-platform` -> Replace: `privatetours-platform` (git clone URL, directory name)
- Find: `heritageguiding.com` -> Replace: `privatetours.se` (env examples, URLs)
- Find: `HeritageGuiding` -> Replace: `PrivateTours` (all remaining)
- Find: `#heritageguiding` (Slack) -> Replace: `#privatetours`
- Find: `DATABASE_URL=postgresql://user:password@host:5432/heritageguiding` -> Replace with `privatetours`

### Step 2: CLAUDE.md
- Find: `HeritageGuiding` -> Replace: `PrivateTours`
- Find: `heritageguiding` -> Replace: `privatetours` (lowercase refs)

### Step 3: Docs Directory (batch replacement)
For each file in `docs/`:
- Find: `HeritageGuiding` -> Replace: `PrivateTours`
- Find: `heritageguiding.com` -> Replace: `privatetours.se`
- Find: `heritageguiding` -> Replace: `privatetours` (lowercase, package names, DB names)
- Find email addresses -> Replace with `@privatetours.se`

### Step 4: Project Structure References
In files that show the directory tree:
- Find: `heritageguiding-platform/` -> Replace: `privatetours-platform/`

### Step 5: Verify No Remaining References
```bash
grep -ri "heritageguiding" README.md CLAUDE.md docs/
```

## Todo List
- [ ] Update README.md
- [ ] Update CLAUDE.md
- [ ] Update docs/project-overview-pdr.md
- [ ] Update docs/code-standards.md
- [ ] Update docs/codebase-summary.md
- [ ] Update docs/design-guidelines.md
- [ ] Update docs/deployment-guide.md
- [ ] Update docs/system-architecture.md
- [ ] Update docs/infrastructure-setup.md
- [ ] Update docs/MVP-PROJECT-PLAN.md
- [ ] Update other docs/ files if they exist
- [ ] Verify zero remaining references

## Success Criteria
- `grep -ri "heritageguiding" README.md CLAUDE.md docs/` returns nothing
- README quick start instructions work with new names
- All documentation internally consistent

## Risk Assessment
- **Very low risk:** Documentation-only changes
- **Watch for:** Git clone URLs that point to actual GitHub repos (may need repo rename separately)

## Security Considerations
- Ensure no API keys or secrets are exposed in documentation updates
- `.env.example` should not contain real values

## Next Steps
- Consider renaming the GitHub repository from `heritageguiding-platform` to `privatetours-platform`
- Update any external references (bookmarks, wiki pages, CI/CD configs referencing repo name)
- Update `.github/workflows/` if they reference the old brand in names or comments
