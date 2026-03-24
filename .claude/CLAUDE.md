# Daily Notes NG - Agent Instructions

## Overview

Next-generation daily notes plugin for Obsidian. Consolidates periodic notes, calendar, templates, todo rollover, frontmatter dates, NLP dates, and identity/attribution into one plugin.

## Build Commands

```bash
bun install              # Install dependencies
bun run dev              # Development mode (watch, outputs to dnng-test-vault)
bun run build            # Production build (type-check + bundle)
bun test                 # Run tests
bun test --watch         # Watch mode
bun run lint             # ESLint with obsidian-plugin rules
```

## Architecture

```
src/
├── main.ts              # Plugin entry point (DailyNotesNGPlugin)
├── constants.ts         # DEFAULT_SETTINGS
├── settings/            # SettingsTab + types
├── periodic/            # PeriodicNoteManager, dateUtils, periodicity enum
├── calendar/            # CalendarView (ItemView), CalendarWidget, DayCell
├── templates/           # TemplateEngine, TemplaterBridge
├── navigation/          # NavigationCommands, BreadcrumbRenderer
├── rollover/            # TodoRollover, todoParser
├── frontmatter/         # FrontmatterDateTracker, frontmatterUtils
├── nlp/                 # DateParser (chrono-node), DateSuggest (EditorSuggest)
├── identity/            # DeviceIdentityManager, UserRegistry, PersonNoteService, GroupRegistry, NoteUuidService
├── compat/              # PeriodicNotesCompat, DailyNotesInterfaceCompat
└── utils/               # debug.ts, deepMerge.ts
```

## Key Patterns

- **Bun** as package manager and script runner
- **esbuild** bundles to `dnng-test-vault/.obsidian/plugins/daily-notes-ng/` in dev mode
- **Jest + ts-jest** for unit tests, jsdom environment
- **ESLint 9 flat config** with `eslint-plugin-obsidianmd` for community plugin compliance
- **Identity system** adapted from TaskNotes (DeviceIdentityManager, UserRegistry, etc.)
- **Templater bridge**: Detect via `app.plugins.getPlugin('templater-obsidian')`, delegate if available
- **CSS scoping**: All classes prefixed with `.dnng-`
- **chrono-node**: NLP date parsing (same lib as nldates plugin)

## Testing

- Unit tests in `tests/` mirror `src/` structure
- Obsidian API mocked in `tests/__mocks__/obsidian.ts`
- Calendar UI requires manual testing in test vault
- Open `dnng-test-vault/` in Obsidian to test the plugin

## Git Commit Rules

**NEVER include AI attribution in commits:**
- Do not use `Co-Authored-By: Claude ...` or any AI/LLM co-author
- Do not use `Co-Authored-By: Anthropic ...`
- Commit as the human developer only

## Docs Site

Astro Starlight in `docs/` directory. Deployed to GitHub Pages via `.github/workflows/deploy-docs.yml`.

```bash
cd docs && bun install && bun run dev    # Local dev
cd docs && bun run build                  # Production build
```
