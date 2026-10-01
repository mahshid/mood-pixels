"use client";
import React, { useMemo, useSyncExternalStore } from "react";
import MoodCheckIn from "./ui/MoodCheckIn";
import YearInPixelsCard from "./ui/YearInPixelsCard";
import BrandLogo from "./ui/BrandLogo";
import {
    saveMoodLog,
    getMoodLog,
    parseMoodLog,
    subscribeMoodLog,
} from "./lib/mood-log";

const moodColours: Record<string, { text: string; bg: string }> = {
    Sparkly: { text: "text-emerald-500", bg: "bg-emerald-500" },
    Cozy: { text: "text-yellow-400", bg: "bg-yellow-400" },
    Tired: { text: "text-blue-400", bg: "bg-blue-400" },
    Sad: { text: "text-purple-400", bg: "bg-purple-400" },
    Frustrated: { text: "text-red-500", bg: "bg-red-500" },
};

export default function Home() {
    const savedData = useSyncExternalStore(
        subscribeMoodLog,
        getMoodLog,
        () => null,
    );
    const allVibes = useMemo(() => parseMoodLog(savedData), [savedData]);
    const vibeResult = allVibes[allVibes.length - 1] ?? null;

    return (
        <div className="mx-auto flex max-w-5xl mt-10 flex-col gap-6">
            <BrandLogo colours={moodColours} />
            <MoodCheckIn
                vibeResult={vibeResult}
                moodColours={moodColours}
                onMoodLogged={saveMoodLog}
            />

            <YearInPixelsCard allVibes={allVibes} moodColours={moodColours} />
            <p className="mb-5 text-center text-sm text-gray-400">
                Created by Mahshid
                <span className="mx-2">|</span>
                <a
                    href="https://github.com/mahshid/mood-pixels"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4 transition-colors hover:text-cyan-700"
                >
                    View source
                </a>
            </p>
        </div>
    );
}
