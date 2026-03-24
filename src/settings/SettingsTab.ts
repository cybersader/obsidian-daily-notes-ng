import { App, PluginSettingTab, Setting } from 'obsidian';
import type DailyNotesNGPlugin from '../main';
import { ALL_PERIODICITIES, PERIODICITY_LABELS } from '../periodic/periodicity';

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

    // Periodic notes settings
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
          .setDesc(`Folder for ${label.toLowerCase()} notes`)
          .addText((text) =>
            text.setValue(config.folder).onChange(async (value) => {
              config.folder = value;
              await this.plugin.saveSettings();
            })
          );

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
          .addText((text) =>
            text.setValue(config.templatePath).onChange(async (value) => {
              config.templatePath = value;
              await this.plugin.saveSettings();
            })
          );
      }
    }

    // Calendar settings
    new Setting(containerEl).setName('Calendar').setHeading();

    new Setting(containerEl)
      .setName('Open on startup')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.calendar.openOnStartup).onChange(async (value) => {
          this.plugin.settings.calendar.openOnStartup = value;
          await this.plugin.saveSettings();
        })
      );

    // TODO: Add remaining settings sections (rollover, frontmatter, NLP, identity, debug)
  }
}
