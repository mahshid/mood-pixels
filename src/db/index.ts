import "server-only";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
        throw new Error("DATABASE_URL is missing");
}

const globalForDb = globalThis as typeof globalThis & {
        moodPixelsPool?: Pool;
};

const pool = globalForDb.moodPixelsPool ?? new Pool({
        connectionString: databaseUrl,
        connectionTimeoutMillis: 5000,
});

if (process.env.NODE_ENV !== "production") {
        globalForDb.moodPixelsPool = pool;
}

export const db = drizzle({
        client: pool,
        schema,
});