export default function BrandLogo({
    colours,
}: {
    colours: Record<string, { text: string; bg: string }>;
}) {
    const colour = Object.values(colours);
    const logos = Array.from({ length: 3 }, (_, rowIndex) => (
        <div key={rowIndex} className="flex gap-1">
            {colour.slice(0, 5).map((c, colIndex) => (
                <span
                    key={colIndex}
                    className={`size-2 rounded-full ${c.bg}`}
                />
            ))}
        </div>
    ));

    return (
        <>
            <div className="flex items-center space-x-2 px-4">
                <div className="flex flex-col gap-1">{logos}</div>
                <span className="text-3xl font-bold text-gray-800">
                    Mood Pixels
                </span>
            </div>
            <hr className="border-gray-200" />
        </>
    );
}
