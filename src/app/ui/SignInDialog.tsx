'use client';

import { useEffect, useRef } from 'react';
import SignInCard from './SignInCard';
import styles from './SignInDialog.module.css';

export type SignInReason = 'save' | 'ai' | 'account';

export default function SignInDialog({
	reason,
	onClose,
}: {
	reason: SignInReason;
	onClose: () => void;
}) {
	const dialog = useRef<HTMLDialogElement>(null);
	useEffect(() => {
		const element = dialog.current;
		element?.showModal();
		return () => element?.close();
	}, []);

	return (
		<dialog
			ref={dialog}
			className={styles.dialog}
			aria-labelledby="sign-in-title"
			onCancel={onClose}
			onClick={(event) => {
				if (event.target === event.currentTarget) {
					const bounds = event.currentTarget.getBoundingClientRect();
					if (
						event.clientX < bounds.left ||
						event.clientX > bounds.right ||
						event.clientY < bounds.top ||
						event.clientY > bounds.bottom
					)
						onClose();
				}
			}}
		>
			<button
				type="button"
				className={styles.close}
				onClick={onClose}
				autoFocus
			>
				Keep exploring
			</button>
			<SignInCard reason={reason} />
		</dialog>
	);
}
