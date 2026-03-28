import { Plugin, WorkspaceLeaf } from 'obsidian';
import type { DailyNotesNGSettings } from './settings/types';
import { DEFAULT_SETTINGS, migratePeriodicToJournals } from './constants';
import { DailyNotesNGSettingsTab } from './settings/SettingsTab';
import { PeriodicNoteManager } from './periodic/PeriodicNoteManager';
import { CalendarView, CALENDAR_VIEW_TYPE } from './calendar/CalendarView';
import { NavigationCommands } from './navigation/NavigationCommands';
import { TodoRollover } from './rollover/TodoRollover';
import { FrontmatterDateTracker } from './frontmatter/FrontmatterDateTracker';
import { DateSuggest } from './nlp/DateSuggest';
import { DeviceIdentityManager } from './identity/DeviceIdentityManager';
import { UserRegistry } from './identity/UserRegistry';
import { NoteUuidService } from './identity/NoteUuidService';
import { PersonNoteService } from './identity/PersonNoteService';
import { GroupRegistry } from './identity/GroupRegistry';
import { DevicePreferences } from './identity/DevicePreferences';
import { JournalResolver } from './identity/JournalResolver';
import { TemplateEngine } from './templates/TemplateEngine';
import { TemplaterBridge } from './templates/TemplaterBridge';
import { DebugLog } from './utils/debug';
import { deepMerge } from './utils/deepMerge';

export default class DailyNotesNGPlugin extends Plugin {
  settings: DailyNotesNGSettings = DEFAULT_SETTINGS;
  periodicManager!: PeriodicNoteManager;
  todoRollover!: TodoRollover;
  frontmatterTracker!: FrontmatterDateTracker;
  deviceManager!: DeviceIdentityManager;
  userRegistry!: UserRegistry;
  noteUuidService!: NoteUuidService;
  personNoteService!: PersonNoteService;
  groupRegistry!: GroupRegistry;
  devicePreferences!: DevicePreferences;
  journalResolver!: JournalResolver;
  templateEngine!: TemplateEngine;
  templaterBridge!: TemplaterBridge;
  debug!: DebugLog;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.debug = new DebugLog(this.app, this.settings.debug.enabled);
    this.debug.setConsoleOutput(this.settings.debug.consoleOutput);
    this.debug.setCategories(this.settings.debug.categories);

    // Initialize identity system
    this.deviceManager = new DeviceIdentityManager();
    this.userRegistry = new UserRegistry(this.settings, this.deviceManager);
    this.noteUuidService = new NoteUuidService(this.app, this.settings);
    this.personNoteService = new PersonNoteService(this.app, this.settings);
    this.groupRegistry = new GroupRegistry(this.app, this.settings);
    this.devicePreferences = new DevicePreferences();

    // Journal resolver (replaces PeriodicConfigResolver)
    this.journalResolver = new JournalResolver(
      this.app, this.settings, this.userRegistry,
      this.personNoteService, this.groupRegistry, this.debug
    );

    // Initialize template system
    this.templateEngine = new TemplateEngine(this.app, this.settings);
    this.templaterBridge = new TemplaterBridge(this.app);

    // Initialize core managers
    this.periodicManager = new PeriodicNoteManager(
      this.app, this.settings, this.journalResolver,
      this.userRegistry, this.noteUuidService,
      this.templateEngine, this.templaterBridge, this.debug
    );
    this.todoRollover = new TodoRollover(this.app, this.settings, this.debug);
    this.frontmatterTracker = new FrontmatterDateTracker(this.app, this.settings, this.debug);

    // Register calendar sidebar view
    this.registerView(
      CALENDAR_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new CalendarView(leaf, this)
    );

    // Register navigation commands
    const nav = new NavigationCommands(this);
    nav.registerCommands();

    // Register inline date suggestor
    if (this.settings.nlp.enabled) {
      this.registerEditorSuggest(new DateSuggest(this.app, this.settings));
    }

    // Register frontmatter date tracking
    if (this.settings.frontmatter.trackDates) {
      this.frontmatterTracker.register(this);
    }

