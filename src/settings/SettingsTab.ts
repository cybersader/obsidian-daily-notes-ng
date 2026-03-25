import { App, PluginSettingTab, Setting, AbstractInputSuggest, TFile } from 'obsidian';
import type DailyNotesNGPlugin from '../main';
import { ALL_PERIODICITIES, PERIODICITY_LABELS } from '../periodic/periodicity';
import type { Periodicity } from '../periodic/periodicity';

/**
 * File path suggester that shows matching vault files as you type.
 * Filters to person notes when the identity system can detect them.
 */
/**
 * Folder path suggester for folder settings.
 */
class FolderSuggest extends AbstractInputSuggest<string> {
  getSuggestions(query: string): string[] {
    const lowerQuery = query.toLowerCase();
    const folders = new Set<string>();
    for (const file of this.app.vault.getMarkdownFiles()) {
      const folder = file.parent?.path;
      if (folder && folder !== '/' && folder.toLowerCase().includes(lowerQuery)) {
        folders.add(folder);
      }
    }
    return [...folders].sort().slice(0, 20);
  }

  renderSuggestion(folder: string, el: HTMLElement): void {
    el.setText(folder);
  }

  selectSuggestion(folder: string): void {
    (this as any).inputEl.value = folder;
    (this as any).inputEl.dispatchEvent(new Event('input'));
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

    this.renderPeriodicSection(containerEl);
    this.renderFolderNotesSection(containerEl);
    this.renderCalendarSection(containerEl);
    this.renderIdentitySection(containerEl);
    this.renderRolloverSection(containerEl);
    this.renderFrontmatterSection(containerEl);
    this.renderNlpSection(containerEl);
    this.renderDebugSection(containerEl);
  }

  private renderPeriodicSection(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Periodic notes').setHeading();

    for (const periodicity of ALL_PERIODICITIES) {
      const label = PERIODICITY_LABELS[periodicity];
      const config = this.plugin.settings.periodic[periodicity];

      new Setting(containerEl)
        .setName(`Enable ${label.toLowerCase()} notes`)
        .addToggle((toggle) =>
          toggle.setValue(config.enabled).onChange(async (value) => {
            config.enabled = value;
            await this.plugin.saveSettings();
            this.display();
          })
        );

      if (config.enabled) {
        new Setting(containerEl)
          .setName(`${label} folder`)
          .setDesc(`Folder for ${label.toLowerCase()} notes. Use {{person}} for per-person folders.`)
          .addText((text) => {
            text.setValue(config.folder).onChange(async (value) => {
              config.folder = value;
              await this.plugin.saveSettings();
            });
            new FolderSuggest(this.app, text.inputEl);
          });

        new Setting(containerEl)
          .setName(`${label} format`)
          .setDesc('Moment.js date format for filenames')
          .addText((text) =>
            text.setValue(config.format).onChange(async (value) => {
              config.format = value;
              await this.plugin.saveSettings();
            })
          );

        new Setting(containerEl)
          .setName(`${label} template`)
          .setDesc('Path to template file')
          .addText((text) => {
            text.setValue(config.templatePath).onChange(async (value) => {
              config.templatePath = value;
              await this.plugin.saveSettings();
            });
            new FileSuggest(this.app, text.inputEl, this.plugin, (file) => {
              config.templatePath = file.path;
              text.setValue(file.path);
              this.plugin.saveSettings();
            });
          });
      }
    }
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
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.calendar.openOnStartup).onChange(async (value) => {
          this.plugin.settings.calendar.openOnStartup = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Show week numbers')
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
      .setDesc('Folder to scan for person notes (empty for entire vault)')
      .addText((text) => {
        text.setValue(this.plugin.settings.identity.personNotesFolder).onChange(async (value) => {
          this.plugin.settings.identity.personNotesFolder = value;
          await this.plugin.saveSettings();
        });
        new FolderSuggest(this.app, text.inputEl);
      });

    new Setting(containerEl)
      .setName('Group notes folder')
      .setDesc('Folder to scan for group notes (empty for entire vault)')
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
      .addText((text) =>
        text.setValue(tc.personTypeValue).onChange(async (value) => {
          tc.personTypeValue = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Group type value')
      .addText((text) =>
        text.setValue(tc.groupTypeValue).onChange(async (value) => {
          tc.groupTypeValue = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Members property')
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
      .setDesc('Writes to debug.log in the vault root')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.debug).onChange(async (value) => {
          this.plugin.settings.debug = value;
          await this.plugin.saveSettings();
        })
      );
  }
}
