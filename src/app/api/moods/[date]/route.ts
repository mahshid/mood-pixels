import { getLocalDate } from '@/app/lib/date';
import { NextResponse } from 'next/server';
import { updateMoodEntry, deleteMoodEntry } from '@/db/queries';
import { createMoodEntrySchema } from '@/db/validation';
import { requireUser } from '@/app/lib/require-user';

const updateMoodEntrySchema = createMoodEntrySchema.omit({
	entryDate: true,
});

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ date: string }> }
) {
	const currentUser = await requireUser(request);
	if (!currentUser.ok) return currentUser.response;

	const { date } = await params;

	const dateResult = createMoodEntrySchema.shape.entryDate.safeParse(date);

	if (!dateResult.success) {
		return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
	}

	const today = getLocalDate();

	if (dateResult.data > today) {
		return NextResponse.json(
			{ error: 'Future dates are not allowed' },
			{ status: 400 }
		);
	}

	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const result = updateMoodEntrySchema.safeParse(body);

	if (!result.success) {
		return NextResponse.json(
			{ error: 'Invalid check-in', issues: result.error.issues },
			{ status: 400 }
		);
	}

	try {
		const entry = await updateMoodEntry(
			{ ...result.data, entryDate: dateResult.data },
			currentUser.userId
		);

		if (!entry) {
			return NextResponse.json(
				{ error: 'Check-in not found' },
				{ status: 404 }
			);
		}

		return NextResponse.json(entry);
	} catch (error) {
		console.error('Failed to update mood entry:', error);

		return NextResponse.json(
			{ error: 'Could not update check-in' },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ date: string }> }
) {
	const currentUser = await requireUser(request);
	if (!currentUser.ok) return currentUser.response;

	const { date } = await params;

	const result = createMoodEntrySchema.shape.entryDate.safeParse(date);

	if (!result.success) {
		return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
	}

	try {
		const entry = await deleteMoodEntry(result.data, currentUser.userId);

		if (!entry) {
			return NextResponse.json(
				{ error: 'Check-in not found' },
				{ status: 404 }
			);
		}

		return new NextResponse(null, { status: 204 });
	} catch (error) {
		console.error('Failed to delete mood entry:', error);

		return NextResponse.json(
			{ error: 'Could not delete check-in' },
			{ status: 500 }
		);
	}
}
