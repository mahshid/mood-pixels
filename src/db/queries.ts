import "server-only";
import { db } from "./index";
import { eq } from "drizzle-orm"
import { moodEntries } from "./schema";

type NewMoodEntry = Pick<typeof moodEntries.$inferInsert, "entryDate" | "mood" | "energy" | "nudge">;

export async function createMoodEntry(entry: NewMoodEntry) {
    const [createdEntry] = await db.insert(moodEntries)
        .values(entry)
        .returning();

    return createdEntry;
}

export async function updateMoodEntry(entry: NewMoodEntry) {
    const [updatedEntry] = await db.update(moodEntries)
        .set({
            mood: entry.mood,
            energy: entry.energy,
            nudge: entry.nudge ?? null,
        })
        .where(eq(moodEntries.entryDate, entry.entryDate))
        .returning();

    return updatedEntry;
}

export async function deleteMoodEntry(entryDate: string) {
    const [deletedEntry] = await db.delete(moodEntries)
        .where(eq(moodEntries.entryDate, entryDate))
        .returning();

    return deletedEntry;
}
