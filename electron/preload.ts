import { contextBridge, ipcRenderer } from "electron";
import type { FileTrailPersistenceApi, PersistenceResult } from "../src/types/persistence";
import { persistenceChannels } from "./database/channels";

function invoke<T>(channel: string, ...args: unknown[]): Promise<PersistenceResult<T>> {
  return ipcRenderer.invoke(channel, ...args) as Promise<PersistenceResult<T>>;
}

const persistenceApi: FileTrailPersistenceApi = {
  initialize: () => invoke(persistenceChannels.initialize),
  listRecentEvents: (limit) => invoke(persistenceChannels.listRecentEvents, limit),
  getFileHistory: (fileId) => invoke(persistenceChannels.getFileHistory, fileId),
  upsertFile: (file) => invoke(persistenceChannels.upsertFile, file),
  recordEvent: (event) => invoke(persistenceChannels.recordEvent, event),
};

contextBridge.exposeInMainWorld("fileTrailPersistence", persistenceApi);
