import {
  App,
  ColorComponent,
  Component,
  Notice,
  Plugin,
  Setting,
  TextComponent,
  TFile,
  TFolder,
  getLanguage,
  moment,
  normalizePath,
} from "obsidian";
import {
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
  getDailyNoteSettings,
} from "obsidian-daily-notes-interface";

const HIDDEN_CORE_RIBBON_CLASS = "daily-notes-calendar-core-hidden";

type MomentDate = ReturnType<typeof moment>;
type ReportType = "week" | "month";
type PickerMode = "year" | "month";

interface CalendarSettings {
  monthBackgroundOpacity: number;
  monthBorderOpacity: number;
  monthBackgroundColor: string;
  monthBackgroundUseAccent: boolean;
  dayBackgroundColor: string;
  dayBackgroundOpacity: number;
  dayBackgroundUseTheme: boolean;
  emptyDayBackgroundColor: string;
  emptyDayBackgroundOpacity: number;
  emptyDayBackgroundUseTheme: boolean;
  dayFontSize: number;
  dayFontWeight: number;
  dayGap: number;
  extraDailyNoteFolders: string;
  extraDailyNoteFormats: string;
  weeklyReportFolder: string;
  weeklyReportFormat: string;
  extraWeeklyReportFolders: string;
  extraWeeklyReportFormats: string;
  monthlyReportFolder: string;
  monthlyReportFormat: string;
  extraMonthlyReportFolders: string;
  extraMonthlyReportFormats: string;
}

const DEFAULT_SETTINGS: CalendarSettings = {
  monthBackgroundOpacity: 5,
  monthBorderOpacity: 55,
  monthBackgroundColor: "#7c3aed",
  monthBackgroundUseAccent: true,
  dayBackgroundColor: "#1C1C1C",
  dayBackgroundOpacity: 80,
  dayBackgroundUseTheme: true,
  emptyDayBackgroundColor: "#808080",
  emptyDayBackgroundOpacity: 16,
  emptyDayBackgroundUseTheme: true,
  dayFontSize: 12,
  dayFontWeight: 600,
  dayGap: 6,
  extraDailyNoteFolders: "",
  extraDailyNoteFormats: "",
  weeklyReportFolder: "",
  weeklyReportFormat: "[Weekly-]gggg-[W]ww",
  extraWeeklyReportFolders: "",
  extraWeeklyReportFormats: "",
  monthlyReportFolder: "",
  monthlyReportFormat: "[Monthly-]YYYY-MM",
  extraMonthlyReportFolders: "",
  extraMonthlyReportFormats: "",
};

interface Messages {
  calendar: string;
  openCalendar: string;
  openCurrentMonth: string;
  openToday: string;
  dailyNotesRequired: string;
  dailyNoteError: string;
  reportError: (report: string) => string;
  previousMonth: string;
  nextMonth: string;
  selectYear: string;
  selectMonth: string;
  closePicker: string;
  openCreateToday: string;
  monthReport: string;
  weekReport: string;
  monthlyReportName: string;
  weeklyReportName: string;
  dailyNotesWarning: string;
  noteExists: string;
  createNote: string;
  openCreate: string;
  settings: string;
  openSettings: string;
  settingsHint: string;
  backgroundOpacity: string;
  borderOpacity: string;
  backgroundColor: string;
  useAccentColor: string;
  dayBackgroundColor: string;
  dayBackgroundOpacity: string;
  dayBackgroundUseTheme: string;
  emptyDayBackgroundColor: string;
  emptyDayBackgroundOpacity: string;
  emptyDayBackgroundUseTheme: string;
  fontSize: string;
  fontWeight: string;
  dateSpacing: string;
  monthGroup: string;
  notedDayGroup: string;
  emptyDayGroup: string;
  typographyGroup: string;
  dailyNotesGroup: string;
  weeklyReportGroup: string;
  monthlyReportGroup: string;
  appearanceTab: string;
  notesReportsTab: string;
  openDailyNotesSettings: string;
  extraDailyNoteFolders: string;
  extraDailyNoteFormats: string;
  defaultDailyNoteFolder: string;
  defaultDailyNoteFormat: string;
  vaultRoot: string;
  dailyNotesSettingsUnavailable: string;
  resetDefaults: string;
  weekdays: string[];
}

const ZH: Messages = {
  calendar: "日记月历",
  openCalendar: "打开日记月历",
  openCurrentMonth: "打开本月日记月历",
  openToday: "打开/创建今天日记",
  dailyNotesRequired: "请先在 Obsidian 设置中启用“日记”核心插件。",
  dailyNoteError: "无法打开或创建日记，请检查“日记”核心插件的设置。",
  reportError: (report) => `无法打开或创建${report}。`,
  previousMonth: "上个月",
  nextMonth: "下个月",
  selectYear: "选择年份",
  selectMonth: "选择月份",
  closePicker: "关闭选择器",
  openCreateToday: "打开 / 创建今天日记",
  monthReport: "月报",
  weekReport: "周报",
  monthlyReportName: "月报",
  weeklyReportName: "周报",
  dailyNotesWarning: "请先在设置 → 核心插件中启用“日记”，再使用月历打开或创建日记。",
  noteExists: "已有日记",
  createNote: "创建日记",
  openCreate: "打开/创建",
  settings: "月历外观设置",
  openSettings: "打开月历外观设置",
  settingsHint: "调整会自动保存，并在右侧预览中生效。",
  backgroundOpacity: "底色不透明度",
  borderOpacity: "边框深浅",
  backgroundColor: "自定义底色",
  useAccentColor: "跟随主题强调色",
  dayBackgroundColor: "自定义底色",
  dayBackgroundOpacity: "底色不透明度",
  dayBackgroundUseTheme: "跟随主题底色",
  emptyDayBackgroundColor: "自定义底色",
  emptyDayBackgroundOpacity: "底色不透明度",
  emptyDayBackgroundUseTheme: "跟随主题底色",
  fontSize: "字号",
  fontWeight: "字重",
  dateSpacing: "行列间距",
  monthGroup: "本月区域",
  notedDayGroup: "有日记日期块",
  emptyDayGroup: "无日记日期块",
  typographyGroup: "日期排版",
  dailyNotesGroup: "日记识别",
  weeklyReportGroup: "周报识别",
  monthlyReportGroup: "月报识别",
  appearanceTab: "外观",
  notesReportsTab: "日记与报告",
  openDailyNotesSettings: "打开 Obsidian 日记设置",
  extraDailyNoteFolders: "额外目录",
  extraDailyNoteFormats: "额外格式",
  defaultDailyNoteFolder: "默认目录",
  defaultDailyNoteFormat: "默认格式",
  vaultRoot: "库根目录",
  dailyNotesSettingsUnavailable: "无法打开 Obsidian 日记设置。",
  resetDefaults: "恢复默认外观",
  weekdays: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
};

