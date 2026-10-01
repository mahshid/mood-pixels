import React from "react";

const MONTHS = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

interface YearInPixelsGridProps {
    allVibes: { date: string; vibe: string }[];
    moodColours: Record<string, { text: string; bg: string }>;
    year?: number;
}

export default function YearInPixelsGrid({
    allVibes,
    moodColours,
    year = 2026,
}: YearInPixelsGridProps) {
    const getColorForDate = (monthIndex: number, day: number) => {
        const log = allVibes.find((v) => {
            const d = new Date(`${v.date}T12:00:00`);
            return (
                d.getMonth() === monthIndex &&
                d.getDate() === day &&
                d.getFullYear() === year
            );
        });

        return (log && moodColours[log.vibe]?.bg) ?? "bg-gray-200";
    };

    return (
        <div
            role="region"
            aria-label={`${year} mood calendar, scroll horizontally to see all months`}
            tabIndex={0}
            className="w-full min-w-0 overflow-x-auto overscroll-x-contain rounded-sm pb-4 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
            <div className="grid min-w-[36rem] grid-cols-[1.5rem_repeat(12,minmax(0,1fr))] gap-x-3 pt-3">
                <div className="sticky left-0 z-10 flex flex-col gap-1 bg-white pr-1">
                    <div aria-hidden="true" className="h-6" />
                    {Array.from({ length: 31 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-4 flex items-center justify-end text-gray-500 font-medium text-[10px]"
                        >
                            {i + 1}
                        </div>
                    ))}
                </div>

                {MONTHS.map((month, monthIndex) => (
                    <div key={month} className="flex min-w-0 flex-col gap-1">
                        <div className="h-6 flex items-center justify-center text-gray-600 font-semibold">
                            {month}
                        </div>

                        {Array.from({ length: DAYS_IN_MONTH[monthIndex] }).map(
                            (_, dayIndex) => {
                                const day = dayIndex + 1;
                                const colorClass = getColorForDate(
                                    monthIndex,
                                    day,
                                );

                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        aria-label={`${month} ${day}, ${year}`}
                                        className={`group relative h-4 w-full min-w-0 cursor-pointer rounded-md ${colorClass} ${monthIndex === 11 ? "origin-right" : "origin-left"} transition duration-200 ease-out hover:z-20 hover:scale-110 hover:shadow-md focus:z-20 focus-visible:scale-110 motion-reduce:transition-none`}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={`pointer-events-none absolute bottom-full mb-1 hidden whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block group-focus-visible:block ${monthIndex === 11 ? "right-0" : "left-0"}`}
                                        >
                                            {month} {day}, {year}
                                        </span>
                                    </button>
                                );
                            },
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
