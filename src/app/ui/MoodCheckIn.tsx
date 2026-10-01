"use client";
import React, { useState } from "react";
import EnergyIndicator from "./EnergyIndicator";
import type { LogFormat } from "../types/log";
import { getLocalDate } from "../lib/mood-log";

type MoodColours = Record<string, { text: string; bg: string }>;

const moodCardThemes: Record<
    string,
    { background: string; border: string; text: string }
> = {
    Sparkly: {
        background: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-800",
    },
    Cozy: {
        background: "bg-yellow-50",
        border: "border-yellow-200",
        text: "text-yellow-800",
    },
    Tired: {
        background: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-800",
    },
    Sad: {
        background: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-800",
    },
    Frustrated: {
        background: "bg-red-50",
        border: "border-red-200",
        text: "text-red-800",
    },
};

const defaultCardTheme = {
    background: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-800",
};

interface MoodCheckInProps {
    vibeResult: LogFormat | null;
    moodColours: MoodColours;
    onMoodLogged: (result: LogFormat) => void;
}

export default function MoodCheckIn({
    vibeResult,
    moodColours,
    onMoodLogged,
}: MoodCheckInProps) {
    const [mood, setMood] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const cardTheme =
        (vibeResult && moodCardThemes[vibeResult.vibe]) || defaultCardTheme;

    async function handleSubmit() {
        if (!mood.trim()) return;

        setIsLoading(true);

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

            const resultObj: LogFormat = {
                date: getLocalDate(),
                vibe: data.vibe,
                energy: data.energy,
                nudge: data.nudge,
            };

            onMoodLogged(resultObj);
        } catch (error) {
            console.error("Failed to fetch vibe", error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="card w-full ">
            <div className="card-header text-black py-4 px-5 rounded-lg">
                <h2 className="text-xs font-weight mb-2 tracking-widest text-emerald-800 font-bold">
                    {showTodaysDate().toUpperCase()}
                </h2>
                <h1 className="card-title text-3xl font-bold mb-2">
                    How was your day?
                </h1>
                <h6 className="text-gray-400">
                    A few words today. A colourful picture over time.
                </h6>
            </div>
            <div className="card-body p-5 rounded-lg border border-gray-300 bg-white">
                <h3 className="mb-4 font-bold">Today&apos;s check-in</h3>
                <p className="mb-2 text-small">How did your day feel?</p>
                <textarea
                    value={mood}
                    id="mood-input"
                    className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    placeholder="Describe your mood..."
                    onChange={(e) => setMood(e.target.value)}
                ></textarea>
                <div className="flex justify-end text-center mx-auto">
                    <input
                        type="button"
                        value={isLoading ? "Analyzing..." : "Log Vibe Check"}
                        className="mt-4 bg-teal-700 text-white  py-3 px-4 rounded-lg hover:bg-teal-800 cursor-pointer"
                        onClick={handleSubmit}
                        disabled={isLoading}
                    />
                </div>

                {vibeResult && (
                    <div
                        className={`mt-5 overflow-hidden rounded-xl border ${cardTheme.border} ${cardTheme.background}`}
                    >
                        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p
                                    className={`text-xs font-semibold uppercase tracking-wider ${cardTheme.text}`}
                                >
                                    Your vibe today: (Analyzed by JEV AI)
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span
                                        aria-hidden="true"
                                        className={`h-3 w-3 rounded-full ${moodColours[vibeResult.vibe]?.bg ?? "bg-gray-500"}`}
                                    />
                                    <p
                                        className={`text-xl font-semibold ${cardTheme.text}`}
                                    >
                                        {vibeResult.vibe}
                                    </p>
                                </div>
                            </div>
                            <div
                                className={`rounded-lg border bg-white px-4 py-3 sm:min-w-40 ${cardTheme.border}`}
                            >
                                <EnergyIndicator
                                    energy={vibeResult.energy}
                                    colourClassName={
                                        moodColours[vibeResult.vibe]?.bg
                                    }
                                />
                            </div>
                        </div>
                        <div
                            className={`border-t bg-white/70 px-5 py-4 ${cardTheme.border}`}
                        >
                            <p
                                className={`text-xs font-semibold uppercase tracking-wider ${cardTheme.text}`}
                            >
                                Self-care nudge
                            </p>
                            <p className="mt-1 text-sm leading-6 text-gray-700">
                                {vibeResult.nudge}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function showTodaysDate() {
    const weekdays = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];

    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    const today = new Date();

    return `${weekdays[today.getDay()]}, ${months[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;
}
