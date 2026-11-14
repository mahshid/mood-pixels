import "dotenv/config";
import pg from "pg";

if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is missing.");
}

const client = new pg.Client({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 5000,
});

try {
        await client.connect();

        const result = await client.query(
                "SELECT current_database(), current_user"
        );

        console.table(result.rows);
} catch (error) {
        console.error("Database connection failed:", error.message);
        process.exitCode = 1;
} finally {
        await client.end();
}