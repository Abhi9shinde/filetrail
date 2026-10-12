import type { ActivityType } from "../../src/types/activity";
import type { EventDetails, EventInput, FileInput } from "../../src/types/persistence";
import { PersistenceError } from "./errors";

const activityTypes = new Set<ActivityType>(["download", "modify", "rename", "move", "delete"]);
const fileFields = new Set(["id", "currentPath", "filename", "extension", "size", "createdAt", "updatedAt"]);
const eventFields = new Set(["id", "fileId", "type", "timestamp", "details"]);
const detailFields = new Set(["previousName", "previousPath", "newPath", "source", "note"]);

function invalid(message: string): never {
  throw new PersistenceError("INVALID_REQUEST", message);
}

function record(value: unknown, fields: Set<string>, name: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return invalid(`${name} must be an object.`);
  }

  const result = value as Record<string, unknown>;
  if (Object.keys(result).some((key) => !fields.has(key))) {
    return invalid(`${name} contains an unsupported field.`);
  }
  return result;
}

function requiredString(value: unknown, name: string, maxLength: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    return invalid(`${name} must be a non-empty string of at most ${maxLength} characters.`);
  }
  return value.trim();
}

export function normalizeTimestamp(value: unknown, name = "timestamp"): string {
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
  const date = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() + 1 !== Number(month) ||
    date.getUTCDate() !== Number(day) ||
    Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59 ||
    (offsetHour !== undefined && (Number(offsetHour) > 14 || Number(offsetMinute) > 59 || (Number(offsetHour) === 14 && Number(offsetMinute) !== 0)))
  ) {
    return invalid(`${name} is not a valid timestamp.`);
  }

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return invalid(`${name} is not a valid timestamp.`);
  return new Date(parsed).toISOString();
}

export function validateFileInput(value: unknown): FileInput {
  const input = record(value, fileFields, "file");
  if (typeof input.size !== "number" || !Number.isSafeInteger(input.size) || input.size < 0) {
    return invalid("file.size must be a non-negative safe integer.");
  }

  return {
    id: requiredString(input.id, "file.id", 128),
    currentPath: requiredString(input.currentPath, "file.currentPath", 32768),
    filename: requiredString(input.filename, "file.filename", 255),
    extension: typeof input.extension === "string" && input.extension.length <= 32
      ? input.extension.replace(/^\./, "").toLowerCase()
      : invalid("file.extension must be a string of at most 32 characters."),
    size: input.size,
    ...(input.createdAt === undefined ? {} : { createdAt: normalizeTimestamp(input.createdAt, "file.createdAt") }),
    ...(input.updatedAt === undefined ? {} : { updatedAt: normalizeTimestamp(input.updatedAt, "file.updatedAt") }),
  };
}

function validateDetails(value: unknown): EventDetails {
  const input = record(value, detailFields, "event.details");
  const details: EventDetails = {};
  for (const field of detailFields) {
    const detail = input[field];
    if (detail !== undefined) {
      details[field as keyof EventDetails] = requiredString(detail, `event.details.${field}`, 32768);
    }
  }
  if (JSON.stringify(details).length > 16384) return invalid("event.details is too large.");
  return details;
}

export function validateEventInput(value: unknown): EventInput {
  const input = record(value, eventFields, "event");
  if (typeof input.type !== "string" || !activityTypes.has(input.type as ActivityType)) {
    return invalid("event.type is unsupported.");
  }

  const details = input.details === undefined ? undefined : validateDetails(input.details);
  if ((input.type === "rename" || input.type === "move") && !details?.newPath) {
    return invalid("Rename and move events require event.details.newPath.");
  }

  return {
    id: requiredString(input.id, "event.id", 128),
    fileId: requiredString(input.fileId, "event.fileId", 128),
    type: input.type as ActivityType,
    timestamp: normalizeTimestamp(input.timestamp),
    ...(details ? { details } : {}),
  };
}

export function validateRecentLimit(value: unknown): number {
  if (value === undefined) return 50;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 200) {
    return invalid("limit must be an integer between 1 and 200.");
  }
  return value;
}

export function validateFileId(value: unknown): string {
  return requiredString(value, "fileId", 128);
}