const EN: Messages = {
  calendar: "Daily note calendar",
  openCalendar: "Open daily note calendar",
  openCurrentMonth: "Open this month's daily note calendar",
  openToday: "Open/create today's daily note",
  dailyNotesRequired: "Enable the Daily notes core plugin in Obsidian settings first.",
  dailyNoteError: "Unable to open or create the daily note. Check the Daily notes core plugin settings.",
  reportError: (report) => `Unable to open or create the ${report}.`,
  previousMonth: "Previous month",
  nextMonth: "Next month",
  selectYear: "Select year",
  selectMonth: "Select month",
  closePicker: "Close picker",
  openCreateToday: "Open / create today's note",
  monthReport: "Monthly",
  weekReport: "Week",
  monthlyReportName: "monthly report",
  weeklyReportName: "weekly report",
  dailyNotesWarning: "Enable Daily notes under Settings → Core plugins before using this calendar.",
  noteExists: "daily note exists",
  createNote: "create daily note",
  openCreate: "Open/create",
  settings: "Calendar appearance",
  openSettings: "Open calendar appearance settings",
  settingsHint: "Changes are saved automatically and shown in the preview.",
  backgroundOpacity: "Background opacity",
  borderOpacity: "Border opacity",
  backgroundColor: "Custom background",
  useAccentColor: "Use theme accent color",
  dayBackgroundColor: "Custom background",
  dayBackgroundOpacity: "Background opacity",
  dayBackgroundUseTheme: "Use theme background",
  emptyDayBackgroundColor: "Custom background",
  emptyDayBackgroundOpacity: "Background opacity",
  emptyDayBackgroundUseTheme: "Use theme background",
  fontSize: "Font size",
  fontWeight: "Font weight",
  dateSpacing: "Spacing",
  monthGroup: "Current month",
  notedDayGroup: "Dates with notes",
  emptyDayGroup: "Dates without notes",
  typographyGroup: "Date typography",
  dailyNotesGroup: "Daily note discovery",
  weeklyReportGroup: "Weekly report discovery",
  monthlyReportGroup: "Monthly report discovery",
  appearanceTab: "Appearance",
  notesReportsTab: "Notes & reports",
  openDailyNotesSettings: "Open Obsidian Daily notes settings",
  extraDailyNoteFolders: "Additional folders",
  extraDailyNoteFormats: "Additional formats",
  defaultDailyNoteFolder: "Default folder",
  defaultDailyNoteFormat: "Default format",
  vaultRoot: "Vault root",
  dailyNotesSettingsUnavailable: "Unable to open Obsidian Daily notes settings.",
  resetDefaults: "Reset appearance",
  weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

function isChinese(): boolean {
  return getLanguage().toLowerCase().startsWith("zh");
}

function getMessages(): Messages {
  return isChinese() ? ZH : EN;
}

interface DailyNotesInternalPlugin {
  enabled: boolean;
  instance?: {
    options?: {
      folder?: string;
    };
  };
}

interface InternalPlugins {
  getPluginById(id: string): DailyNotesInternalPlugin | null;
}

function getCoreDailyNotesPlugin(
  app: App,
): DailyNotesInternalPlugin | null | undefined {
  return (app as App & { internalPlugins?: InternalPlugins }).internalPlugins
    ?.getPluginById("daily-notes");
}

function isCoreDailyNotesEnabled(app: App): boolean {
  return getCoreDailyNotesPlugin(app)?.enabled ?? false;
}

function getDailyNotesFolder(app: App): string {
  const folder = getCoreDailyNotesPlugin(app)?.instance?.options?.folder ?? "";
  return folder.trim().replace(/^\/+|\/+$/g, "");
}

function positionPopover(popoverEl: HTMLElement, anchorEl: HTMLElement): void {
  const margin = 12;
  const gap = 10;
  const anchorRect = anchorEl.getBoundingClientRect();
  const width = popoverEl.offsetWidth;
  const height = popoverEl.offsetHeight;

  let left = anchorRect.right + gap;
  if (left + width > window.innerWidth - margin) {
    left = window.innerWidth - width - margin;
  }

  const top = Math.max(
    margin,
    Math.min(anchorRect.top, window.innerHeight - height - margin),
  );

  popoverEl.style.left = `${Math.max(margin, left)}px`;
  popoverEl.style.top = `${top}px`;
}

export default class DailyNotesCalendarPlugin extends Plugin {
  settings: CalendarSettings = { ...DEFAULT_SETTINGS };
  private ribbonIconEl!: HTMLElement;
  private calendarPopover?: DailyCalendarPopover;
  private settingsPopover?: DailyCalendarSettingsPopover;

  async onload(): Promise<void> {
    const savedSettings = (await this.loadData()) as Partial<CalendarSettings> | null;
    this.settings = { ...DEFAULT_SETTINGS, ...savedSettings };
    const dailyNotesFolder = getDailyNotesFolder(this.app);
    if (savedSettings?.weeklyReportFolder === undefined) {
      this.settings.weeklyReportFolder = dailyNotesFolder;
    }
    if (savedSettings?.monthlyReportFolder === undefined) {
      this.settings.monthlyReportFolder = dailyNotesFolder;
    }
    if (savedSettings?.weeklyReportFormat === "gggg-[W]ww") {
      this.settings.weeklyReportFormat = DEFAULT_SETTINGS.weeklyReportFormat;
    }
    if (savedSettings?.monthlyReportFormat === "YYYY-MM") {
      this.settings.monthlyReportFormat = DEFAULT_SETTINGS.monthlyReportFormat;
    }

    const messages = getMessages();
    this.ribbonIconEl = this.addRibbonIcon(
      "calendar-days",
      messages.openCalendar,
      () => this.toggleCalendarPopover(),
    );
    this.ribbonIconEl.dataset.dailyNotesCalendar = "true";
    this.registerDomEvent(this.ribbonIconEl, "contextmenu", (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      this.toggleSettingsPopover();
    });

    this.addCommand({
      id: "open-daily-notes-calendar",
      name: messages.openCurrentMonth,
      callback: () => this.toggleCalendarPopover(),
    });

    this.addCommand({
      id: "open-daily-notes-calendar-settings",
      name: messages.openSettings,
      callback: () => this.toggleSettingsPopover(),
    });

    this.addCommand({
      id: "open-or-create-today-daily-note",
      name: messages.openToday,
      callback: () => void this.openDailyNote(moment()),
    });

    this.app.workspace.onLayoutReady(() => {
      this.restoreCoreDailyNotesRibbon();
    });
  }

  onunload(): void {
    this.closeCalendarPopover();
    this.closeSettingsPopover();
    this.restoreCoreDailyNotesRibbon();
  }

  toggleCalendarPopover(): void {
    this.closeSettingsPopover();
    if (this.calendarPopover) {
      this.closeCalendarPopover();
      return;
    }

    this.calendarPopover = new DailyCalendarPopover(
      this.app,
      this,
      this.ribbonIconEl,
    );
    this.calendarPopover.load();
  }

  closeCalendarPopover(): void {
    const popover = this.calendarPopover;
    this.calendarPopover = undefined;
    popover?.unload();
  }

  toggleSettingsPopover(): void {
    this.closeCalendarPopover();
    if (this.settingsPopover) {
      this.closeSettingsPopover();
      return;
    }

    this.settingsPopover = new DailyCalendarSettingsPopover(this, this.ribbonIconEl);
    this.settingsPopover.load();
  }

  closeSettingsPopover(): void {
    const popover = this.settingsPopover;
    this.settingsPopover = undefined;
    popover?.unload();
  }

  async updateSettings(update: Partial<CalendarSettings>): Promise<void> {
    this.settings = { ...this.settings, ...update };
    await this.saveData(this.settings);
    this.settingsPopover?.refreshPreview();
  }

  async resetSettings(): Promise<void> {
    const dailyNotesFolder = getDailyNotesFolder(this.app);
    this.settings = {
      ...DEFAULT_SETTINGS,
      weeklyReportFolder: dailyNotesFolder,
      monthlyReportFolder: dailyNotesFolder,
    };
    await this.saveData(this.settings);
    this.settingsPopover?.refreshPreview();
  }

  findDailyNote(date: MomentDate, dailyNotes: Record<string, TFile>): TFile | undefined {
    const coreNote = getDailyNote(date, dailyNotes);
    if (coreNote) return coreNote;

    const coreSettings = getDailyNoteSettings();
    const folders = Array.from(new Set([
      coreSettings.folder ?? "",
      ...this.settings.extraDailyNoteFolders.split(/[,\n]/),
    ].map((folder) => folder.trim().replace(/^\/+|\/+$/g, ""))));
    const formats = Array.from(new Set([
      coreSettings.format || "YYYY-MM-DD",
      ...this.settings.extraDailyNoteFormats.split(/[,\n]/),
    ].map((format) => format.trim()).filter(Boolean)));

    for (const folder of folders) {
      for (const format of formats) {
        const fileName = `${date.format(format)}.md`;
        const path = normalizePath(folder ? `${folder}/${fileName}` : fileName);
        const file = this.app.vault.getAbstractFileByPath(path);
        if (file instanceof TFile) return file;
      }
    }
    return undefined;
  }

  openDailyNotesSettings(): void {
    const settings = (this.app as App & {
      setting?: { open(): void; openTabById(id: string): void };
    }).setting;
    if (!settings) {
      new Notice(getMessages().dailyNotesSettingsUnavailable);
      return;
    }
    settings.open();
    settings.openTabById("daily-notes");
  }

  async openDailyNote(date: MomentDate): Promise<void> {
    if (!this.ensureDailyNotesEnabled()) return;

    try {
      const dailyNotes = getAllDailyNotes();
      const existingNote = this.findDailyNote(date, dailyNotes);
      const note = existingNote ?? (await createDailyNote(date));
      if (!note) throw new Error("Daily note creation returned no file");
      await this.openNoteAndClosePopover(note);
    } catch (error) {
      console.error("Daily Notes Calendar: failed to open daily note", error);
      new Notice(getMessages().dailyNoteError);
    }
  }

  getReportName(date: MomentDate, type: ReportType): string {
    const format = type === "week"
      ? this.settings.weeklyReportFormat || DEFAULT_SETTINGS.weeklyReportFormat
      : this.settings.monthlyReportFormat || DEFAULT_SETTINGS.monthlyReportFormat;
    return date.format(format);
  }

  async openReport(date: MomentDate, type: ReportType): Promise<void> {
    if (!this.ensureDailyNotesEnabled()) return;

    try {
      const defaultFolder = type === "week"
        ? this.settings.weeklyReportFolder
        : this.settings.monthlyReportFolder;
      const defaultFormat = type === "week"
        ? this.settings.weeklyReportFormat || DEFAULT_SETTINGS.weeklyReportFormat
        : this.settings.monthlyReportFormat || DEFAULT_SETTINGS.monthlyReportFormat;
      const extraFolders = type === "week"
        ? this.settings.extraWeeklyReportFolders
        : this.settings.extraMonthlyReportFolders;
      const extraFormats = type === "week"
        ? this.settings.extraWeeklyReportFormats
        : this.settings.extraMonthlyReportFormats;
      const folders = Array.from(new Set([
        defaultFolder,
        ...extraFolders.split(/[,\n]/),
      ].map((folder) => folder.trim().replace(/^\/+|\/+$/g, ""))));
      const formats = Array.from(new Set([
        defaultFormat,
        ...extraFormats.split(/[,\n]/),
      ].map((format) => format.trim()).filter(Boolean)));

      let note: TFile | undefined;
      for (const folder of folders) {
        for (const format of formats) {
          const fileName = `${date.format(format)}.md`;
          const path = normalizePath(folder ? `${folder}/${fileName}` : fileName);
          const file = this.app.vault.getAbstractFileByPath(path);
          if (file instanceof TFile) {
            note = file;
            break;
          }
        }
        if (note) break;
      }

      if (!note) {
        const reportName = this.getReportName(date, type);
        const folder = defaultFolder.trim().replace(/^\/+|\/+$/g, "");
        const path = normalizePath(
          folder ? `${folder}/${reportName}.md` : `${reportName}.md`,
        );
        const existingFile = this.app.vault.getAbstractFileByPath(path);
        if (existingFile && !(existingFile instanceof TFile)) {
          throw new Error(`A folder already exists at ${path}`);
        }
        const parentFolder = path.split("/").slice(0, -1).join("/");
        await this.ensureFolderExists(parentFolder);
        note = await this.app.vault.create(path, "");
      }
      await this.openNoteAndClosePopover(note);
    } catch (error) {
      console.error("Daily Notes Calendar: failed to open report", error);
      const messages = getMessages();
      const report = type === "week"
        ? messages.weeklyReportName
        : messages.monthlyReportName;
      new Notice(messages.reportError(report));
    }
  }

  private ensureDailyNotesEnabled(): boolean {
    if (isCoreDailyNotesEnabled(this.app)) return true;
    new Notice(getMessages().dailyNotesRequired);
    return false;
  }

  private async ensureFolderExists(folder: string): Promise<void> {
    if (!folder) return;

    let currentPath = "";
    for (const segment of normalizePath(folder).split("/")) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      const existing = this.app.vault.getAbstractFileByPath(currentPath);
      if (!existing) {
        await this.app.vault.createFolder(currentPath);
      } else if (!(existing instanceof TFolder)) {
        throw new Error(`A file already exists at ${currentPath}`);
      }
    }
  }

  private async openNoteAndClosePopover(note: TFile): Promise<void> {
    this.closeCalendarPopover();
    await this.app.workspace.getLeaf(false).openFile(note, { active: true });
  }

  private restoreCoreDailyNotesRibbon(): void {
    const hiddenActions = document.querySelectorAll<HTMLElement>(
      `.${HIDDEN_CORE_RIBBON_CLASS}`,
    );
    for (const action of Array.from(hiddenActions)) {
      action.classList.remove(HIDDEN_CORE_RIBBON_CLASS);
    }
  }
}

