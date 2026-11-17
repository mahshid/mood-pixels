import { z } from 'zod';

const KEY = 'mood-pixels:guest-draft';
const draftSchema = z.object({
	date: z.iso.date(),
	mood: z.string().max(2000),
	selectedMood: z
		.enum(['Sparkly', 'Cozy', 'Tired', 'Sad', 'Frustrated'])
		.nullable(),
	energy: z.number().int().min(1).max(5),
	nudge: z.string().max(1000),
	showMoodControls: z.boolean(),
	expiresAt: z.number(),
	saveAfterSignIn: z.boolean().default(false),
});
export type CheckInDraft = z.infer<typeof draftSchema>;

export function readCheckInDraft(): CheckInDraft | null {
	if (typeof window === 'undefined') return null;
	try {
		const result = draftSchema.safeParse(
			JSON.parse(sessionStorage.getItem(KEY) ?? 'null')
		);
		return result.success && result.data.expiresAt > Date.now()
			? result.data
			: null;
	} catch {
		return null;
	}
}

export function writeCheckInDraft(
	draft: Omit<CheckInDraft, 'expiresAt' | 'saveAfterSignIn'> & {
		saveAfterSignIn?: boolean;
	}
): boolean {
	try {
		sessionStorage.setItem(
			KEY,
			JSON.stringify({ ...draft, expiresAt: Date.now() + 60 * 60 * 1000 })
		);
		return true;
	} catch {
		return false;
	}
}

export function clearCheckInDraft() {
	try {
		sessionStorage.removeItem(KEY);
	} catch {
		/* Storage may be unavailable. */
	}
}

// Set only when the user actually continues from the Save sign-in prompt.
export function setDraftSaveIntent(saveAfterSignIn: boolean): boolean {
	const draft = readCheckInDraft();
	if (!draft || (saveAfterSignIn && !draft.selectedMood)) return false;
	return writeCheckInDraft({ ...draft, saveAfterSignIn });
}
