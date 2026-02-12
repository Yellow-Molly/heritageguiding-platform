# Phase 4: Category Mapping

## Current Platform Categories

Valid filter categories: `['history', 'architecture', 'nature', 'maritime', 'royal']`

## SHT → Platform Category Mapping

| SHT Category | Platform Category | Action |
|-------------|-------------------|--------|
| Viking Tours | `history` + new `viking` | Create `viking` theme |
| Dark/Ghost walks | new `dark-history` | Create `dark-history` theme |
| Church & Castle | `architecture` + new `religious-heritage` | Create `religious-heritage` theme |
| Food tours | new `food-wine` | Create `food-wine` theme |
| Women's History | new `cultural` | Create `cultural` theme |
| Naval History | `maritime` (existing) | Map directly |
| Medieval | `history` + new `medieval` | Create `medieval` theme |
| Bronze/Iron Age | `history` + new `ancient` | Create `ancient` theme |
| Museum tours | new `museum` | Create `museum` theme |
| Folklore | new `folklore` | Create `folklore` theme |
| Countryside/Nature | `nature` (existing) | Map directly |
| Royal/Castles | `royal` (existing) | Map directly |

## New Categories Needed (~9)

| Slug | EN Name | SV Name | DE Name | Icon |
|------|---------|---------|---------|------|
| `viking` | Viking History | Vikingahistoria | Wikingergeschichte | swords |
| `dark-history` | Dark History & Ghost Walks | Mörk historia & Spökvandringar | Dunkle Geschichte & Geisterwanderungen | skull |
| `religious-heritage` | Religious Heritage | Religiöst kulturarv | Religiöses Erbe | church |
| `food-wine` | Food & Wine | Mat & Dryck | Essen & Wein | utensils |
| `cultural` | Culture & Society | Kultur & Samhälle | Kultur & Gesellschaft | users |
| `medieval` | Medieval History | Medeltiden | Mittelalterliche Geschichte | castle |
| `ancient` | Ancient & Bronze Age | Forntid & Bronsålder | Antike & Bronzezeit | landmark |
| `museum` | Museums | Museer | Museen | building-2 |
| `folklore` | Folklore & Mythology | Folklore & Mytologi | Folklore & Mythologie | sparkles |

## Notes

- All new categories use `type: 'theme'`
- Icons are Lucide icon names matching existing pattern
- Categories are localized in CMS (sv/en/de) — no i18n message changes needed for filter chips since they read `name` from CMS
- Some SHT tours map to multiple categories (e.g., Viking + History)