class DailyCalendarSettingsPopover extends Component {
  private popoverEl!: HTMLElement;
  private previewPopover?: DailyCalendarPopover;
  private activeTab: "appearance" | "notes" = "appearance";

  constructor(
    private readonly plugin: DailyNotesCalendarPlugin,
    private readonly anchorEl: HTMLElement,
  ) {
    super();
  }

  onload(): void {
    this.popoverEl = document.body.createDiv({
      cls: "daily-notes-calendar-settings-popover",
      attr: { role: "dialog", "aria-label": getMessages().settings },
    });
    this.popoverEl.style.visibility = "hidden";

    this.registerDomEvent(
      document,
      "pointerdown",
      (event: PointerEvent) => {
        const target = event.target;
        if (!(target instanceof Node)) return;
        if (
          !this.popoverEl.contains(target) &&
          !this.previewPopover?.contains(target) &&
          !this.anchorEl.contains(target)
        ) {
          this.plugin.closeSettingsPopover();
        }
      },
      true,
    );
    this.registerDomEvent(document, "keydown", (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        this.plugin.closeSettingsPopover();
      }
    });
    this.registerDomEvent(window, "resize", () => {
      positionPopover(this.popoverEl, this.anchorEl);
      this.previewPopover?.reposition();
    });

    this.render();
    this.popoverEl.style.visibility = "visible";
    this.previewPopover = new DailyCalendarPopover(
      this.plugin.app,
      this.plugin,
      this.popoverEl,
      true,
    );
    this.previewPopover.load();
  }

  onunload(): void {
    this.previewPopover?.unload();
    this.previewPopover = undefined;
    this.popoverEl?.remove();
  }

  refreshPreview(): void {
    this.previewPopover?.refreshSettings();
  }

  private render(): void {
    const messages = getMessages();
    this.popoverEl.empty();
    const container = this.popoverEl.createDiv({ cls: "daily-notes-calendar-settings" });
    const settingsHeader = container.createDiv({ cls: "daily-notes-calendar-settings-header" });
    settingsHeader.createEl("h2", { cls: "daily-notes-calendar-settings-title", text: messages.settings });
    const resetButton = settingsHeader.createEl("button", {
      cls: "daily-notes-calendar-settings-reset",
      text: messages.resetDefaults,
      attr: { type: "button" },
    });
    resetButton.addEventListener("click", async () => {
      await this.plugin.resetSettings();
      this.render();
    });
    container.createDiv({ cls: "daily-notes-calendar-settings-hint", text: messages.settingsHint });

    const tabs = container.createDiv({
      cls: "daily-notes-calendar-settings-tabs",
      attr: { role: "tablist" },
    });
    const appearanceTab = tabs.createEl("button", {
      cls: "daily-notes-calendar-settings-tab",
      text: messages.appearanceTab,
      attr: { type: "button", role: "tab" },
    });
    const notesTab = tabs.createEl("button", {
      cls: "daily-notes-calendar-settings-tab",
      text: messages.notesReportsTab,
      attr: { type: "button", role: "tab" },
    });
    const appearancePanel = container.createDiv({
      cls: "daily-notes-calendar-settings-panel",
      attr: { role: "tabpanel" },
    });
    const notesPanel = container.createDiv({
      cls: "daily-notes-calendar-settings-panel",
      attr: { role: "tabpanel" },
    });
    const selectTab = (tab: "appearance" | "notes"): void => {
      this.activeTab = tab;
      const isAppearance = tab === "appearance";
      appearancePanel.hidden = !isAppearance;
      notesPanel.hidden = isAppearance;
      appearanceTab.classList.toggle("is-active", isAppearance);
      notesTab.classList.toggle("is-active", !isAppearance);
      appearanceTab.setAttribute("aria-selected", String(isAppearance));
      notesTab.setAttribute("aria-selected", String(!isAppearance));
      positionPopover(this.popoverEl, this.anchorEl);
      this.previewPopover?.reposition();
    };
    appearanceTab.addEventListener("click", () => selectTab("appearance"));
    notesTab.addEventListener("click", () => selectTab("notes"));

    const monthGroup = this.createSettingsGroup(appearancePanel, messages.monthGroup);
    const notedDayGroup = this.createSettingsGroup(appearancePanel, messages.notedDayGroup);
    const emptyDayGroup = this.createSettingsGroup(appearancePanel, messages.emptyDayGroup);
    const typographyGroup = this.createSettingsGroup(appearancePanel, messages.typographyGroup, true);
    const dailyNotesGroup = this.createSettingsGroup(notesPanel, messages.dailyNotesGroup);

    new Setting(monthGroup)
      .setName(messages.useAccentColor)
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.monthBackgroundUseAccent)
        .onChange(async (value) => {
          await this.plugin.updateSettings({ monthBackgroundUseAccent: value });
          this.render();
        }));

    let monthHexInput: TextComponent;
    let monthColorPicker: ColorComponent;
    new Setting(monthGroup)
      .setName(messages.backgroundColor)
      .addColorPicker((colorPicker) => {
        monthColorPicker = colorPicker;
        colorPicker.setValue(this.plugin.settings.monthBackgroundColor)
          .setDisabled(this.plugin.settings.monthBackgroundUseAccent)
          .onChange((value) => {
            monthHexInput.setValue(value);
            monthHexInput.inputEl.removeAttribute("aria-invalid");
            void this.plugin.updateSettings({ monthBackgroundColor: value });
          });
      })
      .addText((text) => {
        monthHexInput = text;
        text.setPlaceholder("#RRGGBB")
          .setValue(this.plugin.settings.monthBackgroundColor)
          .setDisabled(this.plugin.settings.monthBackgroundUseAccent)
          .onChange((value) => {
            const color = value.trim().startsWith("#") ? value.trim() : `#${value.trim()}`;
            text.inputEl.setAttribute("aria-invalid", String(!/^#[0-9a-fA-F]{6}$/.test(color)));
          });
        text.inputEl.addClass("daily-notes-calendar-hex-input");
        this.registerDomEvent(text.inputEl, "keydown", (event: KeyboardEvent) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          event.stopPropagation();
          const value = text.getValue().trim();
          const color = value.startsWith("#") ? value : `#${value}`;
          if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
            text.inputEl.setAttribute("aria-invalid", "true");
            return;
          }
          text.setValue(color);
          text.inputEl.removeAttribute("aria-invalid");
          monthColorPicker.setValue(color);
          void this.plugin.updateSettings({ monthBackgroundColor: color });
        });
      });

    new Setting(monthGroup)
      .setName(messages.backgroundOpacity)
      .addSlider((slider) => slider
        .setLimits(0, 100, 5)
        .setValue(this.plugin.settings.monthBackgroundOpacity)
        .setDynamicTooltip()
        .onChange((value) => void this.plugin.updateSettings({ monthBackgroundOpacity: value })));

    new Setting(monthGroup)
      .setName(messages.borderOpacity)
      .addSlider((slider) => slider
        .setLimits(0, 100, 5)
        .setValue(this.plugin.settings.monthBorderOpacity)
        .setDynamicTooltip()
        .onChange((value) => void this.plugin.updateSettings({ monthBorderOpacity: value })));

    new Setting(notedDayGroup)
      .setName(messages.dayBackgroundUseTheme)
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.dayBackgroundUseTheme)
        .onChange(async (value) => {
          await this.plugin.updateSettings({ dayBackgroundUseTheme: value });
          this.render();
        }));

    let dayHexInput: TextComponent;
    let dayColorPicker: ColorComponent;
    new Setting(notedDayGroup)
      .setName(messages.dayBackgroundColor)
      .addColorPicker((colorPicker) => {
        dayColorPicker = colorPicker;
        colorPicker.setValue(this.plugin.settings.dayBackgroundColor)
          .setDisabled(this.plugin.settings.dayBackgroundUseTheme)
          .onChange((value) => {
            dayHexInput.setValue(value);
            dayHexInput.inputEl.removeAttribute("aria-invalid");
            void this.plugin.updateSettings({ dayBackgroundColor: value });
          });
      })
      .addText((text) => {
        dayHexInput = text;
        text.setPlaceholder("#RRGGBB")
          .setValue(this.plugin.settings.dayBackgroundColor)
          .setDisabled(this.plugin.settings.dayBackgroundUseTheme)
          .onChange((value) => {
            const color = value.trim().startsWith("#") ? value.trim() : `#${value.trim()}`;
            text.inputEl.setAttribute("aria-invalid", String(!/^#[0-9a-fA-F]{6}$/.test(color)));
          });
        text.inputEl.addClass("daily-notes-calendar-hex-input");
        this.registerDomEvent(text.inputEl, "keydown", (event: KeyboardEvent) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          event.stopPropagation();
          const value = text.getValue().trim();
          const color = value.startsWith("#") ? value : `#${value}`;
          if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
            text.inputEl.setAttribute("aria-invalid", "true");
            return;
          }
          text.setValue(color);
          text.inputEl.removeAttribute("aria-invalid");
          dayColorPicker.setValue(color);
          void this.plugin.updateSettings({ dayBackgroundColor: color });
        });
      });

    new Setting(notedDayGroup)
      .setName(messages.dayBackgroundOpacity)
      .addSlider((slider) => slider
        .setLimits(0, 100, 5)
        .setValue(this.plugin.settings.dayBackgroundOpacity)
        .setDynamicTooltip()
        .onChange((value) => void this.plugin.updateSettings({ dayBackgroundOpacity: value })));

    new Setting(emptyDayGroup)
      .setName(messages.emptyDayBackgroundUseTheme)
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.emptyDayBackgroundUseTheme)
        .onChange(async (value) => {
          await this.plugin.updateSettings({ emptyDayBackgroundUseTheme: value });
          this.render();
        }));

    let emptyDayHexInput: TextComponent;
    let emptyDayColorPicker: ColorComponent;
    new Setting(emptyDayGroup)
      .setName(messages.emptyDayBackgroundColor)
      .addColorPicker((colorPicker) => {
        emptyDayColorPicker = colorPicker;
        colorPicker.setValue(this.plugin.settings.emptyDayBackgroundColor)
          .setDisabled(this.plugin.settings.emptyDayBackgroundUseTheme)
          .onChange((value) => {
            emptyDayHexInput.setValue(value);
            emptyDayHexInput.inputEl.removeAttribute("aria-invalid");
            void this.plugin.updateSettings({ emptyDayBackgroundColor: value });
          });
      })
      .addText((text) => {
        emptyDayHexInput = text;
        text.setPlaceholder("#RRGGBB")
          .setValue(this.plugin.settings.emptyDayBackgroundColor)
          .setDisabled(this.plugin.settings.emptyDayBackgroundUseTheme)
          .onChange((value) => {
            const color = value.trim().startsWith("#") ? value.trim() : `#${value.trim()}`;
            text.inputEl.setAttribute("aria-invalid", String(!/^#[0-9a-fA-F]{6}$/.test(color)));
          });
        text.inputEl.addClass("daily-notes-calendar-hex-input");
        this.registerDomEvent(text.inputEl, "keydown", (event: KeyboardEvent) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          event.stopPropagation();
          const value = text.getValue().trim();
          const color = value.startsWith("#") ? value : `#${value}`;
          if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
            text.inputEl.setAttribute("aria-invalid", "true");
            return;
          }
          text.setValue(color);
          text.inputEl.removeAttribute("aria-invalid");
          emptyDayColorPicker.setValue(color);
          void this.plugin.updateSettings({ emptyDayBackgroundColor: color });
        });
      });

    new Setting(emptyDayGroup)
      .setName(messages.emptyDayBackgroundOpacity)
      .addSlider((slider) => slider
        .setLimits(0, 100, 5)
        .setValue(this.plugin.settings.emptyDayBackgroundOpacity)
        .setDynamicTooltip()
        .onChange((value) => void this.plugin.updateSettings({ emptyDayBackgroundOpacity: value })));

    this.addNumericSetting(typographyGroup, messages.fontSize, this.plugin.settings.dayFontSize, 10, 18, 1,
      (dayFontSize) => ({ dayFontSize }));
    this.addNumericSetting(typographyGroup, messages.fontWeight, this.plugin.settings.dayFontWeight, 400, 800, 100,
      (dayFontWeight) => ({ dayFontWeight }));
    this.addNumericSetting(typographyGroup, messages.dateSpacing, this.plugin.settings.dayGap, 2, 12, 1,
      (dayGap) => ({ dayGap }));

    new Setting(dailyNotesGroup)
      .setName(messages.extraDailyNoteFolders)
      .addTextArea((text) => {
        text.setPlaceholder("Diary\nArchive/Daily")
          .setValue(this.plugin.settings.extraDailyNoteFolders);
        text.inputEl.rows = 2;
        this.registerDomEvent(text.inputEl, "change", () => {
          void this.plugin.updateSettings({ extraDailyNoteFolders: text.getValue() });
        });
      });

    new Setting(dailyNotesGroup)
      .setName(messages.extraDailyNoteFormats)
      .addTextArea((text) => {
        text.setPlaceholder("YYYY-MM-DD\nYYYY/MM/DD")
          .setValue(this.plugin.settings.extraDailyNoteFormats);
        text.inputEl.rows = 2;
        this.registerDomEvent(text.inputEl, "change", () => {
          void this.plugin.updateSettings({ extraDailyNoteFormats: text.getValue() });
        });
      });

    const coreDailyNoteSettings = getDailyNoteSettings();
    dailyNotesGroup.createDiv({
      cls: "daily-notes-calendar-settings-group-hint",
      text: `${messages.defaultDailyNoteFolder}：${coreDailyNoteSettings.folder || messages.vaultRoot}\n${messages.defaultDailyNoteFormat}：${coreDailyNoteSettings.format || "YYYY-MM-DD"}`,
    });

    this.addReportSettings(notesPanel, "week");
    this.addReportSettings(notesPanel, "month");

    new Setting(notesPanel).addButton((button) => button
      .setButtonText(messages.openDailyNotesSettings)
      .onClick(() => {
        this.plugin.closeSettingsPopover();
        this.plugin.openDailyNotesSettings();
      }));

    selectTab(this.activeTab);
    positionPopover(this.popoverEl, this.anchorEl);
  }

  private addReportSettings(container: HTMLElement, type: ReportType): void {
    const messages = getMessages();
    const isWeek = type === "week";
    const group = this.createSettingsGroup(
      container,
      isWeek ? messages.weeklyReportGroup : messages.monthlyReportGroup,
    );

    new Setting(group)
      .setName(messages.defaultDailyNoteFolder)
      .addText((text) => {
        text.setPlaceholder(isWeek ? "Weekly" : "Monthly")
          .setValue(isWeek
            ? this.plugin.settings.weeklyReportFolder
            : this.plugin.settings.monthlyReportFolder);
        this.registerDomEvent(text.inputEl, "change", () => {
          const value = text.getValue();
          void this.plugin.updateSettings(isWeek
            ? { weeklyReportFolder: value }
            : { monthlyReportFolder: value });
        });
      });

    new Setting(group)
      .setName(messages.defaultDailyNoteFormat)
      .addText((text) => {
        text.setPlaceholder(isWeek ? "[Weekly-]gggg-[W]ww" : "[Monthly-]YYYY-MM")
          .setValue(isWeek
            ? this.plugin.settings.weeklyReportFormat
            : this.plugin.settings.monthlyReportFormat);
        this.registerDomEvent(text.inputEl, "change", () => {
          const value = text.getValue();
          void this.plugin.updateSettings(isWeek
            ? { weeklyReportFormat: value }
            : { monthlyReportFormat: value });
        });
      });

    new Setting(group)
      .setName(messages.extraDailyNoteFolders)
      .addTextArea((text) => {
        text.setPlaceholder(isWeek
          ? "Reports/Weekly\nArchive/Weekly"
          : "Reports/Monthly\nArchive/Monthly")
          .setValue(isWeek
            ? this.plugin.settings.extraWeeklyReportFolders
            : this.plugin.settings.extraMonthlyReportFolders);
        text.inputEl.rows = 2;
        this.registerDomEvent(text.inputEl, "change", () => {
          const value = text.getValue();
          void this.plugin.updateSettings(isWeek
            ? { extraWeeklyReportFolders: value }
            : { extraMonthlyReportFolders: value });
        });
      });

    new Setting(group)
      .setName(messages.extraDailyNoteFormats)
      .addTextArea((text) => {
        text.setPlaceholder(isWeek
          ? "gggg-[W]ww\nYYYY-[W]ww"
          : "YYYY-MM\nYYYY/MM")
          .setValue(isWeek
            ? this.plugin.settings.extraWeeklyReportFormats
            : this.plugin.settings.extraMonthlyReportFormats);
        text.inputEl.rows = 2;
        this.registerDomEvent(text.inputEl, "change", () => {
          const value = text.getValue();
          void this.plugin.updateSettings(isWeek
            ? { extraWeeklyReportFormats: value }
            : { extraMonthlyReportFormats: value });
        });
      });
  }

  private createSettingsGroup(
    container: HTMLElement,
    title: string,
    compactGrid = false,
  ): HTMLElement {
    const group = container.createDiv({ cls: "daily-notes-calendar-settings-group" });
    group.createDiv({ cls: "daily-notes-calendar-settings-group-title", text: title });
    return group.createDiv({
      cls: `daily-notes-calendar-settings-group-items${compactGrid ? " is-compact-grid" : ""}`,
    });
  }

  private addNumericSetting(
    container: HTMLElement,
    name: string,
    value: number,
    min: number,
    max: number,
    step: number,
    update: (value: number) => Partial<CalendarSettings>,
  ): void {
    const isValid = (rawValue: string): boolean => {
      if (!rawValue.trim()) return false;
      const numericValue = Number(rawValue);
      return Number.isFinite(numericValue) &&
        numericValue >= min &&
        numericValue <= max &&
        (numericValue - min) % step === 0;
    };

    new Setting(container).setName(name).addText((text) => {
      text.setValue(String(value)).onChange((rawValue) => {
        text.inputEl.setAttribute("aria-invalid", String(!isValid(rawValue)));
      });
      text.inputEl.type = "number";
      text.inputEl.min = String(min);
      text.inputEl.max = String(max);
      text.inputEl.step = String(step);
      text.inputEl.addClass("daily-notes-calendar-number-input");
      this.registerDomEvent(text.inputEl, "keydown", (event: KeyboardEvent) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        event.stopPropagation();
        const rawValue = text.getValue();
        if (!isValid(rawValue)) {
          text.inputEl.setAttribute("aria-invalid", "true");
          return;
        }
        const numericValue = Number(rawValue);
        text.setValue(String(numericValue));
        text.inputEl.removeAttribute("aria-invalid");
        void this.plugin.updateSettings(update(numericValue));
      });
    });
  }
}

