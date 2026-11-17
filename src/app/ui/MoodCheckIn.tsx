'use client';
import { useEffect, useRef, useState } from 'react';
import { MoodPicker, EnergyPicker } from './CheckInControls';
import type { LogFormat } from '../types/log';
import { getLocalDate } from '../lib/date';
import { energyByMood } from '../lib/mood-defaults';
import {
	clearCheckInDraft,
	readCheckInDraft,
	writeCheckInDraft,
} from '../lib/check-in-draft';

export default function MoodCheckIn({
	moodColours,
	onMoodLogged,
	onDraftSubmitted,
	isGuest = false,
	onRequestSignIn,
}: {
	onDraftSubmitted: (result: LogFormat) => void | Promise<void>;
	isGuest?: boolean;
	onRequestSignIn: (reason: 'save' | 'ai') => void;
	moodColours: Record<string, { text: string; bg: string }>;
	onMoodLogged: (result: LogFormat) => void | Promise<void>;
}) {
	const [draft] = useState(readCheckInDraft);
	const [restored, setRestored] = useState(Boolean(draft) && !isGuest);
	const [entryDate] = useState(() => draft?.date ?? getLocalDate());
	const [draftStored, setDraftStored] = useState(true);
	const [selectedMood, setSelectedMood] = useState<string | null>(
		draft?.selectedMood ?? null
	);
	const [showMoodControls, setShowMoodControls] = useState(
		draft?.showMoodControls ?? false
	);

	const [mood, setMood] = useState(draft?.mood ?? '');
	const [energy, setEnergy] = useState(draft?.energy ?? 3);
	const [nudge, setNudge] = useState(draft?.nudge ?? '');
	const [error, setError] = useState('');
	const [status, setStatus] = useState('');
	const [guestLimitReached, setGuestLimitReached] = useState(false);

	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(
		!isGuest && Boolean(draft?.saveAfterSignIn && draft.selectedMood)
	);
	const autoSaveStarted = useRef(false);

	const isBusy = isLoading || isSaving;

	useEffect(() => {
		if (isGuest || autoSaveStarted.current) return;
		if (!draft?.saveAfterSignIn || !draft.selectedMood) {
			clearCheckInDraft();
			return;
		}
		autoSaveStarted.current = true;
		const submittedMood = draft.selectedMood;
		// Defer state changes; the ref prevents duplicate submissions in Strict Mode.
		void Promise.resolve().then(async () => {
			try {
				await onDraftSubmitted({
					date: draft.date,
					vibe: submittedMood,
					energy: draft.energy,
					nudge: draft.nudge,
				});
				clearCheckInDraft();
				setRestored(false);
				setMood('');
				setStatus('Your day was saved after signing in.');
			} catch (error) {
				writeCheckInDraft({ ...draft, saveAfterSignIn: false });
				setError(
					error instanceof Error
						? error.message
						: 'Could not save your check-in. Your draft is still here; please try Save again.'
				);
			} finally {
				setIsSaving(false);
			}
		});
	}, [isGuest, draft, onDraftSubmitted]);

	useEffect(() => {
		if (!isGuest) return;
		writeCheckInDraft({
			date: entryDate,
			mood,
			selectedMood: selectedMood as NonNullable<typeof draft>['selectedMood'],
			energy,
			nudge,
			showMoodControls,
		});
	}, [isGuest, entryDate, mood, selectedMood, energy, nudge, showMoodControls]);

	function requestSignIn(reason: 'save' | 'ai') {
		const stored = writeCheckInDraft({
			date: entryDate,
			mood,
			selectedMood: selectedMood as NonNullable<typeof draft>['selectedMood'],
			energy,
			nudge,
			showMoodControls,
		});
		setDraftStored(stored);
		if (stored) onRequestSignIn(reason);
	}

	async function handleSave() {
		if (!selectedMood || isBusy) return;

		if (isGuest) {
			requestSignIn('save');
			return;
		}

		setIsSaving(true);
		setError('');
		setStatus('');

		try {
			await onMoodLogged({
				date: entryDate,
				vibe: selectedMood,
				energy,
				nudge,
			});

			setMood('');
			setRestored(false);
			clearCheckInDraft();
			setStatus('Your day is saved.');
		} catch (error) {
			setError(
				error instanceof Error
					? error.message
					: 'Your check-in could not be saved.'
			);
		} finally {
			setIsSaving(false);
		}
	}

	async function handleSuggest() {
		if (!mood.trim() || isBusy) return;

		setGuestLimitReached(false);
		setIsLoading(true);
		setError('');
		setStatus('');

		try {
			const response = await fetch('/api/jev', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: mood }),
			});

			if (response.status === 401) {
				setError('Your session has expired. Please sign in again.');
				return;
			}

			if (response.status === 400) {
				setError('Please enter a message between 1 and 2000 characters.');
				return;
			}

			if (response.status === 429) {
				const body: unknown = await response.json().catch(() => null);
				const message =
					typeof body === 'object' &&
					body !== null &&
					'error' in body &&
					typeof body.error === 'string'
						? body.error
						: 'AI is taking a little break. Try again later or choose a mood yourself.';
				setError(message);
				setGuestLimitReached(isGuest);
				return;
			}

			if (!response.ok) {
				throw new Error('Failed to analyze mood');
			}

			const data = await response.json();

			if (
				typeof data.vibe !== 'string' ||
				!Object.hasOwn(moodColours, data.vibe) ||
				!Number.isInteger(data.energy) ||
				data.energy < 1 ||
				data.energy > 5 ||
				typeof data.nudge !== 'string'
			) {
				throw new Error('Invalid suggestion');
			}

			setSelectedMood(data.vibe);
			setEnergy(data.energy);
			setNudge(data.nudge);
			setShowMoodControls(true);

			setStatus('Feel right? Adjust anything below.');
		} catch {
			setError(
				'JEV could not suggest a mood. Try again or choose one yourself.'
			);
		} finally {
			setIsLoading(false);
		}
	}

	const moodControls = (
		<fieldset
			className="selection"
			id="mood-controls"
			hidden={!showMoodControls}
			disabled={isBusy}
		>
			<legend className="sr-only">Review your check-in</legend>
			<p className="label">Choose what feels right</p>
			<MoodPicker
				moods={Object.keys(moodColours)}
				value={selectedMood}
				onChange={(name) => {
					setSelectedMood(name);
					setEnergy(energyByMood[name] ?? 3);
					setNudge('');
					setStatus('');
				}}
			/>
			<EnergyPicker
				value={energy}
				onChange={(level) => {
					setEnergy(level);
					setStatus('');
				}}
			/>
			{nudge && <p className="small nudge">{nudge}</p>}
			<button
				type="button"
				className="primary"
				disabled={!selectedMood || isBusy}
				onClick={handleSave}
			>
				{isSaving ? 'Saving…' : 'Save my day'}
			</button>
			{isGuest && <p className="small">Sign in to save.</p>}
		</fieldset>
	);

	const aiFields = (
		<>
			<label htmlFor="mood-input" className="sr-only">
				Tell JEV about your day
			</label>
			<textarea
				id="mood-input"
				value={mood}
				disabled={isBusy}
				maxLength={2000}
				aria-describedby="mood-input-hint"
				placeholder="A busy day. A quiet evening. Feeling a little drained…"
				onChange={(event) => {
					setMood(event.target.value);
					setStatus('');
				}}
			/>
			{!mood && (
				<button
					type="button"
					className="manual-link"
					onClick={() =>
						setMood(
							'I got a lot done, but now I feel drained and just want a quiet evening.'
						)
					}
				>
					Try an example
				</button>
			)}
			<p
				id="mood-input-hint"
				className={mood.length >= 1800 ? 'small' : 'sr-only'}
			>
				{mood.length >= 1800
					? `${mood.length} / 2000`
					: 'Up to 2,000 characters.'}
			</p>
			<button
				type="button"
				className="primary suggest"
				disabled={isBusy || !mood.trim()}
				onClick={handleSuggest}
			>
				{isLoading ? 'Finding your mood…' : 'Find my mood ✧'}
			</button>
			{isGuest && <p className="small">Try it without signing in.</p>}
		</>
	);

	return (
		<section>
			<p className="eyebrow font-bold">
				{new Date()
					.toLocaleDateString('en-GB', {
						weekday: 'long',
						day: 'numeric',
						month: 'long',
					})
					.toUpperCase()}
			</p>
			<h1>Not sure how you feel?</h1>
			{restored && !isSaving && (
				<p className="small" role="status">
					Draft restored · {entryDate}
				</p>
			)}
			<p className="intro">A few words. A mood suggestion from JEV AI.</p>

			<div className="card">
				{aiFields}
				<button
					type="button"
					className="manual-link mood-toggle"
					disabled={isBusy}
					aria-expanded={showMoodControls}
					aria-controls="mood-controls"
					onClick={() => setShowMoodControls((isOpen) => !isOpen)}
				>
					{showMoodControls ? 'Hide mood choices' : 'Or pick a mood'}
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<path d="m6 9 6 6 6-6" />
					</svg>
				</button>
				{moodControls}
				{guestLimitReached && (
					<button
						type="button"
						className="manual-link"
						onClick={() => requestSignIn('ai')}
					>
						Continue with an account
					</button>
				)}

				{!draftStored && (
					<p className="error" role="alert">
						Your browser could not keep your draft. Allow session storage before
						signing in so your choices are not lost.
					</p>
				)}
				{error && (
					<p className="error" role="alert">
						{error}
					</p>
				)}
				<p className="status" role="status">
					{status}
				</p>
			</div>
		</section>
	);
}
