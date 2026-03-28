import { App, PluginSettingTab, Setting, AbstractInputSuggest, TFile, ToggleComponent } from 'obsidian';
import type DailyNotesNGPlugin from '../main';
import { ALL_PERIODICITIES, PERIODICITY_LABELS } from '../periodic/periodicity';
import type { Periodicity } from '../periodic/periodicity';
import type { JournalDefinition, JournalScope } from './types';

/**
 * File path suggester that shows matching vault files as you type.
 * Filters to person notes when the identity system can detect them.
 */
/**
 * Folder path suggester for folder settings.
 */
class FolderSuggest extends AbstractInputSuggest<string> {
  private inputEl: HTMLInputElement;
  private onSelectFolder: ((folder: string) => void) | null;

  constructor(app: App, inputEl: HTMLInputElement, onSelect?: (folder: string) => void) {
    super(app, inputEl);
    this.inputEl = inputEl;
    this.onSelectFolder = onSelect ?? null;
  }

  getSuggestions(query: string): string[] {
    // Collect all unique folder paths in the vault
    const allFolders = new Set<string>();
    for (const file of this.app.vault.getMarkdownFiles()) {
      // Walk up the folder hierarchy to collect all intermediate paths
      let current = file.parent;
      while (current && current.path && current.path !== '/') {
        allFolders.add(current.path);
        current = current.parent;
      }
    }

    const lowerQuery = query.toLowerCase().replace(/\/+$/, '');

    if (!query || query === '/') {
      // Empty query: show top-level folders
      return [...allFolders]
        .filter(f => !f.includes('/'))
        .sort()
        .slice(0, 30);
    }

    // Check if query ends with "/" — user wants to browse children
    const browsingChildren = query.endsWith('/');
    const parentPath = browsingChildren ? query.replace(/\/+$/, '') : null;

    if (parentPath) {
      // Show direct children of the typed path
      const lowerParent = parentPath.toLowerCase();
      return [...allFolders]
        .filter(f => {
          const lowerF = f.toLowerCase();
          // Must start with parent path + "/"
          if (!lowerF.startsWith(lowerParent + '/')) return false;
          // Must be a direct child (no further slashes after parent)
          const remainder = f.substring(parentPath.length + 1);
          return !remainder.includes('/');
        })
        .sort()
        .slice(0, 30);
    }

    // Otherwise: match folders where the last segment matches the query's last segment
    // Split query into parent path + partial name
    const lastSlash = query.lastIndexOf('/');
    const parentPrefix = lastSlash >= 0 ? query.substring(0, lastSlash).toLowerCase() : '';
    const partialName = lastSlash >= 0 ? query.substring(lastSlash + 1).toLowerCase() : lowerQuery;

    return [...allFolders]
      .filter(f => {
        const lowerF = f.toLowerCase();
        if (parentPrefix) {
          // Must be under the parent prefix
          if (!lowerF.startsWith(parentPrefix + '/')) return false;
          // And the folder name after parent must start with partial
          const name = f.substring(parentPrefix.length + 1);
          return !name.includes('/') && name.toLowerCase().startsWith(partialName);
        }
        // No parent prefix — match folder name starting with query
        const name = f.split('/').pop() ?? '';
        return name.toLowerCase().startsWith(partialName);
      })
      .sort()
      .slice(0, 30);
  }

  renderSuggestion(folder: string, el: HTMLElement): void {
    // Show full path but bold the matching part
    el.setText(folder);
  }

  selectSuggestion(folder: string): void {
    this.inputEl.value = folder;
    this.inputEl.dispatchEvent(new Event('input'));
    if (this.onSelectFolder) this.onSelectFolder(folder);
    this.close();
  }
}

class FileSuggest extends AbstractInputSuggest<TFile> {
  private plugin: DailyNotesNGPlugin;
  private onSelectFile: (file: TFile) => void;

  constructor(app: App, inputEl: HTMLInputElement, plugin: DailyNotesNGPlugin, onSelect: (file: TFile) => void) {
    super(app, inputEl);
    this.plugin = plugin;
    this.onSelectFile = onSelect;
  }

