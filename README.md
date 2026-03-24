# Daily Notes NG

Next-generation daily notes plugin for [Obsidian](https://obsidian.md). Consolidates the best features from multiple daily journaling and periodic notes plugins into a single, actively maintained solution.

## Why?

The Obsidian daily notes ecosystem has a maintenance crisis. **Periodic Notes** and **Calendar** (by Liam Cain) have been abandoned for ~4 years with 151+ open issues. Users are forced to combine 5+ plugins to get a complete daily notes workflow. Daily Notes NG solves this by providing everything in one plugin.

## Features

- **Periodic notes** — Daily, weekly, monthly, quarterly, and yearly notes with independent folder/format/template configs
- **Calendar sidebar** — Month-view calendar with dot indicators for existing notes
- **Template integration** — Built-in variable resolution + seamless Templater bridge
- **Todo rollover** — Automatically carry incomplete todos from previous notes
- **Frontmatter date tracking** — Auto-populate `date created` and `date modified` with smart debouncing
- **Natural language dates** — Type `@next friday` to insert date links inline
- **Navigation commands** — Previous/next note, open today, breadcrumb hierarchy
- **Identity system** — Per-device IDs, person/group notes, auto-attribution (inspired by TaskNotes)
- **Migration support** — Import settings from Periodic Notes plugin

## Installation

### From Community Plugins (coming soon)

Search for "Daily Notes NG" in Obsidian Settings > Community Plugins.

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/cybersader/obsidian-daily-notes-ng/releases)
2. Create folder: `<vault>/.obsidian/plugins/daily-notes-ng/`
3. Copy the downloaded files into that folder
4. Restart Obsidian and enable the plugin

## Development

```bash
# Install dependencies
bun install

# Development mode (watch + auto-reload in test vault)
bun run dev

# Production build
bun run build

# Run tests
bun test

# Lint
bun run lint
```

## Documentation

Full documentation available at: https://cybersader.github.io/obsidian-daily-notes-ng

## License

[MIT](LICENSE)
