# Changelog

## [0.1.17] - 2026-03-28

### Added
- Lucide icons on all 11 navigation commands (calendar-check, chevron-left/right)
- Mobile toolbar settings section with guided setup modal (visible on mobile only)
- Journal icon field in settings card with live Lucide icon preview
- Icons render in command palette, mobile toolbar, and ribbon menu

## [0.1.16] - 2026-03-28

### Added
- Logo assets: 20 variations (PNG 32-512px, SVG color + mono, transparent bg)
- Pretty README with centered logo, badges, feature table, BRAT install guide
- Docs branding: logo in Starlight header + hero image
- process-logos.py script for regenerating from source images

## [0.1.15] - 2026-03-28

### Changed
- All journal cards start collapsed in settings (click to expand)

## [0.1.14] - 2026-03-28

### Added
- Notice messages when no journals are available for a command
- Diagnostic messages explain why: no journals defined, all disabled, identity off, device not registered, or scope mismatch
- 8-second display time for actionable guidance

## [0.1.13] - 2026-03-28

### Added
- Debug logging system: dual file/console output, write queue, per-category filtering
- Category groups in debug settings: Core, Identity, Templates, Other
- Comprehensive trace logging in JournalResolver, PeriodicNoteManager, NavigationCommands
- onExternalSettingsChange: plugin reloads journals when Obsidian Sync updates data.json
- Debug settings UI: master toggle, console toggle, category filters, clear log button

### Fixed
- Obsidian Sync: journals from other devices now load without restart
- Debug settings migration: old boolean format auto-converts to new object format

## [0.1.12] - 2026-03-26

### Improved
- All settings now have clear descriptions explaining purpose and usage
- Template field: lists available variables and Templater support
- Date format: shows examples for daily/weekly/monthly
- Folder: explains person interpolation
- NLP trigger: shows usage example

## [0.1.11] - 2026-03-26

### Improved
- Journal scope badge now shows owner name (e.g., "person: Alice Smith" instead of just "person")

## [0.1.10] - 2026-03-26

### Added
- Per-journal setting overrides: folder-note mode, base MOC, Templater, date tracking, date keys, creator, UUID
- Collapsible "Overrides" section in each journal card
- Tri-state dropdowns: "Use global" / "On" / "Off" for boolean overrides
- String overrides with placeholder showing global default

## [0.1.9] - 2026-03-26

### Changed
- Removed auto-heading on notes without templates (too opinionated)

## [0.1.8] - 2026-03-26

### Fixed
- Empty notes when no template configured (now gets a # heading)
- UUID added to all new notes regardless of identity being enabled
- processFrontMatter no longer gated behind identity.enabled

## [0.1.7] - 2026-03-26

### Fixed
- Creator property now renders as clickable link in Obsidian Properties view
- Creator stored as YAML list via processFrontMatter (not raw string injection)
- Plugin registers creator property type as 'multitext' on load
- UUID also set via processFrontMatter (single atomic operation)

## [0.1.6] - 2026-03-26

### Fixed
- Folder autocomplete: hierarchical path navigation instead of substring matching
- Typing "/" after a folder browses its children
- Backspacing to a folder name shows that folder again
- No more deep nested paths appearing for partial queries

## [0.1.5] - 2026-03-26

### Fixed
- Folder autocomplete: clicking suggestions now works (FolderSuggest inputEl fix)
- File tree preview: added "File preview" label heading
- Remove journal button: eliminated excessive padding/margin gap

## [0.1.4] - 2026-03-26

### Added
- Collapsible journal cards in settings with header badges and chevron toggle
- Live file tree preview showing resolved folder path, sample filenames, folder-note structure
- Preview updates dynamically when changing folder path or date format

## [0.1.3] - 2026-03-25

### Added
- Named journals: multiple journal definitions per vault, each with own folder/template/periodicity
- Journal scopes: global (everyone), person (one user), group (team members)
- Journal picker modal when multiple journals match a periodicity
- Auto-migration from old periodic settings to journals format

### Changed
- Settings UI: journals section replaces old per-periodicity toggles
- PeriodicNoteManager now journal-aware (accepts JournalDefinition)
- Navigation commands detect current journal from active file

## [0.1.2] - 2026-03-25

### Added
- Autocomplete for all path/folder fields in settings (person notes, templates, folders)
- FileSuggest and FolderSuggest using Obsidian's AbstractInputSuggest API
- Person note search filters to configured discovery folder

## [0.1.1] - 2026-03-25

### Added
- BRAT-compatible release workflow (auto-detect version, CHANGELOG parsing, auto-tag)
- Version bump scripts: `bun run release:patch/minor/major`
- Folder notes integration guide in docs
- Expanded glossary with folder-note and companion plugin terms

### Fixed
- Templater bridge: correctly falls back to built-in engine when trigger_on_file_creation is off
- .base MOC generation triggers when opening existing notes too

## [0.1.0] - 2026-03-24

### Added
- Initial scaffold with all source modules stubbed
- Multi-user identity system: device IDs, person/group notes, per-note UUIDs
- PeriodicConfigResolver: 4-layer resolution chain for per-person settings
- Navigation commands: open today, prev/next for all five periodicities
- Folder-note mode: store periodic notes as folders for attachment nesting
- Auto-generated .base MOC indexes for periodic note folders
- Calendar sidebar view (stub)
- Template engine with Templater bridge
- Todo rollover (stub)
- Frontmatter date tracking (stub)
- Natural language date suggestions via chrono-node
- Settings UI with all sections: periodic, folder notes, calendar, identity, rollover, frontmatter, NLP, debug
- Obsidian CLI skill for agentic testing workflow
- Test fixtures companion plugin with generate/cleanup commands
- Astro Starlight documentation site with 12 pages
- GitHub Actions: release workflow + docs deployment to GitHub Pages
- ESLint with obsidian-plugin community rules
- 25 unit tests (DevicePreferences, PeriodicConfigResolver, periodicity, frontmatter)

### Fixed
- Templater bridge: check trigger_on_file_creation before delegating to avoid unresolved variables
- .base MOC generation on opening existing notes (not just new note creation)
