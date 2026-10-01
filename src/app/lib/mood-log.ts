import type { LogFormat } from "../types/log";

const STORAGE_KEY = "moodLog";

export function getLocalDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function getMoodLog() {
    return window.localStorage.getItem(STORAGE_KEY);
}

export function parseMoodLog(savedData: string | null): LogFormat[] {
    if (!savedData) return [];

    try {
        const logs = JSON.parse(savedData);
        return Array.isArray(logs) ? logs : [];
    } catch {
        return [];
    }
}

export function subscribeMoodLog(updatePage: () => void) {
    window.addEventListener("moodUpdated", updatePage);
    window.addEventListener("storage", updatePage);

    return function cleanup() {
        window.removeEventListener("moodUpdated", updatePage);
        window.removeEventListener("storage", updatePage);
    };
}

export function saveMoodLog(newLog: LogFormat) {
    const savedData = getMoodLog();
    const logs = parseMoodLog(savedData);

    const updatedLogs = logs.filter((log) => log.date !== newLog.date);

    updatedLogs.push(newLog);

    const json = JSON.stringify(updatedLogs);
    window.localStorage.setItem(STORAGE_KEY, json);

    window.dispatchEvent(new Event("moodUpdated"));
}
