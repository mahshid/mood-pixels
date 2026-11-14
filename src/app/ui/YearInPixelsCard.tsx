"use client";
import { useState } from "react";
import type { LogFormat } from "../types/log";
import { MoodPicker, EnergyPicker } from "./CheckInControls";
import { getLocalDate } from "../lib/date";

export default function YearInPixelsCard({
    allVibes,
    moodColours,
    onSave,
    onDelete,
}: {
    allVibes: LogFormat[];
    moodColours: Record<string, { text: string; bg: string }>;
    onSave: (entry: LogFormat) => void | Promise<void>;
    onDelete: (date: string) => void | Promise<void>;
}) {
    const [period, setPeriod] = useState(() => ({
        year: new Date().getFullYear(),
        month: new Date().getMonth(),
    }));
    const [view, setView] = useState<"month" | "year">("month");
    const [selected, setSelected] = useState<string | null>(null);
    const [draftMood, setDraftMood] = useState<string | null>(null);
    const [draftEnergy, setDraftEnergy] = useState(3);
    const [draftNudge, setDraftNudge] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const { year, month } = period;

    const logs = new Map(allVibes.map((log) => [log.date, log]));
    const selectedLog = selected ? logs.get(selected) : undefined;
    const today = getLocalDate();

    const [pendingAction, setPendingAction] = useState<
        "save" | "delete" | null
    >(null);
    const isPending = pendingAction !== null;

    function selectDay(date: string) {
        if (date > getLocalDate()) return;

        const log = logs.get(date);

        setSelected(date);
        setDraftMood(log?.vibe ?? null);

        const level = Number(log?.energy);

        setDraftEnergy(
            Number.isInteger(level) && level >= 1 && level <= 5 ? level : 3,
        );
        setDraftNudge(log?.nudge ?? "");
        setError("");
        setMessage("");
    }

    async function saveDay() {
        if (!selected || !draftMood || selected > getLocalDate() || isPending)
            return;

        setPendingAction("save");
        setError("");
        setMessage("");

        try {
            await onSave({
                date: selected,
                vibe: draftMood,
                energy: draftEnergy,
                nudge: draftNudge,
            });
            setMessage("Your check-in is saved.");
        } catch {
            setError("Could not save your check-in. Please try again.");
        } finally {
            setPendingAction(null);
        }
    }

    async function deleteDay() {
        if (!selected || !selectedLog || isPending) return;

        const label = new Date(selected + "T12:00:00").toLocaleDateString(
            "en-GB",
            { dateStyle: "long" },
        );

        if (
            !window.confirm(
                `Delete the check-in for ${label}? This cannot be undone.`,
            )
        )
            return;

        setPendingAction("delete");
        setError("");
        setMessage("");

        try {
            await onDelete(selected);

            setDraftMood(null);
            setDraftEnergy(3);
            setDraftNudge("");
            setMessage("Check-in deleted.");
        } catch {
            setError("Could not delete your check-in. Please try again.");
        } finally {
            setPendingAction(null);
        }
    }

    function navigate(delta: number) {
        if (view === "year") setPeriod({ year: year + delta, month });
        else {
            const d = new Date(year, month + delta, 1);
            setPeriod({ year: d.getFullYear(), month: d.getMonth() });
        }
        setSelected(null);
    }

    function day(m: number, d: number, pixel = false) {
        const date = getLocalDate(new Date(year, m, d));
        const log = logs.get(date);
        return (
            <button
                type="button"
                key={date}
                disabled={date > today}
                className={`${pixel ? "pixel" : "day"} ${log ? (moodColours[log.vibe]?.bg ?? "") : ""}`}
                aria-label={`${new Date(year, m, d).toLocaleDateString("en-GB", { dateStyle: "long" })}: ${log ? `${log.vibe}, energy ${log.energy} out of 5` : "No check-in"}`}
                aria-pressed={selected === date}
                onClick={() => selectDay(date)}
            >
                {pixel ? null : d}
            </button>
        );
    }

    return (
        <section>
            <p className="eyebrow">YOUR LITTLE COLLECTION</p>
            <h1>Days, in colour.</h1>
            <p className="intro">Tap a day to revisit it.</p>
            <fieldset disabled={isPending} aria-busy={isPending}>
                <legend className="sr-only">Mood calendar</legend>
                <div className="card">
                        <div className="calendar-head">
                        <button
                                type="button"
                                aria-label="Previous period"
                                onClick={() => navigate(-1)}
                        >
                                ‹
                        </button>
                        <span aria-live="polite">
                                {view === "year"
                                ? year
                                : new Date(year, month, 1).toLocaleDateString(
                                        "en-GB",
                                        { month: "long", year: "numeric" },
                                )}
                        </span>
                        <button
                                type="button"
                                aria-label="Next period"
                                onClick={() => navigate(1)}
                        >
                                ›
                        </button>
                        </div>
                        {view === "month" ? (
                        <div className="month-grid">
                                {["M", "T", "W", "T", "F", "S", "S"].map((x, i) => (
                                <span
                                        className="weekday"
                                        key={i}
                                        aria-hidden="true"
                                >
                                        {x}
                                </span>
                                ))}
                                {Array.from(
                                {
                                        length:
                                        (new Date(year, month, 1).getDay() + 6) % 7,
                                },
                                (_, i) => (
                                        <span key={`blank-${i}`} />
                                ),
                                )}
                                {Array.from(
                                { length: new Date(year, month + 1, 0).getDate() },
                                (_, i) => day(month, i + 1),
                                )}
                        </div>
                        ) : (
                        <div className="year-view">
                                <p className="year-scroll-hint" id="year-scroll-hint">
                                Swipe sideways to see all months ↔
                                </p>
                                <div
                                className="year-scroll"
                                role="region"
                                aria-label={`${year} year in pixels calendar`}
                                tabIndex={0}
                                >
                                <div className="year-grid">
                                        {Array.from({ length: 12 }, (_, m) => (
                                        <div className="year-column" key={m}>
                                                <span>
                                                {new Date(
                                                        year,
                                                        m,
                                                        1,
                                                ).toLocaleDateString("en-GB", {
                                                        month: "short",
                                                })}
                                                </span>
                                                {Array.from(
                                                {
                                                        length: new Date(
                                                        year,
                                                        m + 1,
                                                        0,
                                                        ).getDate(),
                                                },
                                                (_, i) => day(m, i + 1, true),
                                                )}
                                        </div>
                                        ))}
                                </div>
                                </div>
                        </div>
                        )}
                        <div className="legend">
                        {Object.entries(moodColours).map(([name, c]) => (
                                <span key={name}>
                                <i aria-hidden="true" className={`dot ${c.bg}`} />
                                {name}
                                </span>
                        ))}
                        </div>
                        {selected && (
                        <div className="day-detail">
                                <h2 className="label">
                                {new Date(
                                        selected + "T12:00:00",
                                ).toLocaleDateString("en-GB", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                })}
                                </h2>
                                {!selectedLog && (
                                <p className="small">
                                        Choose a mood to add a check-in for this day.
                                </p>
                                )}
                                <fieldset className="energy">
                                <legend>Mood</legend>
                                    <MoodPicker
                                        moods={Object.keys(moodColours)}
                                        value={draftMood}
                                        onChange={(name) => {
                                            setDraftMood(name);
                                            setDraftNudge("");
                                            setMessage("");
                                        }}
                                    />
                                </fieldset>
                                <EnergyPicker
                                    value={draftEnergy}
                                    onChange={(level) => {
                                        setDraftEnergy(level);
                                        setMessage("");
                                    }}
                                />
                                {draftNudge && (
                                <p className="small nudge">{draftNudge}</p>
                                )}
                                <button
                                type="button"
                                className="primary"
                                disabled={!draftMood || selected > today}
                                onClick={saveDay}
                                >
                                {pendingAction === "save"
                                        ? "Saving…"
                                        : selectedLog
                                                ? "Save changes"
                                                : "Save check-in"}
                                </button>
                                {selectedLog && (
                                <button
                                        type="button"
                                        className="danger"
                                        onClick={deleteDay}
                                >
                                        {pendingAction === "delete" ? "Deleting…" : "Delete entry"}
                                </button>
                                )}
                                <button
                                type="button"
                                className="manual-link"
                                onClick={() => setSelected(null)}
                                >
                                Cancel
                                </button>
                                {error && (
                                <p className="error" role="alert">
                                        {error}
                                </p>
                                )}
                                <p className="status" role="status">
                                {message}
                                </p>
                        </div>
                        )}
                        {allVibes.length === 0 && (
                        <p className="small quiet">
                                Your first check-in will add a little colour here.
                        </p>
                        )}
                </div>
                <div
                        className="view-choice"
                        role="group"
                        aria-label="Calendar view"
                >
                        <button
                        type="button"
                        aria-pressed={view === "month"}
                        onClick={() => setView("month")}
                        >
                        Month
                        </button>
                        <button
                        type="button"
                        aria-pressed={view === "year"}
                        onClick={() => setView("year")}
                        >
                        Year in pixels
                        </button>
                </div>
            </fieldset>
        </section>
    );
}
