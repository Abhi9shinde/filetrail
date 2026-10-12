var _a;
import { ipcMain, app, BrowserWindow, dialog } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { mkdirSync } from "node:fs";
import Database from "better-sqlite3";
class PersistenceError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "PersistenceError";
  }
}
function toPersistenceError(error) {
  if (error instanceof PersistenceError) {
    return { code: error.code, message: error.message };
  }
  const sqliteCode = typeof error === "object" && error !== null && "code" in error ? error.code : void 0;
  if (typeof sqliteCode === "string" && sqliteCode.startsWith("SQLITE_CONSTRAINT") || error instanceof Error && /constraint failed/i.test(error.message)) {
    return { code: "CONFLICT", message: "The record conflicts with existing history." };
  }
  return { code: "DATABASE_ERROR", message: "The local history operation failed." };
}
const migrations = [
  {
    version: 1,
    up(database2) {
      database2.exec(`
        CREATE TABLE files (
          id TEXT PRIMARY KEY NOT NULL CHECK(length(id) BETWEEN 1 AND 128),
          current_path TEXT NOT NULL CHECK(length(current_path) BETWEEN 1 AND 32768),
          filename TEXT NOT NULL CHECK(length(filename) BETWEEN 1 AND 255),
          extension TEXT NOT NULL DEFAULT '' CHECK(length(extension) <= 32),
          size INTEGER NOT NULL CHECK(size >= 0),
          created_at TEXT NOT NULL CHECK(length(created_at) = 24 AND substr(created_at, -1) = 'Z'),
          updated_at TEXT NOT NULL CHECK(length(updated_at) = 24 AND substr(updated_at, -1) = 'Z'),
          deleted_at TEXT CHECK(deleted_at IS NULL OR (length(deleted_at) = 24 AND substr(deleted_at, -1) = 'Z'))
        );

        CREATE TABLE events (
          id TEXT PRIMARY KEY NOT NULL CHECK(length(id) BETWEEN 1 AND 128),
          file_id TEXT NOT NULL REFERENCES files(id) ON DELETE RESTRICT,
          type TEXT NOT NULL CHECK(type IN ('download', 'modify', 'rename', 'move', 'delete')),
          timestamp TEXT NOT NULL CHECK(length(timestamp) = 24 AND substr(timestamp, -1) = 'Z'),
          details_json TEXT CHECK(details_json IS NULL OR json_valid(details_json))
        );

        CREATE INDEX files_filename_idx ON files(filename COLLATE NOCASE);
        CREATE INDEX files_path_idx ON files(current_path COLLATE NOCASE);
        CREATE INDEX files_extension_idx ON files(extension);
        CREATE INDEX events_recent_idx ON events(timestamp DESC, id DESC);
        CREATE INDEX events_file_history_idx ON events(file_id, timestamp DESC, id DESC);
        CREATE INDEX events_type_recent_idx ON events(type, timestamp DESC, id DESC);
      `);
    }
  }
];
const currentSchemaVersion = ((_a = migrations[migrations.length - 1]) == null ? void 0 : _a.version) ?? 0;
function migrate(database2) {
  const currentVersion = Number(database2.pragma("user_version", { simple: true }));
  if (!Number.isInteger(currentVersion) || currentVersion < 0) {
    throw new Error("The SQLite schema version is invalid.");
  }
  if (currentVersion > currentSchemaVersion) {
    throw new Error(`Database schema version ${currentVersion} is newer than supported version ${currentSchemaVersion}.`);
  }
  for (const migration of migrations) {
    if (migration.version <= currentVersion) continue;
    if (migration.version !== Number(database2.pragma("user_version", { simple: true })) + 1) {
      throw new Error(`SQLite migration ${migration.version} is not sequential.`);
    }
    database2.transaction(() => {
      migration.up(database2);
      database2.pragma(`user_version = ${migration.version}`);
    })();
  }
}
const activityTypes = /* @__PURE__ */ new Set(["download", "modify", "rename", "move", "delete"]);
const fileFields = /* @__PURE__ */ new Set(["id", "currentPath", "filename", "extension", "size", "createdAt", "updatedAt"]);
const eventFields = /* @__PURE__ */ new Set(["id", "fileId", "type", "timestamp", "details"]);
const detailFields = /* @__PURE__ */ new Set(["previousName", "previousPath", "newPath", "source", "note"]);
function invalid(message) {
  throw new PersistenceError("INVALID_REQUEST", message);
}
function record(value, fields, name) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return invalid(`${name} must be an object.`);
  }
  const result = value;
  if (Object.keys(result).some((key) => !fields.has(key))) {
    return invalid(`${name} contains an unsupported field.`);
  }
  return result;
}
function requiredString(value, name, maxLength) {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    return invalid(`${name} must be a non-empty string of at most ${maxLength} characters.`);
  }
  return value.trim();
}
function normalizeTimestamp(value, name = "timestamp") {
  if (typeof value !== "string") return invalid(`${name} must include an ISO 8601 timezone.`);
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|([+-])(\d{2}):(\d{2}))$/);
  if (!match) return invalid(`${name} must be an ISO 8601 timestamp with an explicit timezone.`);
  const year = match[1];
  const month = match[2];
  const day = match[3];
  const hour = match[4];
  const minute = match[5];
  const second = match[6];
  const offsetHour = match[9];
  const offsetMinute = match[10];
  const date = /* @__PURE__ */ new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() + 1 !== Number(month) || date.getUTCDate() !== Number(day) || Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59 || offsetHour !== void 0 && (Number(offsetHour) > 14 || Number(offsetMinute) > 59 || Number(offsetHour) === 14 && Number(offsetMinute) !== 0)) {
    return invalid(`${name} is not a valid timestamp.`);
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return invalid(`${name} is not a valid timestamp.`);
  return new Date(parsed).toISOString();
}
function validateFileInput(value) {
  const input = record(value, fileFields, "file");
  if (typeof input.size !== "number" || !Number.isSafeInteger(input.size) || input.size < 0) {
    return invalid("file.size must be a non-negative safe integer.");
  }
  return {
    id: requiredString(input.id, "file.id", 128),
    currentPath: requiredString(input.currentPath, "file.currentPath", 32768),
    filename: requiredString(input.filename, "file.filename", 255),
    extension: typeof input.extension === "string" && input.extension.length <= 32 ? input.extension.replace(/^\./, "").toLowerCase() : invalid("file.extension must be a string of at most 32 characters."),
    size: input.size,
    ...input.createdAt === void 0 ? {} : { createdAt: normalizeTimestamp(input.createdAt, "file.createdAt") },
    ...input.updatedAt === void 0 ? {} : { updatedAt: normalizeTimestamp(input.updatedAt, "file.updatedAt") }
  };
}
function validateDetails(value) {
  const input = record(value, detailFields, "event.details");
  const details = {};
  for (const field of detailFields) {
    const detail = input[field];
    if (detail !== void 0) {
      details[field] = requiredString(detail, `event.details.${field}`, 32768);
    }
  }
  if (JSON.stringify(details).length > 16384) return invalid("event.details is too large.");
  return details;
}
function validateEventInput(value) {
  const input = record(value, eventFields, "event");
  if (typeof input.type !== "string" || !activityTypes.has(input.type)) {
    return invalid("event.type is unsupported.");
  }
  const details = input.details === void 0 ? void 0 : validateDetails(input.details);
  if ((input.type === "rename" || input.type === "move") && !(details == null ? void 0 : details.newPath)) {
    return invalid("Rename and move events require event.details.newPath.");
  }
  return {
    id: requiredString(input.id, "event.id", 128),
    fileId: requiredString(input.fileId, "event.fileId", 128),
    type: input.type,
    timestamp: normalizeTimestamp(input.timestamp),
    ...details ? { details } : {}
  };
}
function validateRecentLimit(value) {
  if (value === void 0) return 50;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 200) {
    return invalid("limit must be an integer between 1 and 200.");
  }
  return value;
}
function validateFileId(value) {
  return requiredString(value, "fileId", 128);
}
let database = null;
function fileFromRow(row) {
  return {
    id: row.id,
    currentPath: row.current_path,
    filename: row.filename,
    extension: row.extension,
    size: row.size,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  };
}
function eventFromRow(row) {
  return {
    id: row.id,
    fileId: row.file_id,
    type: row.type,
    timestamp: row.timestamp,
    details: row.details_json ? JSON.parse(row.details_json) : null
  };
}
function getDatabase() {
  if (!(database == null ? void 0 : database.open)) {
    throw new PersistenceError("DATABASE_UNAVAILABLE", "The local history database is not initialized.");
  }
  return database;
}
function initializeDatabase(databasePath) {
  if (database == null ? void 0 : database.open) return;
  if (!path.isAbsolute(databasePath)) throw new Error("The database path must be absolute.");
  mkdirSync(path.dirname(databasePath), { recursive: true });
  const connection = new Database(databasePath);
  try {
    connection.pragma("foreign_keys = ON");
    if (Number(connection.pragma("foreign_keys", { simple: true })) !== 1) {
      throw new Error("SQLite foreign-key enforcement could not be enabled.");
    }
    connection.pragma("journal_mode = WAL");
    connection.pragma("busy_timeout = 5000");
    migrate(connection);
    database = connection;
  } catch (error) {
    connection.close();
    throw error;
  }
}
function closeDatabase() {
  if (!database) return;
  const connection = database;
  database = null;
  if (connection.open) connection.close();
}
function listRecentEvents(limit) {
  const rows = getDatabase().prepare("SELECT id, file_id, type, timestamp, details_json FROM events ORDER BY timestamp DESC, id DESC LIMIT ?").all(limit);
  return rows.map(eventFromRow);
}
function getFileHistory(fileId) {
  const db = getDatabase();
  const fileRow = db.prepare("SELECT * FROM files WHERE id = ?").get(fileId);
  if (!fileRow) throw new PersistenceError("NOT_FOUND", "The requested file history was not found.");
  const rows = db.prepare("SELECT id, file_id, type, timestamp, details_json FROM events WHERE file_id = ? ORDER BY timestamp DESC, id DESC").all(fileId);
  return { file: fileFromRow(fileRow), events: rows.map(eventFromRow) };
}
function upsertFile(input) {
  const db = getDatabase();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const createdAt = normalizeTimestamp(input.createdAt ?? now, "file.createdAt");
  const updatedAt = normalizeTimestamp(input.updatedAt ?? now, "file.updatedAt");
  const existing = db.prepare("SELECT current_path, filename, extension, deleted_at FROM files WHERE id = ?").get(input.id);
  if (existing && existing.deleted_at !== null) {
    throw new PersistenceError("CONFLICT", "A deleted file record cannot be updated.");
  }
  if (existing && (existing.current_path !== input.currentPath || existing.filename !== input.filename || existing.extension !== input.extension)) {
    throw new PersistenceError("INVALID_REQUEST", "Path or filename changes must be recorded as rename or move events.");
  }
  db.prepare(`
    INSERT INTO files (id, current_path, filename, extension, size, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      current_path = excluded.current_path,
      filename = excluded.filename,
      extension = excluded.extension,
      size = excluded.size,
      updated_at = excluded.updated_at
  `).run(input.id, input.currentPath, input.filename, input.extension, input.size, createdAt, updatedAt);
  const row = db.prepare("SELECT * FROM files WHERE id = ?").get(input.id);
  return fileFromRow(row);
}
function recordEvent(input) {
  const db = getDatabase();
  const timestamp = normalizeTimestamp(input.timestamp);
  return db.transaction(() => {
    const row = db.prepare("SELECT * FROM files WHERE id = ?").get(input.fileId);
    if (!row) throw new PersistenceError("NOT_FOUND", "The file record for this event was not found.");
    if (row.deleted_at !== null) {
      throw new PersistenceError("CONFLICT", "A historical event cannot be added to a deleted file record.");
    }
    let details = input.details ? { ...input.details } : null;
    if (input.type === "rename" || input.type === "move" || input.type === "delete") {
      details = {
        ...details,
        previousName: row.filename,
        previousPath: row.current_path
      };
    }
    if (input.type === "rename" || input.type === "move") {
      const newPath = details == null ? void 0 : details.newPath;
      if (!newPath) {
        throw new PersistenceError("INVALID_REQUEST", "Rename and move events require a destination path.");
      }
      const filename = newPath.split(/[\\/]/).filter(Boolean).pop();
      if (!filename) throw new PersistenceError("INVALID_REQUEST", "The destination path must include a filename.");
      const extensionIndex = filename.lastIndexOf(".");
      const extension = extensionIndex > 0 ? filename.slice(extensionIndex + 1).toLowerCase() : "";
      db.prepare(`
        UPDATE files SET current_path = ?, filename = ?, extension = ?, updated_at = ? WHERE id = ?
      `).run(newPath, filename, extension, timestamp, input.fileId);
    } else if (input.type === "delete") {
      db.prepare("UPDATE files SET deleted_at = ?, updated_at = ? WHERE id = ?").run(timestamp, timestamp, input.fileId);
    }
    const detailsJson = details ? JSON.stringify(details) : null;
    db.prepare(`
      INSERT INTO events (id, file_id, type, timestamp, details_json) VALUES (?, ?, ?, ?, ?)
    `).run(input.id, input.fileId, input.type, timestamp, detailsJson);
    return {
      id: input.id,
      fileId: input.fileId,
      type: input.type,
      timestamp,
      details
    };
  })();
}
const persistenceChannels = {
  initialize: "filetrail:persistence:initialize",
  listRecentEvents: "filetrail:persistence:list-recent-events",
  getFileHistory: "filetrail:persistence:get-file-history",
  upsertFile: "filetrail:persistence:upsert-file",
  recordEvent: "filetrail:persistence:record-event"
};
function isTrustedSender(event, options) {
  if (!event.senderFrame || event.senderFrame !== event.sender.mainFrame) return false;
  try {
    const senderUrl = new URL(event.senderFrame.url);
    if (options.developmentUrl) {
      return senderUrl.origin === new URL(options.developmentUrl).origin;
    }
    return senderUrl.protocol === "file:" && path.resolve(fileURLToPath(senderUrl)) === path.resolve(options.rendererHtmlPath);
  } catch {
    return false;
  }
}
function success(data) {
  return { ok: true, data };
}
function failure(error) {
  return { ok: false, error: toPersistenceError(error) };
}
function guarded(event, options, action) {
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
function registerPersistenceIpc(options) {
  ipcMain.handle(persistenceChannels.initialize, (event) => guarded(event, options, () => {
    initializeDatabase(options.databasePath);
    return { initialized: true };
  }));
  ipcMain.handle(persistenceChannels.listRecentEvents, (event, limit) => guarded(event, options, () => listRecentEvents(validateRecentLimit(limit))));
  ipcMain.handle(persistenceChannels.getFileHistory, (event, fileId) => guarded(event, options, () => getFileHistory(validateFileId(fileId))));
  ipcMain.handle(persistenceChannels.upsertFile, (event, file) => guarded(event, options, () => upsertFile(validateFileInput(file))));
  ipcMain.handle(persistenceChannels.recordEvent, (event, activity) => guarded(event, options, () => recordEvent(validateEventInput(activity))));
  return () => Object.values(persistenceChannels).forEach((channel) => ipcMain.removeHandler(channel));
}
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let unregisterPersistenceIpc = null;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  const databasePath = path.join(app.getPath("userData"), "filetrail.sqlite");
  try {
    initializeDatabase(databasePath);
  } catch (error) {
    console.error("FileTrail database initialization failed:", error);
    dialog.showErrorBox(
      "Local history could not be initialized",
      "Check that the application data folder is writable and restart FileTrail. See the application log for technical details."
    );
    app.quit();
    return;
  }
  unregisterPersistenceIpc = registerPersistenceIpc({
    databasePath,
    developmentUrl: VITE_DEV_SERVER_URL,
    rendererHtmlPath: path.join(RENDERER_DIST, "index.html")
  });
  createWindow();
}).catch((error) => {
  console.error("FileTrail startup failed:", error);
  dialog.showErrorBox(
    "FileTrail could not start",
    "The application failed to open. See the application log for technical details."
  );
  app.quit();
});
app.on("before-quit", () => {
  unregisterPersistenceIpc == null ? void 0 : unregisterPersistenceIpc();
  unregisterPersistenceIpc = null;
  try {
    closeDatabase();
  } catch (error) {
    console.error("FileTrail database shutdown failed:", error);
  }
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
