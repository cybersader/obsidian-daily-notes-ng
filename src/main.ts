import { Plugin, WorkspaceLeaf } from 'obsidian';
import type { DailyNotesNGSettings } from './settings/types';
import { DEFAULT_SETTINGS } from './constants';
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
import { PeriodicConfigResolver } from './identity/PeriodicConfigResolver';
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
  configResolver!: PeriodicConfigResolver;
  templateEngine!: TemplateEngine;
  templaterBridge!: TemplaterBridge;
  debug!: DebugLog;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.debug = new DebugLog(this.app, this.settings.debug);

    // Initialize identity system
    this.deviceManager = new DeviceIdentityManager();
    this.userRegistry = new UserRegistry(this.settings, this.deviceManager);
    this.noteUuidService = new NoteUuidService(this.app, this.settings);
    this.personNoteService = new PersonNoteService(this.app, this.settings);
    this.groupRegistry = new GroupRegistry(this.app, this.settings);
    this.devicePreferences = new DevicePreferences();
    this.configResolver = new PeriodicConfigResolver(
      this.app, this.settings, this.userRegistry,
      this.personNoteService, this.devicePreferences
    );

    // Initialize template system
    this.templateEngine = new TemplateEngine(this.app, this.settings);
    this.templaterBridge = new TemplaterBridge(this.app);

    // Initialize core managers (now with identity-aware resolver)
    this.periodicManager = new PeriodicNoteManager(
      this.app, this.settings, this.configResolver,
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

    // Ribbon icon to open calendar
    this.addRibbonIcon('calendar', 'Open calendar', () => {
      this.activateCalendarView();
    });

    // Open calendar on startup if configured
    if (this.settings.calendar.openOnStartup) {
      this.app.workspace.onLayoutReady(() => {
        this.activateCalendarView();
      });
    }

    // Update device lastSeen if identity is enabled
    if (this.settings.identity.enabled && this.userRegistry.getCurrentUser()) {
      this.userRegistry.updateLastSeen();
      await this.saveSettings();
    }

    await this.debug.log('Daily Notes NG loaded', { version: this.manifest.version });
  }

  async onunload(): Promise<void> {
    // Cleanup handled by Obsidian's plugin lifecycle
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
    this.settings = deepMerge(DEFAULT_SETTINGS, (await this.loadData()) as Partial<DailyNotesNGSettings>);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
