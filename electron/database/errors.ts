import type { PersistenceErrorCode } from "../../src/types/persistence";

export class PersistenceError extends Error {
  constructor(
    readonly code: PersistenceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "PersistenceError";
  }
}

export function toPersistenceError(error: unknown): { code: PersistenceErrorCode; message: string } {
  if (error instanceof PersistenceError) {
    return { code: error.code, message: error.message };
  }

  const sqliteCode = typeof error === "object" && error !== null && "code" in error
    ? (error as { code?: unknown }).code
    : undefined;
  if ((typeof sqliteCode === "string" && sqliteCode.startsWith("SQLITE_CONSTRAINT")) ||
    (error instanceof Error && /constraint failed/i.test(error.message))) {
    return { code: "CONFLICT", message: "The record conflicts with existing history." };
  }

  return { code: "DATABASE_ERROR", message: "The local history operation failed." };
}