  getSuggestions(query: string): TFile[] {
    const lowerQuery = query.toLowerCase();
    return this.app.vault.getMarkdownFiles()
      .filter(f => {
        // Match on path or basename
        if (!f.path.toLowerCase().includes(lowerQuery) && !f.basename.toLowerCase().includes(lowerQuery)) {
          return false;
        }
        // If person notes folder is configured, filter to that folder
        const folder = this.plugin.settings.identity.personNotesFolder;
        if (folder && !f.path.startsWith(folder)) {
          return false;
        }
        return true;
      })
      .slice(0, 20);
  }

  renderSuggestion(file: TFile, el: HTMLElement): void {
    el.setText(file.path);
  }

  selectSuggestion(file: TFile): void {
    this.onSelectFile(file);
    this.close();
  }
}

/**
 * Main settings tab for Daily Notes NG.
 */
export class DailyNotesNGSettingsTab extends PluginSettingTab {
  plugin: DailyNotesNGPlugin;

  constructor(app: App, plugin: DailyNotesNGPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    this.renderJournalsSection(containerEl);
    this.renderFolderNotesSection(containerEl);
    this.renderCalendarSection(containerEl);
    this.renderIdentitySection(containerEl);
    this.renderRolloverSection(containerEl);
    this.renderFrontmatterSection(containerEl);
    this.renderNlpSection(containerEl);
    this.renderDebugSection(containerEl);
  }

  private renderJournalsSection(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Journals').setHeading();

    new Setting(containerEl)
      .setDesc('Each journal is a named destination for periodic notes with its own folder, template, and scope. See docs for details.')
      .addButton((btn) =>
        btn.setButtonText('Add journal').onClick(async () => {
          const id = crypto.randomUUID?.() ?? Date.now().toString(36);
          this.plugin.settings.journals.push({
            id,
            name: 'New journal',
            periodicity: 'daily',
            folder: 'Journal/New',
            format: 'YYYY-MM-DD',
            templatePath: '',
            scope: 'global',
            enabled: true,
          });
          await this.plugin.saveSettings();
          this.display();
        })
      );

    for (const journal of this.plugin.settings.journals) {
      this.renderJournalCard(containerEl, journal);
    }
  }

