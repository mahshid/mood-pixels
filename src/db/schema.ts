import { pgTable, integer, date, pgEnum, smallint, check, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const moodEnum = pgEnum("mood", [
        "Sparkly",
        "Cozy",
        "Tired",
        "Sad",
        "Frustrated",
]);

export const moodEntries = pgTable(
        "mood_entries",
        {
                id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
                entryDate: date("entry_date", { mode: "string" }).notNull().unique(),
                mood: moodEnum("mood").notNull(),
                energy: smallint("energy").notNull(),
                nudge: text("nudge"),

                createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
                updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
        },
        (table) => [
                check("energy_range", sql`${table.energy} BETWEEN 1 AND 5`),
        ]
);