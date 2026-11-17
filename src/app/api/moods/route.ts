import { getLocalDate } from '@/app/lib/date';
import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { moodEntries } from '@/db/schema';
import { createMoodEntrySchema } from '@/db/validation';
import { createMoodEntry } from '@/db/queries';
import { requireUser } from '@/app/lib/require-user';

export async function POST(request: Request) {
	const currentUser = await requireUser(request);
	if (!currentUser.ok) return currentUser.response;

	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const result = createMoodEntrySchema.safeParse(body);

	if (!result.success) {
		return NextResponse.json(
			{ error: 'Invalid check-in', issues: result.error.issues },
			{ status: 400 }
		);
	}

	const today = getLocalDate();

	if (result.data.entryDate > today) {
		return NextResponse.json(
			{ error: 'Future dates are not allowed' },
			{ status: 400 }
		);
	}

	try {
		const entry = await createMoodEntry(result.data, currentUser.userId);

		return NextResponse.json(entry, { status: 201 });
	} catch (error) {
		const cause =
			error instanceof Error && 'cause' in error ? error.cause : error;

		if (
			typeof cause === 'object' &&
			cause !== null &&
			'code' in cause &&
			cause.code === '23505'
		) {
			return NextResponse.json(
				{ error: 'A check-in already exists for this date' },
				{ status: 409 }
			);
		}

		console.error('Failed to create mood entry:', error);

		return NextResponse.json(
			{ error: 'Could not save check-in' },
			{ status: 500 }
		);
	}
}

export async function GET(request: Request) {
	const currentUser = await requireUser(request);
	if (!currentUser.ok) return currentUser.response;

	try {
		const entries = await db
			.select()
			.from(moodEntries)
			.where(eq(moodEntries.userId, currentUser.userId))
			.orderBy(desc(moodEntries.entryDate));

		return NextResponse.json(entries);
	} catch (error) {
		console.error('Failed to load mood entries:', error);

		return NextResponse.json(
			{ error: 'Could not load mood entries' },
			{ status: 500 }
		);
	}
}
