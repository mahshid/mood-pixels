"use client";

import { useEffect, useState } from "react";
import type { LogFormat } from "../types/log";
import { fetchMoodLogs, saveMoodLogToApi, deleteMoodLogFromApi } from "../lib/mood-api";

export function useMoodEntries() {
        const [entries, setEntries] = useState<LogFormat[]>([]);
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);

        useEffect(() => {
                const controller = new AbortController();

                async function loadEntries() {
                        try {
                                const data = await fetchMoodLogs(controller.signal);

                                if (!controller.signal.aborted) {
                                        setEntries(data);
                                }
                        } catch (error) {
                                if (!controller.signal.aborted) {
                                        setError(error instanceof Error ? error.message : "Could not load check-ins");
                                }
                        } finally {
                                if (!controller.signal.aborted) {
                                        setIsLoading(false);
                                }
                        }
                }

                void loadEntries();

                return () => controller.abort();
        }, []);

        async function saveEntry(log: LogFormat): Promise<void> {
                if (isLoading || error) {
                        throw new Error("Please load your check-ins before saving.");
                }

                const exists = entries.some((entry) => entry.date === log.date);

                await saveMoodLogToApi(log, exists ? "update" : "create");

                setEntries((current) =>[...current.filter((entry) => entry.date !== log.date), log].sort((a, b) => b.date.localeCompare(a.date)));
        }

        async function deleteEntry(date: string): Promise<void> {
                if (isLoading || error) {
                        throw new Error("Please load your check-ins before deleting.");
                }

                await deleteMoodLogFromApi(date);

                setEntries((current) =>
                        current.filter((entry) => entry.date !== date),
                );
        }

        return { entries, isLoading, error, saveEntry, deleteEntry };
}