  private renderJournalCard(containerEl: HTMLElement, journal: JournalDefinition): void {
    const card = containerEl.createDiv('dnng-journal-card');
    let collapsed = true;

    // ── Header (always visible) ──────────────────
    const header = card.createDiv('dnng-journal-card-header');
    const chevron = header.createSpan({ cls: 'dnng-journal-card-chevron', text: '\u25BC' });
    header.createSpan({ text: journal.name, cls: 'dnng-journal-card-header-name' });

    const badges = header.createDiv('dnng-journal-card-badges');
    badges.createSpan({ text: journal.periodicity, cls: 'dnng-journal-card-badge' });
    let scopeText = journal.scope as string;
    if (journal.scope !== 'global' && journal.ownerPath) {
      const ownerName = journal.ownerPath.replace(/\.md$/, '').split('/').pop() ?? '';
      scopeText = `${journal.scope}: ${ownerName}`;
    }
    const scopeBadge = badges.createSpan({ text: scopeText, cls: 'dnng-journal-card-badge' });
    if (!journal.enabled) scopeBadge.addClass('dnng-journal-card-badge--disabled');

    // Enable toggle in header
    const toggleEl = header.createDiv();
    const toggle = new ToggleComponent(toggleEl);
    toggle.setValue(journal.enabled).onChange(async (value) => {
      journal.enabled = value;
      await this.plugin.saveSettings();
      this.display();
    });

    // ── Content (collapsible) ────────────────────
    const content = card.createDiv('dnng-journal-card-content');

    const updateCollapse = () => {
      card.toggleClass('dnng-journal-card--collapsed', collapsed);
    };

    header.addEventListener('click', (e: MouseEvent) => {
      // Don't toggle collapse when clicking the enable toggle
      if (toggleEl.contains(e.target as Node)) return;
      collapsed = !collapsed;
      updateCollapse();
    });
    updateCollapse();

    // Name
    new Setting(content)
      .setName('Name')
      .setDesc('Display name shown in the journal picker and settings')
      .addText((text) =>
        text.setValue(journal.name).onChange(async (value) => {
          journal.name = value;
          await this.plugin.saveSettings();
        })
      );

    // Periodicity
    new Setting(content)
      .setName('Periodicity')
      .setDesc('How often this journal creates notes: daily, weekly, monthly, quarterly, or yearly')
      .addDropdown((dd) => {
        for (const p of ALL_PERIODICITIES) {
          dd.addOption(p, PERIODICITY_LABELS[p]);
        }
        dd.setValue(journal.periodicity).onChange(async (value) => {
          journal.periodicity = value as Periodicity;
          await this.plugin.saveSettings();
        });
      });

    // Folder (with autocomplete)
    new Setting(content)
      .setName('Folder')
      .setDesc('Where notes are created. Use {{person}} to auto-insert the registered user\'s name as a subfolder.')
      .addText((text) => {
        text.setValue(journal.folder).onChange(async (value) => {
          journal.folder = value;
          await this.plugin.saveSettings();
          this.updateFileTreePreview(previewEl, journal);
        });
        new FolderSuggest(this.app, text.inputEl);
      });

    // Format
    new Setting(content)
      .setName('Date format')
      .setDesc('Format for filenames. Examples: YYYY-MM-DD (daily), gggg-[W]WW (weekly), YYYY-MM (monthly).')
      .addText((text) =>
        text.setValue(journal.format).onChange(async (value) => {
          journal.format = value;
          await this.plugin.saveSettings();
          this.updateFileTreePreview(previewEl, journal);
        })
      );

    // Template (with autocomplete)
    new Setting(content)
      .setName('Template')
      .setDesc('Applied when creating new notes. Supports {{title}}, {{date}}, {{time}}, {{person}} variables. Works with Templater if installed.')
      .addText((text) => {
        text.setValue(journal.templatePath).onChange(async (value) => {
          journal.templatePath = value;
          await this.plugin.saveSettings();
        });
        new FileSuggest(this.app, text.inputEl, this.plugin, (file) => {
          journal.templatePath = file.path;
          text.setValue(file.path);
          this.plugin.saveSettings();
        });
      });

    // Scope
    new Setting(content)
      .setName('Scope')
      .setDesc('Who can see and use this journal')
      .addDropdown((dd) => {
        dd.addOption('global', 'Global (everyone)');
        dd.addOption('person', 'Person (one user)');
        dd.addOption('group', 'Group (team members)');
        dd.setValue(journal.scope).onChange(async (value) => {
          journal.scope = value as JournalScope;
          if (value === 'global') journal.ownerPath = undefined;
          await this.plugin.saveSettings();
          this.display();
        });
      });

    // Owner (person or group note) — only for non-global
    if (journal.scope !== 'global') {
      new Setting(content)
        .setName('Owner')
        .setDesc(`The ${journal.scope} note that owns this journal. Only devices registered to this ${journal.scope === 'person' ? 'person' : 'group\'s members'} will see it.`)
        .addText((text) => {
          text.setValue(journal.ownerPath ?? '').onChange(async (value) => {
            journal.ownerPath = value || undefined;
            await this.plugin.saveSettings();
          });
          new FileSuggest(this.app, text.inputEl, this.plugin, (file) => {
            journal.ownerPath = file.path;
            text.setValue(file.path);
            this.plugin.saveSettings();
          });
        });
    }

    // ── Per-journal overrides (collapsible) ─────
    this.renderJournalOverrides(content, journal, () => {
      this.updateFileTreePreview(previewEl, journal);
    });

    // ── File tree preview ────────────────────────
    const previewEl = content.createDiv('dnng-journal-card-preview');
    this.updateFileTreePreview(previewEl, journal);

    // ── Remove button ────────────────────────────
    const removeRow = content.createDiv('dnng-journal-card-remove');
    const removeBtn = removeRow.createEl('button', {
      text: 'Remove journal',
      cls: 'mod-warning',
    });
    removeBtn.addEventListener('click', async () => {
      this.plugin.settings.journals = this.plugin.settings.journals.filter(j => j.id !== journal.id);
      await this.plugin.saveSettings();
      this.display();
    });
  }

