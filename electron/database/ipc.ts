import { ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { IpcMainInvokeEvent } from "electron";
import type {
  EventInput,
  FileInput,
  FileTrailPersistenceApi,
  PersistenceResult,
} from "../../src/types/persistence";
import { persistenceChannels as channels } from "./channels";
import { PersistenceError, toPersistenceError } from "./errors";
import {
  getFileHistory,
  initializeDatabase,
  listRecentEvents,
  recordEvent,
  upsertFile,
} from "./store";
import {
  validateEventInput,
  validateFileId,
  validateFileInput,
  validateRecentLimit,
} from "./validation";

export type PersistenceIpcOptions = {
  databasePath: string;
  developmentUrl?: string;
  rendererHtmlPath: string;
};

function isTrustedSender(event: IpcMainInvokeEvent, options: PersistenceIpcOptions): boolean {
  if (!event.senderFrame || event.senderFrame !== event.sender.mainFrame) return false;
  try {
    const senderUrl = new URL(event.senderFrame.url);
    if (options.developmentUrl) {
      return senderUrl.origin === new URL(options.developmentUrl).origin;
    }
    return senderUrl.protocol === "file:" &&
      path.resolve(fileURLToPath(senderUrl)) === path.resolve(options.rendererHtmlPath);
  } catch {
    return false;
  }
}

function success<T>(data: T): PersistenceResult<T> {
  return { ok: true, data };
}

function failure(error: unknown): PersistenceResult<never> {
  return { ok: false, error: toPersistenceError(error) };
}

function guarded<T>(
  event: IpcMainInvokeEvent,
  options: PersistenceIpcOptions,
  action: () => T,
): PersistenceResult<T> {
  if (!isTrustedSender(event, options)) {
    return failure(new PersistenceError("INVALID_REQUEST", "This application frame cannot access local history."));
  }
  try {
    return success(action());
  } catch (error) {
    if (!(error instanceof PersistenceError)) {
      console.error("FileTrail persistence operation failed:", error);
    }
    return failure(error);
  }
}

export function registerPersistenceIpc(options: PersistenceIpcOptions): () => void {
  ipcMain.handle(channels.initialize, (event) => guarded(event, options, () => {
    initializeDatabase(options.databasePath);
    return { initialized: true as const };
  }));
  ipcMain.handle(channels.listRecentEvents, (event, limit) => guarded(event, options, () =>
    listRecentEvents(validateRecentLimit(limit))));
  ipcMain.handle(channels.getFileHistory, (event, fileId) => guarded(event, options, () =>
    getFileHistory(validateFileId(fileId))));
  ipcMain.handle(channels.upsertFile, (event, file) => guarded(event, options, () =>
    upsertFile(validateFileInput(file) as FileInput)));
  ipcMain.handle(channels.recordEvent, (event, activity) => guarded(event, options, () =>
    recordEvent(validateEventInput(activity) as EventInput)));

  return () => Object.values(channels).forEach((channel) => ipcMain.removeHandler(channel));
}

export type RendererPersistenceApi = FileTrailPersistenceApi;
