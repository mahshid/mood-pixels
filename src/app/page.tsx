"use client";
import { useState } from "react";
import MoodCheckIn from "./ui/MoodCheckIn";
import YearInPixelsCard from "./ui/YearInPixelsCard";
import { useMoodEntries } from "./hooks/useMoodEntries";

const moodColours = {
    Sparkly: { text: "", bg: "tone-sparkly" },
    Cozy: { text: "", bg: "tone-cozy" },
    Tired: { text: "", bg: "tone-tired" },
    Sad: { text: "", bg: "tone-sad" },
    Frustrated: { text: "", bg: "tone-frustrated" },
};

export default function Home() {
    const [page, setPage] = useState("today");
    const [account, setAccount] = useState(false);

    const { entries, isLoading, error, saveEntry, deleteEntry } = useMoodEntries();

    return (
        <main className="mood-app">
            <header>
                <div className="brand">
                    <span className="flex flex-col gap-1" aria-hidden="true">
                        {[0, 1, 2].map((row) => (
                            <span key={row} className="flex gap-1">
                                {[
                                    "bg-emerald-500",
                                    "bg-yellow-400",
                                    "bg-blue-400",
                                    "bg-purple-400",
                                    "bg-red-500",
                                ].map((colour) => (
                                    <span
                                        key={colour}
                                        className={`size-2 rounded-full ${colour}`}
                                    />
                                ))}
                            </span>
                        ))}
                    </span>
                    Mood Pixels
                </div>
                <button
                    type="button"
                    className="avatar"
                    aria-label="About your storage"
                    aria-expanded={account}
                    aria-controls="account-note"
                    onClick={() => setAccount(!account)}
                >
                    ☺
                </button>
            </header>
            <div
                id="account-note"
                hidden={!account}
                className="card account-note"
            >
                <p className="label">Your own little space.</p>
                <p className="small">
                    Your check-ins are saved in your local PostgreSQL database.
                    Accounts and syncing across devices are coming later.
                </p>
                <button
                    type="button"
                    className="manual-link"
                    onClick={() => setAccount(false)}
                >
                    Close
                </button>
            </div>
            <nav className="nav" aria-label="Main navigation">
                <button
                    type="button"
                    aria-current={page === "today" ? "page" : undefined}
                    onClick={() => setPage("today")}
                >
                    Check in
                </button>
                <button
                    type="button"
                    aria-current={page === "history" ? "page" : undefined}
                    onClick={() => setPage("history")}
                >
                    My days
                </button>
            </nav>
            {isLoading ? (
                <p className="small" role="status">
                    Loading your check-ins…
                </p>
            ) : error ? (
                <div className="card" role="alert">
                    <p>{error}</p>
                    <button
                        type="button"
                        className="primary"
                        onClick={() => window.location.reload()}
                    >
                        Try again
                    </button>
                </div>
            ) : (
                <>
                    <div hidden={page !== "today"}>
                        <MoodCheckIn
                            moodColours={moodColours}
                            onMoodLogged={saveEntry}
                        />
                    </div>
                    <div hidden={page !== "history"}>
                        <YearInPixelsCard
                            allVibes={entries}
                            moodColours={moodColours}
                            onSave={saveEntry}
                            onDelete={deleteEntry}
                        />
                    </div>
                </>
            )}
            <footer className="foot">
                Made by Mahshid ·{" "}
                <a
                    href="https://github.com/mahshid/mood-pixels"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    View source
                </a>
            </footer>
        </main>
    );
}
