import 'server-only';
import { db } from './index';
import { and, eq } from 'drizzle-orm';
import { moodEntries } from './schema';

type NewMoodEntry = Pick<
	typeof moodEntries.$inferInsert,
	'entryDate' | 'mood' | 'energy' | 'nudge'
>;

export async function createMoodEntry(entry: NewMoodEntry, userId: string) {
	const [createdEntry] = await db
		.insert(moodEntries)
		.values({ ...entry, userId })
		.returning();

	return createdEntry;
}

export async function updateMoodEntry(entry: NewMoodEntry, userId: string) {
	const [updatedEntry] = await db
		.update(moodEntries)
		.set({
			mood: entry.mood,
			energy: entry.energy,
			nudge: entry.nudge ?? null,
		})
		.where(
			and(
				eq(moodEntries.entryDate, entry.entryDate),
				eq(moodEntries.userId, userId)
			)
		)
		.returning();

	return updatedEntry;
}

export async function deleteMoodEntry(entryDate: string, userId: string) {
	const [deletedEntry] = await db
		.delete(moodEntries)
		.where(
			and(eq(moodEntries.entryDate, entryDate), eq(moodEntries.userId, userId))
		)
		.returning();

	return deletedEntry;
}
