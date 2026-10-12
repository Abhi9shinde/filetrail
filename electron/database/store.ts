import { mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type {
  EventDetails,
  EventInput,
  FileHistory,
  FileInput,
  PersistedEvent,
  PersistedFile,
} from "../../src/types/persistence";
import { PersistenceError } from "./errors";
import { migrate } from "./migrations";
import { normalizeTimestamp } from "./validation";

type FileRow = {
  id: string;
  current_path: string;
  filename: string;
  extension: string;
  size: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type EventRow = {
  id: string;
  file_id: string;
  type: PersistedEvent["type"];
  timestamp: string;
  details_json: string | null;
};

let database: Database | null = null;

function fileFromRow(row: FileRow): PersistedFile {
  return {
    id: row.id,
    currentPath: row.current_path,
    filename: row.filename,
    extension: row.extension,
    size: row.size,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function eventFromRow(row: EventRow): PersistedEvent {
  return {
    id: row.id,
    fileId: row.file_id,
    type: row.type,
    timestamp: row.timestamp,
    details: row.details_json ? JSON.parse(row.details_json) as EventDetails : null,
  };
}

function getDatabase(): Database {
  if (!database?.open) {
    throw new PersistenceError("DATABASE_UNAVAILABLE", "The local history database is not initialized.");
  }
  return database;
}

export function initializeDatabase(databasePath: string): void {
  if (database?.open) return;
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

export function closeDatabase(): void {
  if (!database) return;
  const connection = database;
  database = null;
  if (connection.open) connection.close();
}

export function listRecentEvents(limit: number): PersistedEvent[] {
  const rows = getDatabase()
    .prepare("SELECT id, file_id, type, timestamp, details_json FROM events ORDER BY timestamp DESC, id DESC LIMIT ?")
    .all(limit) as EventRow[];
  return rows.map(eventFromRow);
}

export function getFileHistory(fileId: string): FileHistory {
  const db = getDatabase();
  const fileRow = db.prepare("SELECT * FROM files WHERE id = ?").get(fileId) as FileRow | undefined;
  if (!fileRow) throw new PersistenceError("NOT_FOUND", "The requested file history was not found.");

  const rows = db
    .prepare("SELECT id, file_id, type, timestamp, details_json FROM events WHERE file_id = ? ORDER BY timestamp DESC, id DESC")
    .all(fileId) as EventRow[];
  return { file: fileFromRow(fileRow), events: rows.map(eventFromRow) };
}

export function upsertFile(input: FileInput): PersistedFile {
  const db = getDatabase();
  const now = new Date().toISOString();
  const createdAt = normalizeTimestamp(input.createdAt ?? now, "file.createdAt");
  const updatedAt = normalizeTimestamp(input.updatedAt ?? now, "file.updatedAt");
  const existing = db.prepare("SELECT current_path, filename, extension, deleted_at FROM files WHERE id = ?")
    .get(input.id) as Pick<FileRow, "current_path" | "filename" | "extension" | "deleted_at"> | undefined;
  if (existing && existing.deleted_at !== null) {
    throw new PersistenceError("CONFLICT", "A deleted file record cannot be updated.");
  }
  if (existing && (
    existing.current_path !== input.currentPath ||
    existing.filename !== input.filename ||
    existing.extension !== input.extension
  )) {
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

  const row = db.prepare("SELECT * FROM files WHERE id = ?").get(input.id) as FileRow;
  return fileFromRow(row);
}

export function recordEvent(input: EventInput): PersistedEvent {
  const db = getDatabase();
  const timestamp = normalizeTimestamp(input.timestamp);

  return db.transaction(() => {
    const row = db.prepare("SELECT * FROM files WHERE id = ?").get(input.fileId) as FileRow | undefined;
    if (!row) throw new PersistenceError("NOT_FOUND", "The file record for this event was not found.");
    if (row.deleted_at !== null) {
      throw new PersistenceError("CONFLICT", "A historical event cannot be added to a deleted file record.");
    }

    let details = input.details ? { ...input.details } : null;
    if (input.type === "rename" || input.type === "move" || input.type === "delete") {
      details = {
        ...details,
        previousName: row.filename,
        previousPath: row.current_path,
      };
    }

    if (input.type === "rename" || input.type === "move") {
      const newPath = details?.newPath;
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
      db.prepare("UPDATE files SET deleted_at = ?, updated_at = ? WHERE id = ?")
        .run(timestamp, timestamp, input.fileId);
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
      details,
    };
  })();
}