  private renderJournalOverrides(
    containerEl: HTMLElement,
    journal: JournalDefinition,
    onUpdate: () => void
  ): void {
    // Collapsible section
    const section = containerEl.createDiv('dnng-journal-card-overrides');
    const header = section.createDiv('dnng-journal-card-overrides-header');
    const chevron = header.createSpan({ cls: 'dnng-journal-card-chevron', text: '\u25BC' });
    header.createSpan({ text: 'Overrides', cls: 'dnng-journal-card-overrides-label' });

    const overridesContent = section.createDiv('dnng-journal-card-overrides-content');
    let overridesCollapsed = true;

    const updateOverridesCollapse = () => {
      section.toggleClass('dnng-journal-card--collapsed', overridesCollapsed);
    };
    header.addEventListener('click', () => {
      overridesCollapsed = !overridesCollapsed;
      updateOverridesCollapse();
    });
    updateOverridesCollapse();

    // Helper: boolean tri-state dropdown (undefined / true / false)
    const addBoolOverride = (name: string, field: keyof JournalDefinition, globalValue: boolean) => {
      const currentValue = journal[field] as boolean | undefined;
      const globalLabel = globalValue ? 'on' : 'off';

      new Setting(overridesContent)
        .setName(name)
        .setDesc(`Global: ${globalLabel}`)
        .addDropdown((dd) => {
          dd.addOption('global', `Use global (${globalLabel})`);
          dd.addOption('true', 'On');
          dd.addOption('false', 'Off');

          dd.setValue(currentValue === undefined ? 'global' : String(currentValue));
          dd.onChange(async (value) => {
            if (value === 'global') {
              (journal as any)[field] = undefined;
            } else {
              (journal as any)[field] = value === 'true';
            }
            await this.plugin.saveSettings();
            onUpdate();
          });
        });
    };

    // Helper: string override (empty = use global)
    const addStringOverride = (name: string, field: keyof JournalDefinition, globalValue: string) => {
      new Setting(overridesContent)
        .setName(name)
        .setDesc(`Global: ${globalValue || '(empty)'}`)
        .addText((text) => {
          text
            .setPlaceholder(`Use global: ${globalValue}`)
            .setValue((journal[field] as string) ?? '')
            .onChange(async (value) => {
              (journal as any)[field] = value || undefined;
              await this.plugin.saveSettings();
            });
        });
    };

    addBoolOverride('Folder-note mode', 'folderNoteMode', this.plugin.settings.folderNotes.enabled);
    addBoolOverride('Auto base MOC', 'autoGenerateBaseMoc', this.plugin.settings.folderNotes.autoGenerateBaseMoc);
    addBoolOverride('Use Templater', 'useTemplater', this.plugin.settings.templates.useTemplater);
    addBoolOverride('Track dates', 'trackDates', this.plugin.settings.frontmatter.trackDates);
    addStringOverride('Date created key', 'dateCreatedKey', this.plugin.settings.frontmatter.createdKey);
    addStringOverride('Date modified key', 'dateModifiedKey', this.plugin.settings.frontmatter.modifiedKey);
    addBoolOverride('Auto-set creator', 'autoSetCreator', this.plugin.settings.identity.autoSetCreator);
    addStringOverride('Creator field name', 'creatorFieldName', this.plugin.settings.identity.creatorFieldName);
    addBoolOverride('Auto-generate UUID', 'autoGenerateUuid', this.plugin.settings.identity.noteUuidAutoGenerate);
    addStringOverride('UUID property', 'uuidProperty', this.plugin.settings.identity.noteUuidProperty);
  }

