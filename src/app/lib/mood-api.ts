import type { LogFormat } from "../types/log";
import type { moodEntries } from "@/db/schema";

type ApiMoodEntry = Pick<typeof moodEntries.$inferSelect, "entryDate" | "mood" | "energy" | "nudge">;

async function checkResponse(response: Response, fallback: string): Promise<void> {
    if (response.ok) return;

    const body: unknown = await response.json().catch(() => null);
    const message = typeof body === "object" && body !== null
        && "error" in body && typeof body.error === "string"
        ? body.error
        : fallback;

    throw new Error(message);
}

export async function fetchMoodLogs(signal?: AbortSignal): Promise<LogFormat[]> {
        const response = await fetch("/api/moods", {
                cache: "no-store",
                signal,
        });

        await checkResponse(response, "Could not load mood entries");

        const entries: ApiMoodEntry[] = await response.json();

        return entries.map((entry) => ({
                date: entry.entryDate,
                vibe: entry.mood,
                energy: entry.energy,
                nudge: entry.nudge ?? "",
        }));
}

export async function saveMoodLogToApi(log: LogFormat, mode: "create" | "update"): Promise<void> {
        const isCreating = mode === "create";
        const url = isCreating ? "/api/moods" : `/api/moods/${encodeURIComponent(log.date)}`;

        const values = {
                mood: log.vibe,
                energy: Number(log.energy),
                nudge: log.nudge || null
        };

        const response = await fetch(url, {
                method: isCreating ? "POST" : "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(isCreating ? {...values, entryDate: log.date} : values)
        });

        await checkResponse(response, "Could not save check-in");
}

export async function deleteMoodLogFromApi(date: string): Promise<void> {
    const response = await fetch(`/api/moods/${encodeURIComponent(date)}`, { method: "DELETE" });

    await checkResponse(response, "Could not delete check-in");
}
