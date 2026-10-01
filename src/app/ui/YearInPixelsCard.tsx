import YearInPixelsGrid from "./YearInPixelsGrid";
import type { LogFormat } from "../types/log";

export default function YearInPixelsCard({
    allVibes,
    moodColours,
}: {
    allVibes: LogFormat[];
    moodColours: Record<string, { text: string; bg: string }>;
}) {
    return (
        <div className="card w-full min-w-0 rounded-xl bg-white border border-gray-300 p-4 sm:p-5">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
                <h3 className="text-xl font-bold">Year in Pixels</h3>
                <span className="font-bold text-lg">2026</span>
            </div>
            <p className="mb-6 text-md text-gray-400 text-left">
                A little colour for every day.
            </p>
            <p className="mb-2 text-xs text-gray-500 sm:hidden">
                Swipe sideways to see all months.
            </p>
            <YearInPixelsGrid
                allVibes={allVibes}
                moodColours={moodColours}
                year={2026}
            />
            <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm font-medium text-gray-700">
                {Object.entries(moodColours).map(([mood, colours]) => (
                    <span
                        key={mood}
                        className="inline-flex items-center gap-2 whitespace-nowrap"
                    >
                        <span
                            aria-hidden="true"
                            className={`h-3 w-3 shrink-0 rounded-sm ${colours.bg}`}
                        />
                        {mood}
                    </span>
                ))}
            </div>
        </div>
    );
}
