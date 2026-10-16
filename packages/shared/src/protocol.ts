export const PROTOCOL_VERSION = 11 as const;
export const SCHEMA_VERSION = 16 as const;
export const APP_ID = "com.ocode.desktop";
export const APP_NAME = "Ocode";
export const APP_VERSION = "0.21.0-beta.1";

export const APP_MENU_COMMANDS = [
  "newTask",
  "openProject",
  "openSettings",
  "openSearch",
  "openCommandPalette",
  "toggleSidebar",
  "openHelp",
  "openLogs",
  "checkForUpdates",
] as const;

export type AppMenuCommand = (typeof APP_MENU_COMMANDS)[number];

export const NATIVE_MENU_ACTIONS = [
  "undo",
  "redo",
  "cut",
  "copy",
  "paste",
  "selectAll",
  "reload",
  "zoomIn",
  "zoomOut",
  "resetZoom",
  "toggleFullScreen",
  "minimize",
  "toggleMaximize",
  "close",
  "restoreMainWindow",
  "toggleMainWindow",
] as const;

export type NativeMenuAction = (typeof NATIVE_MENU_ACTIONS)[number];

export const WINDOW_CONTROL_ACTIONS = [
  "getState",
  "minimize",
  "toggleMaximize",
  "close",
] as const;

export type WindowControlAction = (typeof WINDOW_CONTROL_ACTIONS)[number];