  private updateFileTreePreview(previewEl: HTMLElement, journal: JournalDefinition): void {
    previewEl.empty();

    // Label
    previewEl.createDiv({
      text: 'File preview',
      cls: 'dnng-journal-card-preview-label',
    });

    const folder = this.plugin.journalResolver.resolveFolder(journal);
    const folderNoteMode = journal.folderNoteMode ?? this.plugin.settings.folderNotes.enabled;
    const baseMoc = journal.autoGenerateBaseMoc ?? this.plugin.settings.folderNotes.autoGenerateBaseMoc;
    const today = (window as any).moment();
    const yesterday = (window as any).moment().subtract(1, 'day');
    const todayName = today.format(journal.format);
    const yesterdayName = yesterday.format(journal.format);
    const folderName = folder.split('/').pop() ?? 'Index';

    let tree = `${folder}/\n`;
    if (baseMoc) tree += `\u251C\u2500\u2500 ${folderName}.base\n`;

    if (folderNoteMode) {
      tree += `\u251C\u2500\u2500 ${todayName}/\n`;
      tree += `\u2502   \u2514\u2500\u2500 ${todayName}.md\n`;
      tree += `\u2514\u2500\u2500 ${yesterdayName}/\n`;
      tree += `    \u2514\u2500\u2500 ${yesterdayName}.md\n`;
    } else {
      tree += `\u251C\u2500\u2500 ${todayName}.md\n`;
      tree += `\u2514\u2500\u2500 ${yesterdayName}.md\n`;
    }

    previewEl.createEl('pre', { text: tree });

    const info = previewEl.createDiv('dnng-journal-card-preview-info');
    const parts: string[] = [];
    if (folderNoteMode) parts.push('folder-note mode');
    if (baseMoc) parts.push('auto base MOC');
    if (journal.templatePath) parts.push(`template: ${journal.templatePath}`);
    info.setText(parts.length > 0 ? parts.join(' \u00B7 ') : 'flat mode');
  }

  private renderFolderNotesSection(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Folder notes').setHeading();

    new Setting(containerEl)
      .setName('Folder-note mode')
      .setDesc(
        'Each periodic note becomes a folder, allowing attachments to nest under it. ' +
        'Works with LostPaul\'s Folder Notes plugin. ' +
        'Off: Journal/Daily/2026-03-24.md — ' +
        'On: Journal/Daily/2026-03-24/2026-03-24.md'
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.folderNotes.enabled).onChange(async (value) => {
          this.plugin.settings.folderNotes.enabled = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Auto-generate periodic index')
      .setDesc(
        'Creates a .base file in each periodic folder as a dashboard showing all notes in that folder'
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.folderNotes.autoGenerateBaseMoc).onChange(async (value) => {
          this.plugin.settings.folderNotes.autoGenerateBaseMoc = value;
          await this.plugin.saveSettings();
        })
      );
  }

  private renderCalendarSection(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Calendar').setHeading();

    new Setting(containerEl)
      .setName('Open on startup')
      .setDesc('Automatically show the calendar sidebar when Obsidian starts')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.calendar.openOnStartup).onChange(async (value) => {
          this.plugin.settings.calendar.openOnStartup = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Show week numbers')
      .setDesc('Display ISO week numbers along the left edge of the calendar')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.calendar.showWeekNumbers).onChange(async (value) => {
          this.plugin.settings.calendar.showWeekNumbers = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Dot indicators')
      .setDesc('Show dots for days with existing notes')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.calendar.dotIndicators).onChange(async (value) => {
          this.plugin.settings.calendar.dotIndicators = value;
          await this.plugin.saveSettings();
        })
      );
  }

  private renderIdentitySection(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Identity').setHeading();

    new Setting(containerEl)
      .setName('Enable multi-user identity')
      .setDesc('Map devices to person notes for per-person journals and creator attribution')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.identity.enabled).onChange(async (value) => {
          this.plugin.settings.identity.enabled = value;
          await this.plugin.saveSettings();
          this.display();
        })
      );

    if (!this.plugin.settings.identity.enabled) return;

    // Current device info
    const deviceId = this.plugin.userRegistry.getCurrentDeviceId();
    const deviceName = this.plugin.userRegistry.getCurrentDeviceName();
    const currentUser = this.plugin.userRegistry.getCurrentUser();

    new Setting(containerEl)
      .setName('This device')
      .setDesc(`${deviceName} (${deviceId.substring(0, 8)}...)`)
      .addText((text) =>
        text
          .setPlaceholder('Registered to...')
          .setValue(currentUser ?? 'Not registered')
          .setDisabled(true)
      );

    // Register device to person note (with autocomplete)
    let selectedPath = currentUser ?? '';
    const registerSetting = new Setting(containerEl)
      .setName('Register this device')
      .setDesc('Select a person note to associate with this device')
      .addText((text) => {
        text
          .setPlaceholder('Search for a person note...')
          .setValue(selectedPath);

        // Attach file suggester to the text input
        new FileSuggest(this.app, text.inputEl, this.plugin, (file) => {
          selectedPath = file.path;
          text.setValue(file.path);
        });

        text.onChange((value) => {
          selectedPath = value;
        });
      })
      .addButton((btn) =>
        btn.setButtonText('Register').onClick(async () => {
          if (selectedPath) {
            const displayName = selectedPath.replace(/\.md$/, '').split('/').pop();
            this.plugin.userRegistry.registerDevice(selectedPath, displayName);
            await this.plugin.saveSettings();
            this.display();
          }
        })
      );

