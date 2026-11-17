'use client';

import { useState } from 'react';
import { authClient } from '../lib/auth-client';
import { readCheckInDraft, setDraftSaveIntent } from '../lib/check-in-draft';

export default function SignInCard({
	reason,
}: {
	reason: 'save' | 'ai' | 'account';
}) {
	const [isSigningIn, setIsSigningIn] = useState(false);
	const [error, setError] = useState('');

	async function handleSignIn() {
		if (isSigningIn) return;
		const draft = readCheckInDraft();
		if (reason !== 'account' && !draft) {
			setError(
				'Your draft could not be kept in this tab. Return to the form and allow browser session storage before signing in.'
			);
			return;
		}

		if (draft && !setDraftSaveIntent(reason === 'save')) {
			setError(
				'Your draft could not be prepared. Return to the form and try again.'
			);
			return;
		}
		setIsSigningIn(true);
		setError('');

		try {
			const result = await authClient.signIn.social({
				provider: 'google',
				callbackURL: '/',
			});

			if (result.error) {
				throw new Error(result.error.message || 'Could not sign in.');
			}
		} catch {
			setDraftSaveIntent(false);
			setError('Could not sign in. Please try again.');
			setIsSigningIn(false);
		}
	}

	return (
		<section>
			<h2 id="sign-in-title">
				{reason === 'ai'
					? 'More with JEV'
					: reason === 'save'
						? 'Save your day'
						: 'Welcome back'}
			</h2>
			<p className="small">
				{reason === 'save'
					? 'Sign in to save automatically. Existing entries stay unchanged.'
					: reason === 'ai'
						? 'Sign in for more suggestions. Your draft stays here.'
						: 'Your moods, all in one place.'}
			</p>

			<button
				type="button"
				className="primary"
				disabled={isSigningIn}
				onClick={handleSignIn}
			>
				{isSigningIn ? 'Connecting to Google…' : 'Continue with Google'}
			</button>

			{error && (
				<p className="error" role="alert">
					{error}
				</p>
			)}
		</section>
	);
}