class DailyCalendarPopover extends Component {
  private currentMonth: MomentDate = moment().startOf("month");
  private pickerMode?: PickerMode;
  private popoverEl!: HTMLElement;

  constructor(
    private readonly app: App,
    private readonly plugin: DailyNotesCalendarPlugin,
    private readonly anchorEl: HTMLElement,
    private readonly preview = false,
  ) {
    super();
  }

  onload(): void {
    this.popoverEl = document.body.createDiv({
      cls: `daily-notes-calendar-popover${this.preview ? " is-preview" : ""}`,
      attr: { role: "dialog", "aria-label": getMessages().calendar },
    });
    this.popoverEl.style.visibility = "hidden";
    this.applySettings();

    const refresh = () => this.render();
    this.registerEvent(this.app.vault.on("create", refresh));
    this.registerEvent(this.app.vault.on("delete", refresh));
    this.registerEvent(this.app.vault.on("rename", refresh));
    this.registerEvent(this.app.workspace.on("active-leaf-change", refresh));

    this.registerDomEvent(
      document,
      "pointerdown",
      (event: PointerEvent) => {
        const target = event.target;
        if (!(target instanceof Node)) return;
        if (
          !this.preview &&
          !this.popoverEl.contains(target) &&
          !this.anchorEl.contains(target)
        ) {
          this.plugin.closeCalendarPopover();
        }
      },
      true,
    );

    this.registerDomEvent(document, "keydown", (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      if (this.pickerMode) {
        this.pickerMode = undefined;
        this.render();
      } else if (this.preview) {
        this.plugin.closeSettingsPopover();
      } else {
        this.plugin.closeCalendarPopover();
      }
    });

    this.registerDomEvent(window, "resize", () => this.reposition());
    this.render();
    this.popoverEl.style.visibility = "visible";
  }