export type LifecycleDialogKind = "quit-confirmation" | "close-behavior";
export type LifecycleDialogChoice = "cancel" | "confirm" | "tray" | "quit";
export type LifecycleDialogRequest = {
  requestId: string;
  kind: LifecycleDialogKind;
};
export type LifecycleDialogDismiss = { requestId: string };
export const IPC = {
  invoke: {
    storageGet: "ocode/storage/get",
    storageChoose: "ocode/storage/choose",
    storageMigrate: "ocode/storage/migrate",
    storageClearCache: "ocode/storage/clearCache",
    storageRemoveBackup: "ocode/storage/removeBackup",
    appGetVersion: "ocode/app/getVersion",
    appOpenFeedback: "ocode/app/openFeedback",
    appHealth: "ocode/app/health",
    appGetOnboarding: "ocode/app/getOnboarding",
    appDismissOnboarding: "ocode/app/dismissOnboarding",
    /**
     * Quit the whole application through the ordered shutdown. Exposed for the
     * surfaces that own the window while the shell has no data yet — a stuck
     * startup must always be able to exit the app (issue #831).
     */
    appQuit: "ocode/app/quit",
    /** Installed system font families, resolved by Electron main. */
    systemFontsList: "ocode/app/systemFonts",
    updatesGetState: "ocode/updates/getState",
    updatesCheck: "ocode/updates/check",
    updatesDownload: "ocode/updates/download",
    updatesInstall: "ocode/updates/install",
    updatesOpenReleases: "ocode/updates/openReleases",
    /** Persist the user's decision to stop nudging about one version (#1317). */
    updatesDismiss: "ocode/updates/dismiss",
    notificationList: "ocode/notification/list",
    notificationMarkRead: "ocode/notification/markRead",
    notificationMarkAllRead: "ocode/notification/markAllRead",
    notificationClear: "ocode/notification/clear",
    notificationShowNative: "ocode/notification/showNative",
    notificationSetViewingSession: "ocode/notification/setViewingSession",
    agentPrompt: "ocode/agent/prompt",
    agentSteer: "ocode/agent/steer",
    speechTranscribe: "ocode/speech/transcribe",
    speechSynthesize: "ocode/speech/synthesize",
    speechGetStatus: "ocode/speech/getStatus",
    voiceStart: "ocode/voice/start",
    voiceStop: "ocode/voice/stop",
    voiceCancel: "ocode/voice/cancel",
    voiceGetState: "ocode/voice/getState",
    voiceGetDevices: "ocode/voice/getDevices",
    voiceGetModels: "ocode/voice/getModels",
    voiceDownloadModel: "ocode/voice/downloadModel",
    voiceDeleteModel: "ocode/voice/deleteModel",
    voiceUpdateSettings: "ocode/voice/updateSettings",
    voiceCheckPermission: "ocode/voice/checkPermission",
    voiceRequestPermission: "ocode/voice/requestPermission",
    liveVoiceStatus: "ocode/voice/live/status",
    liveVoicePrepare: "ocode/voice/live/prepare",
    liveVoiceConnect: "ocode/voice/live/connect",
    liveVoiceSetMuted: "ocode/voice/live/setMuted",
    liveVoiceReportMedia: "ocode/voice/live/reportMedia",
    liveVoiceReportPlayback: "ocode/voice/live/reportPlayback",
    liveVoiceReportDelegation: "ocode/voice/live/reportDelegation",
    liveVoiceReportControlApplied: "ocode/voice/live/reportControlApplied",
    liveVoiceEnd: "ocode/voice/live/end",
    liveVoiceHeartbeat: "ocode/voice/live/heartbeat",
    liveVoiceResolveWorkSelection: "ocode/voice/live/work/resolveSelection",
    liveVoiceStopWorkOperation: "ocode/voice/live/work/stopOperation",
    liveVoiceCancelQueuedOperation: "ocode/voice/live/work/cancelQueuedOperation",
    liveVoiceWidgetAction: "ocode/voice/live/widget/action",
    liveVoiceWidgetOwnerState: "ocode/voice/live/widget/ownerState",
    liveVoiceWidgetVisibility: "ocode/voice/live/widget/visibility",
    agentCompact: "ocode/agent/compact",
    agentAbort: "ocode/agent/abort",
    agentStopSubagents: "ocode/agent/stop-subagents",
    agentStop: "ocode/agent/stop",
    agentQueuePush: "ocode/agent/queue/push",
    agentQueueList: "ocode/agent/queue/list",
    agentQueueRemove: "ocode/agent/queue/remove",
    agentQueuePrioritize: "ocode/agent/queue/prioritize",
    agentQueueReorder: "ocode/agent/queue/reorder",
    agentGetStatus: "ocode/agent/getStatus",
    agentInstructionsGet: "ocode/agent/instructions/get",
    agentInstructionsSave: "ocode/agent/instructions/save",
    sessionList: "ocode/session/list",
    sessionCreate: "ocode/session/create",
    sessionFork: "ocode/session/fork",
    sessionMoveProject: "ocode/session/moveProject",
    sessionSearch: "ocode/session/search",
    sessionSearchContext: "ocode/session/searchContext",
    sessionGet: "ocode/session/get",
    sessionCollaboration: "ocode/session/collaboration",
    /** Validate and select a durable session from a reviewed host operation. */
    sessionOpen: "ocode/session/open",
    sessionDelete: "ocode/session/delete",
    /** Isolated sessions in git worktrees (ADR 0329). */
    worktreeProbe: "ocode/worktree/probe",
    worktreePreview: "ocode/worktree/preview",
    worktreeMerge: "ocode/worktree/merge",
    worktreePendingWork: "ocode/worktree/pendingWork",
    /** "Sync from project": project commits the session lacks, and the sync. */
    worktreeBehind: "ocode/worktree/behind",
    worktreeSync: "ocode/worktree/sync",
    /** Behind counts of every isolated session, for the sidebar marker. */
    worktreeBehindAll: "ocode/worktree/behindAll",
    worktreeSetupLog: "ocode/worktree/setupLog",
    /** Opens the worktree folder in the OS file manager; no path is returned. */
    worktreeReveal: "ocode/worktree/reveal",
    worktreeSetupCommandGet: "ocode/worktree/setupCommand/get",
    worktreeSetupCommandSet: "ocode/worktree/setupCommand/set",
    sessionRename: "ocode/session/rename",
    /** Deterministic first-prompt title for a session that is still untitled. */
    sessionDeriveTitle: "ocode/session/deriveTitle",
    sessionConfigure: "ocode/session/configure",
    sessionImportScan: "ocode/session/importScan",
    sessionImportRun: "ocode/session/importRun",
    modelConfigImportScan: "ocode/modelConfig/importScan",
    modelConfigImportRun: "ocode/modelConfig/importRun",
    sessionReplaceMessages: "ocode/session/replaceMessages",
    sessionSaveRevision: "ocode/session/saveRevision",
    sessionListRevisions: "ocode/session/listRevisions",
    sessionActivateRevision: "ocode/session/activateRevision",
    sessionGetScratchPath: "ocode/session/getScratchPath",
    sessionOpenScratchPath: "ocode/session/openScratchPath",
    projectOpenFolder: "ocode/project/openFolder",
    settingsGet: "ocode/settings/get",
    settingsSet: "ocode/settings/set",
    configSyncGetState: "ocode/configSync/getState",
    backgroundTasksList: "ocode/backgroundTasks/list",
    backgroundTasksOutput: "ocode/backgroundTasks/output",
    backgroundTasksStop: "ocode/backgroundTasks/stop",
    configSyncConfigure: "ocode/configSync/configure",
    configSyncTest: "ocode/configSync/test",
    configSyncSyncNow: "ocode/configSync/syncNow",
    configSyncPause: "ocode/configSync/pause",
    configSyncUnlock: "ocode/configSync/unlock",
    configSyncApprove: "ocode/configSync/approve",
    configSyncReject: "ocode/configSync/reject",
    configSyncMapProject: "ocode/configSync/mapProject",
    configSyncListHistory: "ocode/configSync/listHistory",
    configSyncRestore: "ocode/configSync/restore",
    configSyncChangePassword: "ocode/configSync/changePassword",
    configSyncDisconnect: "ocode/configSync/disconnect",
    networkProxyTest: "ocode/network/testProxy",
    commandShellList: "ocode/commandShell/list",
    secretsSet: "ocode/secrets/set",
    secretsDelete: "ocode/secrets/delete",
    secretsHas: "ocode/secrets/has",
    projectOpen: "ocode/project/open",
    projectPickFolders: "ocode/project/pickFolders",
    projectMemoryGet: "ocode/project/memory/get",
    projectMemorySave: "ocode/project/memory/save",
    projectGroupList: "ocode/project-group/list",
    projectGroupCreateRemote: "ocode/project-group/createRemote",
    projectGroupCreate: "ocode/project-group/create",
    projectGroupRename: "ocode/project-group/rename",
    projectGroupUpdate: "ocode/project-group/update",
    projectGroupMemoryGet: "ocode/project-group/memory/get",
    projectGroupMemorySave: "ocode/project-group/memory/save",
    projectGroupInstructionsGet: "ocode/project-group/instructions/get",
    projectGroupInstructionsSave: "ocode/project-group/instructions/save",
    projectClone: "ocode/project/clone",
    projectCloneCheckout: "ocode/project/cloneCheckout",
    projectGet: "ocode/project/get",
    projectList: "ocode/project/list",
    projectSet: "ocode/project/set",
    projectClear: "ocode/project/clear",
    projectRemove: "ocode/project/remove",
    scheduledList: "ocode/scheduled/list",
    scheduledCreate: "ocode/scheduled/create",
    scheduledUpdate: "ocode/scheduled/update",
    scheduledDelete: "ocode/scheduled/delete",
    scheduledRun: "ocode/scheduled/run",
    scheduledExecute: "ocode/scheduled/execute",
    scheduledListRuns: "ocode/scheduled/listRuns",
    toolResolvePermission: "ocode/tool/resolvePermission",
    todosGet: "ocode/todos/get",
    askToolResolve: "ocode/agent/askTool/resolve",
    plansPending: "ocode/plans/pending",
    pendingInteractive: "ocode/agent/pendingInteractive",
    plansResolve: "ocode/plans/resolve",
    /**
     * List every paired remote `ocode-host` this desktop knows, redacted so no
     * device token reaches the renderer. See ADR 0286 (R2b pairing UX).
     */
    remoteHostList: "ocode/remoteHost/list",
    /**
     * Pair with a `ocode-host` at `url` using a single-use `pairingToken`, mint
     * a device token, persist it encrypted, and open the live connection.
     */
    remoteHostPair: "ocode/remoteHost/pair",
    /** Close the live connection for `hostKey` and drop its persisted record. */
    remoteHostRemove: "ocode/remoteHost/remove",
    /**
     * Install and pair a `ocode-host` on a machine the user reaches over SSH:
     * upload the bootstrap script, download and verify the published bundle
     * there, start the host, forward its loopback port, and exchange the
     * pairing token (spec §5.2). Uses the user's own SSH keys; no credential
     * crosses this channel.
     */
    remoteHostBootstrap: "ocode/remoteHost/bootstrap",
    remoteHostReconnect: "ocode/remoteHost/reconnect",
    remoteHostProjects: "ocode/remoteHost/projects",
    remoteHostBrowseProjects: "ocode/remoteHost/browseProjects",
    remoteHostRegisterProject: "ocode/remoteHost/registerProject",
    remoteHostSessions: "ocode/remoteHost/sessions",
    remoteHostCreateSession: "ocode/remoteHost/createSession",
    remoteHostSyncProviders: "ocode/remoteHost/syncProviders",
    providersList: "ocode/providers/list",
    providersReorder: "ocode/providers/reorder",
    providersCreate: "ocode/providers/create",
    providersUpdate: "ocode/providers/update",
    providersDelete: "ocode/providers/delete",
    /**
     * Set or clear one provider's API key. Separate from `providersUpdate`
     * because a plugin-declared row refuses a generic update while still
     * needing the credential its declaration asks for.
     */
    providersSetSecret: "ocode/providers/setSecret",
    providersTest: "ocode/providers/testConnection",
    /**
     * Check a TypeSafe key before the Jev settings row keeps it.
     *
     * Jev is not a provider row, so `providersTest` cannot answer this: the
     * key is checked by the same System One round trip the Agent's
     * `JevClassify` tool makes, and only a key that answered is stored.
     */
    jevTest: "ocode/jev/test",
    providersListModels: "ocode/providers/listModels",
    /**
     * Look one model id up in the local models.dev snapshot.
     *
     * `providersListModels` cannot answer this: it describes a saved or
     * reached provider's catalogue, and a hand-typed custom id exists nowhere
     * yet when the settings picker needs its published limits. This is a
     * snapshot read — no provider network access and no host call — so the
     * picker can seed a custom row without probing an endpoint that does not
     * know the id.
     */
    providersLookupModel: "ocode/providers/lookupModel",
    providersRefreshModelCatalog: "ocode/providers/refreshModelCatalog",
    providersModelCatalogStatus: "ocode/providers/modelCatalogStatus",
    providersOauthVendors: "ocode/providers/oauth/vendors",
    providersOauthStart: "ocode/providers/oauth/start",
    providersOauthRespond: "ocode/providers/oauth/respond",
    providersOauthCancel: "ocode/providers/oauth/cancel",
    providersOauthDelete: "ocode/providers/oauth/delete",
    pluginList: "ocode/plugin/list",
    /** A renderer slot component asking its own plugin for one JSON answer. */
    pluginRendererCall: "ocode/plugin/rendererCall",
    /** Invoke a declared, user-facing Composer transform action. */
    pluginComposerTransform: "ocode/plugin/composerTransform",
    /** Plugin-contributed agent extensions (D387/D388, ADR 0214). */
    pluginImportExtension: "ocode/plugin/importExtension",
    extensionsCommandRun: "ocode/extensions/commands/run",
    extensionsUiRespond: "ocode/extensions/ui/respond",
    pluginLoadDev: "ocode/plugin/loadDev",
    /**
     * The answer to a development plugin's permission review. Loading a folder
     * is a two-step: `pluginLoadDev` returns the declaration, and this commits
     * the permissions the user accepted.
     */
    pluginLoadDevConfirm: "ocode/plugin/loadDevConfirm",
    pluginReload: "ocode/plugin/reload",
    /** Commits a reviewed widening for an already-loaded development plugin. */
    pluginReloadConfirm: "ocode/plugin/reloadConfirm",
    pluginCreateFromTemplate: "ocode/plugin/createFromTemplate",
    pluginInstallFromPath: "ocode/plugin/installFromPath",
    pluginInstallFromPackage: "ocode/plugin/installFromPackage",
    pluginEnable: "ocode/plugin/enable",
    pluginDisable: "ocode/plugin/disable",
    pluginSetScope: "ocode/plugin/setScope",
    pluginUninstall: "ocode/plugin/uninstall",
    pluginSetAutoUpdate: "ocode/plugin/setAutoUpdate",
    pluginSettingsGet: "ocode/plugin/settings/get",
    pluginSettingsSet: "ocode/plugin/settings/set",
    pluginOpenPanel: "ocode/plugin/openPanel",
    pluginLauncherToggle: "ocode/pluginLauncher/toggle",
    pluginLauncherDismiss: "ocode/pluginLauncher/dismiss",
    pluginThemes: "ocode/plugin/themes",
    pluginProviderCatalog: "ocode/plugin/providerCatalog",
    pluginScenicThemesDestinations: "ocode/plugin/scenicThemes/destinations",
    pluginScenicThemesSetBlur: "ocode/plugin/scenicThemes/setBlur",
    pluginServices: "ocode/plugin/services",
    pluginViews: "ocode/plugin/views",
    pluginViewOpen: "ocode/plugin/view/open",
    pluginViewClose: "ocode/plugin/view/close",
    pluginViewSetBounds: "ocode/plugin/view/setBounds",
    pluginViewSetVisible: "ocode/plugin/view/setVisible",
    mcpList: "ocode/mcp/list",
    mcpUpsert: "ocode/mcp/upsert",
    mcpRemove: "ocode/mcp/remove",
    mcpSetEnabled: "ocode/mcp/setEnabled",
    mcpSetScope: "ocode/mcp/setScope",
    mcpTransfer: "ocode/mcp/transfer",
    mcpTest: "ocode/mcp/test",
    mcpOauthStart: "ocode/mcp/oauth/start",
    mcpOauthCancel: "ocode/mcp/oauth/cancel",
    mcpImport: "ocode/mcp/import",
    mcpImportScan: "ocode/mcp/importScan",
    mcpImportRun: "ocode/mcp/importRun",
    mcpMarketSearch: "ocode/mcp/market/search",
    skillList: "ocode/skill/list",
    skillBuiltinList: "ocode/skill/builtin/list",
    skillBuiltinSetEnabled: "ocode/skill/builtin/setEnabled",
    skillCreate: "ocode/skill/create",
    skillImport: "ocode/skill/import",
    skillImportScan: "ocode/skill/importScan",
    skillImportRun: "ocode/skill/importRun",
    skillMarketSearch: "ocode/skill/market/search",
    skillMarketFetch: "ocode/skill/market/fetch",
    skillUpdate: "ocode/skill/update",
    skillRemove: "ocode/skill/remove",
    skillSetEnabled: "ocode/skill/setEnabled",
    skillSetScope: "ocode/skill/setScope",
    skillTransfer: "ocode/skill/transfer",
    skillRead: "ocode/skill/read",
    skillReveal: "ocode/skill/reveal",
    subagentList: "ocode/subagent/list",
    subagentCatalog: "ocode/subagent/catalog",
    subagentCreate: "ocode/subagent/create",
    subagentUpdate: "ocode/subagent/update",
    subagentRead: "ocode/subagent/read",
    subagentRemove: "ocode/subagent/remove",
    subagentSetEnabled: "ocode/subagent/setEnabled",
    subagentSetScope: "ocode/subagent/setScope",
    subagentSetBuiltinEnabled: "ocode/subagent/setBuiltinEnabled",
    subagentReveal: "ocode/subagent/reveal",
    marketRefresh: "ocode/market/refresh",
    marketSearch: "ocode/market/search",
    marketGetDetail: "ocode/market/getDetail",
    marketInstall: "ocode/market/install",
    marketCheckUpdates: "ocode/market/checkUpdates",
    marketApplyUpdates: "ocode/market/applyUpdates",
    marketCancelInstall: "ocode/market/cancelInstall",
    commandPaletteSearch: "ocode/commandPalette/search",
    commandPaletteExecute: "ocode/commandPalette/execute",
    logOpenFolder: "ocode/log/openFolder",
    devtoolsToggle: "ocode/devtools/toggle",
    composerPickFiles: "ocode/composer/pickFiles",
    composerPickPhotos: "ocode/composer/pickPhotos",
    composerImportFiles: "ocode/composer/importFiles",
    composerPasteFiles: "ocode/composer/pasteFiles",
    clipboardRecordPaste: "ocode/clipboard/recordPaste",
    composerCommands: "ocode/composer/commands",
    workspaceDiff: "ocode/workspace/diff",
    workspaceReviewRollback: "ocode/workspace/review/rollback",
    browserNavigate: "ocode/browser/navigate",
    browserAction: "ocode/browser/action",
    browserSetBounds: "ocode/browser/setBounds",
    browserSetVisible: "ocode/browser/setVisible",
    browserOpenExternal: "ocode/browser/openExternal",
    browserGetState: "ocode/browser/getState",
    fsList: "ocode/fs/list",
    fsRead: "ocode/fs/read",
    fsReadImageDataUrl: "ocode/fs/readImageDataUrl",
    statsGetTokenUsageHistory: "ocode/stats/getTokenUsageHistory",
    fsReveal: "ocode/fs/reveal",
    fsOpen: "ocode/fs/open",
    fsIndex: "ocode/fs/index",
    fsResolveRef: "ocode/fs/resolveRef",
    windowSetWorkPanelReservation:
      "ocode/window/setWorkPanelReservation",
    windowSetWorkPanelChatWidth: "ocode/window/setWorkPanelChatWidth",
    windowSetBackgroundColor: "ocode/window/setBackgroundColor",
    windowControl: "ocode/window/control",
    closeBehaviorGet: "ocode/window/closeBehavior/get",
    closeBehaviorSet: "ocode/window/closeBehavior/set",
    lifecycleDialogReady: "ocode/window/lifecycleDialog/ready",
    lifecycleDialogRespond: "ocode/window/lifecycleDialog/respond",
    menuRendererReady: "ocode/menu/rendererReady",
    traySetSessionPreferences: "ocode/tray/setSessionPreferences",
    nativeMenuAction: "ocode/menu/nativeAction",
  },
  event: {
    pluginChanged: "ocode/event/pluginChanged",
    /** Progress of an install or update, while it is still running. */
    pluginInstallProgress: "ocode/plugin/event/installProgress",
    /** Host-originated app settings mutation (e.g. plugin `app.setTheme`). */
    settingsChanged: "ocode/app/event/settingsChanged",
    configSyncChanged: "ocode/configSync/event/changed",
    /** A chat-started background task started, exited, or was stopped. */
    backgroundTasksChanged: "ocode/backgroundTasks/event/changed",
    /** What a running sync is doing, while it is still running. */
    configSyncProgress: "ocode/configSync/event/progress",
    extensionsUiPrompt: "ocode/extensions/event/uiPrompt",
    extensionsStatus: "ocode/extensions/event/status",
    pluginLauncherShown: "ocode/pluginLauncher/event/shown",
    agentMessage: "ocode/agent/event/message",
    agentQueueChanged: "ocode/agent/event/queueChanged",
    hostStatus: "ocode/app/event/hostStatus",
    toast: "ocode/app/event/toast",
    /**
     * The first plaintext hop to an endpoint the user typed, sent once and only
     * until the shell records `networkPolicy.insecureNoticeAcknowledged`. The
     * shell owns the wording, because the address is not a secret and the copy
     * is localized.
     */
    insecureEndpointNotice: "ocode/network/event/insecureEndpointNotice",
    browserState: "ocode/browser/event/state",
    browserPreview: "ocode/browser/event/preview",
    browserOpenFile: "ocode/browser/event/openFile",
    windowMaximized: "ocode/window/event/maximized",
    windowFullScreen: "ocode/window/event/fullscreen",
    windowWorkPanelResize: "ocode/window/event/workPanelResize",
    lifecycleDialogRequest: "ocode/window/event/lifecycleDialogRequest",
    lifecycleDialogDismiss: "ocode/window/event/lifecycleDialogDismiss",
    menuCommand: "ocode/menu/event/command",
    traySessionActivated: "ocode/tray/event/sessionActivated",
    notificationChanged: "ocode/notification/event/changed",
    sessionsChanged: "ocode/session/event/changed",
    remoteInteractions: "ocode/remote/event/interactions",
    notificationActivated: "ocode/notification/event/activated",
    notificationSound: "ocode/notification/event/sound",
    plansChanged: "ocode/plans/event/changed",
    todosChanged: "ocode/todos/event/changed",
    providersOauth: "ocode/providers/oauth/event",
    mcpOauth: "ocode/mcp/oauth/event",
    updatesState: "ocode/updates/event/state",
    voiceStateChanged: "ocode/voice/event/stateChanged",
    voiceModelProgress: "ocode/voice/event/modelProgress",
    liveVoiceChanged: "ocode/voice/live/event/changed",
    liveVoicePort: "ocode/voice/live/event/port",
    liveVoiceControl: "ocode/voice/live/event/control",
    liveVoiceTranscript: "ocode/voice/live/event/transcript",
    liveVoiceWidgetState: "ocode/voice/live/event/widgetState",
    liveVoiceWidgetAction: "ocode/voice/live/event/widgetAction",
  },
} as const;

export const IPC_WHITELIST = new Set<string>([
  ...Object.values(IPC.invoke),
  ...Object.values(IPC.event),
]);
