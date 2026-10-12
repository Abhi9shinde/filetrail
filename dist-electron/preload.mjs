"use strict";
const electron = require("electron");
const persistenceChannels = {
  initialize: "filetrail:persistence:initialize",
  listRecentEvents: "filetrail:persistence:list-recent-events",
  getFileHistory: "filetrail:persistence:get-file-history",
  upsertFile: "filetrail:persistence:upsert-file",
  recordEvent: "filetrail:persistence:record-event"
};
function invoke(channel, ...args) {
  return electron.ipcRenderer.invoke(channel, ...args);
}
const persistenceApi = {
  initialize: () => invoke(persistenceChannels.initialize),
  listRecentEvents: (limit) => invoke(persistenceChannels.listRecentEvents, limit),
  getFileHistory: (fileId) => invoke(persistenceChannels.getFileHistory, fileId),
  upsertFile: (file) => invoke(persistenceChannels.upsertFile, file),
  recordEvent: (event) => invoke(persistenceChannels.recordEvent, event)
};
electron.contextBridge.exposeInMainWorld("fileTrailPersistence", persistenceApi);