  onunload(): void {
    this.popoverEl?.remove();
  }

  contains(target: Node): boolean {
    return this.popoverEl.contains(target);
  }

  reposition(): void {
    positionPopover(this.popoverEl, this.anchorEl);
  }

  refreshSettings(): void {
    this.applySettings();
    this.render();
  }

  private applySettings(): void {
    const settings = this.plugin.settings;
    this.popoverEl.style.setProperty("--daily-calendar-gap", `${settings.dayGap}px`);
    this.popoverEl.style.setProperty("--daily-calendar-font-size", `${settings.dayFontSize}px`);
    this.popoverEl.style.setProperty("--daily-calendar-font-weight", String(settings.dayFontWeight));
    const dayBackgroundColor = settings.dayBackgroundUseTheme
      ? "var(--background-secondary)"
      : settings.dayBackgroundColor;
    this.popoverEl.style.setProperty(
      "--daily-calendar-day-bg",
      `color-mix(in srgb, ${dayBackgroundColor} ${settings.dayBackgroundOpacity}%, transparent)`,
    );
    const emptyDayBackgroundColor = settings.emptyDayBackgroundUseTheme
      ? "var(--background-secondary)"
      : settings.emptyDayBackgroundColor;
    this.popoverEl.style.setProperty(
      "--daily-calendar-empty-day-bg",
      `color-mix(in srgb, ${emptyDayBackgroundColor} ${settings.emptyDayBackgroundOpacity}%, transparent)`,
    );
  }

