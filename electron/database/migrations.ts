import type Database from "better-sqlite3";

type Migration = {
  version: number;
  up: (database: Database) => void;
};

const migrations: Migration[] = [
  {
    version: 1,
    up(database) {
      database.exec(`
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
    },
  },
];

export const currentSchemaVersion = migrations[migrations.length - 1]?.version ?? 0;

export function migrate(database: Database): void {
  const currentVersion = Number(database.pragma("user_version", { simple: true }));
  if (!Number.isInteger(currentVersion) || currentVersion < 0) {
    throw new Error("The SQLite schema version is invalid.");
  }
  if (currentVersion > currentSchemaVersion) {
    throw new Error(`Database schema version ${currentVersion} is newer than supported version ${currentSchemaVersion}.`);
  }

  for (const migration of migrations) {
    if (migration.version <= currentVersion) continue;
    if (migration.version !== Number(database.pragma("user_version", { simple: true })) + 1) {
      throw new Error(`SQLite migration ${migration.version} is not sequential.`);
    }

    database.transaction(() => {
      migration.up(database);
      database.pragma(`user_version = ${migration.version}`);
    })();
  }
}
