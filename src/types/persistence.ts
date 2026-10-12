import type { ActivityType } from "./activity";

export type EventDetails = {
  previousName?: string;
  previousPath?: string;
  newPath?: string;
  source?: string;
  note?: string;
};

export type PersistedFile = {
  id: string;
  currentPath: string;
  filename: string;
  extension: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type FileInput = Pick<PersistedFile, "id" | "currentPath" | "filename" | "extension" | "size"> & {
  createdAt?: string;
  updatedAt?: string;
};

export type PersistedEvent = {
  id: string;
  fileId: string;
  type: ActivityType;
  timestamp: string;
  details: EventDetails | null;
};

export type EventInput = {
  id: string;
  fileId: string;
  type: ActivityType;
  timestamp: string;
  details?: EventDetails;
};

export type FileHistory = {
  file: PersistedFile;
  events: PersistedEvent[];
};

export type PersistenceErrorCode =
  | "INVALID_REQUEST"
  | "NOT_FOUND"
  | "CONFLICT"
  | "DATABASE_UNAVAILABLE"
  | "DATABASE_ERROR";

export type PersistenceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: PersistenceErrorCode; message: string } };

export type FileTrailPersistenceApi = {
  initialize: () => Promise<PersistenceResult<{ initialized: true }>>;
  listRecentEvents: (limit?: number) => Promise<PersistenceResult<PersistedEvent[]>>;
  getFileHistory: (fileId: string) => Promise<PersistenceResult<FileHistory>>;
  upsertFile: (file: FileInput) => Promise<PersistenceResult<PersistedFile>>;
  recordEvent: (event: EventInput) => Promise<PersistenceResult<PersistedEvent>>;
};