  private render(): void {
    const messages = getMessages();
    const chinese = isChinese();
    this.popoverEl.empty();

    const container = this.popoverEl.createDiv({ cls: "daily-notes-calendar-container" });
    const header = container.createDiv({ cls: "daily-notes-calendar-header" });
    const previousButton = header.createEl("button", {
      cls: "clickable-icon",
      attr: { "aria-label": messages.previousMonth, type: "button" },
    });
    previousButton.setText("‹");
    previousButton.addEventListener("click", () => {
      this.pickerMode = undefined;
      this.currentMonth = this.currentMonth.clone().subtract(1, "month");
      this.render();
    });

    const title = header.createEl("h2", { cls: "daily-notes-calendar-title" });
    const yearButton = title.createEl("button", {
      cls: "daily-notes-calendar-period-button",
      text: this.currentMonth.format("YYYY"),
      attr: { type: "button", "aria-label": messages.selectYear },
    });
    yearButton.addEventListener("click", () => {
      this.pickerMode = this.pickerMode === "year" ? undefined : "year";
      this.render();
    });
    if (chinese) title.createSpan({ cls: "daily-notes-calendar-period-suffix", text: "年" });

    const monthButton = title.createEl("button", {
      cls: "daily-notes-calendar-period-button",
      text: this.currentMonth.format(chinese ? "M" : "MMM"),
      attr: { type: "button", "aria-label": messages.selectMonth },
    });
    monthButton.addEventListener("click", () => {
      this.pickerMode = this.pickerMode === "month" ? undefined : "month";
      this.render();
    });
    if (chinese) title.createSpan({ cls: "daily-notes-calendar-period-suffix", text: "月" });

    const monthReportButton = title.createEl("button", {
      cls: "daily-notes-calendar-month-report",
      text: messages.monthReport,
      attr: {
        type: "button",
        "aria-label": `${messages.openCreate}${messages.monthlyReportName}`,
      },
    });
    monthReportButton.addEventListener("click", () => {
      if (!this.preview) void this.plugin.openReport(this.currentMonth, "month");
    });

    const nextButton = header.createEl("button", {
      cls: "clickable-icon",
      attr: { "aria-label": messages.nextMonth, type: "button" },
    });
    nextButton.setText("›");
    nextButton.addEventListener("click", () => {
      this.pickerMode = undefined;
      this.currentMonth = this.currentMonth.clone().add(1, "month");
      this.render();
    });

    if (!isCoreDailyNotesEnabled(this.app)) {
      container.createDiv({ cls: "daily-notes-calendar-warning", text: messages.dailyNotesWarning });
    }

    const weekdays = container.createDiv({ cls: "daily-notes-calendar-weekdays" });
    for (const weekday of messages.weekdays) {
      weekdays.createDiv({ cls: "daily-notes-calendar-weekday", text: weekday });
    }
    weekdays.createSpan({ cls: "daily-notes-calendar-week-spacer" });

    const grid = container.createDiv({ cls: "daily-notes-calendar-grid" });
    grid.createDiv({ cls: "daily-notes-calendar-month-layer", attr: { "aria-hidden": "true" } });
    const coreDailyNotesEnabled = isCoreDailyNotesEnabled(this.app);
    const dailyNotes = coreDailyNotesEnabled ? getAllDailyNotes() : {};
    const activeFilePath = this.app.workspace.getActiveFile()?.path;
    const today = moment().startOf("day");
    const firstDay = this.currentMonth.clone().startOf("month");
    const mondayBasedOffset = (firstDay.day() + 6) % 7;
    const gridStart = firstDay.clone().subtract(mondayBasedOffset, "days");
    const currentMonthCells: boolean[] = [];

    for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
      const weekDate = gridStart.clone().add(weekIndex * 7, "days");
      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        const date = weekDate.clone().add(dayIndex, "days");
        const note = coreDailyNotesEnabled ? this.plugin.findDailyNote(date, dailyNotes) : undefined;
        const isToday = date.isSame(today, "day");
        const isActiveNote = Boolean(note && activeFilePath === note.path);
        const isCurrentMonth = date.isSame(this.currentMonth, "month");
        const classes = ["daily-notes-calendar-day"];
        const dateLabel = date.format(chinese ? "YYYY年M月D日" : "YYYY-MM-DD");
        const noteState = note ? messages.noteExists : messages.createNote;

        currentMonthCells.push(isCurrentMonth);
        classes.push(isCurrentMonth ? "is-current-month" : "is-outside-month");
        if (note) classes.push("has-daily-note");
        if (isToday) classes.push("is-today");
        if (isActiveNote) classes.push("is-active-note");

        const dayButton = grid.createEl("button", {
          cls: classes.join(" "),
          attr: {
            type: "button",
            "aria-label": `${dateLabel}, ${noteState}`,
            ...(isToday ? { "aria-current": "date" } : {}),
          },
        });
        dayButton.createSpan({ cls: "daily-notes-calendar-day-number", text: date.format("D") });
        if (note) {
          dayButton.createSpan({
            cls: "daily-notes-calendar-note-dot",
            attr: { "aria-hidden": "true" },
          });
        }
        dayButton.addEventListener("click", () => {
          if (!this.preview) void this.plugin.openDailyNote(date);
        });
      }
      this.createWeekReportButton(grid, weekDate);
    }
    this.renderMonthBackground(grid, currentMonthCells);

    const footer = container.createDiv({ cls: "daily-notes-calendar-footer" });
    const todayButton = footer.createEl("button", {
      cls: "mod-cta daily-notes-calendar-footer-button",
      text: messages.openCreateToday,
      attr: { type: "button" },
    });
    todayButton.addEventListener("click", () => {
      if (!this.preview) void this.plugin.openDailyNote(moment());
    });

    if (this.pickerMode) this.renderPicker();
    positionPopover(this.popoverEl, this.anchorEl);
  }

  private renderMonthBackground(grid: HTMLElement, currentMonthCells: boolean[]): void {
    const layer = grid.querySelector<HTMLElement>(".daily-notes-calendar-month-layer");
    const dayElements = Array.from(grid.querySelectorAll<HTMLElement>(".daily-notes-calendar-day"));
    if (!layer || dayElements.length !== 42) return;

    layer.empty();
    const gridRect = grid.getBoundingClientRect();
    const rects = dayElements.map((element) => element.getBoundingClientRect());
    const expand = this.plugin.settings.dayGap / 2 + 2;
    const xBounds: number[] = [rects[0].left - gridRect.left - expand];
    const yBounds: number[] = [rects[0].top - gridRect.top - expand];

    for (let column = 1; column < 7; column += 1) {
      xBounds.push((rects[column - 1].right + rects[column].left) / 2 - gridRect.left);
    }
    xBounds.push(rects[6].right - gridRect.left + expand);
    for (let row = 1; row < 6; row += 1) {
      yBounds.push((rects[(row - 1) * 7].bottom + rects[row * 7].top) / 2 - gridRect.top);
    }
    yBounds.push(rects[35].bottom - gridRect.top + expand);

    type Point = [number, number];
    type Edge = { start: Point; end: Point };
    const edges: Edge[] = [];
    const isCurrent = (row: number, column: number): boolean =>
      row >= 0 && row < 6 && column >= 0 && column < 7 && currentMonthCells[row * 7 + column];

    for (let row = 0; row < 6; row += 1) {
      for (let column = 0; column < 7; column += 1) {
        if (!isCurrent(row, column)) continue;
        if (!isCurrent(row - 1, column)) edges.push({ start: [column, row], end: [column + 1, row] });
        if (!isCurrent(row, column + 1)) edges.push({ start: [column + 1, row], end: [column + 1, row + 1] });
        if (!isCurrent(row + 1, column)) edges.push({ start: [column + 1, row + 1], end: [column, row + 1] });
        if (!isCurrent(row, column - 1)) edges.push({ start: [column, row + 1], end: [column, row] });
      }
    }

    const firstEdge = edges.shift();
    if (!firstEdge) return;
    const toPixel = (point: Point): string =>
      `${xBounds[point[0]].toFixed(2)} ${yBounds[point[1]].toFixed(2)}`;
    const pointKey = (point: Point): string => `${point[0]},${point[1]}`;
    let pathData = `M ${toPixel(firstEdge.start)} L ${toPixel(firstEdge.end)}`;
    let currentPoint = firstEdge.end;
    let guard = 0;

    while (edges.length > 0 && guard < 200) {
      const nextIndex = edges.findIndex((edge) => pointKey(edge.start) === pointKey(currentPoint));
      if (nextIndex < 0) break;
      const nextEdge = edges.splice(nextIndex, 1)[0];
      pathData += ` L ${toPixel(nextEdge.end)}`;
      currentPoint = nextEdge.end;
      guard += 1;
    }
    pathData += " Z";

    const namespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(namespace, "svg");
    svg.setAttribute("class", "daily-notes-calendar-month-svg");
    svg.setAttribute("width", String(gridRect.width));
    svg.setAttribute("height", String(gridRect.height));
    svg.setAttribute("viewBox", `0 0 ${gridRect.width} ${gridRect.height}`);
    const path = document.createElementNS(namespace, "path");
    const settings = this.plugin.settings;
    const color = settings.monthBackgroundUseAccent ? "var(--interactive-accent)" : settings.monthBackgroundColor;
    path.setAttribute("d", pathData);
    path.setAttribute("fill", color);
    path.setAttribute("fill-opacity", String(settings.monthBackgroundOpacity / 100));
    path.setAttribute("stroke", color);
    path.setAttribute("stroke-opacity", String(settings.monthBorderOpacity / 100));
    path.setAttribute("stroke-width", "1.25");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("stroke-linecap", "round");
    svg.appendChild(path);
    layer.appendChild(svg);
  }

  private createWeekReportButton(parent: HTMLElement, date: MomentDate): void {
    const messages = getMessages();
    const reportName = this.plugin.getReportName(date, "week");
    const weekLabel = `W${String(date.isoWeek()).padStart(2, "0")}`;
    const button = parent.createEl("button", {
      cls: "daily-notes-calendar-week-report",
      text: weekLabel,
      attr: {
        type: "button",
        "aria-label": `${messages.openCreate} ${reportName} ${messages.weeklyReportName}`,
      },
    });
    button.addEventListener("click", () => {
      if (!this.preview) void this.plugin.openReport(date, "week");
    });
  }

  private renderPicker(): void {
    if (!this.pickerMode) return;

    const messages = getMessages();
    const chinese = isChinese();
    const pickerTitle = this.pickerMode === "year" ? messages.selectYear : messages.selectMonth;
    const picker = this.popoverEl.createDiv({
      cls: "daily-notes-calendar-picker",
      attr: { role: "dialog", "aria-label": pickerTitle },
    });
    const header = picker.createDiv({ cls: "daily-notes-calendar-picker-header" });
    header.createSpan({ text: pickerTitle });
    const closeButton = header.createEl("button", {
      cls: "clickable-icon",
      text: "×",
      attr: { type: "button", "aria-label": messages.closePicker },
    });
    closeButton.addEventListener("click", () => {
      this.pickerMode = undefined;
      this.render();
    });

    const options = picker.createDiv({ cls: `daily-notes-calendar-picker-options is-${this.pickerMode}` });
    const currentDate = moment();
    const coreDailyNotesEnabled = isCoreDailyNotesEnabled(this.app);
    const dailyNotes = coreDailyNotesEnabled ? getAllDailyNotes() : {};
    const monthHasNotes = (year: number, month: number): boolean => {
      if (!coreDailyNotesEnabled) return false;
      const monthDate = moment().year(year).month(month).startOf("month");
      for (let day = 1; day <= monthDate.daysInMonth(); day += 1) {
        if (this.plugin.findDailyNote(monthDate.clone().date(day), dailyNotes)) return true;
      }
      return false;
    };
    const yearHasNotes = (year: number): boolean => {
      for (let month = 0; month < 12; month += 1) {
        if (monthHasNotes(year, month)) return true;
      }
      return false;
    };

    if (this.pickerMode === "year") {
      const selectedYear = this.currentMonth.year();
      for (let year = selectedYear - 15; year <= selectedYear + 15; year += 1) {
        const classes = [
          year === selectedYear ? "is-selected" : "",
          year === currentDate.year() ? "is-current" : "",
          yearHasNotes(year) ? "has-daily-note" : "",
        ].filter(Boolean).join(" ");
        const button = options.createEl("button", {
          cls: classes,
          text: String(year),
          attr: { type: "button" },
        });
        button.addEventListener("click", () => {
          this.currentMonth = this.currentMonth.clone().year(year);
          this.pickerMode = undefined;
          this.render();
        });
      }
    } else {
      const selectedMonth = this.currentMonth.month();
      for (let month = 0; month < 12; month += 1) {
        const isCurrentMonth = this.currentMonth.year() === currentDate.year() && month === currentDate.month();
        const classes = [
          month === selectedMonth ? "is-selected" : "",
          isCurrentMonth ? "is-current" : "",
          monthHasNotes(this.currentMonth.year(), month) ? "has-daily-note" : "",
        ].filter(Boolean).join(" ");
        const button = options.createEl("button", {
          cls: classes,
          text: chinese ? `${month + 1}月` : moment().month(month).format("MMM"),
          attr: { type: "button" },
        });
        button.addEventListener("click", () => {
          this.currentMonth = this.currentMonth.clone().month(month);
          this.pickerMode = undefined;
          this.render();
        });
      }
    }
  }
}
