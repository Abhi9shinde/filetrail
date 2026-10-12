export const persistenceChannels = {
  initialize: "filetrail:persistence:initialize",
  listRecentEvents: "filetrail:persistence:list-recent-events",
  getFileHistory: "filetrail:persistence:get-file-history",
  upsertFile: "filetrail:persistence:upsert-file",
  recordEvent: "filetrail:persistence:record-event",
} as const;
