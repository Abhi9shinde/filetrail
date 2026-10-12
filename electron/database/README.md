# Local persistence foundation

`better-sqlite3` is loaded only by the Electron main process. The database file is
`filetrail.sqlite` inside `app.getPath("userData")`; it is not created in the
repository. The renderer can call only the named methods exposed as
`window.fileTrailPersistence`. It cannot select a database path, send SQL, or
perform filesystem operations.

## Schema and history rules

Schema version 1 is recorded in SQLite's `PRAGMA user_version`. Each migration
runs in a transaction. Foreign-key enforcement is enabled and verified before
migrations run. The `files` table stores a stable ID, current path/name,
extension, size, record timestamps, and an optional `deleted_at` tombstone. The
`events` table stores event IDs, file IDs, types, UTC ISO timestamps, and
optional validated JSON details. A foreign key uses `ON DELETE RESTRICT`, so
file rows cannot be physically deleted while history refers to them.

Rename and move events retain the same file ID, update the current path/name,
and record the prior path/name in event details. A delete event sets
`deleted_at` and remains in history; later events for that tombstoned ID are
rejected. Event IDs are unique primary keys, so duplicate inserts fail instead
of silently duplicating history.

The indexes support newest-first timeline and per-file history queries, with
additional indexes for type, filename, path, and extension. The mock UI remains
mock-backed. Startup does not copy or seed its demonstration records into this
database.

## IPC operations and errors

The narrow bridge provides database initialization, recent event listing
(1–200 rows; default 50), per-file history, file upsert, and event recording.
Main-process validation limits IDs and strings, checks event types, bounds
details, validates non-negative integer sizes, and requires timezone-aware ISO
8601 timestamps.

Operations return a discriminated result with these error codes:

- `INVALID_REQUEST`: malformed or unsupported input, or an untrusted frame.
- `NOT_FOUND`: requested file/history does not exist.
- `CONFLICT`: duplicate IDs, violated constraints, or an event for a tombstone.
- `DATABASE_UNAVAILABLE`: database operations ran before successful startup.
- `DATABASE_ERROR`: another storage failure; SQL details are logged in the main
  process and are not sent to the renderer.

If opening or migrating the database fails, startup logs the underlying error,
shows a general error dialog, and closes instead of silently running with
nonfunctional persistence. The database is closed idempotently on application
quit. Check that the user-data directory is writable and that the database is
not locked by an incompatible process before restarting. A database whose
schema version is newer than this app supports is rejected without downgrade.

## Native module setup

`better-sqlite3` is pinned to 12.6.2 as a runtime dependency. The prior isolated
Windows x64 compatibility spike loaded it and ran a query in Electron 30.5.1
(Node 20.16.0); it also exercised an unpacked package. This is compatibility
evidence for the module/runtime pair, not a production build test of this
repository. `npm run rebuild:native` and the install hook rebuild native
dependencies for the Electron version in the project. electron-builder also
rebuilds native dependencies during packaging; the native module is external to
Vite's main bundle and its package files are unpacked from ASAR.

If no compatible prebuilt binary is available, Windows source builds require
Python and Visual Studio Build Tools with the **Desktop development with C++**
workload, including the x64 MSVC toolchain and a Windows SDK. This machine did
not expose `cl.exe` or `vswhere.exe` during this milestone's inspection.
