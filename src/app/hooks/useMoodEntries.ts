'use client';

import { useEffect, useState } from 'react';
import type { LogFormat } from '../types/log';
import {
	fetchMoodLogs,
	saveMoodLogToApi,
	deleteMoodLogFromApi,
} from '../lib/mood-api';

export function useMoodEntries(enabled = true) {
	const [entries, setEntries] = useState<LogFormat[]>([]);
	const [isLoading, setIsLoading] = useState(enabled);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!enabled) return;
		const controller = new AbortController();

		async function loadEntries() {
			try {
				const data = await fetchMoodLogs(controller.signal);

				if (!controller.signal.aborted) {
					setEntries(data);
				}
			} catch (error) {
				if (!controller.signal.aborted) {
					setError(
						error instanceof Error ? error.message : 'Could not load check-ins'
					);
				}
			} finally {
				if (!controller.signal.aborted) {
					setIsLoading(false);
				}
			}
		}

		void loadEntries();

		return () => controller.abort();
	}, [enabled]);

	async function saveEntry(log: LogFormat, createOnly = false): Promise<void> {
		if (!enabled || isLoading || error) {
			throw new Error('Please load your check-ins before saving.');
		}

		const exists = entries.some((entry) => entry.date === log.date);

		if (createOnly && exists) {
			throw new Error(
				'You already have a check-in for this date. Review your draft and choose Save to replace it.'
			);
		}

		await saveMoodLogToApi(log, !createOnly && exists ? 'update' : 'create');

		setEntries((current) =>
			[...current.filter((entry) => entry.date !== log.date), log].sort(
				(a, b) => b.date.localeCompare(a.date)
			)
		);
	}

	async function deleteEntry(date: string): Promise<void> {
		if (!enabled || isLoading || error) {
			throw new Error('Please load your check-ins before deleting.');
		}

		await deleteMoodLogFromApi(date);

		setEntries((current) => current.filter((entry) => entry.date !== date));
	}

	return {
		entries,
		isLoading,
		error,
		saveEntry,
		deleteEntry,
		saveSubmittedDraft: (log: LogFormat) => saveEntry(log, true),
	};
}
