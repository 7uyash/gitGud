declare const process: {
  env: Record<string, string | undefined>;
};

declare module 'pg' {
  export class Pool {
    constructor(options?: { connectionString?: string });
    end(): Promise<void>;
  }
}

declare module 'drizzle-orm/node-postgres' {
  export function drizzle(pool: unknown, config?: unknown): any;
}
