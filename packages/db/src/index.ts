import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export * from "./schema.js";
export { schema };

// Re-export drizzle-orm operators to avoid duplicate-instance issues in monorepos
export { eq, and, or, desc, asc, sql, inArray, isNull, isNotNull } from "drizzle-orm";

export type Database = ReturnType<typeof createDatabase>;

export function createDatabase(connectionString: string) {
  const client = postgres(connectionString);
  return drizzle(client, { schema });
}
