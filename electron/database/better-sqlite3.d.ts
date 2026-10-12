declare module "better-sqlite3" {
  export type RunResult = {
    changes: number;
    lastInsertRowid: number | bigint;
  };

  export type Statement = {
    run(...values: unknown[]): RunResult;
    get(...values: unknown[]): unknown;
    all(...values: unknown[]): unknown[];
  };

  export default class Database {
    constructor(filename: string);
    readonly open: boolean;
    exec(sql: string): this;
    pragma(sql: string, options?: { simple?: boolean }): unknown;
    prepare(sql: string): Statement;
    transaction<T>(callback: () => T): () => T;
    close(): void;
  }
}