    // Registered devices table
    const mappings = this.plugin.userRegistry.getAllMappings();
    if (mappings.length > 0) {
      new Setting(containerEl).setName('Registered devices').setHeading();

      for (const mapping of mappings) {
        const isCurrentDevice = mapping.deviceId === deviceId;
        const lastSeen = new Date(mapping.lastSeen).toLocaleDateString();
        const desc = `${mapping.userNotePath} | Last seen: ${lastSeen}${isCurrentDevice ? ' (this device)' : ''}`;

        new Setting(containerEl)
          .setName(mapping.deviceName)
          .setDesc(desc)
          .addButton((btn) =>
            btn
              .setButtonText('Remove')
              .setWarning()
              .onClick(async () => {
                this.plugin.userRegistry.removeDevice(mapping.deviceId);
                await this.plugin.saveSettings();
                this.display();
              })
          );
      }
    }

    // Creator attribution
    new Setting(containerEl).setName('Attribution').setHeading();

    new Setting(containerEl)
      .setName('Auto-set creator on new notes')
      .setDesc('Adds a creator field linking to the person note')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.identity.autoSetCreator).onChange(async (value) => {
          this.plugin.settings.identity.autoSetCreator = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Creator field name')
      .setDesc('The frontmatter property name used to store the creator link (e.g., "creator", "author")')
      .addText((text) =>
        text.setValue(this.plugin.settings.identity.creatorFieldName).onChange(async (value) => {
          this.plugin.settings.identity.creatorFieldName = value;
          await this.plugin.saveSettings();
        })
      );

    // Note UUIDs
    new Setting(containerEl).setName('Note identity').setHeading();

    new Setting(containerEl)
      .setName('UUID property name')
      .setDesc('Frontmatter property for stable note IDs (empty to disable)')
      .addText((text) =>
        text.setValue(this.plugin.settings.identity.noteUuidProperty).onChange(async (value) => {
          this.plugin.settings.identity.noteUuidProperty = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Auto-generate UUIDs')
      .setDesc('Automatically assign a unique ID to each new periodic note. Survives renames and moves.')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.identity.noteUuidAutoGenerate).onChange(async (value) => {
          this.plugin.settings.identity.noteUuidAutoGenerate = value;
          await this.plugin.saveSettings();
        })
      );

    // Person/group note discovery
    new Setting(containerEl).setName('Discovery').setHeading();

    new Setting(containerEl)
      .setName('Person notes folder')
      .setDesc('Limit person note discovery to this folder. Leave empty to scan the entire vault.')
      .addText((text) => {
        text.setValue(this.plugin.settings.identity.personNotesFolder).onChange(async (value) => {
          this.plugin.settings.identity.personNotesFolder = value;
          await this.plugin.saveSettings();
        });
        new FolderSuggest(this.app, text.inputEl);
      });

    new Setting(containerEl)
      .setName('Group notes folder')
      .setDesc('Limit group note discovery to this folder. Leave empty to scan the entire vault.')
      .addText((text) => {
        text.setValue(this.plugin.settings.identity.groupNotesFolder).onChange(async (value) => {
          this.plugin.settings.identity.groupNotesFolder = value;
          await this.plugin.saveSettings();
        });
        new FolderSuggest(this.app, text.inputEl);
      });

    // Enterprise type configuration
    new Setting(containerEl).setName('Advanced type configuration').setHeading();

    const tc = this.plugin.settings.identity.typeConfig;

    new Setting(containerEl)
      .setName('Identity type property')
      .setDesc('Frontmatter property that identifies person/group notes')
      .addText((text) =>
        text.setValue(tc.identityTypePropertyName).onChange(async (value) => {
          tc.identityTypePropertyName = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Person type value')
      .setDesc('The value that identifies a note as a person (e.g., "person", "team-member")')
      .addText((text) =>
        text.setValue(tc.personTypeValue).onChange(async (value) => {
          tc.personTypeValue = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Group type value')
      .setDesc('The value that identifies a note as a group (e.g., "group", "team")')
      .addText((text) =>
        text.setValue(tc.groupTypeValue).onChange(async (value) => {
          tc.groupTypeValue = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Members property')
      .setDesc('Frontmatter key containing the list of group members as wikilinks')
      .addText((text) =>
        text.setValue(tc.membersPropertyName).onChange(async (value) => {
          tc.membersPropertyName = value;
          await this.plugin.saveSettings();
        })
      );
  }

  private renderRolloverSection(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Todo rollover').setHeading();

    new Setting(containerEl)
      .setName('Enable todo rollover')
      .setDesc('Carry incomplete checkboxes from previous daily note')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.rollover.enabled).onChange(async (value) => {
          this.plugin.settings.rollover.enabled = value;
          await this.plugin.saveSettings();
        })
      );
  }

  private renderFrontmatterSection(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Frontmatter dates').setHeading();

    new Setting(containerEl)
      .setName('Track dates')
      .setDesc('Auto-populate created and modified dates in frontmatter')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.frontmatter.trackDates).onChange(async (value) => {
          this.plugin.settings.frontmatter.trackDates = value;
          await this.plugin.saveSettings();
        })
      );
  }

  private renderNlpSection(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Natural language dates').setHeading();

    new Setting(containerEl)
      .setName('Enable date suggestions')
      .setDesc('Type the trigger character to get inline date suggestions')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.nlp.enabled).onChange(async (value) => {
          this.plugin.settings.nlp.enabled = value;
          await this.plugin.saveSettings();
        })
      );

    if (this.plugin.settings.nlp.enabled) {
      new Setting(containerEl)
        .setName('Trigger character')
        .setDesc('Type this character followed by a date phrase (e.g., @tomorrow, @next friday) to get suggestions')
        .addText((text) =>
          text.setValue(this.plugin.settings.nlp.triggerChar).onChange(async (value) => {
            this.plugin.settings.nlp.triggerChar = value;
            await this.plugin.saveSettings();
          })
        );
    }
  }

  private renderDebugSection(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Debug').setHeading();

    new Setting(containerEl)
      .setName('Enable debug logging')
      .setDesc('Writes detailed logs to debug.log in the vault root and optionally to the browser console (Ctrl+Shift+I)')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.debug.enabled).onChange(async (value) => {
          this.plugin.settings.debug.enabled = value;
          this.plugin.debug.setEnabled(value);
          await this.plugin.saveSettings();
          this.display();
        })
      );

    if (!this.plugin.settings.debug.enabled) return;

    new Setting(containerEl)
      .setName('Console output')
      .setDesc('Also log to browser DevTools console (Ctrl+Shift+I)')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.debug.consoleOutput).onChange(async (value) => {
          this.plugin.settings.debug.consoleOutput = value;
          this.plugin.debug.setConsoleOutput(value);
          await this.plugin.saveSettings();
        })
      );

    // Category filters
    const { LOG_CATEGORY_GROUPS } = require('../utils/debug');
    for (const [groupName, categories] of Object.entries(LOG_CATEGORY_GROUPS) as [string, string[]][]) {
      new Setting(containerEl)
        .setName(groupName)
        .setDesc((categories as string[]).join(', '))
        .setHeading();

      for (const cat of categories as string[]) {
        const isEnabled = this.plugin.settings.debug.categories[cat] !== false;
        new Setting(containerEl)
          .setName(cat)
          .addToggle((toggle) =>
            toggle.setValue(isEnabled).onChange(async (value) => {
              if (value) {
                delete this.plugin.settings.debug.categories[cat];
              } else {
                this.plugin.settings.debug.categories[cat] = false;
              }
              this.plugin.debug.setCategories(this.plugin.settings.debug.categories);
              await this.plugin.saveSettings();
            })
          );
      }
    }

    // Clear log button
    new Setting(containerEl)
      .setName('Clear debug log')
      .setDesc('Clear the contents of debug.log')
      .addButton((btn) =>
        btn.setButtonText('Clear').onClick(async () => {
          await this.plugin.debug.clear();
        })
      );
  }
}
