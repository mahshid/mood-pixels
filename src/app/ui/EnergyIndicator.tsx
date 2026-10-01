export default function EnergyIndicator({
    energy,
    colourClassName = "bg-gray-500",
}: {
    energy: number | string;
    colourClassName?: string;
}) {
    const value = Number(energy) || 0;
    const percent = Math.min(Math.max((value / 5) * 100, 0), 100);

    return (
        <div className="w-full">
            <div className="mb-2 flex items-baseline justify-between gap-4">
                <span className="text-xs font-medium text-gray-600">
                    Energy
                </span>
                <span className="text-sm font-semibold text-gray-900">
                    {value}
                    <span className="font-normal text-gray-500">/5</span>
                </span>
            </div>
            <div
                role="progressbar"
                aria-label="Energy level"
                aria-valuemin={0}
                aria-valuemax={5}
                aria-valuenow={Math.min(Math.max(value, 0), 5)}
                className="h-2 w-full overflow-hidden rounded-full bg-gray-100"
            >
                <div
                    className={`h-full rounded-full transition-[width] ${colourClassName}`}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}