    // Settings tab
    this.addSettingTab(new DailyNotesNGSettingsTab(this.app, this));

    // Ribbon icon — open today's note (primary action)
    this.addRibbonIcon('calendar-check', 'Daily Notes NG: Open today', () => {
      const journals = this.journalResolver.getJournalsForPeriodicity('daily');
      if (journals.length === 1) {
        this.periodicManager.openPeriodicNote((window as any).moment(), journals[0]);
      } else if (journals.length > 1) {
        // Trigger via command which handles the picker
        (this.app as any).commands.executeCommandById('daily-notes-ng:open-today');
      }
    });

    // Open calendar on startup if configured
    if (this.settings.calendar.openOnStartup) {
      this.app.workspace.onLayoutReady(() => {
        this.activateCalendarView();
      });
    }

    // Register property types so Obsidian renders them correctly
    if (this.settings.identity.enabled) {
      const typeManager = (this.app as any).metadataTypeManager;
      if (typeManager?.setType) {
        if (this.settings.identity.autoSetCreator) {
          typeManager.setType(this.settings.identity.creatorFieldName, 'multitext');
        }
      }
    }

    // Update device lastSeen if identity is enabled
    if (this.settings.identity.enabled && this.userRegistry.getCurrentUser()) {
      this.userRegistry.updateLastSeen();
      await this.saveSettings();
    }

    await this.debug.log('Daily Notes NG loaded', {
      version: this.manifest.version,
      journals: this.settings.journals.length,
    });
  }

  async onunload(): Promise<void> {}

  /**
   * Called by Obsidian when another device syncs plugin settings (data.json).
   * Reloads journals and identity so changes from other devices take effect
   * without requiring a full plugin restart.
   */
  async onExternalSettingsChange(): Promise<void> {
    await this.debug.log('Plugin', 'External settings change detected (Obsidian Sync)');
    await this.loadSettings();
    this.debug.setEnabled(this.settings.debug.enabled);
    this.debug.setConsoleOutput(this.settings.debug.consoleOutput);
    this.debug.setCategories(this.settings.debug.categories);
    // Update refs that hold settings pointer
    this.userRegistry = new UserRegistry(this.settings, this.deviceManager);
    this.personNoteService = new PersonNoteService(this.app, this.settings);
    this.groupRegistry = new GroupRegistry(this.app, this.settings);
    this.journalResolver = new JournalResolver(
      this.app, this.settings, this.userRegistry,
      this.personNoteService, this.groupRegistry, this.debug
    );
    await this.debug.log('Plugin', 'Settings reloaded after sync', {
      journals: this.settings.journals.length,
      journalNames: this.settings.journals.map(j => j.name),
    });
  }

  async activateCalendarView(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(CALENDAR_VIEW_TYPE);
    if (existing.length > 0) {
      this.app.workspace.revealLeaf(existing[0]);
      return;
    }
    const leaf = this.app.workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({ type: CALENDAR_VIEW_TYPE, active: true });
      this.app.workspace.revealLeaf(leaf);
    }
  }

  async loadSettings(): Promise<void> {
    const saved = (await this.loadData()) as any;
    let settings = deepMerge(DEFAULT_SETTINGS, saved as Partial<DailyNotesNGSettings>);

    // Migration: debug setting changed from boolean to object
    if (typeof saved?.debug === 'boolean') {
      settings.debug = { enabled: saved.debug, consoleOutput: true, categories: {} };
    }

    // Migration: convert old periodic format to journals
    if (saved?.periodic && !saved?.journals) {
      const migrated = migratePeriodicToJournals(
        saved.periodic,
        saved.personPeriodicOverrides ?? saved?.identity?.personPeriodicOverrides
      );
      settings.journals = migrated;
      delete (settings as any).periodic;
      delete (settings as any).personPeriodicOverrides;
      await this.saveData(settings);
      console.log('Daily Notes NG: Migrated periodic settings to journals format');
    }

    this.settings = settings;
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
