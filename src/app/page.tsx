'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import MoodCheckIn from './ui/MoodCheckIn';
import YearInPixelsCard from './ui/YearInPixelsCard';
import MonthPreview from './ui/MonthPreview';
import { useMoodEntries } from './hooks/useMoodEntries';
import { authClient } from './lib/auth-client';
import SignInDialog, { type SignInReason } from './ui/SignInDialog';
import { clearCheckInDraft } from './lib/check-in-draft';

const moodColours = {
	Sparkly: { text: '', bg: 'tone-sparkly' },
	Cozy: { text: '', bg: 'tone-cozy' },
	Tired: { text: '', bg: 'tone-tired' },
	Sad: { text: '', bg: 'tone-sad' },
	Frustrated: { text: '', bg: 'tone-frustrated' },
};

type AccountUser = typeof authClient.$Infer.Session.user;

function MoodTracker({ user }: { user: AccountUser | null }) {
	const [signInReason, setSignInReason] = useState<SignInReason | null>(null);
	const [page, setPage] = useState('today');
	const [account, setAccount] = useState(false);
	const [failedImage, setFailedImage] = useState<string | null>(null);
	const accountRef = useRef<HTMLDivElement>(null);
	const accountButtonRef = useRef<HTMLButtonElement>(null);
	const calendarButtonRef = useRef<HTMLButtonElement>(null);
	const displayName = user?.name.trim() || user?.email || 'Guest';
	const firstName = user?.name.trim().split(/\s+/)[0] || 'Account';
	const initial = Array.from(displayName)[0]?.toUpperCase() || '?';

	useEffect(() => {
		if (!account) return;

		function closeOutside(event: PointerEvent) {
			if (
				event.target instanceof Node &&
				!accountRef.current?.contains(event.target)
			) {
				setAccount(false);
			}
		}

		function closeOnEscape(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				setAccount(false);
				accountButtonRef.current?.focus();
			}
		}

		document.addEventListener('pointerdown', closeOutside);
		document.addEventListener('keydown', closeOnEscape);
		return () => {
			document.removeEventListener('pointerdown', closeOutside);
			document.removeEventListener('keydown', closeOnEscape);
		};
	}, [account]);

	const {
		entries,
		isLoading,
		error,
		saveEntry,
		deleteEntry,
		saveSubmittedDraft,
	} = useMoodEntries(Boolean(user));

	const [isSigningOut, setIsSigningOut] = useState(false);
	const [signOutError, setSignOutError] = useState('');

	async function handleSignOut() {
		if (isSigningOut) return;

		setIsSigningOut(true);
		setSignOutError('');

		try {
			clearCheckInDraft();
			const result = await authClient.signOut();

			if (result.error) {
				throw new Error('Sign out failed');
			}
		} catch {
			setSignOutError('Could not sign out. Please try again.');
		} finally {
			setIsSigningOut(false);
		}
	}

	return (
		<main className="mood-app">
			<header>
				<div className="brand">
					<span className="grid grid-cols-3 gap-0.5" aria-hidden="true">
						{[
							'bg-emerald-500',
							'bg-yellow-400',
							'bg-blue-400',
							'bg-purple-400',
							'bg-red-500',
							'bg-emerald-500',
							'bg-blue-400',
							'bg-purple-400',
							'bg-yellow-400',
						].map((colour, index) => (
							<span key={index} className={`size-2 rounded-full ${colour}`} />
						))}
					</span>
					Mood Pixels
				</div>
				{user ? (
					<div
						className="account"
						ref={accountRef}
						onBlur={(event) => {
							if (!event.currentTarget.contains(event.relatedTarget)) {
								setAccount(false);
							}
						}}
					>
						<button
							ref={accountButtonRef}
							type="button"
							className="account-trigger"
							aria-label={`Account: ${displayName}, ${user.email}`}
							aria-expanded={account}
							aria-controls="account-panel"
							onClick={() => setAccount((open) => !open)}
						>
							<span className="account-avatar" aria-hidden="true">
								{user.image && failedImage !== user.image ? (
									<Image
										src={user.image}
										alt=""
										width={36}
										height={36}
										unoptimized
										referrerPolicy="no-referrer"
										onError={() => setFailedImage(user.image ?? null)}
									/>
								) : (
									initial
								)}
							</span>
							<span className="account-first-name">{firstName}</span>
							<svg
								className="account-chevron"
								viewBox="0 0 16 16"
								aria-hidden="true"
							>
								<path
									d="m4 6 4 4 4-4"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</button>
						<div
							id="account-panel"
							className="account-panel"
							hidden={!account}
							role="region"
							aria-label="Your account"
						>
							<p className="account-name">{displayName}</p>
							<p className="account-email">{user.email}</p>
							<p className="account-provider">Signed in with Google</p>
							<button
								type="button"
								className="account-sign-out"
								disabled={isSigningOut}
								onClick={handleSignOut}
							>
								{isSigningOut ? 'Signing out…' : 'Sign out'}
							</button>
							{signOutError && (
								<p className="error" role="alert">
									{signOutError}
								</p>
							)}
						</div>
					</div>
				) : (
					<button
						type="button"
						className="account-trigger"
						style={{ padding: '8px 16px', flexShrink: 0 }}
						onClick={() => setSignInReason('account')}
					>
						Sign in
					</button>
				)}
			</header>
			<nav className="nav" aria-label="Main navigation">
				<button
					type="button"
					aria-current={page === 'today' ? 'page' : undefined}
					onClick={() => setPage('today')}
				>
					Check in
				</button>
				<button
					type="button"
					ref={calendarButtonRef}
					aria-current={page === 'history' ? 'page' : undefined}
					onClick={() => setPage('history')}
				>
					Calendar
				</button>
			</nav>
			{isLoading ? (
				<p className="small" role="status">
					Loading your check-ins…
				</p>
			) : error ? (
				<div className="card" role="alert">
					<p>{error}</p>
					<button
						type="button"
						className="primary"
						onClick={() => window.location.reload()}
					>
						Try again
					</button>
				</div>
			) : (
				<>
					<div hidden={page !== 'today'}>
						<MoodCheckIn
							moodColours={moodColours}
							onMoodLogged={saveEntry}
							onDraftSubmitted={saveSubmittedDraft}
							isGuest={!user}
							onRequestSignIn={setSignInReason}
						/>
						<MonthPreview
							entries={entries}
							isGuest={!user}
							moodColours={moodColours}
							onViewCalendar={() => {
								setPage('history');
								calendarButtonRef.current?.focus();
							}}
						/>
					</div>
					<div hidden={page !== 'history'}>
						<YearInPixelsCard
							allVibes={entries}
							moodColours={moodColours}
							onSave={saveEntry}
							onDelete={deleteEntry}
							onGuestSelect={
								!user ? () => setSignInReason('account') : undefined
							}
						/>
					</div>
				</>
			)}
			{signInReason && (
				<SignInDialog
					reason={signInReason}
					onClose={() => setSignInReason(null)}
				/>
			)}
			<footer className="foot">
				Made by{' '}
				<a
					className="underline"
					href="https://github.com/mahshid"
					target="_blank"
					rel="noopener noreferrer"
				>
					Mahshid
				</a>{' '}
				·{' '}
				<a
					className="underline"
					href="https://github.com/mahshid/mood-pixels"
					target="_blank"
					rel="noopener noreferrer"
				>
					View source
				</a>
			</footer>
		</main>
	);
}

export default function Home() {
	const { data: session, isPending, error } = authClient.useSession();

	if (isPending) {
		return (
			<main className="mood-app">
				<p role="status">Checking your session…</p>
			</main>
		);
	}

	if (error) {
		return (
			<main className="mood-app">
				<div className="card" role="alert">
					<p>Could not check your session.</p>
					<button
						type="button"
						className="primary"
						onClick={() => window.location.reload()}
					>
						Try again
					</button>
				</div>
			</main>
		);
	}

	return (
		<MoodTracker
			key={session?.user.id ?? 'guest'}
			user={session?.user ?? null}
		/>
	);
}
