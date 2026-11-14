"use client";
import { useState } from "react";
import { MoodPicker, EnergyPicker } from "./CheckInControls";
import type { LogFormat } from "../types/log";
import { getLocalDate } from "../lib/date";
export default function MoodCheckIn({ moodColours, onMoodLogged }: {
    moodColours: Record<string, { text: string; bg: string }>;
    onMoodLogged: (result: LogFormat) => void | Promise<void>;
}) {
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [showMoodControls, setShowMoodControls] = useState(false);

    const [mood, setMood] = useState("");
    const [energy, setEnergy] = useState(3);
    const [nudge, setNudge] = useState("");
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const isBusy = isLoading || isSaving;

    async function handleSave() {
        if (!selectedMood || isBusy) return;

        setIsSaving(true);
        setError("");
        setStatus("");

        try {
            await onMoodLogged({
                date: getLocalDate(),
                vibe: selectedMood,
                energy,
                nudge,
            });

            setMood("");
            setStatus("Your day is saved.");
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Your check-in could not be saved.",
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function handleSuggest() {
        if (!mood.trim() || isBusy) return;

        setIsLoading(true);
        setError("");
        setStatus("");

        try {
            const response = await fetch("/api/jev", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: mood }),
            });

            if (!response.ok) {
                throw new Error("Failed to analyze mood");
            }

            const data = await response.json();

            if (typeof data.vibe !== "string" || !Object.hasOwn(moodColours, data.vibe) || !Number.isInteger(data.energy) || data.energy < 1 || data.energy > 5 || typeof data.nudge !== "string") {
                throw new Error("Invalid suggestion");
            }

            setSelectedMood(data.vibe);
            setEnergy(data.energy);
            setNudge(data.nudge);
            setShowMoodControls(true);

            setStatus("Review your suggestion. You can change it before saving.");
        } catch {
            setError("JEV could not suggest a mood. Try again or choose one yourself.");
        } finally {
            setIsLoading(false);
        }
    }

    return <section>
        <p className="eyebrow">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}</p>
        <h1>How was your day?</h1>
        <p className="intro">A few words. A little space to reflect.</p>
        <div className="card">
            <label htmlFor="mood-input">Tell me a little about today.</label>
            <textarea id="mood-input" value={mood} disabled={isBusy} placeholder="A slow morning, a busy afternoon…" onChange={e => { setMood(e.target.value); setStatus(""); }} />
            <button type="button" className="primary suggest" disabled={isBusy || !mood.trim()} onClick={handleSuggest}>{isLoading ? "Finding your mood…" : "Suggest my mood ✧"}</button>
            <button type="button" className="manual-link" disabled={isBusy} aria-expanded={showMoodControls} aria-controls="mood-controls" onClick={() => { setShowMoodControls(true); setNudge(""); setError(""); setStatus(""); }}>Or choose a mood yourself</button>
            {showMoodControls && (
                <fieldset className="selection" id="mood-controls" disabled={isBusy}>
                    <legend className="sr-only">Review your check-in</legend>
                    <p className="label">Choose what feels right</p>
                    <MoodPicker moods={Object.keys(moodColours)} value={selectedMood} onChange={(name) => { setSelectedMood(name); setNudge(""); setStatus(""); }} />
                    <EnergyPicker value={energy} onChange={(level) => { setEnergy(level); setStatus(""); }} />
                    {nudge && <p className="small nudge">{nudge}</p>}
                    <button type="button" className="primary" disabled={!selectedMood || isBusy} onClick={handleSave}>
                        {isSaving ? "Saving…" : "Save my day"}
                    </button>
                </fieldset>
            )}
            {error && <p className="error" role="alert">{error}</p>}
            <p className="status" role="status">{status}</p>
        </div><p className="quiet">Every feeling has a place here.</p>
    </section>;
}
