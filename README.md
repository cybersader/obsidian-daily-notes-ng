<p align="center">
  <img src="assets/logo/logo-recraft-crystal.svg" alt="Daily Notes NG" width="200">
</p>

<h1 align="center">Daily Notes NG</h1>

<p align="center">
  <strong>Next-generation daily notes for <a href="https://obsidian.md">Obsidian</a></strong><br>
  Named journals &middot; Multi-user identity &middot; Folder-note mode &middot; All-in-one
</p>

<p align="center">
  <a href="https://github.com/cybersader/obsidian-daily-notes-ng/releases/latest"><img src="https://img.shields.io/github/v/release/cybersader/obsidian-daily-notes-ng?style=flat-square&color=7c3aed" alt="Latest Release"></a>
  <a href="https://github.com/cybersader/obsidian-daily-notes-ng/blob/main/LICENSE"><img src="https://img.shields.io/github/license/cybersader/obsidian-daily-notes-ng?style=flat-square" alt="License"></a>
  <a href="https://cybersader.github.io/obsidian-daily-notes-ng"><img src="https://img.shields.io/badge/docs-Starlight-blue?style=flat-square" alt="Documentation"></a>
  <a href="https://obsidian.md/plugins?id=daily-notes-ng"><img src="https://img.shields.io/badge/Obsidian-Plugin-7c3aed?style=flat-square&logo=obsidian&logoColor=white" alt="Obsidian Plugin"></a>
</p>

---

> **Early development** &mdash; Features are being built and APIs may change. I use this plugin daily in my own vaults, so it will be maintained. Bug reports and feature requests welcome on [GitHub Issues](https://github.com/cybersader/obsidian-daily-notes-ng/issues).

## Why?

The Obsidian daily notes ecosystem has a **maintenance crisis**. [Periodic Notes](https://github.com/liamcain/obsidian-periodic-notes) and [Calendar](https://github.com/liamcain/obsidian-calendar-plugin) have been abandoned for ~4 years with 151+ open issues. Users are forced to combine 5+ plugins for a complete workflow.

Daily Notes NG consolidates the best features into one plugin &mdash; and adds **named journals** and **multi-user identity** that no other daily notes plugin offers.

## Features

<table>
<tr>
<td width="50%">

### Named journals
Multiple journals per vault, each with its own folder, template, periodicity, and ownership scope. Personal journal, work standup, team retro &mdash; all separate.

### Multi-user identity
Register devices to person notes. Per-person folders, creator attribution, group journals. Shared vaults just work.

### Folder-note mode
Each periodic note becomes a folder &mdash; attachments nest under it. Auto-generated `.base` MOC dashboards.

</td>
<td width="50%">

### Template integration
Built-in `{{title}}`, `{{date}}`, `{{time}}`, `{{person}}` variables. Seamless Templater bridge when installed.

### Calendar sidebar
Month-view calendar with dot indicators. Click any day to open or create a note.

### Todo rollover
Carry incomplete checkboxes from yesterday's note to today's automatically.

### Natural language dates
Type `@next friday` to get inline date suggestions powered by chrono-node.

</td>
</tr>
</table>

### Named journals &mdash; the core concept

Unlike other periodic notes plugins that give you one folder per periodicity, Daily Notes NG lets you define **multiple named journals**:

```
Your journals:
+-- Personal        -> Journal/Alice/Daily     (daily, person-scoped)
+-- Work standup    -> Teams/Dev/Standup       (daily, group-scoped)
+-- Research log    -> Research/Weekly          (weekly, person-scoped)
+-- HQ bulletin     -> HQ/Bulletin             (daily, global)
+-- Team retro      -> Teams/Dev/Retro         (weekly, group-scoped)
```

**Global journals** are available to everyone. **Person journals** only appear on registered devices. **Group journals** show for all group members.

## Installation

### BRAT (recommended for beta)

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) from Community Plugins
2. BRAT Settings > Add Beta Plugin > `cybersader/obsidian-daily-notes-ng`
3. Enable Daily Notes NG in Community Plugins

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/cybersader/obsidian-daily-notes-ng/releases/latest)
2. Create folder: `<vault>/.obsidian/plugins/daily-notes-ng/`
3. Copy the downloaded files into that folder
4. Restart Obsidian and enable the plugin

### Community Plugins (coming soon)

Search for "Daily Notes NG" in Obsidian Settings > Community Plugins.

## Quick start

1. **Enable the plugin** &mdash; a "Daily" journal is created by default
2. **Open today's note** &mdash; `Ctrl/Cmd + P` > "Open today's daily note"
3. **Configure journals** &mdash; Settings > Daily Notes NG > Journals

For multi-user vaults:
1. Settings > Identity > Enable multi-user identity
2. Register this device to a person note
3. Create person-scoped journals

## Documentation

Full documentation: **[cybersader.github.io/obsidian-daily-notes-ng](https://cybersader.github.io/obsidian-daily-notes-ng)**

- [Getting started](https://cybersader.github.io/obsidian-daily-notes-ng/getting-started/installation/)
- [Journals (periodic notes)](https://cybersader.github.io/obsidian-daily-notes-ng/features/periodic-notes/)
- [Multi-user identity](https://cybersader.github.io/obsidian-daily-notes-ng/features/identity/)
- [Folder notes integration](https://cybersader.github.io/obsidian-daily-notes-ng/guides/folder-notes/)
- [Settings reference](https://cybersader.github.io/obsidian-daily-notes-ng/reference/settings/)
- [Glossary](https://cybersader.github.io/obsidian-daily-notes-ng/concepts/glossary/)

## Development

Built with **Bun**, **TypeScript**, and **esbuild**. Includes Obsidian CLI testing, a test fixtures plugin, and BRAT-compatible releases.

```bash
bun install              # Install dependencies
bun run dev              # Development mode (watch)
bun run build            # Production build
bun test                 # Run tests
bun run lint             # ESLint with obsidian-plugin rules
bun run release:patch    # Bump version + commit + push (CI auto-releases)
```

See the [development guide](https://cybersader.github.io/obsidian-daily-notes-ng/development/setup/) for the full workflow.

## Companion plugins

| Plugin | Integration |
|--------|-------------|
| [Folder Notes](https://github.com/LostPaul/obsidian-folder-notes) | `.base` MOC recognized as folder note, click-to-open |
| [Templater](https://github.com/SilentVoid13/Templater) | Auto-delegates template processing when installed |
| [Dataview](https://github.com/blacksmithgu/obsidian-dataview) | All periodic notes queryable regardless of storage mode |

## Contributing

Contributions welcome! Please read the [development docs](https://cybersader.github.io/obsidian-daily-notes-ng/development/setup/) first.

## License

[MIT](LICENSE)

---

<p align="center">
  <sub>Made with care by <a href="https://github.com/cybersader">cybersader</a></sub>
</p>
